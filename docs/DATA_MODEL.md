# Data Model

所有表使用可移植列类型（`JSON` 而非 `JSONB`），同一套模型在 SQLite（切片）与
Postgres（完整栈）上都能运行。定义见 `apps/api/app/models.py`。

## radar_projects
项目配置：`id, name, objective, owner_id, status(Draft|Active|Paused|Archived),
scan_frequency, report_frequency, alert_threshold, settings_json, created_at, updated_at`。
`settings_json` 存 `score_weights` 等可配置项。

## source_channels
`id, project_id→radar_projects, platform, channel_name, channel_url,
channel_tier(A|B|C|Watchlist|Excluded), scan_enabled, last_scanned_at, checkpoint,
metadata_json`。

## query_rules
`id, project_id, rule_type(keyword|semantic|competitor), rule_value, weight,
is_negative, language, enabled`。支持分组/权重/语言/正负规则。

## raw_contents
采集原文：`id, platform, external_id, content_type(post|comment), subreddit,
author_username, title, body, url, permalink, score, upvote_ratio, comment_count,
created_at_platform, collected_at, parent_external_id, raw_json, content_hash, project_id`。
唯一约束 `(platform, external_id)`；`content_hash` 建索引用于去重。

## insights
结构化分析结果（对应 LLMAnalysis + 评分）：`id, content_id→raw_contents, summary_zh,
original_language, persona, industry, geography, problem, current_workflow, current_tools,
competitors, purchase_intent, pain_severity, urgency, budget_signal, desired_outcome,
product_opportunity, medo_solution_type, opportunity_type, suggested_action,
suggested_response_angle, opportunity_score, score_breakdown_json, confidence,
evidence_json, model_version, prompt_version, analysis_status(ok|failed|pending), created_at`。

## authors
活跃用户识别（Active User Score，仅公开内容）：`id, platform, platform_username,
public_profile_url, active_score, persona, primary_topics, active_channels,
related_content_count, last_active_at, metadata_json`。
唯一约束 `(platform, platform_username)`。`metadata_json.last_sub_scores` 存子分数。
不推断用户未公开表达的敏感属性。

## scan_runs
扫描执行历史（task health / checkpoint 支撑）：`id, project_id, mode, trigger(manual|
scheduled), listings, status(ok|failed|running), collected, new_contents, analyzed,
failed, hot_leads, duration_ms, error, started_at`。

## follow_up_records
人工闭环：`id, content_id, status, assignee_id, label(relevant|irrelevant),
contacted_at, response_received_at, interview_at, pilot_at, paid_at, failure_reason,
notes, updated_at`。

## reports
`id, project_id, report_type(daily|weekly|custom), date_from, date_to,
content_markdown, summary_json, generated_at, model_version`。

## feedback  (P1)
人工纠正记录：`id, content_id, user_id, label, previous_value, corrected_value, note,
created_at`（用于后续模型/规则迭代）。

## 迁移
SQLite 切片用 `Base.metadata.create_all`（`init_db()`）。Postgres 完整栈由 Alembic
管理，迁移必须可回滚（`infra/migrations`）。
