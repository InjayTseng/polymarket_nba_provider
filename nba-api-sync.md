# NBA API 資料同步與 DB Entity 對照

這份文件整理目前 repo 內「DB entity」與「NBA API 同步流程」，讓新同事可以直接照著做出定時 fetch NBA API → 寫入 DB 的流程。本文以 `worker/` 的實作為準，並補上 `ml-service` 的 NBA API proxy 使用方式。

## 資料庫 Entity（同步相關）

完整欄位意義請看 `docs/entity-fields.md`。這裡直接列出同步流程會寫入的表與欄位。

### `team`
欄位：
- `id` (uuid)
- `provider` (text)
- `provider_team_id` (text)
- `abbrev` (text)
- `name` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

約束：
- unique(`provider`, `provider_team_id`)

### `game`
欄位：
- `id` (uuid)
- `provider` (text)
- `provider_game_id` (text)
- `season` (int)
- `date_time_utc` (timestamptz)
- `status` (text: `scheduled` / `finished`)
- `home_score` (int, nullable)
- `away_score` (int, nullable)
- `home_team_id` (uuid, FK → `team.id`)
- `away_team_id` (uuid, FK → `team.id`)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

約束/索引：
- unique(`provider`, `provider_game_id`)
- index(`date_time_utc`)

### `team_game_stat`
欄位：
- `id` (uuid)
- `game_id` (uuid, FK → `game.id`)
- `team_id` (uuid, FK → `team.id`)
- `is_home` (bool)
- `pts` (int)
- `reb` (int, nullable)
- `ast` (int, nullable)
- `tov` (int, nullable)
- `fgm` (int, nullable)
- `fga` (int, nullable)
- `fg3m` (int, nullable)
- `fg3a` (int, nullable)
- `ftm` (int, nullable)
- `fta` (int, nullable)
- `off_rtg` (numeric, nullable)
- `def_rtg` (numeric, nullable)
- `pace` (numeric, nullable)
- `ts_pct` (numeric, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

約束/索引：
- unique(`game_id`, `team_id`)
- index(`team_id`, `game_id`)

### `player`
欄位：
- `id` (uuid)
- `provider` (text)
- `provider_player_id` (text)
- `first_name` (text)
- `last_name` (text)
- `display_name` (text)
- `position` (text, nullable)
- `height_cm` (int, nullable)
- `weight_kg` (int, nullable)
- `birthdate` (date, nullable)
- `country` (text, nullable)
- `is_active` (bool)
- `shoots` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

約束/索引：
- unique(`provider`, `provider_player_id`)
- index(`display_name`)

### `player_season_team`
欄位：
- `id` (uuid)
- `provider` (text)
- `player_id` (uuid, FK → `player.id`)
- `season` (int)
- `team_id` (uuid, FK → `team.id`)
- `from_utc` (timestamptz)
- `to_utc` (timestamptz, nullable)
- `role` (text, nullable)
- `contract_type` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

約束/索引：
- index(`player_id`, `season`)
- index(`team_id`, `season`)

### `player_game_stat`
欄位：
- `id` (uuid)
- `provider` (text)
- `game_id` (uuid, FK → `game.id`)
- `player_id` (uuid, FK → `player.id`)
- `team_id` (uuid, FK → `team.id`)
- `is_starter` (bool, nullable)
- `minutes` (numeric(6,3), nullable)
- `pts` (int)
- `reb` (int)
- `ast` (int)
- `tov` (int)
- `stl` (int, nullable)
- `blk` (int, nullable)
- `fgm` (int, nullable)
- `fga` (int, nullable)
- `fg3m` (int, nullable)
- `fg3a` (int, nullable)
- `ftm` (int, nullable)
- `fta` (int, nullable)
- `plus_minus` (int, nullable)
- `did_not_play_reason` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

約束/索引：
- unique(`game_id`, `player_id`)
- index(`player_id`, `game_id`)
- index(`game_id`, `team_id`)

### `data_conflict`
欄位：
- `id` (uuid)
- `conflict_type` (text)
- `player_id` (uuid, nullable)
- `season` (int, nullable)
- `job_id` (text, nullable)
- `details_json` (jsonb, nullable)
- `created_at` (timestamptz)

約束/索引：
- index(`conflict_type`)

同步 NBA API 主要會寫入：`team`, `game`, `team_game_stat`, `player`, `player_season_team`, `player_game_stat`, `data_conflict`。

## NBA API Endpoint 對照（實際用到）

`worker/src/provider/nba-api-provider.ts` 會優先走 `NBA.stats`（Node 套件），若設定 `NBA_API_PROXY_BASE` 則改走 proxy（`ml-service` 的 `/stats/{method}`）。

| Endpoint | 使用者 | 寫入表 | 主要欄位 |
| --- | --- | --- | --- |
| `scoreboardv2` | `syncSchedule` | `team`, `game` | `GAME_ID`, `GAME_DATE_EST`, `GAME_STATUS_ID`, `HOME_TEAM_ID`, `VISITOR_TEAM_ID`, `TEAM_ABBREVIATION`, `TEAM_CITY_NAME`, `TEAM_NAME` |
| `boxscoresummaryv2` | `syncFinalResults` | `game` | `GAME_STATUS_ID` / `GAME_STATUS_TEXT` |
| `boxscoretraditionalv3` | `syncFinalResults`, `syncPlayerGameStats` | `team_game_stat`, `player_game_stat` | `points`, `reboundsTotal`, `assists`, `turnovers`, `fieldGoals*`, `threePointers*`, `freeThrows*`, `players` |
| `boxscoreadvancedv3` | `syncFinalResults` | `team_game_stat` | `offensiveRating`, `defensiveRating`, `pace`, `trueShootingPercentage` |
| `commonallplayers` | `syncPlayers` | `player` | `PERSON_ID`, `DISPLAY_FIRST_LAST`, `POSITION`, `HEIGHT`, `WEIGHT`, `BIRTHDATE`, `COUNTRY`, `IS_ACTIVE`, `SHOOTS` |
| `commonplayerinfo` | `syncPlayers` | `player` | 補齊缺漏欄位 |
| `commonteamroster` | `syncPlayerSeasonTeams` | `player_season_team` | `PLAYER_ID`, `PLAYER`, `PLAYER_NAME` |

注意：回傳欄位可能是大寫或 camelCase，程式已做容錯取值。

## 同步流程（Worker 實作順序）

核心在 `worker/src/worker.ts` 與 `worker/src/processors/*`。

1. `syncScheduleJob(dateFromUtc, dateToUtc)`
1. 每天逐日呼叫 `scoreboardv2`
1. Upsert `team` 與 `game`
1. 以 `GAME_STATUS_ID=3` 判定 `game.status=finished`，否則 `scheduled`

2. `syncFinalResultsJob(dateFromUtc, dateToUtc | gameId)`
1. 找出時間範圍內且尚未「完賽+寫入兩隊 stats」的比賽
1. 用 `boxscoresummaryv2` 確認完賽
1. 用 `boxscoretraditionalv3` 寫入 `team_game_stat`
1. 用 `boxscoreadvancedv3` 補 `off_rtg/def_rtg/pace/ts_pct`（可失敗、不中斷）
1. 更新 `game.status`、`home_score`、`away_score`
1. 成功後 enqueue `syncPlayerGameStatsJob(gameId)`

3. `syncPlayersJob(season)`
1. 用 `commonallplayers` 取得球員清單
1. 欄位不完整時用 `commonplayerinfo` 補齊
1. Upsert `player`

4. `syncPlayerSeasonTeamsJob(season)`
1. 對 `team` 逐隊呼叫 `commonteamroster`
1. Upsert `player_season_team`
1. 同一球員同一 season 只允許一筆 `to_utc IS NULL`，多筆會被關閉並寫 `data_conflict`
1. 需要 `SEASON_START_UTC_{season}` 環境變數

5. `syncPlayerGameStatsJob(dateFromUtc, dateToUtc | gameId)`
1. 只處理 `game.status=finished` 且已具備兩隊 `team_game_stat` 的比賽
1. 用 `boxscoretraditionalv3` 拉球員 boxscore（依序嘗試 `Regular Season` / `Playoffs` / `Pre Season`）
1. Upsert `player_game_stat`
1. 缺資料會寫 `data_conflict`

## 定時同步（現有機制）

`worker/src/worker.ts` 內建「每小時」排程，只會 enqueue `syncScheduleJob` 與 `syncFinalResultsJob`。

可用的環境變數在 `worker/src/config/env.ts`：

- `SYNC_HOURLY_ENABLED`：是否啟用每小時排程
- `SYNC_HOURLY_INTERVAL_MINUTES`：排程間隔（分鐘）
- `SYNC_HOURLY_RUN_ON_START`：啟動即跑一次
- `SYNC_SCHEDULE_LOOKBACK_DAYS`：賽程回補天數
- `SYNC_SCHEDULE_LOOKAHEAD_DAYS`：賽程往前抓天數
- `FINAL_RESULTS_SCAN_DAYS`：完賽檢查回補天數
- `NBA_API_PROXY_BASE`：若需要 proxy，填入 `ml-service` 的 base URL

若需要「每天固定時間」補 players/roster，可另行新增排程或 cron 執行 `sync:now`。

## 手動同步指令（開發/修復用）

位於 `worker/package.json`：

```bash
# 本地開發版（ts-node）
cd worker
npm run sync:now:dev -- --schedule-only
npm run sync:now:dev -- --final-only
npm run sync:now:dev -- --players
npm run sync:now:dev -- --player-season-teams
npm run sync:now:dev -- --player-stats
```

## NBA API Proxy（ml-service）

`ml-service` 提供 `/stats/{method}` 代理 NBA Stats API。`worker` 若設定 `NBA_API_PROXY_BASE`，會改打 `BASE/stats/{method}`。

支援方法在 `ml-service/app/api.py`：

- `scoreboardv2`, `boxscoresummaryv2`
- `boxscoretraditionalv2/v3`, `boxscoreadvancedv2/v3`
- `commonallplayers`, `commonplayerinfo`, `commonteamroster`

這個 proxy 只負責「轉送」，不會變更欄位結構。

## 建議實作定時 Fetch 的最小步驟

1. 確認 DB schema 已 migrate（至少包含同步相關表）
1. 設定 `POSTGRES_*`、`REDIS_*`、`NBA_API_PROXY_BASE`（可選）
1. 啟動 `worker`（它會自動每小時 enqueue `syncSchedule` + `syncFinalResults`）
1. 另行規劃每日排程（cron 或 job）執行 `sync:now --players --player-season-teams`

只要以上 4 步完成，就能穩定把 NBA 資料持續寫入 DB，供後續功能使用。
