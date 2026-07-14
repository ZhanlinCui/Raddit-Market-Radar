"""LLMProvider abstraction with a deterministic mock and an OpenAI-compatible client.

The mock uses keyword heuristics so the vertical slice produces meaningful,
schema-valid analysis with zero credentials or network calls.
"""
from __future__ import annotations

import abc
import json
import re

from app.adapters.base import SourceItem
from app.core.config import get_settings
from app.schemas import LLMAnalysis

PROMPT_VERSION = "v1"


class LLMProvider(abc.ABC):
    is_mock: bool = False
    model_version: str = "unknown"

    @abc.abstractmethod
    async def analyze(self, item: SourceItem) -> LLMAnalysis:
        ...


# ---------- Mock (heuristic, deterministic) ----------

_COMPETITORS = [
    "wix", "webflow", "wordpress", "mindbody", "vagaro", "jobber",
    "lovable", "bolt", "replit", "v0", "cursor", "bubble", "flutterflow",
]
_INTENT_EXPLICIT = ["looking for", "recommend a tool", "need a", "need someone",
                    "willing to pay", "hire someone", "quote was", "alternative to",
                    "what should i use", "does a tool exist"]
_PAIN = ["too expensive", "mess", "double booking", "no-shows", "no show",
         "complicated", "missing", "can't", "cant", "struggling", "waste"]
_PERSONA = {
    "Founder": ["founder", "cofounder", "co-founder", "no cto", "mvp", "investor", "raise"],
    "Developer": ["supabase", "rag", "mcp", "agent", "api", "deploy", "react", "nextjs"],
    "Agency": ["agency", "clients", "white label", "white-label", "reseller"],
    "SMB Owner": ["my business", "my salon", "my gym", "my studio", "my shop",
                  "small business", "booking", "appointment", "my clients"],
}
_SOLUTION = {
    "Booking": ["booking", "appointment", "schedule", "no-show", "no show"],
    "Business Website": ["website", "web site", "landing page", "wix", "webflow"],
    "Native App": ["app for my", "branded app", "native app", "mobile app"],
    "Founder MVP": ["mvp", "prototype", "demo for investors"],
    "CRM": ["crm", "client management", "customer portal", "leads"],
    "Membership": ["membership", "loyalty", "members"],
}


def _find(text: str, needles: list[str]) -> list[str]:
    return [n for n in needles if n in text]


class MockLLMProvider(LLMProvider):
    is_mock = True
    model_version = "mock-heuristic-v1"

    async def analyze(self, item: SourceItem) -> LLMAnalysis:
        text = f"{item.title} {item.body}".lower()

        persona = "Unknown"
        for name, kws in _PERSONA.items():
            if _find(text, kws):
                persona = name
                break

        competitors = [c.capitalize() for c in _COMPETITORS if c in text]
        solutions = [name for name, kws in _SOLUTION.items() if _find(text, kws)]

        intent_hits = _find(text, _INTENT_EXPLICIT)
        pain_hits = _find(text, _PAIN)

        if intent_hits and ("willing to pay" in text or "budget" in text or "quote" in text):
            purchase_intent = "explicit"
        elif intent_hits:
            purchase_intent = "high"
        elif pain_hits:
            purchase_intent = "medium"
        else:
            purchase_intent = "low"

        pain_severity = min(100, 30 + 20 * len(pain_hits) + (15 if competitors else 0))
        urgency = "high" if ("urgent" in text or "asap" in text) else (
            "medium" if intent_hits else "low"
        )

        budget = ""
        m = re.search(r"\$\s?\d[\d,\.]*", text)
        if m:
            budget = m.group(0)

        if purchase_intent in ("explicit", "high"):
            opp_type = "Explicit Demand"
        elif competitors and pain_hits:
            opp_type = "Switch Signal"
        elif "too expensive" in text:
            opp_type = "Price Complaint"
        elif persona in ("Founder",):
            opp_type = "Founder Build"
        elif persona == "Developer":
            opp_type = "Developer Build"
        elif pain_hits:
            opp_type = "Pain Signal"
        else:
            opp_type = "Low Value"

        summary = (item.title or item.body or "")[:120]
        evidence = [s.strip() for s in re.split(r"[.\n]", item.body or item.title) if s.strip()][:2]

        confidence = 0.85 if (intent_hits or competitors) else 0.55

        return LLMAnalysis(
            summary_zh=f"[中文摘要] {summary}",
            original_language="en",
            persona=persona,  # type: ignore[arg-type]
            industry="Local Services" if persona == "SMB Owner" else "",
            geography="",
            problem=summary,
            current_workflow="WhatsApp/DM" if "whatsapp" in text or "dm" in text else "",
            current_tools=competitors,
            competitors=competitors,
            pain_severity=pain_severity,
            purchase_intent=purchase_intent,  # type: ignore[arg-type]
            budget_signal=budget,
            urgency=urgency,  # type: ignore[arg-type]
            desired_outcome=solutions,
            product_opportunity=", ".join(solutions),
            medo_solution_type=solutions,
            opportunity_type=opp_type,
            suggested_action="Manual review + reach out" if purchase_intent in ("explicit", "high") else "Watch",
            suggested_response_angle="Offer MeDo one-shot site/app + booking",
            evidence_quotes=evidence,
            confidence=confidence,
            classification_reason=f"intent={intent_hits}; pain={pain_hits}; competitors={competitors}",
            model_version=self.model_version,
            prompt_version=PROMPT_VERSION,
        )


# ---------- OpenAI-compatible (real) ----------

_SYSTEM = (
    "You are an analyst for MeDo, an AI app/website builder. Classify the Reddit "
    "content and return ONLY a JSON object matching the given schema. Be strict."
)


class OpenAICompatibleProvider(LLMProvider):
    is_mock = False

    def __init__(self) -> None:
        s = get_settings()
        self._s = s
        self.model_version = s.llm_model_l2

    async def analyze(self, item: SourceItem) -> LLMAnalysis:
        import httpx

        s = self._s
        user = json.dumps(
            {"title": item.title, "body": item.body, "subreddit": item.channel_name},
            ensure_ascii=False,
        )
        payload = {
            "model": s.llm_model_l2,
            "messages": [
                {"role": "system", "content": _SYSTEM + "\nSchema: " + json.dumps(LLMAnalysis.model_json_schema())},
                {"role": "user", "content": user},
            ],
            "temperature": 0,
            "response_format": {"type": "json_object"},
        }
        headers = {"Authorization": f"Bearer {s.llm_api_key}"}
        last_err: Exception | None = None
        async with httpx.AsyncClient(timeout=s.llm_timeout_seconds) as client:
            for _ in range(s.llm_max_retries + 1):
                try:
                    r = await client.post(
                        f"{s.llm_base_url}/chat/completions", json=payload, headers=headers
                    )
                    r.raise_for_status()
                    content = r.json()["choices"][0]["message"]["content"]
                    data = json.loads(content)
                    data["model_version"] = s.llm_model_l2
                    data["prompt_version"] = PROMPT_VERSION
                    return LLMAnalysis.model_validate(data)
                except Exception as e:  # retry on any transient/parse error
                    last_err = e
        raise RuntimeError(f"LLM analysis failed after retries: {last_err}")


def get_llm_provider() -> LLMProvider:
    s = get_settings()
    if s.llm_is_mock:
        return MockLLMProvider()
    return OpenAICompatibleProvider()
