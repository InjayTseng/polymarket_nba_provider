import { NextResponse } from "next/server";

export function resolveUpstreamBase() {
  return (
    process.env.INTERNAL_API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function pickRequestHeaders(req: Request) {
  const headers = new Headers();
  const pass = [
    "content-type",
    "accept",
    "cookie",
    "authorization",
    "payment-signature",
    "x-payment"
  ];
  for (const key of pass) {
    const val = req.headers.get(key);
    if (val) headers.set(key, val);
  }
  return headers;
}

function copyResponseHeaders(upstream: Response) {
  const headers = new Headers();
  const pass = [
    "content-type",
    "cache-control",
    "payment-required",
    "payment-response",
    "x-payment-response",
  ];
  for (const key of pass) {
    const val = upstream.headers.get(key);
    if (val) headers.set(key, val);
  }

  // Preserve x402 session cookies. Some runtimes expose `getSetCookie()` for multi-values.
  const anyHeaders = upstream.headers as any;
  const setCookies: string[] | undefined =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : undefined;
  if (Array.isArray(setCookies) && setCookies.length) {
    for (const cookie of setCookies) {
      headers.append("set-cookie", cookie);
    }
  } else {
    const single = upstream.headers.get("set-cookie");
    if (single) headers.set("set-cookie", single);
  }

  return headers;
}

export async function proxyJson(
  req: Request,
  opts: { method: string; path: string; body?: any }
) {
  const base = resolveUpstreamBase();
  const url = `${base}${opts.path}`;
  const upstream = await fetch(url, {
    method: opts.method,
    headers: pickRequestHeaders(req),
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    cache: "no-store"
  });

  const headers = copyResponseHeaders(upstream);
  const text = await upstream.text();
  // Preserve upstream status for UI, including x402 402.
  return new NextResponse(text, { status: upstream.status, headers });
}

export async function proxyStream(
  req: Request,
  opts: { method: string; path: string }
) {
  const base = resolveUpstreamBase();
  const url = `${base}${opts.path}`;
  const upstream = await fetch(url, {
    method: opts.method,
    headers: pickRequestHeaders(req),
    cache: "no-store"
  });

  const headers = copyResponseHeaders(upstream);
  if (!headers.get("content-type")) {
    headers.set("content-type", "text/event-stream; charset=utf-8");
  }
  headers.set("x-accel-buffering", "no");
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
