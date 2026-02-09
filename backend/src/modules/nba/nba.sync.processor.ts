import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, Queue } from "bullmq";
import { Logger } from "@nestjs/common";
import { NbaService } from "./nba.service";

@Processor("nba-sync")
export class NbaSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(NbaSyncProcessor.name);
  constructor(
    private readonly nbaService: NbaService,
    @InjectQueue("nba-sync") private readonly queue: Queue
  ) {
    super();
  }

  async process(job: Job) {
    const startedAt = Date.now();
    this.logger.log(
      `[job:start] ${job.name} id=${job.id} data=${JSON.stringify(job.data ?? {})}`
    );
    try {
      let result: unknown;
      switch (job.name) {
        case "sync-scoreboard":
          result = await this.nbaService.syncScoreboard(job.data?.date);
          break;
        case "sync-final-results":
          result = await this.nbaService.syncFinalResults(job.data?.date);
          break;
        case "sync-range": {
          const from = String(job.data?.from || "");
          const to = String(job.data?.to || "");
          const mode = String(job.data?.mode || "");
          if (!from || !to) {
            throw new Error("from/to are required, e.g. 2026-02-01");
          }

          const maxDays = Number(process.env.NBA_SYNC_RANGE_MAX_DAYS || 0);
          const dates = this.expandDates(from, to, maxDays);

          const shouldScoreboard = mode !== "final";
          const shouldFinal = mode !== "scoreboard";

          const jobs = [];
          for (const date of dates) {
            if (shouldScoreboard) {
              jobs.push({ name: "sync-scoreboard", data: { date } });
            }
            if (shouldFinal) {
              jobs.push({ name: "sync-final-results", data: { date } });
            }
          }

          if (jobs.length) {
            await this.queue.addBulk(jobs as any);
          }
          result = { dates, jobs: jobs.length };
          break;
        }
        case "sync-player-game-stats":
          result = await this.nbaService.syncPlayerGameStats(
            job.data?.date,
            job.data?.gameId
          );
          break;
        case "sync-players":
          result = await this.nbaService.syncPlayers(job.data?.season);
          break;
        case "sync-player-season-teams":
          result = await this.nbaService.syncPlayerSeasonTeams(job.data?.season);
          break;
        case "sync-injury-report":
          result = await this.nbaService.syncInjuryReport();
          break;
        default:
          result = { skipped: true };
          break;
      }
      const durationMs = Date.now() - startedAt;
      this.logger.log(
        `[job:ok] ${job.name} id=${job.id} durationMs=${durationMs} result=${JSON.stringify(result)}`
      );
      return result;
    } catch (error) {
      const seasonMatch = String(job.data?.season || "").match(/(\d{4})/);
      const season = seasonMatch ? Number(seasonMatch[1]) : undefined;
      await this.nbaService.recordConflict({
        conflictType: "job_failed",
        season,
        jobId: job.id,
        detailsJson: {
          name: job.name,
          message: error instanceof Error ? error.message : String(error)
        }
      });
      const durationMs = Date.now() - startedAt;
      this.logger.error(
        `[job:fail] ${job.name} id=${job.id} durationMs=${durationMs} error=${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  private expandDates(from: string, to: string, maxDays: number) {
    const start = this.parseDate(from);
    const end = this.parseDate(to);

    if (end.getTime() < start.getTime()) {
      throw new Error("to must be >= from");
    }

    const dates: string[] = [];
    const cursor = new Date(start);
    let count = 0;

    while (cursor.getTime() <= end.getTime()) {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      count += 1;
      if (maxDays > 0 && count > maxDays) {
        throw new Error(`range too large, max days = ${maxDays}`);
      }
    }

    return dates;
  }

  private parseDate(value: string) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("date must be YYYY-MM-DD");
    }
    return parsed;
  }
}
