import { proxyJson } from "../../../../_lib/upstream";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  return proxyJson(req, {
    method: "POST",
    path: `/a2a/tasks/${encodeURIComponent(id)}/cancel`,
    body: {}
  });
}

