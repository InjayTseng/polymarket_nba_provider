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

export function McpClient() {
  const [tools, setTools] = useState<ToolDef[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("nba.getGameContext");
  const todayEt = useMemo(() => {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = dtf.formatToParts(new Date());
    const values: Record<string, string> = {};
    for (const part of parts) {
      if (part.type !== "literal") {
        values[part.type] = part.value;
      }
    }
    return `${values.year}-${values.month}-${values.day}`;
  }, []);
  const [argsText, setArgsText] = useState<string>(
    prettyJson({ date: todayEt, home: "SAS", away: "DAL" })
  );

  const [lastReq, setLastReq] = useState<any>(null);
  const [lastRes, setLastRes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = useMemo(() => tools.find((t) => t.name === selectedTool) ?? null, [tools, selectedTool]);

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
                {(tools.length ? tools : [{ name: "nba.getGameContext" }, { name: "pm.getPrices" }, { name: "analysis.nbaMatchup" }, { name: "analysis.computeEdge" }, { name: "pm.getRecentTrades" }, { name: "ops.getFreshness" }]).map((t: any) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field" style={{ width: "100%" }}>
            <span>Arguments (JSON)</span>
            <textarea
              className="codearea"
              value={argsText}
              onChange={(e) => setArgsText(e.target.value)}
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
