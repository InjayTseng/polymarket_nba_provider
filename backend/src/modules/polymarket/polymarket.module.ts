import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GammaClient } from "./gamma.client";
import { ClobClient } from "./clob.client";
import { PolymarketService } from "./polymarket.service";
import { PolymarketScheduler } from "./polymarket.scheduler";
import { PolymarketController } from "./polymarket.controller";
import { Event } from "./entities/event.entity";
import { Market } from "./entities/market.entity";
import { Tag } from "./entities/tag.entity";
import { EventTag } from "./entities/event-tag.entity";
import { MarketSnapshot } from "./entities/market-snapshot.entity";
import { IngestionState } from "./entities/ingestion-state.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      Market,
      Tag,
      EventTag,
      MarketSnapshot,
      IngestionState
    ])
  ],
  controllers: [PolymarketController],
  providers: [GammaClient, ClobClient, PolymarketService, PolymarketScheduler]
})
export class PolymarketModule {}
