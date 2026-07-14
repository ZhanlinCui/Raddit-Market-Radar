# PRD — MeDo Reddit Intelligence Radar

## 背景
MeDo.dev 海外 SMB 商业化的核心问题是尚未找到清晰、可重复获客与付费转化的 PMF / ICP。
团队目前依赖人工在 Reddit 搜索、翻阅 Subreddit、整理痛点、监测竞品，效率低且不可持续。

## 目标
构建一个持续运行的情报雷达，自动识别并结构化以下信号，产出可行动的机会：
1. 主动寻找网站/App/预约/客户门户的 SMB
2. 对现有工具价格或能力不满的迁移用户
3. 正在做 MVP/SaaS/Agent 的 Founder 与开发者
4. 高频未被满足的业务需求
5. 竞品负面评价与迁移信号
6. 值得长期关注的社区与活跃用户

## 北极星指标
每周被业务团队确认并采取行动的 **Qualified Opportunities** 数量。

辅助指标：机会→触达→回复→访谈→Pilot→付费 各级转化率；各社区/行业机会密度；
竞品迁移信号数；发现到处理时长；报告建议采纳数。

## 核心用户
海外运营、PDSA、PDM、DevRel、管理层（各自视角见提示词第六章）。

## 雷达模板（首期四个）
- SMB Demand Radar
- Founder & Developer Radar
- Competitor Radar
- Partner & KOL Radar

## MVP 范围
**P0**：Reddit/OAuth + Mock Adapter、项目/社区/关键词配置、New/Hot/Top/Search 扫描、
帖子与重点评论采集、增量扫描 + Checkpoint、去重、AI 摘要与分类、Opportunity Score、
Opportunity Feed + 筛选、社区详情、高分提醒、日报/周报、人工反馈、跟进状态、原帖链接、
Docker Compose 启动、文档。

**P1**：语义查询、Embedding、趋势/竞品/活跃用户页面、动态关键词推荐、自动发现社区、
自定义报告、回复草稿、CSV/Markdown 导出。

**P2**：Hacker News / GitHub / Product Hunt 等多平台、CRM 集成、Demo Brief 生成、
DevRel 关系图谱、多语言市场报告。

## 验收标准（摘要）
- 数据层：支持社区 ≥30，单项目关键词 ≥200，扫描延迟 ≤15min，去重率 ≥95%，
  任务成功率 ≥95%，字段完整率 ≥95%，原帖链接有效率 ≥98%。
- AI 层：Top50 相关性 Precision ≥80%，Persona/意图/行业分类 ≥80%，高价值误报 ≤20%，
  中文摘要可用率 ≥90%。
- 业务层：首轮 ≥300 有效需求、≥50 高价值机会、≥20 可触达、≥8 访谈、≥3 Pilot、
  ≥10 产品洞察、≥10 高信号社区、≥20 活跃开发者/KOL。

## 产品原则（关键）
价值在推动行动而非漂亮报告；意图与 ICP 匹配 > 点赞；所有 AI 结论展示证据与置信度；
所有评分可解释；规则权重可配置；数据源以 Adapter 隔离；LLM 可替换；无凭证时 Mock 运行；
不做自动私信/发帖；报告基于结构化 Insight 生成而非重复喂原文；保留人工反馈闭环。
