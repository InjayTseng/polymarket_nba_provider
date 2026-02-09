import { proxyJson } from "../../_lib/upstream";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const capability = url.searchParams.get("capability") || "";
  const body = await req.json().catch(() => ({}));
  return proxyJson(req, {
    method: "POST",
    path: `/a2a/tasks?capability=${encodeURIComponent(capability)}`,
    body
  });
}

