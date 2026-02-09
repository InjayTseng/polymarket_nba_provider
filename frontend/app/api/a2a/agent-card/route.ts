import { proxyJson } from "../../_lib/upstream";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return proxyJson(req, { method: "GET", path: "/.well-known/agent-card.json" });
}

