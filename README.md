# MeDo Reddit Intelligence Radar

> 全球 SMB 需求雷达 + AI Native Developer 社区雷达 + 竞品迁移雷达 + 产品机会洞察平台。

内部 B2B 情报平台：持续扫描目标 Subreddit / 关键词 / 帖子 / 评论，识别正在寻找网站、
App、预约系统的 SMB，对现有工具不满的迁移用户，正在做 MVP 的 Founder / 开发者，并把它们
转成可解释、可行动的 **Qualified Opportunities**。

**北极星指标**：每周被业务团队确认并采取行动的 Qualified Opportunities 数量。

## 当前实现状态

**P0 + P1 全部落地并端到端验证。** 前后端完整数据链路：

```
创建 Radar Project → 配置 Subreddit + 关键词 → 采集 Reddit Post（Mock/真实）
→ 去重存储 → LLM 分析（Pydantic 校验）→ 生成 Insight → 计算可解释 Opportunity Score
→ Opportunity Feed → 人工标记/跟进 → 社区/趋势/竞品/活跃用户分析 → 日报/周报 → CSV 导出
```

无需任何真实凭证即可运行（Mock Reddit + Mock LLM + SQLite）。配置凭证后同一接口切换真实模式。

### 功能清单

**后端**
- SourceAdapter 抽象（Mock + Async PRAW），LLMProvider 抽象（Mock + OpenAI-compatible），Embedding 抽象（Mock）
- 扫描管道：采集 → 去重（唯一约束 + content_hash）→ 分析 → 评分 → 落库；幂等；单条失败隔离
- 可配置 Opportunity Score（8 维）+ Channel Score（7 维）+ Active User Score（7 维），全部保存子分数可解释
- Checkpoint（记录每个社区最新 external_id）+ ScanRun 持久化（task health）
- 内置 asyncio 定时调度器（env 开关）
- 日报 + 周报（从结构化 Insight 聚合，不重复喂原文）+ CSV 导出 + Rescore
- 语义召回、活跃用户识别、社区/竞品/趋势聚合分析

**前端（9 个页面）**
Overview · Opportunity Feed（+详情 Drawer）· Community Explorer · Trend Dashboard ·
Competitor Radar · Active Users · Radar Setup（+Task Health）· Reports · Settings（可调权重 + Rescore）

**主题与多语言**
默认浅色（Light）主题，可在顶栏一键切换深色（Dark）；中 / EN 双语一键切换，偏好保存在
localStorage。也支持 URL 参数 `?lang=en&theme=dark` 生成可分享链接。

## 快速开始（无凭证，本地）

需要两个终端：后端 API 与前端 Dashboard。

```bash
# 终端 1 — 后端 API (http://localhost:8000)
cd apps/api
python3.11 -m venv .venv && source .venv/bin/activate   # 需 Python 3.10+
pip install -r requirements.txt
uvicorn app.main:app --reload            # /docs 有 Swagger

# 终端 2 — 前端 Dashboard (http://localhost:3000)
cd apps/web
npm install
npm run dev
```

打开 http://localhost:3000 → Radar Setup 一键填充社区/关键词 → 运行 Mock 扫描（下方
Task Health 表显示每次扫描）→ Overview / Opportunity Feed 查看结果 → 点开机会看可解释
评分与 Evidence → 标记 Relevant / 跟进状态 → Community Explorer / Trend / Competitor /
Active Users 看聚合洞察 → Settings 调评分权重并一键 Rescore → Reports 生成日报/周报并
导出 .md / CSV。

### 开启定时扫描

后端启动时设 `SCHEDULER_ENABLED=true`，会对每个 Active 项目按 `SCAN_NEW_INTERVAL_MINUTES`
自动扫描（trigger=scheduled，出现在 Task Health 表）：

```bash
SCHEDULER_ENABLED=true SCAN_NEW_INTERVAL_MINUTES=10 uvicorn app.main:app
```

### 仅后端验证

```bash
cd apps/api && source .venv/bin/activate
python demo_slice.py     # 端到端演示（无需前端）
python -m pytest -q      # 测试
```

> 注意：本机默认 `python3` 为 3.9，不支持 `X | None` 类型语法。请使用 Python 3.10+
> （本项目用 3.11 验证通过）。

## 演示输出（真实运行结果）

```
=== SCAN RESULT ===
{ "mode": "mock", "collected": 4, "new_contents": 4, "analyzed": 4, "hot_leads": 1 }

=== OPPORTUNITY FEED ===
[ 89.2 Hot Lead              ] r/smallbusiness  SMB Owner  explicit | Booking through WhatsApp is a mess...
[ 81.1 Qualified Opportunity ] r/smallbusiness  Agency     explicit | Website agency quoted $6000...
[ 77.6 Qualified Opportunity ] r/Entrepreneur   SMB Owner  high     | Branded app for my gym - Vagaro too expensive
[ 74.8 Qualified Opportunity ] r/startups       Founder    high     | No CTO, need an MVP...
```

## 切换到真实模式

编辑 `.env`（从 `.env.example` 复制）：

```bash
SOURCE_ADAPTER=reddit
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
LLM_PROVIDER=openai-compatible
LLM_API_KEY=...
DATABASE_URL=postgresql+asyncpg://medo:medo@localhost:5432/medo_radar
```

真实 Reddit 需要 `pip install async-praw asyncpg`（见 requirements.txt 注释）。
`/api/status` 与 `/health` 会显示当前 `source_mode` / `llm_mode`（mock 或 live）。

## 文档

- [docs/PRD.md](docs/PRD.md) — 产品需求
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 架构与数据流
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) — 数据模型
- [docs/API.md](docs/API.md) — API 参考
- [docs/PROMPTS.md](docs/PROMPTS.md) — LLM 分析契约与提示词
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — 开发指南

## 目录结构

```
apps/api/            FastAPI 后端
  app/adapters/      SourceAdapter 抽象 + Mock/Real Reddit
  app/llm/           LLMProvider + Embedding 抽象 + Mock/OpenAI-compatible
  app/services/      scoring / channel_score / active_user / scan / scheduler / report
  app/routers/       projects / radar / analytics API
  tests/             单元 + API 集成测试（12 项）
  demo_slice.py      端到端演示
apps/web/            Next.js 14 Dashboard（9 页，App Router + Tailwind + TanStack Query）
fixtures/reddit/     Mock 数据
docs/                项目文档
docker-compose.yml   Postgres + Redis + API（完整栈）
```

## 已知限制

- Channel Score 的 recency/growth、Active User Score 的 recency 为占位值，需历史快照（后续）才能算真实近 30 日趋势。
- 真实 Reddit / Postgres / Celery 依赖为可选安装，Mock/SQLite 路径已端到端验证。
- 定时调度为进程内 asyncio 实现（MVP）；生产可换 Celery Beat，scan 服务不变。
- 前端认证尚未接入（内部工具，MVP 阶段单租户）。
- 语义召回与 Embedding 使用确定性 Mock 向量；真实 Embedding provider 按接口替换即可。
