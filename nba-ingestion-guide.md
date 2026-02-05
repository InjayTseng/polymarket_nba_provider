# NBA Polymarket 定期同步服務指南

目標：讓新同學只看這份文件，就能在本 repo 內快速建立「定期拉取 Polymarket NBA events/markets」的服務，並理解 entity 與 backend 的資料流。

## 1. 你會得到什麼
- 一個定期同步 NBA Event/Market 的 worker 流程（NestJS + BullMQ + Cron）。
- 資料落在 PostgreSQL 的 `events` / `markets` / `market_snapshots` / `tags` / `event_tags` / `ingestion_state`。
- 後端 API 可查詢同步結果（events、markets、snapshots）。

## 2. 快速啟動（本 repo 既有流程）
1. 建立 `.env`：
```bash
cp env.example .env
```
2. 啟動容器：
```bash
docker compose up --build
```
3. 確認 worker 正常跑：`worker` container 會自動開始排程同步，API 預設在 `http://localhost:3000/api`。

## 3. Polymarket API（NBA 取數要點）
NBA 的核心做法是：先用 `/sports` 找 NBA 對應的 `series_id`，再用 `/events?series_id=...` 拉 events，再從 events 內的 markets 做同步。官方建議用 `active=true&closed=false` 只拿可交易的事件。

常用 endpoint：
- `GET https://gamma-api.polymarket.com/sports`：取得支援的 league 與 `series_id`，NBA 的 `series_id` 需要透過此列表動態查。
- `GET https://gamma-api.polymarket.com/events?series_id=...&active=true&closed=false`：拉 NBA 事件。
- `GET https://gamma-api.polymarket.com/events?series_id=...&tag_id=...`：若只要「單場比賽」而不是 futures，官方建議用 `tag_id` 過濾。
- `GET https://gamma-api.polymarket.com/markets/:id`：補齊 market 詳細欄位與最新價格。
- `GET https://gamma-api.polymarket.com/teams?league=NBA`：取得 NBA 球隊清單（對照 events / 做名稱正規化用）。

`/events` 支援的主要 query 參數包含 `tag_id`、`exclude_tag_id`、`related_tags`、`closed`、`start_date_min`、`end_date_max` 等。

## 4. 本 repo 的後端同步流程（你需要理解的核心）
### 4.1 資料流
1. `SyncEventsProducer` 定期丟任務到 ingestion queue。
2. `SyncEventsProcessor` 透過 `GammaApiClient.listEvents()` 取 events + markets。
3. events / markets / tags 寫入 DB，並建立 `event_tags` 關聯。
4. `SyncMarketDetailsProducer` 依 TTL 取需要更新的 market IDs。
5. `SyncMarketDetailsProcessor` 逐一呼叫 `/markets/:id` 更新市場細節。
6. `JobsScheduler` 每分鐘觸發 `MarketPollProcessor`，寫入 `market_snapshots`。

相關檔案：
- `src/modules/ingestion/producers/sync-events.producer.ts`
- `src/modules/ingestion/processors/sync-events.processor.ts`
- `src/modules/ingestion/producers/sync-market-details.producer.ts`
- `src/modules/ingestion/processors/sync-market-details.processor.ts`
- `src/modules/jobs/jobs.scheduler.ts`
- `src/modules/jobs/market-poll.processor.ts`
- `src/modules/polymarket-gamma/gamma.client.ts`

### 4.2 排程頻率（現況）
- events 同步：每分鐘 (`* * * * *`)
- popular events 同步：每 5 分鐘 (`*/5 * * * *`)
- market details：每 5 分鐘
- snapshots：每分鐘

### 4.3 目前同步參數
- events 同步：`order=id`、`ascending=false`、`closed=false`
- popular 同步：`order=volume`、`ascending=false`、`closed=false`

這些參數在 `SyncEventsProducer` 中組裝，會直接被 `GammaApiClient` 轉成 query string。

## 5. Entity 與資料表（NBA 專案需要知道的）
### 5.1 核心 Entity
- `events`：`src/modules/events/event.entity.ts`
- `markets`：`src/modules/markets/market.entity.ts`
- `market_snapshots`：`src/modules/markets/market-snapshot.entity.ts`
- `tags`：`src/modules/markets/tag.entity.ts`
- `event_tags`：`src/modules/events/event-tag.entity.ts`
- `ingestion_state`：`src/modules/ingestion/ingestion-state.entity.ts`

### 5.2 Entity 欄位重點（必讀）
以下欄位是「查詢/關聯/同步」最常用的部分，全部來自 entity 定義與 migration。  

`events`（`Event`）：
- `id`（uuid，PK）
- `polymarketEventId`（integer，唯一，對應 Gamma event id）
- `slug` / `title` / `description`
- `startDate` / `endDate`（timestamptz）
- `active` / `closed` / `archived` / `featured` / `restricted`
- `liquidity` / `volume`
- `raw`（jsonb，保留 Gamma 原始 payload）
- `createdAt` / `updatedAt`

