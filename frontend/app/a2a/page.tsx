import Link from "next/link";
import { A2AClient } from "./ui";

export default function A2APage() {
  return (
    <main>
      <div className="badge">A2A</div>
      <h1>Agent Tasks Console</h1>
      <p>
        Create A2A tasks, watch SSE events, and inspect results. Brief tasks are
        free; full analysis tasks may require x402 payment.
      </p>

      <section className="toolbar">
        <div className="section-header">
          <h2>Quick Links</h2>
          <Link className="inline-link" href="/">
            Back to dashboard
          </Link>
        </div>
        <div className="hint">
          <div>`/.well-known/agent-card.json` (via backend)</div>
          <div>`POST /a2a/tasks` · `GET /a2a/tasks/:id/events`</div>
        </div>
      </section>

      <section className="console">
        <A2AClient />
      </section>
    </main>
  );
}

