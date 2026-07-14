"""In-process asyncio scheduler for periodic scans.

Env-gated (SCHEDULER_ENABLED). A lightweight MVP alternative to Celery Beat: it
loops over Active projects and runs a scan every N minutes. For the full stack,
swap this for Celery Beat (see ARCHITECTURE.md) — the scan service is unchanged.
"""
from __future__ import annotations

import asyncio
import logging

from sqlalchemy import select

from app.adapters.reddit_real import get_source_adapter
from app.core.config import get_settings
from app.core.db import SessionLocal
from app.llm.provider import get_llm_provider
from app.models import RadarProject
from app.services.scan import run_scan

log = logging.getLogger("scheduler")


async def _tick() -> None:
    async with SessionLocal() as db:
        projects = list(
            await db.scalars(select(RadarProject).where(RadarProject.status == "Active"))
        )
        if not projects:
            return
        adapter = get_source_adapter()
        llm = get_llm_provider()
        for project in projects:
            try:
                result = await run_scan(
                    db, project, adapter, llm, listings=["new"], trigger="scheduled"
                )
                log.info("scheduled scan project=%s new=%s", project.id, result.new_contents)
            except Exception as e:  # never let one project kill the loop
                log.error("scheduled scan failed project=%s: %s", project.id, e)


async def scheduler_loop() -> None:
    s = get_settings()
    interval = max(30, s.scan_new_interval_minutes * 60)
    log.info("scheduler started, interval=%ss", interval)
    while True:
        await asyncio.sleep(interval)
        try:
            await _tick()
        except Exception as e:
            log.error("scheduler tick error: %s", e)