`markets`（`Market`）：
- `id`（uuid，PK）
- `polymarketMarketId`（integer，唯一，對應 Gamma market id）
- `slug` / `question` / `title`
- `category` / `conditionId` / `marketType` / `formatType`
- `active` / `closed` / `status`
- `endDate` / `resolveTime`
- `liquidity` / `volume` / `volume24hr`
- `outcomePrices`（jsonb，Yes/No 價格陣列）
- `outcomes`（jsonb）
- `clobTokenIds`（text[]）
- `lastDetailSyncedAt`（timestamptz，market 詳細同步時間）
- `eventId`（uuid，FK → `events.id`）
- `raw`（jsonb，保留 Gamma 原始 payload）
- `createdAt` / `updatedAt`

`market_snapshots`（`MarketSnapshot`）：
- `id`（uuid，PK）
- `marketId`（uuid，FK → `markets.id`）
- `ts`（timestamptz，分鐘桶）
- `priceYes` / `priceNo`
- `volume` / `liquidity`

`tags`（`Tag`）：
- `id`（integer，PK）
- `label` / `slug`
- `forceShow` / `forceHide` / `isCarousel`
- `publishedAt` / `createdAt` / `updatedAt`

`event_tags`（`EventTag`）：
- `eventId`（uuid，FK → `events.id`）
- `tagId`（integer，FK → `tags.id`）

`ingestion_state`（`IngestionState`）：
- `key`（text，PK）
- `value`（jsonb，存 offset / limit / updatedAt）
- `updatedAt`

### 5.2 關聯與重點欄位
- `events.polymarketEventId` / `markets.polymarketMarketId`：對應 Polymarket ID。
- `markets.eventId` → `events.id`：Event 1:N Market。
- `events.raw` / `markets.raw`：保留 Gamma API 原始 payload。
- `event_tags`：Event 與 Tag 多對多。
- `market_snapshots`：定期寫入 yes/no 價格、volume、liquidity。

資料表初始化可對照：`src/infra/db/migrations/0001-init.ts`。

## 6. NBA 專用同步策略（建議做法）
以下是「最小改動」版本，讓同步只抓 NBA：

Step 1：先取得 NBA 的 `series_id` 與（可選）`tag_id`。呼叫 `GET /sports` 找 NBA 的 `series_id`，若只抓「單場比賽」(game bets) 而非 futures，用 `tag_id` 過濾。

Step 2：在 ingestion 任務加上 NBA 參數。修改 `SyncEventsProducer` 的 job data，加入 `series_id`（必要）以及 `tag_id`（可選），並將 offset key 換成 NBA 專用（例如 `events_nba_offset`），避免與全量同步共用狀態。

Step 3：限制 snapshot 與 market details 僅針對 NBA。現況 `MarketsService.pullSnapshots()` 是「全體 active market」取前 50 筆，若只要 NBA，建議在 query 上增加條件，例如用 `event_tags` + `tags` 過濾 tag slug，或用 `events.raw` 中的 `series_id` 做條件。

Step 4：若要做「NBA 球隊資訊對齊」，可使用 `/teams?league=NBA` 取得官方球隊列表。

## 7. 建議落地設定（可直接複製到設計文件）
### 7.1 建議新增環境變數
- `POLY_SPORT_SERIES_ID`：NBA series_id
- `POLY_SPORT_TAG_ID`：NBA game bets tag_id（可選）
- `POLY_SPORT_LEAGUE`：固定 `NBA`（僅用於 teams 查詢或記錄）

### 7.2 建議加的最小程式調整點
`src/modules/ingestion/producers/sync-events.producer.ts`：加入 `series_id` / `tag_id` 到 `SyncEventsWithMarkets` job payload，並將 offset key 換成 NBA 專用。

`src/modules/ingestion/processors/sync-events.processor.ts`：不需改動（原本就會透過 query 轉成 URL params）。

`src/modules/markets/markets.service.ts`：`pullSnapshots()` 可加 NBA 篩選條件。

`src/modules/ingestion/services/ingestion-state.service.ts`：只要改 key 名稱即可，不需改 API。

## 8. 驗證與觀察
- 查 DB：確認 `events` / `markets` 只有 NBA 相關資料。
- 查 API：`GET /api/events?tag=...`（或 `tagId`）看是否只剩 NBA，`GET /api/markets?tag=...` 驗證 market。
- 觀察 worker log：`Gamma API request` log 會印出實際 URL。

## 9. 你會常查的檔案清單
- `src/modules/polymarket-gamma/gamma.client.ts`
- `src/modules/ingestion/producers/sync-events.producer.ts`
- `src/modules/ingestion/processors/sync-events.processor.ts`
- `src/modules/markets/markets.service.ts`
- `src/modules/jobs/jobs.scheduler.ts`
- `src/infra/db/migrations/0001-init.ts`

---

如果你需要我直接把「NBA 專用參數」實作到程式裡，回我兩個值即可：
1. `series_id`
2. `tag_id`（若只要 game bets）
