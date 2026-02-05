import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { PolymarketService } from "./polymarket.service";

@Injectable()
export class PolymarketScheduler {
  constructor(
    private readonly configService: ConfigService,
    private readonly polymarketService: PolymarketService
  ) {}

  @Cron(process.env.POLYMARKET_NBA_SYNC_CRON || "*/5 * * * *")
  async syncNbaEvents() {
    const enabled = this.configService.get<string>(
      "POLYMARKET_NBA_SYNC_ENABLED"
    );
    if (enabled === "false") {
      return;
    }

    await this.polymarketService.syncNbaEventsAndMarkets();
  }
}
