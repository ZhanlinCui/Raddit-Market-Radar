"""Active User Score — accumulates per-author signal from public content.

Score is recomputed incrementally on each related content item. All inputs are
public Reddit fields; we never infer undisclosed sensitive attributes.
"""
from __future__ import annotations

from datetime import timezone

from app.adapters.base import SourceItem
from app.models import Author, Insight

# Weights (sum = 1.0) — mirrors PRD §16.
WEIGHTS = {
    "frequency": 0.25,
    "topic_relevance": 0.25,
    "comment_quality": 0.15,
    "influence": 0.10,
    "engagement": 0.10,
    "recency": 0.10,
    "stated_role": 0.05,
}

_TOPIC_PERSONAS = {"SMB Owner", "Founder", "Developer", "Agency", "Consultant"}


def update_author_score(author: Author, item: SourceItem, insight: Insight) -> None:
    """Fold one content item into the author's running Active User Score."""
    author.related_content_count = (author.related_content_count or 0) + 1

    # Track active channels
    channels = set(author.active_channels or [])
    if item.channel_name:
        channels.add(item.channel_name)
    author.active_channels = sorted(channels)

    # Track topics from solution types
    topics = set(author.primary_topics or [])
    for s in insight.medo_solution_type or []:
        topics.add(s)
    author.primary_topics = sorted(topics)[:8]

    # Stated (public) role
    if insight.persona in _TOPIC_PERSONAS:
        author.persona = insight.persona

    if item.created_at_platform:
        ts = item.created_at_platform
        if author.last_active_at is None or ts.replace(tzinfo=None) > author.last_active_at.replace(tzinfo=None) if author.last_active_at else True:
            author.last_active_at = ts.replace(tzinfo=None)

    n = author.related_content_count
    frequency = min(100.0, n * 20.0)  # 5 items -> 100
    topic_relevance = 100.0 if insight.persona in _TOPIC_PERSONAS else 40.0
    comment_quality = float(min(100, insight.pain_severity))
    influence = min(100.0, item.score / 2.0)
    engagement = min(100.0, item.comment_count * 4.0)
    recency = 80.0  # placeholder until historical window (P1)
    stated_role = 100.0 if author.persona else 20.0

    subs = {
        "frequency": frequency,
        "topic_relevance": topic_relevance,
        "comment_quality": comment_quality,
        "influence": influence,
        "engagement": engagement,
        "recency": recency,
        "stated_role": stated_role,
    }
    # Running score = blend of previous and new observation, so multiple items lift it.
    new_score = sum(subs[k] * WEIGHTS[k] for k in subs)
    prev = author.active_score or 0.0
    author.active_score = round(max(prev, new_score) if n <= 1 else 0.5 * prev + 0.5 * new_score, 2)
    md = dict(author.metadata_json or {})
    md["last_sub_scores"] = {k: round(v, 1) for k, v in subs.items()}
    author.metadata_json = md
