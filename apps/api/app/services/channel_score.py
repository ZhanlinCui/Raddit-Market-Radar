"""Channel Score (0-100) per Subreddit — configurable, explainable.

Computed from persisted Insights + RawContent for a channel, so it reflects real
signal density rather than raw volume.
"""
from __future__ import annotations

DEFAULT_CHANNEL_WEIGHTS: dict[str, float] = {
    "relevant_ratio": 0.30,
    "high_intent_ratio": 0.20,
    "persona_match": 0.15,
    "comment_depth": 0.10,
    "recency": 0.10,
    "reachable_ops": 0.10,
    "growth": 0.05,
}

_ICP_PERSONAS = {"SMB Owner", "Founder", "Agency"}


def compute_channel_score(
    *,
    total: int,
    relevant: int,
    high_intent: int,
    persona_matched: int,
    avg_comment_count: float,
    reachable: int,
    weights: dict[str, float] | None = None,
) -> tuple[float, dict]:
    w = {**DEFAULT_CHANNEL_WEIGHTS, **(weights or {})}
    if total == 0:
        subs = {k: 0.0 for k in w}
        return 0.0, {"weights": w, "sub_scores": subs, "final": 0.0}

    subs = {
        "relevant_ratio": 100.0 * relevant / total,
        "high_intent_ratio": 100.0 * high_intent / total,
        "persona_match": 100.0 * persona_matched / total,
        "comment_depth": min(100.0, avg_comment_count * 4.0),  # 25 comments -> 100
        "recency": 80.0,  # placeholder until per-scan timestamps tracked (P1)
        "reachable_ops": min(100.0, reachable * 20.0),  # 5 reachable -> 100
        "growth": 50.0,  # placeholder until historical snapshots (P1)
    }
    final = sum(subs[k] * w[k] for k in subs)
    return round(final, 2), {
        "weights": w,
        "sub_scores": {k: round(v, 1) for k, v in subs.items()},
        "final": round(final, 2),
    }


def channel_tier(score: float) -> str:
    if score >= 70:
        return "A"
    if score >= 50:
        return "B"
    if score >= 30:
        return "C"
    if score >= 15:
        return "Watchlist"
    return "Excluded"
