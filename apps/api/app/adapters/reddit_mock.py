"""Mock Reddit adapter — reads fixtures so the whole system runs with no credentials."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from app.adapters.base import SourceAdapter, SourceItem

FIXTURE_DIR = Path(__file__).resolve().parents[4] / "fixtures" / "reddit"


def _to_item(raw: dict) -> SourceItem:
    created = raw.get("created_utc")
    created_dt = (
        datetime.fromtimestamp(created, tz=timezone.utc) if created else None
    )
    return SourceItem(
        external_id=raw["id"],
        content_type=raw.get("content_type", "post"),
        title=raw.get("title", ""),
        body=raw.get("selftext", raw.get("body", "")),
        author_username=raw.get("author", ""),
        channel_name=raw.get("subreddit", ""),
        url=raw.get("url", ""),
        permalink="https://reddit.com" + raw.get("permalink", ""),
        score=raw.get("score", 0),
        upvote_ratio=raw.get("upvote_ratio", 0.0),
        comment_count=raw.get("num_comments", 0),
        created_at_platform=created_dt,
        parent_external_id=raw.get("parent_id", ""),
        raw=raw,
    )


class MockRedditAdapter(SourceAdapter):
    platform = "reddit"
    is_mock = True

    def __init__(self, fixture_dir: Path | None = None) -> None:
        self.fixture_dir = fixture_dir or FIXTURE_DIR

    def _load(self, name: str) -> list[dict]:
        path = self.fixture_dir / name
        if not path.exists():
            return []
        return json.loads(path.read_text())

    async def fetch_listing(
        self, channel: str, listing: str = "new", limit: int = 25
    ) -> list[SourceItem]:
        posts = self._load("posts.json")
        items = [
            _to_item(p)
            for p in posts
            if not channel or p.get("subreddit", "").lower() == channel.lower()
        ]
        return items[:limit]

    async def search(self, query: str, limit: int = 25) -> list[SourceItem]:
        posts = self._load("posts.json")
        q = query.lower()
        hits = [
            _to_item(p)
            for p in posts
            if q in (p.get("title", "") + " " + p.get("selftext", "")).lower()
        ]
        return hits[:limit]

    async def fetch_comments(self, external_id: str, limit: int = 20) -> list[SourceItem]:
        comments = self._load("comments.json")
        items = [
            _to_item(c)
            for c in comments
            if c.get("parent_id", "").endswith(external_id)
        ]
        return items[:limit]
