"""Pydantic v2 schemas: API request/response + the LLM analysis contract."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# ---------- Radar Project ----------


class QueryRuleIn(BaseModel):
    rule_type: Literal["keyword", "semantic", "competitor"] = "keyword"
    rule_value: str
    weight: float = 1.0
    is_negative: bool = False
    language: str = "en"
    enabled: bool = True


class QueryRuleOut(QueryRuleIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SourceChannelIn(BaseModel):
    channel_name: str
    platform: str = "reddit"
    channel_url: str = ""
    channel_tier: str = "B"
    scan_enabled: bool = True


class SourceChannelOut(SourceChannelIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    last_scanned_at: datetime | None = None
    checkpoint: str = ""


class RadarProjectIn(BaseModel):
    name: str
    objective: str = ""
    owner_id: str = ""
    status: Literal["Draft", "Active", "Paused", "Archived"] = "Draft"
    scan_frequency: str = "10m"
    report_frequency: str = "daily"
    alert_threshold: int = 85
    settings_json: dict = Field(default_factory=dict)


class RadarProjectOut(RadarProjectIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


# ---------- LLM analysis contract (validated) ----------

Persona = Literal[
    "SMB Owner", "Founder", "Developer", "Agency", "Consultant", "Other", "Unknown"
]
PurchaseIntent = Literal["explicit", "high", "medium", "low", "none"]
Urgency = Literal["high", "medium", "low"]


class LLMAnalysis(BaseModel):
    """Structured output every content item must yield. Validated after each LLM call."""

    summary_zh: str = ""
    original_language: str = "en"
    persona: Persona = "Unknown"
    industry: str = ""
    geography: str = ""
    problem: str = ""
    current_workflow: str = ""
    current_tools: list[str] = Field(default_factory=list)
    competitors: list[str] = Field(default_factory=list)
    pain_severity: int = Field(default=0, ge=0, le=100)
    purchase_intent: PurchaseIntent = "none"
    budget_signal: str = ""
    urgency: Urgency = "low"
    desired_outcome: list[str] = Field(default_factory=list)
    product_opportunity: str = ""
    medo_solution_type: list[str] = Field(default_factory=list)
    opportunity_type: str = "Low Value"
    suggested_action: str = ""
    suggested_response_angle: str = ""
    evidence_quotes: list[str] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    classification_reason: str = ""
    model_version: str = ""
    prompt_version: str = ""


# ---------- Opportunity Feed ----------


class InsightOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    content_id: int
    summary_zh: str
    persona: str
    industry: str
    geography: str
    problem: str
    current_tools: list
    competitors: list
    purchase_intent: str
    pain_severity: int
    budget_signal: str
    opportunity_type: str
    opportunity_score: float
    score_breakdown_json: dict
    confidence: float
    evidence_json: list
    suggested_action: str


class OpportunityOut(BaseModel):
    insight: InsightOut
    subreddit: str
    author_username: str
    title: str
    permalink: str
    created_at_platform: datetime | None
    follow_up_status: str = "new"
    label: str = ""


class FollowUpUpdate(BaseModel):
    status: str | None = None
    label: Literal["relevant", "irrelevant", ""] | None = None
    assignee_id: str | None = None
    notes: str | None = None
    failure_reason: str | None = None


class ScanRequest(BaseModel):
    project_id: int
    listings: list[str] = Field(default_factory=lambda: ["new", "hot"])
    limit_per_listing: int = 25


class ScanResult(BaseModel):
    project_id: int
    mode: str
    collected: int
    new_contents: int
    analyzed: int
    hot_leads: int
    duration_ms: int
