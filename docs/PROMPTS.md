# Prompts & Analysis Contract

## 分析契约 (`LLMAnalysis`, `app/schemas.py`)
每条内容必须产出以下 JSON，并经 Pydantic 校验（失败则重试 / 记录 / 不影响主采集）：

```json
{
  "summary_zh": "", "original_language": "en",
  "persona": "SMB Owner|Founder|Developer|Agency|Consultant|Other|Unknown",
  "industry": "", "geography": "", "problem": "", "current_workflow": "",
  "current_tools": [], "competitors": [],
  "pain_severity": 0, "purchase_intent": "explicit|high|medium|low|none",
  "budget_signal": "", "urgency": "high|medium|low",
  "desired_outcome": [], "product_opportunity": "", "medo_solution_type": [],
  "opportunity_type": "", "suggested_action": "", "suggested_response_angle": "",
  "evidence_quotes": [], "confidence": 0.0,
  "classification_reason": "", "model_version": "", "prompt_version": ""
}
```

## 两级模型策略
- **L1（低成本, `LLM_MODEL_L1`）**：相关性判断、噪音过滤、语言识别、一级分类、短摘要。
- **L2（高能力, `LLM_MODEL_L2`）**：深度痛点、Opportunity Score 依据、MeDo 适配、
  推荐动作、聚类、日报/周报。仅对高价值内容调用。

## 机会一级分类
`Explicit Demand, Pain Signal, Switch Signal, Price Complaint, Feature Gap,
Founder Build, Developer Build, Partnership, Product Insight, Market Trend,
Success Pattern, Low Value`。

## MeDo 场景标签
`Business Website, Lead Generation, Booking, CRM, Client Portal, Membership,
Native App, Mobile App, Payment, Local SEO, WhatsApp Workflow, WeChat Mini Program,
Founder MVP, Pitch Demo, Internal Tool, AI Agent, RAG, MCP, Supabase, Deployment,
App Publishing`。

## System Prompt（真实 Provider）
> You are an analyst for MeDo, an AI app/website builder. Classify the Reddit content
> and return ONLY a JSON object matching the given schema. Be strict.

Schema 通过 `LLMAnalysis.model_json_schema()` 注入；`response_format=json_object`，
`temperature=0`。

## Mock Provider
`MockLLMProvider` 用确定性关键词启发式（intent / pain / persona / competitor / solution
词表）产出同样 schema 合法的结果，用于无凭证运行与测试。

## 版本管理
`model_version` 与 `prompt_version`（当前 `v1`）随每条 Insight 落库，便于回溯与 A/B。
