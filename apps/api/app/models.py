"""SQLAlchemy ORM models for the core entities.

Uses portable column types (JSON, not JSONB) so the same models run on both
SQLite (local verifiable slice) and Postgres (full stack).
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RadarProject(Base):
    __tablename__ = "radar_projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    objective: Mapped[str] = mapped_column(Text, default="")
    owner_id: Mapped[str] = mapped_column(String(100), default="")
    status: Mapped[str] = mapped_column(String(20), default="Draft")  # Draft|Active|Paused|Archived
    scan_frequency: Mapped[str] = mapped_column(String(50), default="10m")
    report_frequency: Mapped[str] = mapped_column(String(50), default="daily")
    alert_threshold: Mapped[int] = mapped_column(Integer, default=85)
    settings_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    channels: Mapped[list[SourceChannel]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    rules: Mapped[list[QueryRule]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class SourceChannel(Base):
    __tablename__ = "source_channels"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("radar_projects.id", ondelete="CASCADE"))
    platform: Mapped[str] = mapped_column(String(50), default="reddit")
    channel_name: Mapped[str] = mapped_column(String(200))
    channel_url: Mapped[str] = mapped_column(String(500), default="")
    channel_tier: Mapped[str] = mapped_column(String(20), default="B")  # A|B|C|Watchlist|Excluded
    scan_enabled: Mapped[bool] = mapped_column(default=True)
    last_scanned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    checkpoint: Mapped[str] = mapped_column(String(200), default="")
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)

    project: Mapped[RadarProject] = relationship(back_populates="channels")


class QueryRule(Base):
    __tablename__ = "query_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("radar_projects.id", ondelete="CASCADE"))
    rule_type: Mapped[str] = mapped_column(String(30), default="keyword")  # keyword|semantic|competitor
    rule_value: Mapped[str] = mapped_column(String(500))
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    is_negative: Mapped[bool] = mapped_column(default=False)
    language: Mapped[str] = mapped_column(String(10), default="en")
    enabled: Mapped[bool] = mapped_column(default=True)

    project: Mapped[RadarProject] = relationship(back_populates="rules")


class RawContent(Base):
    __tablename__ = "raw_contents"
    __table_args__ = (UniqueConstraint("platform", "external_id", name="uq_platform_external"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    platform: Mapped[str] = mapped_column(String(50), default="reddit")
    external_id: Mapped[str] = mapped_column(String(100))
    content_type: Mapped[str] = mapped_column(String(20), default="post")  # post|comment
    subreddit: Mapped[str] = mapped_column(String(200), default="")
    author_username: Mapped[str] = mapped_column(String(200), default="")
    title: Mapped[str] = mapped_column(Text, default="")
    body: Mapped[str] = mapped_column(Text, default="")
    url: Mapped[str] = mapped_column(String(1000), default="")
    permalink: Mapped[str] = mapped_column(String(1000), default="")
    score: Mapped[int] = mapped_column(Integer, default=0)
    upvote_ratio: Mapped[float] = mapped_column(Float, default=0.0)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at_platform: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    parent_external_id: Mapped[str] = mapped_column(String(100), default="")
    raw_json: Mapped[dict] = mapped_column(JSON, default=dict)
    content_hash: Mapped[str] = mapped_column(String(64), index=True)
    project_id: Mapped[int | None] = mapped_column(
        ForeignKey("radar_projects.id", ondelete="SET NULL"), nullable=True
    )


class Insight(Base):
    __tablename__ = "insights"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[int] = mapped_column(ForeignKey("raw_contents.id", ondelete="CASCADE"))
    summary_zh: Mapped[str] = mapped_column(Text, default="")
    original_language: Mapped[str] = mapped_column(String(10), default="en")
    persona: Mapped[str] = mapped_column(String(50), default="")
    industry: Mapped[str] = mapped_column(String(80), default="")
    geography: Mapped[str] = mapped_column(String(80), default="")
    problem: Mapped[str] = mapped_column(Text, default="")
    current_workflow: Mapped[str] = mapped_column(Text, default="")
    current_tools: Mapped[list] = mapped_column(JSON, default=list)
    competitors: Mapped[list] = mapped_column(JSON, default=list)
    purchase_intent: Mapped[str] = mapped_column(String(20), default="none")
    pain_severity: Mapped[int] = mapped_column(Integer, default=0)
    urgency: Mapped[str] = mapped_column(String(20), default="low")
    budget_signal: Mapped[str] = mapped_column(String(200), default="")
    desired_outcome: Mapped[list] = mapped_column(JSON, default=list)
    product_opportunity: Mapped[str] = mapped_column(Text, default="")
    medo_solution_type: Mapped[list] = mapped_column(JSON, default=list)
    opportunity_type: Mapped[str] = mapped_column(String(40), default="Low Value")
    suggested_action: Mapped[str] = mapped_column(Text, default="")
    suggested_response_angle: Mapped[str] = mapped_column(Text, default="")
    opportunity_score: Mapped[float] = mapped_column(Float, default=0.0)
    score_breakdown_json: Mapped[dict] = mapped_column(JSON, default=dict)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    evidence_json: Mapped[list] = mapped_column(JSON, default=list)
    model_version: Mapped[str] = mapped_column(String(80), default="")
    prompt_version: Mapped[str] = mapped_column(String(40), default="")
    analysis_status: Mapped[str] = mapped_column(String(20), default="ok")  # ok|failed|pending
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class FollowUpRecord(Base):
    __tablename__ = "follow_up_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[int] = mapped_column(ForeignKey("raw_contents.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(30), default="new")
    assignee_id: Mapped[str] = mapped_column(String(100), default="")
    label: Mapped[str] = mapped_column(String(20), default="")  # relevant|irrelevant
    contacted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    response_received_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    interview_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    pilot_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    failure_reason: Mapped[str] = mapped_column(Text, default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int | None] = mapped_column(
        ForeignKey("radar_projects.id", ondelete="SET NULL"), nullable=True
    )
    report_type: Mapped[str] = mapped_column(String(20), default="daily")
    date_from: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    date_to: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    content_markdown: Mapped[str] = mapped_column(Text, default="")
    summary_json: Mapped[dict] = mapped_column(JSON, default=dict)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    model_version: Mapped[str] = mapped_column(String(80), default="")


class ScanRun(Base):
    """One scan execution — powers task-health monitoring and checkpoint/backfill."""

    __tablename__ = "scan_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int | None] = mapped_column(
        ForeignKey("radar_projects.id", ondelete="SET NULL"), nullable=True
    )
    mode: Mapped[str] = mapped_column(String(20), default="mock")
    trigger: Mapped[str] = mapped_column(String(20), default="manual")  # manual|scheduled
    listings: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(20), default="ok")  # ok|failed|running
    collected: Mapped[int] = mapped_column(Integer, default=0)
    new_contents: Mapped[int] = mapped_column(Integer, default=0)
    analyzed: Mapped[int] = mapped_column(Integer, default=0)
    failed: Mapped[int] = mapped_column(Integer, default=0)
    hot_leads: Mapped[int] = mapped_column(Integer, default=0)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str] = mapped_column(Text, default="")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Author(Base):
    """Active user identified from public Reddit content (Active User Score)."""

    __tablename__ = "authors"
    __table_args__ = (UniqueConstraint("platform", "platform_username", name="uq_author"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    platform: Mapped[str] = mapped_column(String(50), default="reddit")
    platform_username: Mapped[str] = mapped_column(String(200))
    public_profile_url: Mapped[str] = mapped_column(String(500), default="")
    active_score: Mapped[float] = mapped_column(Float, default=0.0)
    persona: Mapped[str] = mapped_column(String(50), default="")
    primary_topics: Mapped[list] = mapped_column(JSON, default=list)
    active_channels: Mapped[list] = mapped_column(JSON, default=list)
    related_content_count: Mapped[int] = mapped_column(Integer, default=0)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
