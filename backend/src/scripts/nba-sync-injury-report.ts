import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { NbaService } from "../modules/nba/nba.service";

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"]
  });
  const nbaService = app.get(NbaService);

  const result = await nbaService.syncInjuryReport();
  console.log(result);

  await app.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
