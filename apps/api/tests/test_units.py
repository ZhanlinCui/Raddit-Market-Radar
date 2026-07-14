import pytest

from app.adapters.reddit_mock import MockRedditAdapter
from app.llm.provider import MockLLMProvider
from app.services.scoring import compute_opportunity_score, tier_for_score


@pytest.mark.asyncio
async def test_mock_adapter_reads_fixtures():
    a = MockRedditAdapter()
    items = await a.fetch_listing("smallbusiness", "new", 25)
    assert len(items) >= 2
    assert all(i.channel_name.lower() == "smallbusiness" for i in items)


@pytest.mark.asyncio
async def test_mock_adapter_search():
    a = MockRedditAdapter()
    hits = await a.search("booking", 25)
    assert any("booking" in (h.title + h.body).lower() for h in hits)


@pytest.mark.asyncio
async def test_mock_llm_detects_explicit_demand():
    a = MockRedditAdapter()
    llm = MockLLMProvider()
    items = await a.fetch_listing("smallbusiness", "new", 25)
    salon = next(i for i in items if i.external_id == "post_001")
    analysis = await llm.analyze(salon)
    assert analysis.persona == "SMB Owner"
    assert analysis.purchase_intent in ("explicit", "high")
    assert "Booking" in analysis.medo_solution_type
    assert "Mindbody" in analysis.competitors


def test_scoring_high_for_explicit_demand():
    from app.schemas import LLMAnalysis

    a = LLMAnalysis(
        persona="SMB Owner",
        purchase_intent="explicit",
        pain_severity=80,
        urgency="high",
        budget_signal="$100",
        medo_solution_type=["Booking"],
    )
    score, breakdown = compute_opportunity_score(a, post_score=84, comment_count=23)
    assert score >= 85
    assert tier_for_score(score) == "Hot Lead"
    assert set(breakdown["sub_scores"]) == {
        "intent", "icp_match", "pain_severity", "medo_fit",
        "urgency", "budget", "engagement", "freshness",
    }


def test_scoring_low_for_noise():
    from app.schemas import LLMAnalysis

    a = LLMAnalysis(persona="Unknown", purchase_intent="none", pain_severity=0)
    score, _ = compute_opportunity_score(a, post_score=8, comment_count=60)
    assert tier_for_score(score) in ("Noise", "Watch")


def test_scoring_weights_configurable():
    from app.schemas import LLMAnalysis

    a = LLMAnalysis(persona="SMB Owner", purchase_intent="explicit", pain_severity=50)
    base, _ = compute_opportunity_score(a)
    boosted, _ = compute_opportunity_score(a, weights={"intent": 0.9})
    assert boosted != base
