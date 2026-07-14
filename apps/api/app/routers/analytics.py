"""Analytics aggregation: communities, competitors, trends.

All computed from persisted Insight + RawContent (never re-querying the LLM),
per product principle: reports/analytics derive from structured data.
"""
from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models import Author, Insight, RawContent
from app.services.channel_score import channel_tier, compute_channel_score

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

_HIGH_INTENT = {"explicit", "high"}
_ICP_PERSONAS = {"SMB Owner", "Founder", "Agency"}
_SWITCH_TYPES = {"Switch Signal", "Price Complaint"}


async def _rows(db: AsyncSession, project_id: int | None):
    q = (
        select(Insight, RawContent)
        .join(RawContent, Insight.content_id == RawContent.id)
        .where(Insight.analysis_status == "ok")
    )
    if project_id is not None:
        q = q.where(RawContent.project_id == project_id)
    return list(await db.execute(q))


@router.get("/communities")
async def communities(project_id: int | None = None, db: AsyncSession = Depends(get_db)):
    rows = await _rows(db, project_id)
    by_sub: dict[str, list] = defaultdict(list)
    for ins, rc in rows:
        by_sub[rc.subreddit].append((ins, rc))

    out = []
    for sub, items in by_sub.items():
        total = len(items)
        relevant = sum(1 for i, _ in items if i.opportunity_score >= 50)
        high_intent = sum(1 for i, _ in items if i.purchase_intent in _HIGH_INTENT)
        persona_matched = sum(1 for i, _ in items if i.persona in _ICP_PERSONAS)
        reachable = sum(1 for i, _ in items if i.opportunity_score >= 70)
        avg_comments = sum(rc.comment_count for _, rc in items) / total
        personas: dict[str, int] = defaultdict(int)
        for i, _ in items:
            personas[i.persona] += 1
        score, breakdown = compute_channel_score(
            total=total,
            relevant=relevant,
            high_intent=high_intent,
            persona_matched=persona_matched,
            avg_comment_count=avg_comments,
            reachable=reachable,
        )
        out.append(
            {
                "subreddit": sub,
                "total": total,
                "relevant": relevant,
                "high_intent": high_intent,
                "reachable_ops": reachable,
                "avg_comment_count": round(avg_comments, 1),
                "top_persona": max(personas, key=personas.get) if personas else "—",
                "channel_score": score,
                "suggested_tier": channel_tier(score),
                "score_breakdown": breakdown,
            }
        )
    out.sort(key=lambda x: x["channel_score"], reverse=True)
    return out


@router.get("/competitors")
async def competitors(project_id: int | None = None, db: AsyncSession = Depends(get_db)):
    rows = await _rows(db, project_id)
    agg: dict[str, dict] = defaultdict(
        lambda: {"mentions": 0, "switch_signals": 0, "price_complaints": 0, "avg_pain": 0.0,
                 "quotes": [], "examples": []}
    )
    for ins, rc in rows:
        for c in ins.competitors or []:
            a = agg[c]
            a["mentions"] += 1
            if ins.opportunity_type == "Switch Signal":
                a["switch_signals"] += 1
            if ins.opportunity_type == "Price Complaint" or "too expensive" in (ins.problem or "").lower():
                a["price_complaints"] += 1
            a["avg_pain"] += ins.pain_severity
            if ins.evidence_json and len(a["quotes"]) < 3:
                a["quotes"].append(ins.evidence_json[0])
            if len(a["examples"]) < 3:
                a["examples"].append({"title": rc.title, "permalink": rc.permalink, "score": ins.opportunity_score})

    out = []
    for name, a in agg.items():
        out.append(
            {
                "competitor": name,
                "mentions": a["mentions"],
                "switch_signals": a["switch_signals"],
                "price_complaints": a["price_complaints"],
                "avg_pain": round(a["avg_pain"] / a["mentions"], 1) if a["mentions"] else 0,
                "quotes": a["quotes"],
                "examples": a["examples"],
            }
        )
    out.sort(key=lambda x: x["mentions"], reverse=True)
    return out


@router.get("/trends")
async def trends(project_id: int | None = None, db: AsyncSession = Depends(get_db)):
    rows = await _rows(db, project_id)

    def dist(attr: str) -> dict[str, int]:
        d: dict[str, int] = defaultdict(int)
        for ins, _ in rows:
            v = getattr(ins, attr) or "Unknown"
            d[v] += 1
        return dict(sorted(d.items(), key=lambda x: -x[1]))

    solution: dict[str, int] = defaultdict(int)
    for ins, _ in rows:
        for s in ins.medo_solution_type or []:
            solution[s] += 1

    return {
        "total": len(rows),
        "persona": dist("persona"),
        "industry": dist("industry"),
        "opportunity_type": dist("opportunity_type"),
        "purchase_intent": dist("purchase_intent"),
        "medo_solution_type": dict(sorted(solution.items(), key=lambda x: -x[1])),
    }


@router.get("/active-users")
async def active_users(limit: int = 30, db: AsyncSession = Depends(get_db)):
    rows = list(
        await db.scalars(
            select(Author).order_by(Author.active_score.desc()).limit(limit)
        )
    )
    return [
        {
            "username": a.platform_username,
            "profile_url": a.public_profile_url,
            "active_score": a.active_score,
            "persona": a.persona or "Unknown",
            "primary_topics": a.primary_topics or [],
            "active_channels": a.active_channels or [],
            "related_content_count": a.related_content_count,
            "last_active_at": a.last_active_at,
            "sub_scores": (a.metadata_json or {}).get("last_sub_scores", {}),
        }
        for a in rows
    ]


@router.get("/semantic-search")
async def semantic_search(
    q: str, project_id: int | None = None, limit: int = 10, db: AsyncSession = Depends(get_db)
):
    """Embedding-based semantic recall over collected content (mock embeddings)."""
    from app.llm.embedding import semantic_rank

    rows = await _rows(db, project_id)
    if not rows:
        return []
    docs = [f"{rc.title} {rc.body}" for _, rc in rows]
    scores = semantic_rank(q, docs)
    ranked = sorted(zip(scores, rows), key=lambda x: x[0], reverse=True)[:limit]
    return [
        {
            "similarity": round(sim, 4),
            "opportunity_score": ins.opportunity_score,
            "title": rc.title,
            "subreddit": rc.subreddit,
            "permalink": rc.permalink,
            "summary_zh": ins.summary_zh,
        }
        for sim, (ins, rc) in ranked
    ]
