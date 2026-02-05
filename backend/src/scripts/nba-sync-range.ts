import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { NbaService } from "../modules/nba/nba.service";

function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};

  for (const arg of args) {
    if (!arg.startsWith("--")) {
      continue;
    }
    const [key, value] = arg.slice(2).split("=");
    if (key && value !== undefined) {
      options[key] = value;
    }
  }

  return options;
}

function parseDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("date must be YYYY-MM-DD");
  }
  return parsed;
}

function expandDates(from: string, to: string, maxDays: number) {
  const start = parseDate(from);
  const end = parseDate(to);

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

async function run() {
  const args = parseArgs();
  const from = args.from;
  const to = args.to;
  const mode = (args.mode || "both").toLowerCase();

  if (!from || !to) {
    throw new Error("--from and --to are required");
  }
  if (!["scoreboard", "final", "player", "both"].includes(mode)) {
    throw new Error("mode must be scoreboard|final|player|both");
  }

  const maxDays = Number(process.env.NBA_SYNC_RANGE_MAX_DAYS || 0);
  const dates = expandDates(from, to, maxDays);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"]
  });
  const nbaService = app.get(NbaService);

  const shouldScoreboard = mode === "scoreboard" || mode === "both";
  const shouldFinal = mode === "final" || mode === "both";
  const shouldPlayer = mode === "player" || mode === "both";
  const includePlayerStatsInFinal = !(shouldFinal && shouldPlayer);

  const scheduleMap = shouldScoreboard
    ? await nbaService.buildScheduleMap(from, to)
    : undefined;

  for (const date of dates) {
    if (shouldScoreboard) {
      await nbaService.syncScoreboard(date, scheduleMap);
    }
    if (shouldFinal) {
      await nbaService.syncFinalResults(date, {
        includePlayerStats: includePlayerStatsInFinal
      });
    }
    if (shouldPlayer) {
      await nbaService.syncPlayerGameStats(date);
    }
  }

  await app.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
