"""Configurable Opportunity Score (0-100) with persisted per-dimension breakdown.

Weights live in settings (never hardcoded in the frontend). Each sub-score is
0-100; the weighted sum is the final score.
"""
from __future__ import annotations

from app.schemas import LLMAnalysis

# Default weights (sum = 1.0). Overridable via project.settings_json["score_weights"].
DEFAULT_WEIGHTS: dict[str, float] = {
    "intent": 0.25,
    "icp_match": 0.20,
    "pain_severity": 0.15,
    "medo_fit": 0.15,
    "urgency": 0.10,
    "budget": 0.05,
    "engagement": 0.05,
    "freshness": 0.05,
}

_INTENT_SCORE = {"explicit": 100, "high": 80, "medium": 55, "low": 25, "none": 5}
_URGENCY_SCORE = {"high": 100, "medium": 60, "low": 25}
_ICP_PERSONA = {"SMB Owner": 100, "Founder": 85, "Agency": 80, "Developer": 70,
                "Consultant": 65, "Other": 30, "Unknown": 20}


def _engagement_score(score: int, comment_count: int) -> float:
    raw = score + comment_count * 2
    return min(100.0, raw / 2.0)  # 200 raw -> 100


def compute_opportunity_score(
    analysis: LLMAnalysis,
    *,
    post_score: int = 0,
    comment_count: int = 0,
    freshness: float = 80.0,
    weights: dict[str, float] | None = None,
) -> tuple[float, dict]:
    """Return (final_score, breakdown). Breakdown stores every sub-score for explainability."""
    w = {**DEFAULT_WEIGHTS, **(weights or {})}

    subs = {
        "intent": float(_INTENT_SCORE.get(analysis.purchase_intent, 5)),
        "icp_match": float(_ICP_PERSONA.get(analysis.persona, 20)),
        "pain_severity": float(analysis.pain_severity),
        "medo_fit": 100.0 if analysis.medo_solution_type else 30.0,
        "urgency": float(_URGENCY_SCORE.get(analysis.urgency, 25)),
        "budget": 100.0 if analysis.budget_signal else 20.0,
        "engagement": _engagement_score(post_score, comment_count),
        "freshness": float(freshness),
    }

    final = sum(subs[k] * w[k] for k in subs)
    breakdown = {
        "weights": w,
        "sub_scores": subs,
        "weighted": {k: round(subs[k] * w[k], 2) for k in subs},
        "final": round(final, 2),
    }
    return round(final, 2), breakdown


def tier_for_score(score: float) -> str:
    if score >= 85:
        return "Hot Lead"
    if score >= 70:
        return "Qualified Opportunity"
    if score >= 50:
        return "Insight"
    if score >= 30:
        return "Watch"
    return "Noise"
