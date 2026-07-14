# Development Guide

## 环境要求
- **Python 3.10+**（本机默认 `python3` 为 3.9，不支持 `X | None` 语法——务必用 3.10+）。
  本项目用 **3.11** 验证通过。
- Node 20+（前端 P1）
- Docker（完整栈）

## 后端（当前核心）
```bash
cd apps/api
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python demo_slice.py        # 端到端演示
python -m pytest -q         # 测试
uvicorn app.main:app --reload
```

## 运行模式
| 变量 | mock（默认） | live |
|---|---|---|
| `SOURCE_ADAPTER` | `mock`（读 fixtures） | `reddit`（Async PRAW，需凭证） |
| `LLM_PROVIDER` | `mock`（启发式） | `openai-compatible`（需 key） |
| `DATABASE_URL` | SQLite | Postgres+asyncpg |

缺凭证时自动回落 mock（见 `Settings.source_is_mock / llm_is_mock`）。
`/api/status` 显示当前模式。

## 完整栈（Postgres/Redis）
```bash
docker compose up -d          # 见 docker-compose.yml
# 安装完整依赖：取消 requirements.txt 中 asyncpg/async-praw/celery 的注释
```

## 代码约定
- Python 全量类型标注；Pydantic v2 校验所有 LLM 输出与 API 边界。
- 外部调用（LLM/Reddit）必须超时 + 重试 + 错误日志。
- 任务幂等；DB 写入去重；时间统一 UTC。
- 敏感配置只走环境变量，不提交真实 key。
- 新数据源：实现 `SourceAdapter`；新模型商：实现 `LLMProvider`。

## 测试
- `tests/test_units.py` — adapter、mock LLM、评分（含权重可配置、分级）。
- `tests/test_api_slice.py` — 完整 vertical slice（含幂等重扫、Feed 排序、日报）。
- Collector 用 fixtures；LLM 用 mock。

## 下一步（P1）
Next.js Dashboard、Celery 定时、Embedding 语义召回、趋势/竞品/活跃用户页、
CSV/Markdown 导出、Alembic 迁移。
