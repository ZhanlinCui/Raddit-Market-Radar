<div align="center">

<h1>📡 Reddit Market Radar</h1>

<h3>Turn Reddit noise into qualified, actionable sales & product opportunities.</h3>

<p>
  <img src="https://img.shields.io/badge/status-MVP%20(P0%2BP1)-0d946c?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/backend-FastAPI-009688?style=flat-square" alt="FastAPI">
  <img src="https://img.shields.io/badge/frontend-Next.js%2014-000000?style=flat-square" alt="Next.js">
  <img src="https://img.shields.io/badge/tests-12%20passing-0d946c?style=flat-square" alt="Tests">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/i18n-中文%20%2F%20EN-5b9dff?style=flat-square" alt="i18n">
</p>

<p>
  <a href="#-quickstart">Quickstart</a> &middot;
  <a href="#-features">Features</a> &middot;
  <a href="#-how-it-works">How it works</a> &middot;
  <a href="#-architecture">Architecture</a> &middot;
  <a href="docs/API.md">API</a>
</p>

</div>

<!-- Replace with a hosted screenshot once available. Local capture confirmed light+dark, zh+en. -->
<p align="center">
  <img src="docs/screenshot-overview.png" alt="Reddit Market Radar — Overview dashboard" width="820">
  <br><em>Overview dashboard — Hot Leads, competitor signals, and top opportunities at a glance.</em>
</p>

---

## Why Reddit Market Radar?

**Reddit is where SMBs, founders, and developers describe their problems in their own words — but finding those signals by hand doesn't scale.**

Teams end up manually searching subreddits, skimming threads, and copy-pasting pain points into spreadsheets that go stale in a day. Reddit Market Radar replaces that with a continuous pipeline that **collects, classifies, scores, and explains** every relevant post — then surfaces the handful worth acting on.

> **For Growth & Sales** — a ranked feed of reachable buyers with suggested outreach angles.
> **For Product & Solutions** — clustered pain points, competitor switch signals, and ICP evidence.
> **For DevRel** — active builders, community organizers, and AI-native developers worth engaging.

**North-star metric:** *Qualified Opportunities actioned by the team each week* — not scraped volume.

## ✨ Features

<table>
<tr>
<td width="33%" valign="top">

### 🎯 Explainable scoring
Every item gets a 0–100 **Opportunity Score** across 8 weighted dimensions. Weights are configurable and every sub-score is persisted — no black boxes.

</td>
<td width="33%" valign="top">

### 🔌 Pluggable sources & LLMs
`SourceAdapter` and `LLMProvider` abstractions isolate Reddit and the model. Runs fully on **mock data with zero credentials**, then swaps to live via env vars.

</td>
<td width="33%" valign="top">

### 🧭 Analyst-grade dashboards
Nine dashboards: opportunity feed, community & channel scoring, trends, competitor radar, active users — with an evidence-backed detail drawer.

</td>
</tr>
<tr>
<td width="33%" valign="top">

### ⏱️ Continuous scanning
Idempotent collect → dedupe → analyze → score pipeline with checkpoints, persisted scan runs, task-health monitoring, and a built-in scheduler.

</td>
<td width="33%" valign="top">

### 📊 Reports & export
Daily and weekly reports assembled from structured insights (never re-feeding raw text to the LLM), plus one-click CSV / Markdown export.

</td>
<td width="33%" valign="top">

### 🌗 Polished UX
Light theme by default with a dark toggle, and full **中文 / English** switching persisted per user — shareable via `?lang=en&theme=dark`.

</td>
</tr>
</table>

## 🚀 Quickstart

No Reddit or LLM credentials required — the system boots in **mock mode** on SQLite.

```bash
# Backend — http://localhost:8000  (Swagger at /docs)
cd apps/api
python3.11 -m venv .venv && source .venv/bin/activate   # Python 3.10+ required
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```bash
# Frontend — http://localhost:3000
cd apps/web
npm install && npm run dev
```

Open **http://localhost:3000** → **Radar Setup** seeds subreddits & keywords in one click → run a mock scan → explore the feed, scoring, and reports.

<details>
<summary><strong>Backend-only demo & tests (no frontend)</strong></summary>

```bash
cd apps/api && source .venv/bin/activate
python demo_slice.py     # end-to-end pipeline demo
python -m pytest -q      # 12 tests
```

Real output from `demo_slice.py`:

```
=== SCAN RESULT ===
{ "mode": "mock", "collected": 4, "new_contents": 4, "analyzed": 4, "hot_leads": 1 }

=== OPPORTUNITY FEED ===
[ 89.2 Hot Lead   ] r/smallbusiness  SMB Owner  explicit | Booking through WhatsApp is a mess...
[ 81.1 Qualified  ] r/smallbusiness  Agency     explicit | Website agency quoted $6000...
[ 77.6 Qualified  ] r/Entrepreneur   SMB Owner  high     | Branded app for my gym - Vagaro too expensive
[ 74.8 Qualified  ] r/startups       Founder    high     | No CTO, need an MVP...
```

</details>

## 🔍 How it works

```
Radar Project → subreddits + keywords → collect posts/comments (mock or live Reddit)
   → dedupe → LLM analysis (schema-validated) → structured Insight
   → explainable Opportunity Score → Feed → human triage & follow-up
   → community / trend / competitor / active-user analytics → daily & weekly reports
