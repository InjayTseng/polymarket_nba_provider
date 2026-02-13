# NBA Sports Intelligence Agent

**An autonomous AI agent enabling agent-to-agent commerce for real-time sports analytics with native x402 micropayments.**

---

## What We Built

NBA Sports Intelligence Agent aggregates real-time NBA data (schedules, scores, player stats, injury reports) and Polymarket betting markets, providing AI-powered matchup analysis that other agents can discover and pay for autonomously.

---

## Key Features

- **A2A Protocol**: Full agent-to-agent discovery and task execution via `/.well-known/agent-card.json`
- **x402 Payments**: Native micropayments on Base network — agents pay $0.05 USDC for premium AI analysis
- **MCP Tools**: 7 tools for LLM integration (game context, prices, edge computation, whale alerts)
- **ERC-8004 Identity**: [Registered on Base Mainnet](https://www.8004scan.io/agents/base/14352)

---

## How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Your Agent │ ──► │   x402 Pay  │ ──► │  NBA Agent  │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. **Discover**: Agents find us via A2A protocol
2. **Request**: Call `nba.matchup_full` capability
3. **Pay**: Receive 402, pay USDC on Base
4. **Receive**: Get AI-powered betting insights

---

## Payment Flow

```
Agent → POST /a2a/tasks?capability=nba.matchup_full
     ← 402 Payment Required
     → USDC payment on Base ($0.05)
     ← Payment signature
     → Retry with proof
     ← 200 OK + AI Analysis
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | NestJS + TypeORM + BullMQ |
| Frontend | Next.js (App Router) |
| NBA Data | FastAPI + nba_api |
| AI | GPT-4o for matchup analysis |
| Payments | x402 + Coinbase facilitator |
| Chain | Base Mainnet (ERC-8004 + USDC) |
| Database | PostgreSQL 15 |
| Queue | Redis 7 + BullMQ |

---

## Capabilities

| Capability | Price | Description |
|------------|-------|-------------|
| `nba.matchup_brief` | Free | Quick game overview |
| `nba.matchup_full` | $0.05 USDC | Full AI analysis with model outputs |

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `nba.getGameContext` | Get comprehensive game context |
| `pm.getPrices` | Fetch Polymarket live prices |
| `analysis.nbaMatchup` | AI-powered matchup analysis |
| `analysis.computeEdge` | Calculate betting edge |
| `pm.getRecentTrades` | Recent market activity |
| `alerts.detectLargeTrades` | Whale movement alerts |
| `ops.getFreshness` | Data freshness check |

---

## Live Demo

| Endpoint | URL |
|----------|-----|
| **API** | https://api-hoobs.polyox.io |
| **App** | https://app-hoobs.polyox.io |
| **Agent Card** | https://api-hoobs.polyox.io/.well-known/agent-card.json |
| **ERC-8004** | https://www.8004scan.io/agents/base/14352 |
| **A2A Console** | https://app-hoobs.polyox.io/a2a |
| **MCP Console** | https://app-hoobs.polyox.io/mcp |

---

## Quick Test

```bash
# 1. Check agent capabilities
curl -s https://api-hoobs.polyox.io/.well-known/agent-card.json | jq '.capabilities'

# 2. Create a free task
curl -sX POST 'https://api-hoobs.polyox.io/a2a/tasks?capability=nba.matchup_brief' \
  -H 'content-type: application/json' \
  -d '{"input":{"date":"2026-02-13","home":"LAL","away":"BOS"}}'

# 3. List MCP tools
curl -sX POST https://api-hoobs.polyox.io/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## Hackathon Alignment

| Requirement | Implementation |
|-------------|----------------|
| **x402 Payments** | Native x402 middleware with Coinbase facilitator |
| **A2A Protocol** | Full A2A JSON-RPC + REST implementation |
| **ERC-8004** | [Registered on Base Mainnet](https://www.8004scan.io/agents/base/14352) |
| **Agents/AI** | GPT-4o powered matchup analysis |
| **Real-world utility** | Live NBA data + Polymarket integration |

---

## Links

- **GitHub**: https://github.com/InjayTseng/polymarket_nba_provider
- **ERC-8004**: https://www.8004scan.io/agents/base/14352
- **x402 Protocol**: https://www.x402.org/
- **DoraHacks**: https://dorahacks.io/hackathon/x402

---

## Team

Built for the **SF Agentic Commerce x402 Hackathon** by passionate builders exploring the intersection of AI agents, sports analytics, and decentralized payments.
