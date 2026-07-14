import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_radar.db"


@pytest_asyncio.fixture
async def client():
    # Import after env override so the engine binds to the test DB
    from app.core.db import Base, engine
    from app.main import app

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_full_vertical_slice(client: AsyncClient):
    # 1. status shows mock mode
    r = await client.get("/api/status")
    assert r.json()["source_mode"] == "mock"

    # 2. create project
    r = await client.post("/api/projects", json={"name": "SMB Demand Radar", "alert_threshold": 85})
    assert r.status_code == 200
    pid = r.json()["id"]

    # 3. add subreddit + keyword
    await client.post(f"/api/projects/{pid}/channels", json={"channel_name": "smallbusiness"})
    await client.post(
        f"/api/projects/{pid}/rules", json={"rule_type": "keyword", "rule_value": "booking system"}
    )

    # 4. run scan (mock)
    r = await client.post("/api/scan", json={"project_id": pid, "listings": ["new"]})
    assert r.status_code == 200
    result = r.json()
    assert result["new_contents"] >= 2
    assert result["analyzed"] >= 2

    # 5. re-scan is idempotent (dedup) — no new contents
    r2 = await client.post("/api/scan", json={"project_id": pid, "listings": ["new"]})
    assert r2.json()["new_contents"] == 0

    # 6. opportunity feed sorted, has a hot lead
    r = await client.get("/api/opportunities", params={"project_id": pid})
    feed = r.json()
    assert len(feed) >= 2
    scores = [o["insight"]["opportunity_score"] for o in feed]
    assert scores == sorted(scores, reverse=True)
    assert scores[0] >= 70  # salon booking post should be qualified+

    top = feed[0]
    assert top["insight"]["score_breakdown_json"]["sub_scores"]  # explainable
    assert top["permalink"].startswith("https://reddit.com")

    # 7. mark relevant
    cid = top["insight"]["content_id"]
    r = await client.post(f"/api/contents/{cid}/follow-up", json={"label": "relevant", "status": "contacted"})
    assert r.json()["label"] == "relevant"

    # 8. daily report from structured insights
    r = await client.post("/api/reports/daily", params={"project_id": pid})
    body = r.json()
    assert "# MeDo Reddit Daily Radar" in body["markdown"]
    assert body["summary"]["total"] >= 2

    # 9. analytics — communities, competitors, trends
    r = await client.get("/api/analytics/communities", params={"project_id": pid})
    comms = r.json()
    assert len(comms) >= 1
    assert comms[0]["channel_score"] >= 0
    assert comms[0]["suggested_tier"] in ("A", "B", "C", "Watchlist", "Excluded")

    r = await client.get("/api/analytics/competitors", params={"project_id": pid})
    comps = r.json()
    assert any(c["competitor"] == "Mindbody" for c in comps)

    r = await client.get("/api/analytics/trends", params={"project_id": pid})
    tr = r.json()
    assert tr["total"] >= 2
    assert "SMB Owner" in tr["persona"]

    # 10. scan runs persisted (task health)
    r = await client.get("/api/scan-runs", params={"project_id": pid})
    runs = r.json()
    assert len(runs) >= 2  # we scanned twice
    assert runs[0]["trigger"] == "manual"

    # 11. active users tracked from authors
    r = await client.get("/api/analytics/active-users")
    users = r.json()
    assert len(users) >= 1
    assert users[0]["active_score"] >= 0

    # 12. semantic search recalls the booking post first
    r = await client.get(
        "/api/analytics/semantic-search",
        params={"q": "small business owner needs appointment booking", "project_id": pid},
    )
    sem = r.json()
    assert len(sem) >= 1
    assert "booking" in (sem[0]["title"] + sem[0]["summary_zh"]).lower()

    # 13. weekly report
    r = await client.post("/api/reports/weekly", params={"project_id": pid})
    assert "Weekly Insight Report" in r.json()["markdown"]

    # 14. rescore with new weights takes effect
    await client.patch(
        f"/api/projects/{pid}",
        json={"name": "SMB Demand Radar", "settings_json": {"score_weights": {"intent": 0.9}}},
    )
    r = await client.post(f"/api/projects/{pid}/rescore")
    assert r.json()["rescored"] >= 2

    # 15. CSV export
    r = await client.get("/api/opportunities.csv", params={"project_id": pid})
    assert r.status_code == 200
    assert "score,tier,subreddit" in r.text