```

Each content item yields a validated `Insight`: Chinese summary, persona, industry, pain point, purchase intent, competitors, budget signal, evidence quotes, suggested action, confidence, and a full score breakdown. LLM failures are isolated per-item — one bad response never aborts a scan.

## 🧠 Scoring model

| Score | Scope | Dimensions | Purpose |
|-------|-------|-----------|---------|
| **Opportunity Score** | per item | intent · ICP match · pain · MeDo fit · urgency · budget · engagement · freshness | Rank what to act on |
| **Channel Score** | per subreddit | relevance · high-intent · persona · comment depth · recency · reachable · growth | Tier communities (A/B/C/Watchlist) |
| **Active User Score** | per author | frequency · topic · quality · influence · engagement · recency · stated role | Surface builders & buyers |

Weights live in configuration (never hard-coded in the UI). Change them in **Settings** and hit **Rescore** to recompute — no LLM re-run needed.

## 🏗️ Architecture

<details>
<summary><strong>Tech stack & data flow</strong></summary>

**Backend** — FastAPI · async SQLAlchemy 2.0 · Pydantic v2 · SQLite (dev) / Postgres + pgvector (prod)
**Frontend** — Next.js 14 (App Router) · TypeScript · Tailwind · TanStack Query
**Workers** — in-process asyncio scheduler (MVP) → Celery Beat (prod); scan service unchanged

```
             ┌────────────────────────────────────────────┐
 Next.js  ──▶│  FastAPI                                     │
 Dashboard   │   routers: projects · radar · analytics       │
             │   services: scan · scoring · channel_score ·  │
             │             active_user · scheduler · report  │
             │   adapters: SourceAdapter (Reddit, …)         │
             │   llm:      LLMProvider · Embedding           │
             └───────────────┬───────────────┬──────────────┘
                     ┌────────▼─────┐  ┌───────▼──────┐
                     │  PostgreSQL  │  │    Redis     │  (prod)
                     │  + pgvector  │  │  Celery broker│
                     └──────────────┘  └──────────────┘
```

Everything runs on SQLite + mock adapters for local dev; the same interfaces back the Postgres/Redis stack via `docker-compose.yml`.

</details>

<details>
<summary><strong>Repository layout</strong></summary>

```
apps/api/            FastAPI backend
  app/adapters/      SourceAdapter (mock + Async PRAW)
  app/llm/           LLMProvider + Embedding (mock + OpenAI-compatible)
  app/services/      scoring · channel_score · active_user · scan · scheduler · report
  app/routers/       projects · radar · analytics
  tests/             unit + API integration (12 tests)
  demo_slice.py      end-to-end demo
apps/web/            Next.js 14 dashboard (9 pages)
fixtures/reddit/     mock data
docs/                PRD · ARCHITECTURE · DATA_MODEL · API · PROMPTS · DEVELOPMENT
docker-compose.yml   Postgres + Redis + API (full stack)
```

</details>

## 🔧 Going live

Copy `.env.example` to `.env` and provide credentials — the API interface is identical to mock mode.

```bash
SOURCE_ADAPTER=reddit
REDDIT_CLIENT_ID=...          REDDIT_CLIENT_SECRET=...
LLM_PROVIDER=openai-compatible
LLM_API_KEY=...               LLM_BASE_URL=https://api.openai.com/v1
DATABASE_URL=postgresql+asyncpg://medo:medo@localhost:5432/medo_radar
SCHEDULER_ENABLED=true        SCAN_NEW_INTERVAL_MINUTES=10
```

Live Reddit/Postgres need `pip install async-praw asyncpg`. `/api/status` and `/health` report the active `source_mode` / `llm_mode`.

## 📚 Documentation

| Doc | Contents |
|-----|----------|
| [PRD](docs/PRD.md) | Product requirements & acceptance criteria |
| [Architecture](docs/ARCHITECTURE.md) | Components, data flow, reliability |
| [Data Model](docs/DATA_MODEL.md) | All entities & relationships |
| [API](docs/API.md) | Endpoint reference |
| [Prompts](docs/PROMPTS.md) | LLM analysis contract & prompts |
| [Development](docs/DEVELOPMENT.md) | Setup, modes, testing |

## 🗺️ Roadmap

- [x] **P0** — collection, mock adapters, scoring, feed, triage, daily reports, task health
- [x] **P1** — analytics dashboards, weekly reports, CSV export, semantic recall, active users, scheduler, i18n
- [ ] **P2** — multi-source (Hacker News, GitHub, Product Hunt), CRM integration, historical trend snapshots, auth & multi-tenancy

## ⚠️ Known limitations

- `recency` / `growth` sub-scores are placeholders pending historical snapshots.
- The scheduler is in-process asyncio (MVP-grade); swap for Celery Beat in production.
- Embeddings use a deterministic mock; plug a real provider via the `Embedding` interface.
- No frontend auth yet (single-tenant internal tool).

## 🤝 Contributing

```bash
git clone https://github.com/ZhanlinCui/Raddit-Market-Radar.git
cd Raddit-Market-Radar/apps/api && python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && python -m pytest -q
```

Issues and PRs welcome. Please keep the mock path green — it's the contract that lets anyone run the system without credentials.

## 📄 License

[MIT](LICENSE)
