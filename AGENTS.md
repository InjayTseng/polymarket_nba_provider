# 開發需求與工作指南（AGENTS）

本文件提供在此 repo 內進行開發、維運與文件更新時的最低限度需求與流程。若需求涉及實作或排程調整，請先閱讀 `nba-ingestion-guide.md` 與 `nba-api-sync.md`。

**目的**
- 建立與維護「Polymarket NBA」與「NBA API」的同步流程與資料落地規格。
- 將新同事能快速上手所需的資訊集中在文件。

**必要前置**
- `docker` 與 `docker compose`
- 若不使用容器：需具備 Node.js / npm、Python 3.11+、PostgreSQL 環境

**快速啟動（最小可用版本）**
1. 以 `docker compose up --build` 啟動服務。
1. 確認可用端點：
   - `http://localhost:3000/health`（NestJS backend）
   - `http://localhost:3001`（Next.js frontend）
   - `http://localhost:8000/health`（Python nba_api service）
1. Migration 會在 backend 啟動前執行（entrypoint 先跑 migration 再啟動 app）。

**服務清單**
- `backend`（NestJS, port 3000）
- `frontend`（Next.js, port 3001）
- `nba_service`（FastAPI + nba_api, port 8000）
- `db`（PostgreSQL, port 5432）
- `redis`（BullMQ queue, port 6379）

**資料來源**
- Polymarket Gamma API（NBA 事件/市場）
- NBA Stats API（賽程、比分、球隊、球員）
- 若設定 `NBA_API_PROXY_BASE`，NBA API 會改走 `ml-service` 代理

**同步流程與實作路徑**
- NBA API 同步流程與 DB Entity 對照：`nba-api-sync.md`
- Polymarket NBA 同步流程、排程、Entity：`nba-ingestion-guide.md`

**常見任務**
- 若要限制為 NBA：依 `nba-ingestion-guide.md` 建議，加入 `series_id` / `tag_id` 參數並採用專用 offset key。
- 若要補齊 NBA 球員與賽程：依 `nba-api-sync.md` 指示執行對應的 `sync:*` 任務。
- 需要手動跑 migration 時：`npm run migration:run`（於 `backend/` 內）
- 手動同步 NBA scoreboard：`POST /nba/sync/scoreboard?date=YYYY-MM-DD`
- 手動同步 NBA final results：`POST /nba/sync/final-results?date=YYYY-MM-DD`
- 手動同步 players：`POST /nba/sync/players?season=2024-25`
- 手動同步 player season teams：`POST /nba/sync/player-season-teams?season=2024-25`
- 同步時間區間（npm）：`cd backend && npm run nba:sync:range -- --from=2026-02-01 --to=2026-02-07 --mode=both`（`scoreboard` / `final` / `player` / `both`）
- 手動同步 player game stats：`POST /nba/sync/player-game-stats?date=YYYY-MM-DD`（或 `gameId=...`）
- 查詢：`GET /nba/teams`、`GET /nba/games?date=YYYY-MM-DD`、`GET /nba/players`、`GET /nba/team-stats`、`GET /nba/player-stats`、`GET /nba/conflicts`
  - 支援 `page`、`pageSize` 與部分篩選參數（如 `teamId`、`season`、`status`）
- 比賽對應 Polymarket：`GET /nba/games/:id/markets`（嘗試以 slug/date 對應 event，回傳 event + markets）
- Polymarket 查詢：`GET /polymarket/events`、`GET /polymarket/markets`
  - 支援 `date`（YYYY-MM-DD）、`search`、`page`、`pageSize`（markets 另有 `eventId`）

**排程與隊列**
- 使用 BullMQ + Cron：
  - scoreboard：預設每 10 分鐘
  - final results：預設每 15 分鐘
- Polymarket NBA 同步：
  - `POLYMARKET_NBA_SYNC_ENABLED`（預設 true）
  - `POLYMARKET_NBA_SYNC_CRON`（預設 */5 * * * *）
  - `POLYMARKET_NBA_ACTIVE` / `POLYMARKET_NBA_CLOSED`
  - `POLYMARKET_NBA_PAGE_SIZE` / `POLYMARKET_NBA_MAX_PAGES`
- 可用環境變數覆寫：`NBA_SCOREBOARD_CRON`、`NBA_FINAL_RESULTS_CRON`、`NBA_FINAL_LOOKBACK_DAYS`
- 其他：`NBA_PLAYER_INFO_LIMIT`（限制 commonplayerinfo 補齊數量）
- roster 需要 `SEASON_START_UTC_{season}`（例如 `SEASON_START_UTC_2025`）
- players 同步：`NBA_PLAYERS_CURRENT_ONLY`（true/false）
- 每小時同步機制：`NBA_HOURLY_ENABLED=true` 並可設定 `NBA_HOURLY_CRON`（預設每小時）與 `NBA_HOURLY_DATE`
- 區間同步上限：`NBA_SYNC_RANGE_MAX_DAYS`（預設 31）

**啟動順序**
- `db` 有 healthcheck，`backend` 會等 DB ready 後再啟動。

**驗證與觀察**
- DB：確認 `events` / `markets` / `market_snapshots` 或 NBA 同步表是否有新增資料。
- API：查詢 `GET /api/events`、`GET /api/markets` 是否為 NBA 相關資料。
- Log：確認 `Gamma API request` 或 NBA API 呼叫成功。
- 失敗與異常：`data_conflict` 會記錄 job 失敗、缺資料、或 roster 重疊。

**文件更新規範**
- 調整同步策略或新增欄位時，同步更新 `nba-ingestion-guide.md` 或 `nba-api-sync.md`。
- 如新增或變更環境變數，務必更新相關段落與啟動流程。

若需要將「NBA 專用參數」實作進程式，請提供：
- `series_id`
- `tag_id`（若只要 game bets）
