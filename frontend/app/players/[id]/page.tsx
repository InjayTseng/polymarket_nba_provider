import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

const serverApiBase =
  process.env.INTERNAL_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://backend:3000";

async function fetchJson(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { error: `HTTP ${res.status}` };
    }
    return res.json();
  } catch {
    return { error: "offline" };
  }
}

function renderTable(
  rows: any[],
  columns: Array<{ key: string; label: string }>
) {
  if (rows.length === 0) {
    return <div className="empty">No data.</div>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.id ?? idx}`}>
              {columns.map((col) => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PlayerPage({
  params
}: {
  params: { id: string };
  searchParams?: SearchParams;
}) {
  const playerId = params.id;

  const [player, playerStats, teams] = await Promise.all([
    fetchJson(`${serverApiBase}/nba/players/${playerId}`),
    fetchJson(
      `${serverApiBase}/nba/player-game-stat?playerId=${playerId}&page=1&pageSize=20`
    ),
    fetchJson(`${serverApiBase}/nba/teams`)
  ]);

  const teamMap = new Map<string, { name?: string; abbrev?: string }>();
  if (Array.isArray(teams)) {
    for (const team of teams) {
      teamMap.set(team.id, team);
    }
  }

  const statRows = Array.isArray(playerStats?.data) ? playerStats.data : [];

  return (
    <main>
      <Link className="back-link" href="/">
        ← Back to daily slate
      </Link>

      <div className="badge">Player Detail</div>
      <h1>{player?.displayName ?? "Player"}</h1>
      <div className="hint">{`${serverApiBase}/nba/players/${playerId}`}</div>
      <p>
        {player?.position ?? "-"} · {player?.heightCm ?? "-"} cm ·{" "}
        {player?.weightKg ?? "-"} kg · {player?.country ?? "-"}
      </p>

      <section>
        <div className="section-header">
          <h2>Recent Game Stats</h2>
          <div className="hint">
            <div>Last 20</div>
            <div>
              {`${serverApiBase}/nba/player-game-stat?playerId=${playerId}&page=1&pageSize=20`}
            </div>
            <div>{`${serverApiBase}/nba/teams`}</div>
          </div>
        </div>
        {renderTable(
          statRows.map((row: any) => ({
            gameId: row.gameId?.slice(0, 8) ?? "-",
            team:
              (row.teamId && teamMap.get(row.teamId)?.abbrev) ||
              row.teamId?.slice(0, 6) ||
              "-",
            pts: row.pts,
            reb: row.reb,
            ast: row.ast,
            tov: row.tov,
            min: row.minutes ?? "-"
          })),
          [
            { key: "gameId", label: "Game" },
            { key: "team", label: "Team" },
            { key: "pts", label: "PTS" },
            { key: "reb", label: "REB" },
            { key: "ast", label: "AST" },
            { key: "tov", label: "TOV" },
            { key: "min", label: "MIN" }
          ]
        )}
      </section>
    </main>
  );
}
