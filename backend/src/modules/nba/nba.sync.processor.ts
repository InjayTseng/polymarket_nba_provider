import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { NbaService } from "./nba.service";

@Processor("nba-sync")
export class NbaSyncProcessor extends WorkerHost {
  constructor(private readonly nbaService: NbaService) {
    super();
  }

  async process(job: Job) {
    try {
      switch (job.name) {
        case "sync-scoreboard":
          return await this.nbaService.syncScoreboard(job.data?.date);
        case "sync-final-results":
          return await this.nbaService.syncFinalResults(job.data?.date);
        case "sync-player-game-stats":
          return await this.nbaService.syncPlayerGameStats(
            job.data?.date,
            job.data?.gameId
          );
        case "sync-players":
          return await this.nbaService.syncPlayers(job.data?.season);
        case "sync-player-season-teams":
          return await this.nbaService.syncPlayerSeasonTeams(job.data?.season);
        case "sync-injury-report":
          return await this.nbaService.syncInjuryReport();
        default:
          return { skipped: true };
      }
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
      throw error;
    }
  }
}
