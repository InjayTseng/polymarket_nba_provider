import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class NbaSyncScheduler {
  constructor(
    private readonly configService: ConfigService,
    @InjectQueue("nba-sync") private readonly queue: Queue
  ) {}

  @Cron(process.env.NBA_SCOREBOARD_CRON || "*/10 * * * *")
  async enqueueScoreboard() {
    const date = this.configService.get<string>("NBA_SCOREBOARD_DATE");
    await this.queue.add(
      "sync-scoreboard",
      date ? { date } : {},
      {}
    );
  }

  @Cron(process.env.NBA_FINAL_RESULTS_CRON || "*/15 * * * *")
  async enqueueFinalResults() {
    const date = this.configService.get<string>("NBA_FINAL_RESULTS_DATE");
    await this.queue.add(
      "sync-final-results",
      date ? { date } : {},
      {}
    );
  }

  @Cron(process.env.NBA_HOURLY_CRON || "0 * * * *")
  async enqueueHourly() {
    const enabled = this.configService.get<string>("NBA_HOURLY_ENABLED");
    if (enabled !== "true") {
      return;
    }

    const date = this.configService.get<string>("NBA_HOURLY_DATE");
    await this.queue.add("sync-scoreboard", date ? { date } : {}, {});
    await this.queue.add("sync-final-results", date ? { date } : {}, {});
  }

  @Cron(process.env.NBA_INJURY_REPORT_CRON || "30 * * * *")
  async enqueueInjuryReport() {
    await this.queue.add("sync-injury-report", {}, {});
  }
}
