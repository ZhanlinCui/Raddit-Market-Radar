"""Daily report generator — builds Markdown from structured Insight data.

Per product principle #10/#11: never re-feed raw Reddit text into the LLM for
reports. Reports are assembled deterministically from persisted insights.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Insight, RawContent, Report
from app.services.scoring import tier_for_score


async def generate_daily_report(db: AsyncSession, project_id: int | None = None) -> Report:
    q = (
        select(Insight, RawContent)
        .join(RawContent, Insight.content_id == RawContent.id)
        .where(Insight.analysis_status == "ok")
        .order_by(Insight.opportunity_score.desc())
    )
    if project_id is not None:
        q = q.where(RawContent.project_id == project_id)
    rows = list(await db.execute(q))

    total = len(rows)
    hot = [r for r in rows if r[0].opportunity_score >= 85]
    qualified = [r for r in rows if 70 <= r[0].opportunity_score < 85]

    lines: list[str] = []
    lines.append("# MeDo Reddit Daily Radar")
    lines.append("")
    lines.append("## 今日结论")
    lines.append(f"- 分析内容 {total} 条，Hot Leads {len(hot)} 条，Qualified {len(qualified)} 条")
    industries = {r[0].industry for r in rows if r[0].industry}
    if industries:
        lines.append(f"- 涉及行业: {', '.join(sorted(industries))}")
    competitors: dict[str, int] = {}
    for ins, _ in rows:
        for c in ins.competitors or []:
            competitors[c] = competitors.get(c, 0) + 1
    if competitors:
        top_c = ", ".join(f"{k}({v})" for k, v in sorted(competitors.items(), key=lambda x: -x[1]))
        lines.append(f"- 竞品提及: {top_c}")
    lines.append("")

    lines.append("## Top Opportunities")
    lines.append("| Score | Community | Persona | Industry | Intent | Action |")
    lines.append("|------:|-----------|---------|----------|--------|--------|")
    for ins, rc in rows[:20]:
        lines.append(
            f"| {ins.opportunity_score:.0f} | r/{rc.subreddit} | {ins.persona} | "
            f"{ins.industry or '-'} | {ins.purchase_intent} | {ins.suggested_action or '-'} |"
        )
    lines.append("")

    lines.append("## Competitor Signals")
    lines.append("| Competitor | Mentions |")
    lines.append("|-----------|---------:|")
    for k, v in sorted(competitors.items(), key=lambda x: -x[1]):
        lines.append(f"| {k} | {v} |")
    lines.append("")

    lines.append("## Recommended Actions")
    for ins, rc in hot[:5]:
        lines.append(f"- [{ins.opportunity_score:.0f}] r/{rc.subreddit}: {ins.suggested_action} — {rc.permalink}")
    if not hot:
        lines.append("- 今日无 Hot Lead")

    md = "\n".join(lines)
    report = Report(
        project_id=project_id,
        report_type="daily",
        date_from=None,
        date_to=datetime.now(timezone.utc),
        content_markdown=md,
        summary_json={
            "total": total,
            "hot_leads": len(hot),
            "qualified": len(qualified),
            "competitors": competitors,
        },
        generated_at=datetime.now(timezone.utc),
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


async def generate_weekly_report(db: AsyncSession, project_id: int | None = None) -> Report:
    """Weekly insight report (PRD §18.2 structure), assembled from structured insights."""
    q = (
        select(Insight, RawContent)
        .join(RawContent, Insight.content_id == RawContent.id)
        .where(Insight.analysis_status == "ok")
        .order_by(Insight.opportunity_score.desc())
    )
    if project_id is not None:
        q = q.where(RawContent.project_id == project_id)
    rows = list(await db.execute(q))

    total = len(rows)
    hot = [r for r in rows if r[0].opportunity_score >= 85]
    qualified = [r for r in rows if 70 <= r[0].opportunity_score < 85]

    personas: dict[str, int] = {}
    industries: dict[str, int] = {}
    solutions: dict[str, int] = {}
    competitors: dict[str, int] = {}
    for ins, _ in rows:
        personas[ins.persona] = personas.get(ins.persona, 0) + 1
        if ins.industry:
            industries[ins.industry] = industries.get(ins.industry, 0) + 1
        for s in ins.medo_solution_type or []:
            solutions[s] = solutions.get(s, 0) + 1
        for c in ins.competitors or []:
            competitors[c] = competitors.get(c, 0) + 1

    def _top(d: dict[str, int]) -> str:
        return ", ".join(f"{k}({v})" for k, v in sorted(d.items(), key=lambda x: -x[1])[:6]) or "—"

    L: list[str] = []
    L.append("# MeDo Reddit Weekly Insight Report")
    L.append("")
    L.append("## 1. Executive Summary")
    L.append(f"- 本周分析内容 {total} 条，Hot Leads {len(hot)} 条，Qualified {len(qualified)} 条")
    L.append(f"- 主要 Persona: {_top(personas)}")
    L.append(f"- 主要场景需求: {_top(solutions)}")
    L.append("")
    L.append("## 2. 本周需求趋势")
    L.append(f"- MeDo 场景需求分布: {_top(solutions)}")
    L.append(f"- 行业分布: {_top(industries)}")
    L.append("")
    L.append("## 3. Top 20 Opportunities")
    L.append("| Score | Community | Persona | Industry | Intent | Action |")
    L.append("|------:|-----------|---------|----------|--------|--------|")
    for ins, rc in rows[:20]:
        L.append(
            f"| {ins.opportunity_score:.0f} | r/{rc.subreddit} | {ins.persona} | "
            f"{ins.industry or '-'} | {ins.purchase_intent} | {ins.suggested_action or '-'} |"
        )
    L.append("")
    L.append("## 4. 高频痛点聚类")
    for ins, _ in rows[:8]:
        if ins.problem:
            L.append(f"- {ins.problem[:100]}")
    L.append("")
    L.append("## 5. 竞品评价和迁移信号")
    L.append("| Competitor | Mentions |")
    L.append("|-----------|---------:|")
    for k, v in sorted(competitors.items(), key=lambda x: -x[1]):
        L.append(f"| {k} | {v} |")
    L.append("")
    L.append("## 6. SMB 行业分布")
    L.append(f"- {_top(industries)}")
    L.append("")
    L.append("## 7. 对 MeDo 产品的启示 & 推荐动作")
    for ins, rc in hot[:5]:
        L.append(f"- [{ins.opportunity_score:.0f}] r/{rc.subreddit}: {ins.suggested_action} — {rc.permalink}")
    if not hot:
        L.append("- 本周无 Hot Lead，建议扩大关键词与社区覆盖")

    md = "\n".join(L)
    report = Report(
        project_id=project_id,
        report_type="weekly",
        date_to=datetime.now(timezone.utc),
        content_markdown=md,
        summary_json={
            "total": total,
            "hot_leads": len(hot),
            "qualified": len(qualified),
            "personas": personas,
            "solutions": solutions,
            "competitors": competitors,
        },
        generated_at=datetime.now(timezone.utc),
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report
