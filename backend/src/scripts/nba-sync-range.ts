import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { NbaService } from "../modules/nba/nba.service";

function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith("--")) {
      continue;
    }

    const raw = arg.slice(2);
    const eqIndex = raw.indexOf("=");
    if (eqIndex >= 0) {
      const key = raw.slice(0, eqIndex);
      const value = raw.slice(eqIndex + 1);
      if (key && value !== undefined) {
        options[key] = value;
      }
      continue;
    }

    // Support `--from 2026-02-01` style flags too.
    const key = raw;
    const next = args[i + 1];
    if (key && next !== undefined && !next.startsWith("--")) {
      options[key] = next;
      i += 1;
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

  console.log(
    `[nba:sync:range] from=${from} to=${to} mode=${mode} NBA_SERVICE_BASE=${process.env.NBA_SERVICE_BASE || ""} DATABASE_URL=${process.env.DATABASE_URL || ""}`
  );

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
