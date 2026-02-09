import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, Queue } from "bullmq";
import { Logger } from "@nestjs/common";
import { A2AService } from "./a2a.service";
import type { A2ACapabilityName } from "./a2a.types";

@Processor("a2a")
export class A2AProcessor extends WorkerHost {
  private readonly logger = new Logger(A2AProcessor.name);
  constructor(
    private readonly a2aService: A2AService,
    @InjectQueue("a2a") private readonly queue: Queue
  ) {
    super();
  }

  async process(job: Job) {
    const startedAt = Date.now();
    const capability = job.name as A2ACapabilityName;
    this.logger.log(
      `[job:start] capability=${capability} id=${job.id} data=${JSON.stringify(job.data ?? {})}`
    );

    const redis = await this.queue.client;
    const cancelKey = `a2a:cancel:${job.id}`;
    const isCancelled = async () => {
      const flag = await redis.get(cancelKey);
      return flag === "1";
    };
    if (await isCancelled()) {
      throw new Error("cancelled");
    }

    try {
      await job.updateProgress({ stage: "started", at: new Date().toISOString() });

      let result: unknown;
      switch (capability) {
        case "nba.matchup_brief":
          await job.updateProgress({ stage: "fetch_context" });
          if (await isCancelled()) {
            throw new Error("cancelled");
          }
          result = await this.a2aService.runMatchupBrief(job.data ?? {});
          break;
        case "nba.matchup_full":
          await job.updateProgress({ stage: "analyze" });
          if (await isCancelled()) {
            throw new Error("cancelled");
          }
          result = await this.a2aService.runMatchupFull(job.data ?? {});
          break;
        default:
          result = { ok: false, error: "unknown_capability" };
          break;
      }

      await job.updateProgress({ stage: "completed" });

      const durationMs = Date.now() - startedAt;
      this.logger.log(
        `[job:ok] capability=${capability} id=${job.id} durationMs=${durationMs}`
      );
      return result;
    } catch (error: any) {
      const durationMs = Date.now() - startedAt;
      this.logger.error(
        `[job:fail] capability=${capability} id=${job.id} durationMs=${durationMs} error=${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}

