import { addDaysDateString, formatDateEt } from "./date-et";

type TeamRow = { id: string; abbrev?: string | null; name?: string | null };
type GameRow = {
  id: string;
  dateTimeUtc?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
};

const serverApiBase =
  process.env.INTERNAL_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://backend:3000";

async function fetchJson(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function pickFirstGame(games: GameRow[]): GameRow | null {
  if (!games.length) return null;
  const withTime = games
    .filter((g) => g?.dateTimeUtc && !Number.isNaN(new Date(String(g.dateTimeUtc)).getTime()))
    .sort(
      (a, b) =>
        new Date(String(a.dateTimeUtc)).getTime() - new Date(String(b.dateTimeUtc)).getTime()
    );
  return withTime[0] ?? games[0] ?? null;
}

export async function resolveDefaultMatchupEt(options?: {
  daysAheadStart?: number;
  daysAheadMax?: number;
}): Promise<{ date: string; home: string; away: string } | null> {
  const daysAheadStart = Math.max(1, options?.daysAheadStart ?? 1);
  const daysAheadMax = Math.max(daysAheadStart, options?.daysAheadMax ?? 7);

  // Load teams once.
  const teamsJson = await fetchJson(`${serverApiBase}/nba/teams`);
  const teams: TeamRow[] = Array.isArray(teamsJson) ? teamsJson : [];
  const abbrevById = new Map(
    teams
      .filter((t) => t?.id)
      .map((t) => [t.id, String(t.abbrev ?? t.name ?? "").trim()])
  );

  const todayEt = formatDateEt(new Date());

  for (let offset = daysAheadStart; offset <= daysAheadMax; offset += 1) {
    const date = addDaysDateString(todayEt, offset);
    const gamesJson = await fetchJson(
      `${serverApiBase}/nba/games?date=${encodeURIComponent(date)}&page=1&pageSize=200`
    );
    const rows: GameRow[] = Array.isArray(gamesJson?.data) ? gamesJson.data : [];
    const picked = pickFirstGame(rows);
    if (!picked) continue;

    const home = picked.homeTeamId ? abbrevById.get(picked.homeTeamId) : null;
    const away = picked.awayTeamId ? abbrevById.get(picked.awayTeamId) : null;
    if (!home || !away) continue;

    // backend expects team abbreviations (e.g. SAS/DAL)
    const homeAbbrev = String(home).toUpperCase();
    const awayAbbrev = String(away).toUpperCase();
    if (!homeAbbrev || !awayAbbrev) continue;

    return { date, home: homeAbbrev, away: awayAbbrev };
  }

  return null;
}

