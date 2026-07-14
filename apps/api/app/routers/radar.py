"""Scan trigger + Opportunity Feed + follow-up + reports routers."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.reddit_real import get_source_adapter
from app.core.config import get_settings
from app.core.db import get_db
from app.llm.provider import get_llm_provider
from app.models import FollowUpRecord, Insight, RadarProject, RawContent, Report, ScanRun
from app.schemas import (
    FollowUpUpdate,
    InsightOut,
    OpportunityOut,
    ScanRequest,
    ScanResult,
)
from app.services.report import generate_daily_report, generate_weekly_report
from app.services.scan import run_scan
from app.services.scoring import compute_opportunity_score

router = APIRouter(prefix="/api", tags=["radar"])


@router.get("/status")
async def status():
    s = get_settings()
    return {
        "source_mode": "mock" if s.source_is_mock else "live",
        "llm_mode": "mock" if s.llm_is_mock else "live",
        "app_env": s.app_env,
        "scheduler_enabled": s.scheduler_enabled,
        "scan_interval_minutes": s.scan_new_interval_minutes,
    }


@router.post("/scan", response_model=ScanResult)
async def trigger_scan(body: ScanRequest, db: AsyncSession = Depends(get_db)):
    project = await db.get(RadarProject, body.project_id)
    if not project:
        raise HTTPException(404, "project not found")
    adapter = get_source_adapter()
    llm = get_llm_provider()
    return await run_scan(
        db, project, adapter, llm, body.listings, body.limit_per_listing
    )


@router.get("/scan-runs")
async def scan_runs(
    project_id: int | None = None, limit: int = 20, db: AsyncSession = Depends(get_db)
):
    q = select(ScanRun).order_by(ScanRun.id.desc()).limit(limit)
    if project_id is not None:
        q = q.where(ScanRun.project_id == project_id)
    runs = list(await db.scalars(q))
    return [
        {
            "id": r.id,
            "mode": r.mode,
            "trigger": r.trigger,
            "listings": r.listings,
            "status": r.status,
            "collected": r.collected,
            "new_contents": r.new_contents,
            "analyzed": r.analyzed,
            "failed": r.failed,
            "hot_leads": r.hot_leads,
            "duration_ms": r.duration_ms,
            "started_at": r.started_at,
        }
        for r in runs
    ]


@router.get("/opportunities", response_model=list[OpportunityOut])
async def opportunities(
    db: AsyncSession = Depends(get_db),
    project_id: int | None = None,
    subreddit: str | None = None,
    persona: str | None = None,
    min_score: float = 0.0,
    purchase_intent: str | None = None,
    limit: int = Query(50, le=200),
):
    q = (
        select(Insight, RawContent)
        .join(RawContent, Insight.content_id == RawContent.id)
        .where(Insight.analysis_status == "ok", Insight.opportunity_score >= min_score)
        .order_by(Insight.opportunity_score.desc())
        .limit(limit)
    )
    if project_id is not None:
        q = q.where(RawContent.project_id == project_id)
    if subreddit:
        q = q.where(RawContent.subreddit == subreddit)
    if persona:
        q = q.where(Insight.persona == persona)
    if purchase_intent:
        q = q.where(Insight.purchase_intent == purchase_intent)

    rows = list(await db.execute(q))
    out: list[OpportunityOut] = []
    for ins, rc in rows:
        fu = await db.scalar(
            select(FollowUpRecord).where(FollowUpRecord.content_id == rc.id)
        )
        out.append(
            OpportunityOut(
                insight=InsightOut.model_validate(ins),
                subreddit=rc.subreddit,
                author_username=rc.author_username,
                title=rc.title,
                permalink=rc.permalink,
                created_at_platform=rc.created_at_platform,
                follow_up_status=fu.status if fu else "new",
                label=fu.label if fu else "",
            )
        )
    return out


@router.post("/contents/{content_id}/follow-up")
async def upsert_follow_up(
    content_id: int, body: FollowUpUpdate, db: AsyncSession = Depends(get_db)
):
    rc = await db.get(RawContent, content_id)
    if not rc:
        raise HTTPException(404, "content not found")
    fu = await db.scalar(select(FollowUpRecord).where(FollowUpRecord.content_id == content_id))
    if not fu:
        fu = FollowUpRecord(content_id=content_id)
        db.add(fu)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(fu, k, v)
    await db.commit()
    await db.refresh(fu)
    return {"content_id": content_id, "status": fu.status, "label": fu.label}


@router.post("/reports/daily")
async def create_daily_report(
    project_id: int | None = None, db: AsyncSession = Depends(get_db)
):
    report = await generate_daily_report(db, project_id)
    return {"id": report.id, "markdown": report.content_markdown, "summary": report.summary_json}


@router.post("/reports/weekly")
async def create_weekly_report(
    project_id: int | None = None, db: AsyncSession = Depends(get_db)
):
    report = await generate_weekly_report(db, project_id)
    return {"id": report.id, "markdown": report.content_markdown, "summary": report.summary_json}


@router.get("/reports")
async def list_reports(db: AsyncSession = Depends(get_db)):
    rows = list(await db.scalars(select(Report).order_by(Report.id.desc())))
    return [
        {"id": r.id, "type": r.report_type, "generated_at": r.generated_at, "summary": r.summary_json}
        for r in rows
    ]


@router.post("/projects/{project_id}/rescore")
async def rescore_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """Recompute Opportunity Scores from stored insights using current weights.

    Lets Settings weight changes take effect without re-running the LLM.
    """
    project = await db.get(RadarProject, project_id)
    if not project:
        raise HTTPException(404, "project not found")
    weights = (project.settings_json or {}).get("score_weights", {})

    rows = list(
        await db.execute(
            select(Insight, RawContent)
            .join(RawContent, Insight.content_id == RawContent.id)
            .where(RawContent.project_id == project_id, Insight.analysis_status == "ok")
        )
    )
    updated = 0
    for ins, rc in rows:
        from app.schemas import LLMAnalysis

        # Reconstruct the analysis inputs the score depends on from the stored insight.
        analysis = LLMAnalysis(
            persona=ins.persona or "Unknown",
            purchase_intent=ins.purchase_intent or "none",
            pain_severity=ins.pain_severity,
            urgency=ins.urgency or "low",
            budget_signal=ins.budget_signal or "",
            medo_solution_type=ins.medo_solution_type or [],
        )
        final, breakdown = compute_opportunity_score(
            analysis, post_score=rc.score, comment_count=rc.comment_count, weights=weights
        )
        ins.opportunity_score = final
        ins.score_breakdown_json = breakdown
        updated += 1
    await db.commit()
    return {"project_id": project_id, "rescored": updated, "weights": weights}


@router.get("/opportunities.csv")
async def opportunities_csv(project_id: int | None = None, db: AsyncSession = Depends(get_db)):
    import csv
    import io

    from fastapi.responses import StreamingResponse

    q = (
        select(Insight, RawContent)
        .join(RawContent, Insight.content_id == RawContent.id)
        .where(Insight.analysis_status == "ok")
        .order_by(Insight.opportunity_score.desc())
    )
    if project_id is not None:
        q = q.where(RawContent.project_id == project_id)
    rows = list(await db.execute(q))

    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        ["score", "tier", "subreddit", "author", "persona", "industry", "intent",
         "opportunity_type", "competitors", "summary_zh", "permalink"]
    )
    from app.services.scoring import tier_for_score

    for ins, rc in rows:
        w.writerow(
            [ins.opportunity_score, tier_for_score(ins.opportunity_score), rc.subreddit,
             rc.author_username, ins.persona, ins.industry, ins.purchase_intent,
             ins.opportunity_type, "|".join(ins.competitors or []), ins.summary_zh, rc.permalink]
        )
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=opportunities.csv"},
    )
