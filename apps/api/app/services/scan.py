"""Scan pipeline: collect -> dedupe -> persist raw -> analyze -> score -> persist insight.

Idempotent: content is deduped by (platform, external_id) and content_hash, so
re-scanning never creates duplicates. LLM failures are isolated per-item and
recorded as analysis_status='failed' without aborting the scan.
"""
from __future__ import annotations

import hashlib
import time
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.base import SourceAdapter, SourceItem
from app.llm.provider import LLMProvider
from app.models import Author, Insight, RadarProject, RawContent, ScanRun, SourceChannel
from app.schemas import ScanResult
from app.services.active_user import update_author_score
from app.services.scoring import compute_opportunity_score, tier_for_score


def content_hash(item: SourceItem) -> str:
    basis = f"{item.channel_name}|{item.title}|{item.body}".strip().lower()
    return hashlib.sha256(basis.encode("utf-8")).hexdigest()


async def _dedupe_and_store(
    db: AsyncSession, item: SourceItem, platform: str, project_id: int
) -> RawContent | None:
    """Insert raw content if new. Returns the row when newly created, else None."""
    existing = await db.scalar(
        select(RawContent).where(
            RawContent.platform == platform, RawContent.external_id == item.external_id
        )
    )
    if existing:
        return None
    h = content_hash(item)
    dup = await db.scalar(select(RawContent).where(RawContent.content_hash == h))
    if dup:
        return None

    row = RawContent(
        platform=platform,
        external_id=item.external_id,
        content_type=item.content_type,
        subreddit=item.channel_name,
        author_username=item.author_username,
        title=item.title,
        body=item.body,
        url=item.url,
        permalink=item.permalink,
        score=item.score,
        upvote_ratio=item.upvote_ratio,
        comment_count=item.comment_count,
        created_at_platform=item.created_at_platform,
        parent_external_id=item.parent_external_id,
        raw_json=item.raw,
        content_hash=h,
        project_id=project_id,
    )
    db.add(row)
    await db.flush()
    return row


async def _analyze_and_score(
    db: AsyncSession, row: RawContent, item: SourceItem, llm: LLMProvider, weights: dict
) -> Insight:
    try:
        analysis = await llm.analyze(item)
        final, breakdown = compute_opportunity_score(
            analysis,
            post_score=row.score,
            comment_count=row.comment_count,
            weights=weights,
        )
        insight = Insight(
            content_id=row.id,
            summary_zh=analysis.summary_zh,
            original_language=analysis.original_language,
            persona=analysis.persona,
            industry=analysis.industry,
            geography=analysis.geography,
            problem=analysis.problem,
            current_workflow=analysis.current_workflow,
            current_tools=analysis.current_tools,
            competitors=analysis.competitors,
            purchase_intent=analysis.purchase_intent,
            pain_severity=analysis.pain_severity,
            urgency=analysis.urgency,
            budget_signal=analysis.budget_signal,
            desired_outcome=analysis.desired_outcome,
            product_opportunity=analysis.product_opportunity,
            medo_solution_type=analysis.medo_solution_type,
            opportunity_type=analysis.opportunity_type,
            suggested_action=analysis.suggested_action,
            suggested_response_angle=analysis.suggested_response_angle,
            opportunity_score=final,
            score_breakdown_json=breakdown,
            confidence=analysis.confidence,
            evidence_json=analysis.evidence_quotes,
            model_version=analysis.model_version,
            prompt_version=analysis.prompt_version,
            analysis_status="ok",
        )
    except Exception as e:  # isolate failure — never crash the worker
        insight = Insight(
            content_id=row.id,
            analysis_status="failed",
            summary_zh="",
            score_breakdown_json={"error": str(e)[:500]},
        )
    db.add(insight)
    await db.flush()
    return insight


async def _upsert_author(db: AsyncSession, item: SourceItem, insight: Insight) -> None:
    """Track the content author as a candidate active user."""
    uname = item.author_username
    if not uname or uname in ("", "[deleted]", "AutoModerator"):
        return
    author = await db.scalar(
        select(Author).where(Author.platform_username == uname)
    )
    if not author:
        author = Author(
            platform="reddit",
            platform_username=uname,
            public_profile_url=f"https://reddit.com/user/{uname}",
        )
        db.add(author)
    update_author_score(author, item, insight)
    await db.flush()


async def run_scan(
    db: AsyncSession,
    project: RadarProject,
    adapter: SourceAdapter,
    llm: LLMProvider,
    listings: list[str],
    limit_per_listing: int = 25,
    trigger: str = "manual",
) -> ScanResult:
    started = time.perf_counter()
    weights = (project.settings_json or {}).get("score_weights", {})

    channels = await db.scalars(
        select(SourceChannel).where(
            SourceChannel.project_id == project.id, SourceChannel.scan_enabled == True  # noqa: E712
        )
    )
    channels = list(channels)

    collected = new_count = analyzed = hot = failed = 0

    for channel in channels:
        newest_seen = channel.checkpoint or ""
        top_id = ""
        for listing in listings:
            items = await adapter.fetch_listing(
                channel.channel_name, listing=listing, limit=limit_per_listing
            )
            collected += len(items)
            for idx, item in enumerate(items):
                # Track the newest external_id from the "new" listing as the checkpoint.
                if listing == "new" and idx == 0:
                    top_id = item.external_id
                row = await _dedupe_and_store(db, item, adapter.platform, project.id)
                if row is None:
                    continue
                new_count += 1
                insight = await _analyze_and_score(db, row, item, llm, weights)
                if insight.analysis_status == "ok":
                    analyzed += 1
                    await _upsert_author(db, item, insight)
                    if insight.opportunity_score >= project.alert_threshold:
                        hot += 1
                else:
                    failed += 1
        channel.last_scanned_at = datetime.now(timezone.utc)
        if top_id:
            channel.checkpoint = top_id

    duration_ms = int((time.perf_counter() - started) * 1000)
    mode = "mock" if adapter.is_mock else "live"

    run = ScanRun(
        project_id=project.id,
        mode=mode,
        trigger=trigger,
        listings=listings,
        status="ok",
        collected=collected,
        new_contents=new_count,
        analyzed=analyzed,
        failed=failed,
        hot_leads=hot,
        duration_ms=duration_ms,
    )
    db.add(run)
    await db.commit()
    return ScanResult(
        project_id=project.id,
        mode=mode,
        collected=collected,
        new_contents=new_count,
        analyzed=analyzed,
        hot_leads=hot,
        duration_ms=duration_ms,
    )
