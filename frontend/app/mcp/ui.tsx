"use client";

import { useEffect, useMemo, useState } from "react";

type ToolDef = {
  name: string;
  description?: string;
  inputSchema?: any;
};

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function prettyJson(value: any) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

async function mcpRpc(method: string, params?: any) {
  const body = { jsonrpc: "2.0", id: Date.now(), method, params };
  const res = await fetch("/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  const parsed = safeJsonParse(text);
  return { ok: res.ok, status: res.status, req: body, raw: text, json: parsed };
}

export function McpClient(props: { initialMatchup?: { date: string; home: string; away: string } }) {
  const [tools, setTools] = useState<ToolDef[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("nba.getGameContext");
  const [argsText, setArgsText] = useState<string>(() =>
    prettyJson(
      props.initialMatchup
        ? { ...props.initialMatchup }
        : { date: "", home: "", away: "" }
    )
  );
  const [argsDirty, setArgsDirty] = useState(false);

  const [lastReq, setLastReq] = useState<any>(null);
  const [lastRes, setLastRes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = useMemo(() => tools.find((t) => t.name === selectedTool) ?? null, [tools, selectedTool]);

  const buildExampleArgs = (toolName: string) => {
    const matchup = props.initialMatchup ?? { date: "", home: "", away: "" };
    switch (toolName) {
      case "nba.getGameContext":
        return {
          ...matchup,
          matchupLimit: 5,
          recentLimit: 5,
          marketPage: 1,
          marketPageSize: 10
        };
      case "analysis.nbaMatchup":
        return { ...matchup, matchupLimit: 5, recentLimit: 5 };
      case "pm.getPrices":
        return { marketId: null, marketIds: [], tokenId: "", side: "buy" };
      case "pm.getRecentTrades":
        return { tokenId: "", limit: 50 };
      case "alerts.detectLargeTrades":
        return { tokenId: "", limit: 100, minNotionalUsd: 2500, minSize: 0 };
      case "analysis.computeEdge":
        return {
          modelYesProb: 0.55,
          marketYesPrice: 0.5,
          marketNoPrice: 0.5,
          kellyFractionCap: 0.25
        };
      case "ops.getFreshness":
        return {};
      default:
        return {};
    }
  };

  const setExampleForSelectedTool = () => {
    setArgsText(prettyJson(buildExampleArgs(selectedTool)));
    setArgsDirty(false);
  };

  const extractToolCallOutput = (json: any) => {
    const content = json?.result?.content;
    const text = Array.isArray(content) ? content?.[0]?.text : null;
    if (typeof text === "string") {
      return safeJsonParse(text) ?? text;
    }
    return json?.result ?? null;
  };

  const doInit = async () => {
    setLoading(true);
    setError(null);
    try {
      const out = await mcpRpc("initialize", {});
      setLastReq(out.req);
      setLastRes(out.json ?? out.raw);
      if (!out.ok) setError(`HTTP ${out.status}`);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  };

  // Always show a tool-appropriate example when switching tools.
  useEffect(() => {
    setExampleForSelectedTool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool]);

  const doList = async () => {
    setLoading(true);
    setError(null);
    try {
      const out = await mcpRpc("tools/list", {});
      setLastReq(out.req);
      setLastRes(out.json ?? out.raw);
      if (!out.ok) {
        setError(`HTTP ${out.status}`);
        return;
      }
      const toolList = out.json?.result?.tools;
      if (Array.isArray(toolList)) {
        setTools(toolList);
        if (toolList.length && !toolList.find((t: any) => t?.name === selectedTool)) {
          setSelectedTool(toolList[0].name);
        }
      }
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  };

  const fillFromMatchupMarkets = async (alsoCall: boolean) => {
    const baseMatchup = (() => {
      const current = safeJsonParse(argsText);
      const date = current?.date ? String(current.date) : props.initialMatchup?.date;
      const home = current?.home ? String(current.home) : props.initialMatchup?.home;
      const away = current?.away ? String(current.away) : props.initialMatchup?.away;
      return date && home && away ? { date, home, away } : null;
    })();

    if (!baseMatchup) {
      setError("Missing date/home/away. Provide a matchup first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ctxOut = await mcpRpc("tools/call", {
        name: "nba.getGameContext",
        arguments: { ...baseMatchup, marketPage: 1, marketPageSize: 10 }
      });
      setLastReq(ctxOut.req);
      setLastRes(ctxOut.json ?? ctxOut.raw);
      if (!ctxOut.ok) {
        setError(`HTTP ${ctxOut.status}`);
        return;
      }

      const parsed = extractToolCallOutput(ctxOut.json);
      const ctx = (parsed as any)?.context;
      const markets = Array.isArray(ctx?.polymarket?.markets?.data)
        ? ctx.polymarket.markets.data
        : [];
      const first = markets.find((m: any) => m?.polymarketMarketId || (Array.isArray(m?.clobTokenIds) && m.clobTokenIds.length));
      if (!first) {
        setError("No linked Polymarket markets found in context.");
        return;
      }

      const marketIdRaw = first?.polymarketMarketId ?? null;
      const marketId = marketIdRaw !== null ? Number(marketIdRaw) : null;
      const tokenId = Array.isArray(first?.clobTokenIds) ? String(first.clobTokenIds[0] || "") : "";

      let nextArgs: any = {};
      if (selectedTool === "pm.getPrices") {
        nextArgs = { marketId: Number.isFinite(marketId) ? marketId : null, side: "buy" };
      } else if (selectedTool === "pm.getRecentTrades") {
        nextArgs = { tokenId, limit: 50 };
      } else if (selectedTool === "alerts.detectLargeTrades") {
        nextArgs = { tokenId, limit: 100, minNotionalUsd: 2500, minSize: 0 };
      } else {
        nextArgs = { ...baseMatchup };
      }

      setArgsText(prettyJson(nextArgs));
      setArgsDirty(false);

      if (alsoCall) {
        const callOut = await mcpRpc("tools/call", {
          name: selectedTool,
          arguments: nextArgs
        });
        setLastReq(callOut.req);
        setLastRes(callOut.json ?? callOut.raw);
        if (!callOut.ok) setError(`HTTP ${callOut.status}`);
      }
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  };

  const doCall = async () => {
    setLoading(true);
    setError(null);
    try {
      const args = safeJsonParse(argsText);
      if (argsText.trim() && args === null) {
        setError("Arguments JSON is invalid");
        return;
      }
      const out = await mcpRpc("tools/call", {
        name: selectedTool,
        arguments: args ?? {}
      });
      setLastReq(out.req);
      setLastRes(out.json ?? out.raw);
      if (!out.ok) setError(`HTTP ${out.status}`);
    } catch (e: any) {
      setError(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void doList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="console-grid">
      <div className="console-pane">
        <div className="section-header">
          <h2>Actions</h2>
          <div className="hint">`/api/mcp` proxy</div>
        </div>
        <div className="form-row">
          <button type="button" onClick={doInit} disabled={loading}>
            initialize
          </button>
          <button type="button" onClick={doList} disabled={loading} className="ghost">
            tools/list
          </button>
        </div>

        <div className="query-form">
          <div className="form-row">
            <label className="field" style={{ minWidth: 280 }}>
              <span>Tool</span>
              <select value={selectedTool} onChange={(e) => setSelectedTool(e.target.value)}>
                {(tools.length ? tools : [
                  { name: "nba.getGameContext" },
                  { name: "pm.getPrices" },
                  { name: "analysis.nbaMatchup" },
                  { name: "analysis.computeEdge" },
                  { name: "pm.getRecentTrades" },
                  { name: "alerts.detectLargeTrades" },
                  { name: "ops.getFreshness" }
                ]).map((t: any) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <button type="button" onClick={setExampleForSelectedTool} disabled={loading} className="ghost">
              example
            </button>
            {(selectedTool === "pm.getPrices" ||
              selectedTool === "pm.getRecentTrades" ||
              selectedTool === "alerts.detectLargeTrades") ? (
              <>
                <button
                  type="button"
                  onClick={() => void fillFromMatchupMarkets(false)}
                  disabled={loading}
                  className="ghost"
                >
                  fill from matchup
                </button>
                <button
                  type="button"
                  onClick={() => void fillFromMatchupMarkets(true)}
                  disabled={loading}
                >
                  fill + call
                </button>
              </>
            ) : null}
          </div>

          <label className="field" style={{ width: "100%" }}>
            <span>Arguments (JSON)</span>
            <textarea
              className="codearea"
              value={argsText}
              onChange={(e) => {
                setArgsText(e.target.value);
                setArgsDirty(true);
              }}
              rows={10}
              spellCheck={false}
            />
          </label>

          <div className="form-row">
            <button type="button" onClick={doCall} disabled={loading}>
              tools/call
            </button>
            <button type="button" onClick={() => { setLastReq(null); setLastRes(null); setError(null); }} className="ghost">
              Clear
            </button>
          </div>
        </div>

        {selected ? (
          <div className="console-split">
            <div>
              <div className="card-title">Tool schema</div>
              <pre>{prettyJson(selected)}</pre>
            </div>
            <div>
              <div className="card-title">Tips</div>
              <div className="hint">
                <div>`tools/call` returns `content[].text` (JSON string).</div>
                <div>For `analysis.computeEdge`: pass probabilities in 0..1.</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="console-pane">
        <div className="section-header">
          <h2>Wire Log</h2>
          <div className="hint">
            {error ? <span className="pill danger">error</span> : <span className="pill">ok</span>}
          </div>
        </div>
        {error ? <div className="error">{error}</div> : null}
        <div className="console-split">
          <div>
            <div className="card-title">Last request</div>
            <pre>{lastReq ? prettyJson(lastReq) : "No requests yet."}</pre>
          </div>
          <div>
            <div className="card-title">Last response</div>
            <pre>{lastRes ? prettyJson(lastRes) : "No responses yet."}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
