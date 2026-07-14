"""FastAPI application entrypoint."""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.db import init_db
from app.routers import analytics, projects, radar


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(level=get_settings().log_level)
    await init_db()
    task: asyncio.Task | None = None
    if get_settings().scheduler_enabled:
        from app.services.scheduler import scheduler_loop

        task = asyncio.create_task(scheduler_loop())
    yield
    if task:
        task.cancel()


app = FastAPI(title="MeDo Reddit Intelligence Radar", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(radar.router)
app.include_router(analytics.router)


@app.get("/health")
async def health():
    s = get_settings()
    return {"status": "ok", "source_mode": "mock" if s.source_is_mock else "live"}
