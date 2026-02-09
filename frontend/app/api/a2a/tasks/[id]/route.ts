import { proxyJson } from "../../../_lib/upstream";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyJson(req, { method: "GET", path: `/a2a/tasks/${encodeURIComponent(id)}` });
}

