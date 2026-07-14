# Architecture

## 组件总览

```
                    ┌─────────────────────────────────────────┐
                    │              FastAPI (apps/api)           │
   Web Dashboard ──▶│  routers: projects / radar               │
   (Next.js, P1)    │  services: scan · scoring · report        │
                    │  adapters: SourceAdapter (Reddit ...)     │
                    │  llm:      LLMProvider (OpenAI-compat ...) │
                    └───────────┬───────────────┬───────────────┘
                                │               │
                        ┌───────▼──────┐  ┌─────▼──────┐
                        │  PostgreSQL  │  │   Redis    │  (P1: Celery broker)
                        │  + pgvector  │  │            │
                        └──────────────┘  └────────────┘
```

MVP 的可验证切片使用 **SQLite + Mock adapters**，无外部依赖。完整栈用
Postgres/Redis（docker-compose）。

## 关键抽象

### SourceAdapter (`app/adapters/base.py`)
所有业务逻辑只依赖 `SourceItem`（平台中立）与 `SourceAdapter` 接口
（`fetch_listing` / `search` / `fetch_comments`）。
- `MockRedditAdapter` — 读 `fixtures/reddit/*.json`，无凭证。
- `RedditAdapter` — Async PRAW，惰性导入。
- 工厂 `get_source_adapter()` 按 `SOURCE_ADAPTER` / 凭证是否存在选择实现。
- 后续 Hacker News / GitHub / Product Hunt 只需实现同一接口。

### LLMProvider (`app/llm/provider.py`)
- `MockLLMProvider` — 确定性关键词启发式，产出 schema 合法的 `LLMAnalysis`。
- `OpenAICompatibleProvider` — OpenAI/Claude/ERNIE 等，超时 + 重试 + JSON 校验。
- 工厂 `get_llm_provider()` 按 `LLM_PROVIDER` / key 是否存在选择。
- 两级模型策略（L1 低成本过滤 / L2 深度分析）通过 `LLM_MODEL_L1/L2` 配置。

## 数据流（Vertical Slice）

```
adapter.fetch_listing()  ──▶  SourceItem[]
        │
        ▼  dedupe by (platform, external_id) + content_hash
   RawContent (persist)
        │
        ▼  llm.analyze()  → LLMAnalysis (Pydantic 校验)
   compute_opportunity_score()  → (score, breakdown)
        │
        ▼
   Insight (persist, analysis_status ok|failed)
        │
        ▼
   /api/opportunities  (filtered, sorted)  ──▶  Feed
   /api/reports/daily  (从 Insight 聚合，不重复喂原文)
```

## 可靠性
- **幂等**：去重双保险（唯一约束 + content_hash），重扫不产生重复。
- **故障隔离**：单条 LLM 失败记为 `analysis_status='failed'`，不中断扫描。
- **可解释**：`score_breakdown_json` 保存每个维度子分数与权重。
- **可配置**：评分权重存 `project.settings_json["score_weights"]`，非硬编码。
- **时间**：全部 UTC 存储；前端按用户时区展示。
- **Mock/Real 同接口**：切换仅改环境变量。

## 任务调度（P1）
Celery + Celery Beat：New 每 10min、Search 每小时、Backfill 每 6h、Top of Day 每日、
Top of Week 每周、高价值帖 72h 跟踪。频率均可配置。MVP 通过 `/api/scan` 手动触发。
