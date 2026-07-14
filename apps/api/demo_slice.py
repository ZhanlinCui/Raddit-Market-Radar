"""End-to-end demo of the vertical slice, runnable with no credentials.

    python demo_slice.py

Runs: create project -> add subreddit+keyword -> mock scan -> analyze+score ->
print Opportunity Feed -> mark relevant -> generate daily report.
"""
import asyncio
import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./demo_radar.db")


async def main() -> None:
    from app.adapters.reddit_mock import MockRedditAdapter
    from app.core.db import Base, SessionLocal, engine
    from app.llm.provider import MockLLMProvider
    from app.models import RadarProject, SourceChannel
    from app.services.report import generate_daily_report
    from app.services.scan import run_scan
    from app.services.scoring import tier_for_score

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        project = RadarProject(name="SMB Demand Radar", objective="Find SMB booking/website demand", alert_threshold=85)
        db.add(project)
        await db.flush()
        db.add(SourceChannel(project_id=project.id, channel_name="smallbusiness"))
        db.add(SourceChannel(project_id=project.id, channel_name="Entrepreneur"))
        db.add(SourceChannel(project_id=project.id, channel_name="startups"))
        await db.commit()
        await db.refresh(project)

        result = await run_scan(
            db, project, MockRedditAdapter(), MockLLMProvider(), listings=["new"], limit_per_listing=25
        )
        print("=== SCAN RESULT ===")
        print(result.model_dump_json(indent=2))

        from sqlalchemy import select

        from app.models import Insight, RawContent

        rows = list(
            await db.execute(
                select(Insight, RawContent)
                .join(RawContent, Insight.content_id == RawContent.id)
                .where(Insight.analysis_status == "ok")
                .order_by(Insight.opportunity_score.desc())
            )
        )
        print("\n=== OPPORTUNITY FEED ===")
        for ins, rc in rows:
            print(
                f"[{ins.opportunity_score:5.1f} {tier_for_score(ins.opportunity_score):22}] "
                f"r/{rc.subreddit:14} {ins.persona:10} {ins.purchase_intent:8} | {rc.title[:60]}"
            )

        report = await generate_daily_report(db, project.id)
        print("\n=== DAILY REPORT (markdown) ===")
        print(report.content_markdown)


if __name__ == "__main__":
    asyncio.run(main())
