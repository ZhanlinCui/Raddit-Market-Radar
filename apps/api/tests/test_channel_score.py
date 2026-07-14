from app.services.channel_score import channel_tier, compute_channel_score


def test_channel_score_high_signal():
    score, bd = compute_channel_score(
        total=10, relevant=8, high_intent=6, persona_matched=7,
        avg_comment_count=20, reachable=4,
    )
    assert 0 <= score <= 100
    assert score >= 60
    assert channel_tier(score) in ("A", "B")
    assert set(bd["sub_scores"]) == {
        "relevant_ratio", "high_intent_ratio", "persona_match",
        "comment_depth", "recency", "reachable_ops", "growth",
    }


def test_channel_score_empty():
    score, bd = compute_channel_score(
        total=0, relevant=0, high_intent=0, persona_matched=0,
        avg_comment_count=0, reachable=0,
    )
    assert score == 0.0
    assert channel_tier(score) == "Excluded"


def test_channel_tier_bands():
    assert channel_tier(75) == "A"
    assert channel_tier(55) == "B"
    assert channel_tier(35) == "C"
    assert channel_tier(20) == "Watchlist"
    assert channel_tier(5) == "Excluded"
