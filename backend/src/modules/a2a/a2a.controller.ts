import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Body,
  Req,
  Res
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue, QueueEvents } from "bullmq";
import type { Request, Response } from "express";
import type { A2ACapabilityName, A2ATask } from "./a2a.types";

function nowIso() {
  return new Date().toISOString();
}

function buildPublicBase(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function mapState(state: string | null): A2ATask["state"] {
  switch (state) {
    case "waiting":
    case "delayed":
    case "paused":
      return "queued";
    case "active":
      return "running";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    default:
      return "queued";
  }
}

@Controller("a2a")
@ApiTags("A2A")
export class A2AController {
  constructor(@InjectQueue("a2a") private readonly queue: Queue) {}

  @Post("rpc")
  @ApiOperation({ summary: "JSON-RPC shim (not implemented yet)" })
  async rpcShim() {
    throw new HttpException(
      {
        error: "not_implemented",
        message:
          "RPC shim is not implemented yet. Use REST endpoints under /a2a/tasks."
      },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  @Post("tasks")
  @ApiOperation({ summary: "Create an A2A task" })
  @ApiQuery({
    name: "capability",
    required: true,
    description: "e.g. nba.matchup_brief | nba.matchup_full"
  })
  async createTask(
    @Req() req: Request,
    @Query("capability") capability?: string,
    @Body() body?: any
  ) {
    const cap = String(capability || "").trim() as A2ACapabilityName;
    if (cap !== "nba.matchup_brief" && cap !== "nba.matchup_full") {
      throw new BadRequestException("invalid capability");
    }

    // x402 middleware only attaches req.x402 when route is protected.
    const x402 = (req as any).x402 as
      | { payerAddress?: string | null; sessionId?: string | null }
      | undefined;

    const input = body?.input && typeof body.input === "object" ? body.input : body;
    const job = await this.queue.add(cap, {
      ...(input ?? {}),
      _meta: {
        capability: cap,
        payerAddress: x402?.payerAddress ?? null,
        createdAt: nowIso()
      }
    });

    const base = buildPublicBase(req);
    return {
      id: String(job.id),
      capability: cap,
      status: "queued",
      createdAt: nowIso(),
      endpoints: {
        task: `${base}/a2a/tasks/${job.id}`,
        events: `${base}/a2a/tasks/${job.id}/events`,
        cancel: `${base}/a2a/tasks/${job.id}/cancel`
      }
    };
  }

  @Get("tasks/:id")
  @ApiOperation({ summary: "Get task status/result" })
  @ApiParam({ name: "id", required: true })
  async getTask(@Param("id") id: string): Promise<A2ATask> {
    const job = await this.queue.getJob(id);
    if (!job) {
      throw new NotFoundException("task not found");
    }
    const state = (await job.getState()) as string;
    const updatedAt = job.finishedOn
      ? new Date(job.finishedOn).toISOString()
      : job.processedOn
        ? new Date(job.processedOn).toISOString()
        : nowIso();
    const createdAt = job.timestamp
      ? new Date(job.timestamp).toISOString()
      : nowIso();

    const meta = job.data?._meta ?? {};
    const payerAddress =
      typeof meta?.payerAddress === "string" || meta?.payerAddress === null
        ? meta.payerAddress
        : null;

    return {
      id: String(job.id),
      capability: job.name as any,
      state: mapState(state),
      createdAt,
      updatedAt,
      result: state === "completed" ? job.returnvalue ?? null : undefined,
      error:
        state === "failed"
          ? { message: job.failedReason || "failed" }
          : undefined,
      payerAddress
    };
  }

  @Get("tasks/:id/events")
  @ApiOperation({ summary: "Stream task events (SSE)" })
  @ApiParam({ name: "id", required: true })
  async streamEvents(@Param("id") id: string, @Req() req: Request, @Res() res: Response) {
    const job = await this.queue.getJob(id);
    if (!job) {
      throw new NotFoundException("task not found");
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    // Let nginx know not to buffer (also configured on edge).
    res.setHeader("X-Accel-Buffering", "no");

    const send = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const initialState = await job.getState();
    send("state", { id: String(job.id), state: mapState(initialState), at: nowIso() });

    const connection = { host: process.env.REDIS_HOST || "redis", port: Number(process.env.REDIS_PORT || 6379) };
    const queueEvents = new QueueEvents("a2a", { connection });
    await queueEvents.waitUntilReady();

    const handler = (evtName: string) => (payload: any) => {
      if (!payload || String(payload.jobId) !== String(job.id)) {
        return;
      }
      send(evtName, { ...payload, at: nowIso() });
      if (evtName === "completed" || evtName === "failed") {
        // Allow a brief flush window then close.
        setTimeout(() => res.end(), 50);
      }
    };

    const onProgress = handler("progress");
    const onCompleted = handler("completed");
    const onFailed = handler("failed");
    const onActive = handler("active");
    const onWaiting = handler("waiting");

    queueEvents.on("progress", onProgress);
    queueEvents.on("completed", onCompleted);
    queueEvents.on("failed", onFailed);
    queueEvents.on("active", onActive);
    queueEvents.on("waiting", onWaiting);

    const heartbeat = setInterval(() => {
      if (res.writableEnded) return;
      send("ping", { at: nowIso() });
    }, 15000);

    const cleanup = async () => {
      clearInterval(heartbeat);
      queueEvents.removeListener("progress", onProgress);
      queueEvents.removeListener("completed", onCompleted);
      queueEvents.removeListener("failed", onFailed);
      queueEvents.removeListener("active", onActive);
      queueEvents.removeListener("waiting", onWaiting);
      try {
        await queueEvents.close();
      } catch {
        // ignore
      }
    };

    req.on("close", cleanup);
  }

  @Post("tasks/:id/cancel")
  @ApiOperation({ summary: "Cancel a task (best-effort)" })
  @ApiParam({ name: "id", required: true })
  async cancelTask(@Param("id") id: string) {
    const job = await this.queue.getJob(id);
    if (!job) {
      throw new NotFoundException("task not found");
    }

    const redis = await this.queue.client;
    await redis.set(`a2a:cancel:${job.id}`, "1", "PX", 5 * 60 * 1000);

    const state = (await job.getState()) as string;
    if (
      state === "waiting" ||
      state === "delayed" ||
      state === "prioritized" ||
      state === "waiting-children"
    ) {
      await job.remove();
      return { id: String(job.id), cancelled: true, removed: true };
    }

    return { id: String(job.id), cancelled: true, removed: false, state };
  }
}
