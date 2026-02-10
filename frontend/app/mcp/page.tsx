import Link from "next/link";
import { McpClient } from "./ui";
import { resolveDefaultMatchupEt } from "../_lib/default-matchup";

export default async function McpPage() {
  const defaults = await resolveDefaultMatchupEt({ daysAheadStart: 1, daysAheadMax: 7 });
  return (
    <main>
      <div className="badge">MCP</div>
      <h1>Tooling Console</h1>
      <p>
        Inspect MCP tools, craft `tools/call` payloads, and run them against the
        server.
      </p>

      <section className="toolbar">
        <div className="section-header">
          <h2>Endpoint</h2>
          <Link className="inline-link" href="/">
            Back to dashboard
          </Link>
        </div>
        <div className="hint">
          <div>`POST /mcp` (proxied via `POST /api/mcp`)</div>
          <div>Methods: `initialize`, `tools/list`, `tools/call`</div>
        </div>
      </section>

      <section className="console">
        <McpClient initialMatchup={defaults ?? undefined} />
      </section>
    </main>
  );
}
