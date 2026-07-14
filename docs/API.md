# API Reference

Base: `http://localhost:8000`。交互式文档：`/docs`（Swagger）。
返回 JSON，时间为 UTC ISO8601。

## Health / Status
- `GET /health` → `{status, source_mode}`
- `GET /api/status` → `{source_mode(mock|live), llm_mode(mock|live), app_env}`

## Radar Projects
- `POST /api/projects` — 创建。body: `RadarProjectIn`（name 必填）。
- `GET /api/projects` — 列表。
- `GET /api/projects/{id}` — 详情。
- `PATCH /api/projects/{id}` — 更新。
- `POST /api/projects/{id}/channels` — 添加 Subreddit。body: `{channel_name, channel_tier?, ...}`
- `GET /api/projects/{id}/channels`
- `POST /api/projects/{id}/rules` — 添加关键词/语义/竞品规则。
  body: `{rule_type, rule_value, weight?, is_negative?, language?}`
- `GET /api/projects/{id}/rules`

## Scan
- `POST /api/scan` — 触发扫描。
  body: `{project_id, listings?:["new","hot",...], limit_per_listing?}`
  → `ScanResult {mode, collected, new_contents, analyzed, hot_leads, duration_ms}`
  幂等：重复扫描已采集内容 `new_contents=0`。每次执行落库为一条 ScanRun。
- `GET /api/scan-runs?project_id=&limit=` — 扫描任务历史（task health）：
  trigger(manual|scheduled)、status、collected/new/analyzed/failed/hot、耗时。

## Opportunity Feed
- `GET /api/opportunities` — query: `project_id, subreddit, persona, min_score,
  purchase_intent, limit`。按 `opportunity_score` 降序。
  每条含 `insight`（带 `score_breakdown_json` 可解释）、`title, subreddit,
  author_username, permalink, follow_up_status, label`。

## Follow-up（人工闭环）
- `POST /api/contents/{content_id}/follow-up` — upsert。
  body: `FollowUpUpdate {status?, label?(relevant|irrelevant), assignee_id?, notes?,
  failure_reason?}`

## Reports
- `POST /api/reports/daily?project_id=` — 从结构化 Insight 生成日报。
  → `{id, markdown, summary}`
- `POST /api/reports/weekly?project_id=` — 周报（PRD §18.2 结构：Executive Summary、
  趋势、Top 20、痛点聚类、竞品信号、行业分布、产品启示）。
- `GET /api/reports` — 报告列表。
- `GET /api/opportunities.csv?project_id=` — 机会明细 CSV 导出（下载）。

## Rescore
- `POST /api/projects/{id}/rescore` — 用当前权重重算所有机会分数（不重跑 LLM）。
  改 `settings_json.score_weights` 后调用即可生效。

## Analytics（从结构化 Insight 聚合，不重新调用 LLM）
- `GET /api/analytics/communities?project_id=` — 每个 Subreddit 的统计 + **Channel Score**
  （可解释 `score_breakdown`）+ 建议 Tier(A|B|C|Watchlist|Excluded)。
- `GET /api/analytics/competitors?project_id=` — 每个竞品的提及量、迁移信号数、价格抱怨数、
  平均痛点、用户原话、相关帖子示例。按提及量降序。
- `GET /api/analytics/trends?project_id=` — Persona / Industry / Opportunity Type /
  Purchase Intent / MeDo Solution Type 分布。
- `GET /api/analytics/active-users?limit=` — 活跃用户（Active User Score，仅公开内容）：
  username、persona、活跃社区、主要主题、相关内容数、子分数。
- `GET /api/analytics/semantic-search?q=&project_id=&limit=` — 基于 Embedding 的语义召回
  （Mock embeddings），返回按相似度排序的内容。

## 示例（curl）
```bash
curl -X POST localhost:8000/api/projects -H 'content-type: application/json' \
  -d '{"name":"SMB Demand Radar","alert_threshold":85}'
curl -X POST localhost:8000/api/projects/1/channels -H 'content-type: application/json' \
  -d '{"channel_name":"smallbusiness"}'
curl -X POST localhost:8000/api/scan -H 'content-type: application/json' \
  -d '{"project_id":1,"listings":["new"]}'
curl 'localhost:8000/api/opportunities?project_id=1&min_score=70'
curl -X POST 'localhost:8000/api/reports/daily?project_id=1'
```
