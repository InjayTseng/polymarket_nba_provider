import Link from "next/link";
import { McpClient } from "./ui";

export default function McpPage() {
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
        <McpClient />
      </section>
    </main>
  );
}

