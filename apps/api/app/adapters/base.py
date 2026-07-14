"""SourceAdapter abstraction — isolates all business logic from Reddit specifics.

Add Hacker News / GitHub / Product Hunt later by implementing this same interface.
"""
from __future__ import annotations

import abc
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class SourceItem:
    """Platform-neutral content item. Adapters map their native payload into this."""

    external_id: str
    content_type: str  # post | comment
    title: str = ""
    body: str = ""
    author_username: str = ""
    channel_name: str = ""  # subreddit for reddit
    url: str = ""
    permalink: str = ""
    score: int = 0
    upvote_ratio: float = 0.0
    comment_count: int = 0
    created_at_platform: datetime | None = None
    parent_external_id: str = ""
    raw: dict = field(default_factory=dict)


class SourceAdapter(abc.ABC):
    """A pluggable content source (Reddit, HN, GitHub, ...)."""

    platform: str = "unknown"
    is_mock: bool = False

    @abc.abstractmethod
    async def fetch_listing(
        self, channel: str, listing: str = "new", limit: int = 25
    ) -> list[SourceItem]:
        """Fetch a channel listing (new/hot/rising/top_day/top_week)."""

    @abc.abstractmethod
    async def search(self, query: str, limit: int = 25) -> list[SourceItem]:
        """Site-wide keyword search."""

    @abc.abstractmethod
    async def fetch_comments(self, external_id: str, limit: int = 20) -> list[SourceItem]:
        """Expand top comments for a high-value post."""
