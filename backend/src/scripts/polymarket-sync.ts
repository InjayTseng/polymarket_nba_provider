import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { PolymarketService } from "../modules/polymarket/polymarket.service";

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"]
  });
  const polymarketService = app.get(PolymarketService);

  await polymarketService.syncNbaEventsAndMarkets();
  await app.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
