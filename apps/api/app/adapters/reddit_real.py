"""Real Reddit adapter via Async PRAW. Imported lazily so the mock slice needs no deps."""
from __future__ import annotations

from datetime import datetime, timezone

from app.adapters.base import SourceAdapter, SourceItem
from app.core.config import get_settings

_LISTING = {"top_day": ("top", "day"), "top_week": ("top", "week")}


class RedditAdapter(SourceAdapter):
    platform = "reddit"
    is_mock = False

    def __init__(self) -> None:
        import asyncpraw  # noqa: local import — optional dependency

        s = get_settings()
        self._reddit = asyncpraw.Reddit(
            client_id=s.reddit_client_id,
            client_secret=s.reddit_client_secret,
            user_agent=s.reddit_user_agent,
            username=s.reddit_username or None,
            password=s.reddit_password or None,
        )

    @staticmethod
    def _post_item(sub) -> SourceItem:
        return SourceItem(
            external_id=sub.id,
            content_type="post",
            title=sub.title or "",
            body=sub.selftext or "",
            author_username=str(sub.author) if sub.author else "",
            channel_name=str(sub.subreddit),
            url=sub.url or "",
            permalink="https://reddit.com" + sub.permalink,
            score=sub.score or 0,
            upvote_ratio=sub.upvote_ratio or 0.0,
            comment_count=sub.num_comments or 0,
            created_at_platform=datetime.fromtimestamp(sub.created_utc, tz=timezone.utc),
        )

    async def fetch_listing(
        self, channel: str, listing: str = "new", limit: int = 25
    ) -> list[SourceItem]:
        sr = await self._reddit.subreddit(channel)
        if listing in _LISTING:
            kind, tf = _LISTING[listing]
            gen = getattr(sr, kind)(time_filter=tf, limit=limit)
        else:
            gen = getattr(sr, listing)(limit=limit)
        return [self._post_item(s) async for s in gen]

    async def search(self, query: str, limit: int = 25) -> list[SourceItem]:
        sr = await self._reddit.subreddit("all")
        return [self._post_item(s) async for s in sr.search(query, limit=limit)]

    async def fetch_comments(self, external_id: str, limit: int = 20) -> list[SourceItem]:
        sub = await self._reddit.submission(id=external_id)
        await sub.comments.replace_more(limit=0)
        out: list[SourceItem] = []
        for c in sub.comments.list()[:limit]:
            out.append(
                SourceItem(
                    external_id=c.id,
                    content_type="comment",
                    body=c.body or "",
                    author_username=str(c.author) if c.author else "",
                    channel_name=str(sub.subreddit),
                    permalink="https://reddit.com" + c.permalink,
                    score=c.score or 0,
                    created_at_platform=datetime.fromtimestamp(c.created_utc, tz=timezone.utc),
                    parent_external_id=external_id,
                )
            )
        return out


def get_source_adapter() -> SourceAdapter:
    """Factory honoring SOURCE_ADAPTER / credential presence."""
    from app.adapters.reddit_mock import MockRedditAdapter

    s = get_settings()
    if s.source_is_mock:
        return MockRedditAdapter()
    return RedditAdapter()
