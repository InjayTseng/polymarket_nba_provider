import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NbaModule } from "../nba/nba.module";
import { PolymarketModule } from "../polymarket/polymarket.module";
import { McpController } from "./mcp.controller";
import { McpService } from "./mcp.service";
import { Game } from "../nba/entities/game.entity";
import { IngestionState } from "../polymarket/entities/ingestion-state.entity";
import { Event } from "../polymarket/entities/event.entity";
import { Market } from "../polymarket/entities/market.entity";

@Module({
  imports: [
    NbaModule,
    PolymarketModule,
    TypeOrmModule.forFeature([Game, IngestionState, Event, Market])
  ],
  controllers: [McpController],
  providers: [McpService]
})
export class McpModule {}

