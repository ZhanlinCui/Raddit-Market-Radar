"use client";

// Bilingual dictionary. Keys are stable ids; values are [zh, en] handled by t().
export type Locale = "zh" | "en";

export const messages: Record<string, { zh: string; en: string }> = {
  // brand / chrome
  "brand.tagline": { zh: "Intelligence", en: "Intelligence" },
  "brand.northStar": { zh: "北极星指标", en: "North Star" },
  "brand.northStarBody": {
    zh: "每周被采取行动的 Qualified Opportunities",
    en: "Weekly actioned Qualified Opportunities",
  },
  "top.title": { zh: "Reddit 情报雷达", en: "Reddit Intelligence Radar" },
  "top.subtitle": { zh: "全球 SMB · 竞品迁移 · 产品机会", en: "Global SMB · Switch signals · Product opportunities" },

  // nav
  "nav.overview": { zh: "总览", en: "Overview" },
  "nav.opportunities": { zh: "机会 Feed", en: "Opportunity Feed" },
  "nav.communities": { zh: "社区探索", en: "Community Explorer" },
  "nav.trends": { zh: "趋势看板", en: "Trend Dashboard" },
  "nav.competitors": { zh: "竞品雷达", en: "Competitor Radar" },
  "nav.users": { zh: "活跃用户", en: "Active Users" },
  "nav.setup": { zh: "雷达配置", en: "Radar Setup" },
  "nav.reports": { zh: "报告", en: "Reports" },
  "nav.settings": { zh: "设置", en: "Settings" },

  // common
  "common.all": { zh: "全部", en: "All" },
  "common.save": { zh: "保存", en: "Save" },
  "common.noData": { zh: "无数据", en: "No data" },
  "common.noProjectTitle": { zh: "还没有数据", en: "No data yet" },
  "common.noProjectBody": { zh: "先到雷达配置创建项目并运行扫描。", en: "Create a project in Radar Setup and run a scan first." },
  "common.goSetup": { zh: "前往雷达配置", en: "Go to Radar Setup" },
  "common.viewFeed": { zh: "查看完整 Feed →", en: "View full feed →" },

  // overview
  "ov.title": { zh: "总览", en: "Overview" },
  "ov.sub": { zh: "分析 {n} 条内容 · 实时机会态势", en: "{n} items analyzed · live opportunity landscape" },
  "ov.hotLeads": { zh: "Hot Leads", en: "Hot Leads" },
  "ov.qualified": { zh: "Qualified", en: "Qualified" },
  "ov.analyzed": { zh: "已分析", en: "Analyzed" },
  "ov.competitorSignals": { zh: "竞品信号", en: "Competitor Signals" },
  "ov.hotHint": { zh: "≥85 分 · 立即评估", en: "≥85 · assess now" },
  "ov.qualifiedHint": { zh: "70–84 分 · 重点机会池", en: "70–84 · priority pool" },
  "ov.analyzedHint": { zh: "已结构化内容", en: "structured items" },
  "ov.competitorHint": { zh: "竞品提及总数", en: "total mentions" },
  "ov.topOpportunities": { zh: "Top 机会", en: "Top Opportunities" },
  "ov.topIndustries": { zh: "Top 行业", en: "Top Industries" },
  "ov.emptyRun": { zh: "暂无数据，请到雷达配置运行一次扫描。", en: "No data — run a scan in Radar Setup." },
  "ov.noCompetitor": { zh: "无竞品信号", en: "No competitor signals" },
  "ov.noIndustry": { zh: "无行业数据", en: "No industry data" },

  // feed
  "feed.title": { zh: "机会 Feed", en: "Opportunity Feed" },
  "feed.sub": { zh: "{n} 条 · 按机会分降序 · {c} 个社区", en: "{n} items · by score desc · {c} communities" },
  "feed.minScore": { zh: "最低分 {n}", en: "Min score {n}" },
  "feed.persona": { zh: "角色", en: "Persona" },
  "feed.intent": { zh: "购买意图", en: "Purchase Intent" },
  "feed.empty": { zh: "无匹配机会。降低最低分或到雷达配置运行扫描。", en: "No matches. Lower the min score or run a scan." },
  "feed.detail": { zh: "详情 →", en: "Details →" },

  // drawer
  "dw.summary": { zh: "中文摘要", en: "Summary" },
  "dw.competitors": { zh: "竞品 / 当前工具", en: "Competitors / Current Tools" },
  "dw.scoreExplain": { zh: "机会分 · 可解释拆解", en: "Opportunity Score · Explained" },
  "dw.evidence": { zh: "证据 · 用户原话", en: "Evidence · User quotes" },
  "dw.action": { zh: "建议动作", en: "Suggested Action" },
  "dw.openReddit": { zh: "打开 Reddit 原帖 ↗", en: "Open on Reddit ↗" },
  "dw.relevant": { zh: "✓ 相关", en: "✓ Relevant" },
  "dw.irrelevant": { zh: "✕ 无关", en: "✕ Irrelevant" },
  "dw.notePlaceholder": { zh: "添加备注…", en: "Add a note…" },
  "dw.updated": { zh: "已更新 ✓", en: "Updated ✓" },
  "dw.persona": { zh: "角色", en: "Persona" },
  "dw.industry": { zh: "行业", en: "Industry" },
  "dw.geography": { zh: "地区", en: "Geography" },
  "dw.confidence": { zh: "置信度", en: "Confidence" },
  "dw.painSeverity": { zh: "痛点严重度", en: "Pain Severity" },

  // communities
  "cm.title": { zh: "社区探索", en: "Community Explorer" },
  "cm.sub": { zh: "{n} 个社区 · 按 Channel Score 排序", en: "{n} communities · by Channel Score" },
  "cm.topPersona": { zh: "主要角色", en: "Top persona" },
  "cm.channelScore": { zh: "Channel Score", en: "Channel Score" },
  "cm.mContent": { zh: "内容", en: "Content" },
  "cm.mRelevant": { zh: "相关", en: "Relevant" },
  "cm.mHighIntent": { zh: "高意图", en: "High intent" },
  "cm.mReachable": { zh: "可触达", en: "Reachable" },
  "cm.empty": { zh: "暂无社区数据，请先运行扫描。", en: "No community data — run a scan first." },

  // trends
  "tr.title": { zh: "趋势看板", en: "Trend Dashboard" },
  "tr.sub": { zh: "需求主题 · 角色 · 行业 · 意图分布 · 共 {n} 条", en: "Themes · persona · industry · intent · {n} items" },
  "tr.solution": { zh: "MeDo 场景需求 (Solution Type)", en: "MeDo Solution Type" },
  "tr.oppType": { zh: "机会类型", en: "Opportunity Type" },
  "tr.persona": { zh: "角色分布", en: "Persona" },
  "tr.intent": { zh: "购买意图", en: "Purchase Intent" },
  "tr.industry": { zh: "行业分布", en: "Industry" },

  // competitors
  "cp.title": { zh: "竞品雷达", en: "Competitor Radar" },
  "cp.sub": { zh: "{n} 个竞品 · 提及 / 迁移信号 / 价格抱怨", en: "{n} competitors · mentions / switch / price" },
  "cp.mentions": { zh: "提及", en: "Mentions" },
  "cp.switch": { zh: "迁移信号", en: "Switch signals" },
  "cp.price": { zh: "价格抱怨", en: "Price complaints" },
  "cp.avgPain": { zh: "平均痛点", en: "Avg pain" },
  "cp.quotes": { zh: "用户原话", en: "User quotes" },
  "cp.related": { zh: "相关帖子", en: "Related posts" },
  "cp.empty": { zh: "暂无竞品信号，请先运行扫描。", en: "No competitor signals — run a scan first." },

  // users
  "us.title": { zh: "活跃用户", en: "Active Users" },
  "us.sub": { zh: "{n} 位候选活跃用户 · 仅基于公开内容，按 Active User Score 排序", en: "{n} candidate active users · public content only, by Active User Score" },
  "us.activeScore": { zh: "Active Score", en: "Active Score" },
  "us.relatedContent": { zh: "{n} 条相关内容", en: "{n} related items" },
  "us.activeChannels": { zh: "活跃社区", en: "Active communities" },
  "us.topics": { zh: "主要主题", en: "Primary topics" },
  "us.empty": { zh: "暂无活跃用户，请先运行扫描。", en: "No active users — run a scan first." },

  // setup
  "st.title": { zh: "雷达配置", en: "Radar Setup" },
  "st.sub": { zh: "配置项目、社区与关键词，然后用 Mock 数据运行一次扫描。", en: "Configure project, communities and keywords, then run a mock scan." },
  "st.project": { zh: "雷达项目", en: "Radar Project" },
  "st.createProject": { zh: "创建项目", en: "Create project" },
  "st.projectName": { zh: "项目名称", en: "Project name" },
  "st.subreddits": { zh: "社区 (Subreddits)", en: "Subreddits" },
  "st.subPlaceholder": { zh: "社区名（不含 r/）", en: "community name (no r/)" },
  "st.keywords": { zh: "关键词", en: "Keywords" },
  "st.kwPlaceholder": { zh: "正向关键词", en: "positive keyword" },
  "st.add": { zh: "添加", en: "Add" },
  "st.runScan": { zh: "运行扫描", en: "Run Scan" },
  "st.runScanBtn": { zh: "▶ 运行 Mock 扫描 (new + hot)", en: "▶ Run mock scan (new + hot)" },
  "st.scanning": { zh: "扫描中…", en: "Scanning…" },
  "st.collected": { zh: "采集", en: "Collected" },
  "st.new": { zh: "新增", en: "New" },
  "st.analyzedStat": { zh: "已分析", en: "Analyzed" },
  "st.hotLeads": { zh: "Hot Leads", en: "Hot Leads" },
  "st.viewFeed": { zh: "查看机会 Feed →", en: "View Opportunity Feed →" },
  "st.taskHealth": { zh: "扫描任务健康 (Task Health)", en: "Task Health" },
  "th.trigger": { zh: "触发", en: "Trigger" },
  "th.mode": { zh: "模式", en: "Mode" },
  "th.status": { zh: "状态", en: "Status" },
  "th.failed": { zh: "失败", en: "Failed" },
  "th.duration": { zh: "耗时", en: "Duration" },

  // reports
  "rp.title": { zh: "报告", en: "Reports" },
  "rp.sub": { zh: "从结构化 Insight 生成日报 / 周报（不重复喂原文）。", en: "Reports built from structured insights (no re-feeding raw text)." },
  "rp.daily": { zh: "生成日报", en: "Daily report" },
  "rp.weekly": { zh: "生成周报", en: "Weekly report" },
  "rp.generating": { zh: "生成中…", en: "Generating…" },
  "rp.exportCsv": { zh: "导出机会 CSV", en: "Export CSV" },
  "rp.exportMd": { zh: "导出 .md", en: "Export .md" },
  "rp.empty": { zh: "点击「生成日报」或「生成周报」，报告将在此渲染。", en: "Generate a daily or weekly report to render it here." },

  // settings
  "se.title": { zh: "设置", en: "Settings" },
  "se.sub": { zh: "运行模式、评分权重、提醒阈值。改权重后一键 Rescore 生效，无需重跑 LLM。", en: "Modes, score weights, alerts. Rescore applies new weights without re-running the LLM." },
  "se.runMode": { zh: "运行模式", en: "Run Mode" },
  "se.dataSource": { zh: "数据源", en: "Data Source" },
  "se.llmProvider": { zh: "LLM Provider", en: "LLM Provider" },
  "se.scheduler": { zh: "调度器", en: "Scheduler" },
  "se.modeHint": { zh: "切换真实模式与开启定时调度通过后端环境变量配置（见 .env.example / DEVELOPMENT.md）。", en: "Live mode and scheduling are configured via backend env vars (see .env.example / DEVELOPMENT.md)." },
  "se.weights": { zh: "Opportunity Score 权重", en: "Opportunity Score Weights" },
  "se.weightSum": { zh: "权重合计 {n}", en: "Weight sum {n}" },
  "se.weightSumHint": { zh: "(建议 = 1.00)", en: "(should = 1.00)" },
  "se.reset": { zh: "重置默认", en: "Reset defaults" },
  "se.saveRescore": { zh: "保存并 Rescore", en: "Save & Rescore" },
  "se.saving": { zh: "保存并 Rescore…", en: "Saving & Rescoring…" },
  "se.saved": { zh: "已保存并重算所有机会分数 ✓", en: "Saved and rescored all opportunities ✓" },
  "se.dimIntent": { zh: "购买意图", en: "Intent" },
  "se.dimIcp": { zh: "ICP 匹配", en: "ICP match" },
  "se.dimPain": { zh: "痛点严重度", en: "Pain severity" },
  "se.dimFit": { zh: "MeDo 适配", en: "MeDo fit" },
  "se.dimUrgency": { zh: "紧急度", en: "Urgency" },
  "se.dimBudget": { zh: "预算信号", en: "Budget" },
  "se.dimEngagement": { zh: "互动质量", en: "Engagement" },
  "se.dimFreshness": { zh: "新鲜度", en: "Freshness" },

  // score dims (drawer explain)
  "dim.intent": { zh: "购买意图", en: "Intent" },
  "dim.icp_match": { zh: "ICP 匹配", en: "ICP match" },
  "dim.pain_severity": { zh: "痛点严重度", en: "Pain severity" },
  "dim.medo_fit": { zh: "MeDo 适配", en: "MeDo fit" },
  "dim.urgency": { zh: "紧急度", en: "Urgency" },
  "dim.budget": { zh: "预算信号", en: "Budget" },
  "dim.engagement": { zh: "互动质量", en: "Engagement" },
  "dim.freshness": { zh: "新鲜度", en: "Freshness" },

  // tiers
  "tier.hot": { zh: "Hot Lead", en: "Hot Lead" },
  "tier.qualified": { zh: "Qualified", en: "Qualified" },
  "tier.insight": { zh: "Insight", en: "Insight" },
  "tier.watch": { zh: "Watch", en: "Watch" },
  "tier.noise": { zh: "Noise", en: "Noise" },
};

export function translate(key: string, locale: Locale, vars?: Record<string, string | number>): string {
  const entry = messages[key];
  let text = entry ? entry[locale] : key;
  if (vars) {
    for (const [k, val] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(val));
    }
  }
  return text;
}
