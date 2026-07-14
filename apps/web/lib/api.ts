// Typed API client + shared types mirroring the FastAPI schemas.

export type Persona =
  | "SMB Owner" | "Founder" | "Developer" | "Agency" | "Consultant" | "Other" | "Unknown";

export interface ScoreBreakdown {
  weights: Record<string, number>;
  sub_scores: Record<string, number>;
  weighted: Record<string, number>;
  final: number;
}

export interface Insight {
  id: number;
  content_id: number;
  summary_zh: string;
  persona: Persona;
  industry: string;
  geography: string;
  problem: string;
  current_tools: string[];
  competitors: string[];
  purchase_intent: string;
  pain_severity: number;
  budget_signal: string;
  opportunity_type: string;
  opportunity_score: number;
  score_breakdown_json: ScoreBreakdown;
  confidence: number;
  evidence_json: string[];
  suggested_action: string;
}

export interface Opportunity {
  insight: Insight;
  subreddit: string;
  author_username: string;
  title: string;
  permalink: string;
  created_at_platform: string | null;
  follow_up_status: string;
  label: string;
}

export interface Project {
  id: number;
  name: string;
  objective: string;
  status: string;
  alert_threshold: number;
  settings_json?: { score_weights?: Record<string, number> };
}

export interface Channel {
  id: number;
  channel_name: string;
  channel_tier: string;
  last_scanned_at: string | null;
}

export interface ScanResult {
  project_id: number;
  mode: string;
  collected: number;
  new_contents: number;
  analyzed: number;
  hot_leads: number;
  duration_ms: number;
}

export interface Status {
  source_mode: string;
  llm_mode: string;
  app_env: string;
  scheduler_enabled: boolean;
  scan_interval_minutes: number;
}

export interface ScanRun {
  id: number;
  mode: string;
  trigger: string;
  listings: string[];
  status: string;
  collected: number;
  new_contents: number;
  analyzed: number;
  failed: number;
  hot_leads: number;
  duration_ms: number;
  started_at: string;
}

export interface ActiveUser {
  username: string;
  profile_url: string;
  active_score: number;
  persona: string;
  primary_topics: string[];
  active_channels: string[];
  related_content_count: number;
  last_active_at: string | null;
  sub_scores: Record<string, number>;
}

export interface Community {
  subreddit: string;
  total: number;
  relevant: number;
  high_intent: number;
  reachable_ops: number;
  avg_comment_count: number;
  top_persona: string;
  channel_score: number;
  suggested_tier: string;
  score_breakdown: ScoreBreakdown;
}

export interface Competitor {
  competitor: string;
  mentions: number;
  switch_signals: number;
  price_complaints: number;
  avg_pain: number;
  quotes: string[];
  examples: { title: string; permalink: string; score: number }[];
}

export interface Trends {
  total: number;
  persona: Record<string, number>;
  industry: Record<string, number>;
  opportunity_type: Record<string, number>;
  purchase_intent: Record<string, number>;
  medo_solution_type: Record<string, number>;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  status: () => req<Status>("/api/status"),
  projects: () => req<Project[]>("/api/projects"),
  createProject: (body: Partial<Project>) =>
    req<Project>("/api/projects", { method: "POST", body: JSON.stringify(body) }),
  channels: (pid: number) => req<Channel[]>(`/api/projects/${pid}/channels`),
  addChannel: (pid: number, channel_name: string) =>
    req<Channel>(`/api/projects/${pid}/channels`, {
      method: "POST",
      body: JSON.stringify({ channel_name }),
    }),
  addRule: (pid: number, rule_value: string, is_negative = false) =>
    req(`/api/projects/${pid}/rules`, {
      method: "POST",
      body: JSON.stringify({ rule_type: "keyword", rule_value, is_negative }),
    }),
  scan: (project_id: number, listings = ["new", "hot"]) =>
    req<ScanResult>("/api/scan", {
      method: "POST",
      body: JSON.stringify({ project_id, listings }),
    }),
  opportunities: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v != null && v !== "" && qs.set(k, String(v)));
    return req<Opportunity[]>(`/api/opportunities?${qs.toString()}`);
  },
  followUp: (contentId: number, body: Record<string, string>) =>
    req(`/api/contents/${contentId}/follow-up`, { method: "POST", body: JSON.stringify(body) }),
  dailyReport: (pid: number) =>
    req<{ id: number; markdown: string; summary: Record<string, unknown> }>(
      `/api/reports/daily?project_id=${pid}`,
      { method: "POST" }
    ),
  communities: (pid: number) => req<Community[]>(`/api/analytics/communities?project_id=${pid}`),
  competitors: (pid: number) => req<Competitor[]>(`/api/analytics/competitors?project_id=${pid}`),
  trends: (pid: number) => req<Trends>(`/api/analytics/trends?project_id=${pid}`),
  scanRuns: (pid: number) => req<ScanRun[]>(`/api/scan-runs?project_id=${pid}`),
  activeUsers: () => req<ActiveUser[]>(`/api/analytics/active-users`),
  weeklyReport: (pid: number) =>
    req<{ id: number; markdown: string; summary: Record<string, unknown> }>(
      `/api/reports/weekly?project_id=${pid}`,
      { method: "POST" }
    ),
  rescore: (pid: number) => req(`/api/projects/${pid}/rescore`, { method: "POST" }),
  updateProject: (pid: number, body: Record<string, unknown>) =>
    req<Project>(`/api/projects/${pid}`, { method: "PATCH", body: JSON.stringify(body) }),
  csvUrl: (pid: number) => `/api/opportunities.csv?project_id=${pid}`,
};

// ---- tier helpers ----
export function tierOf(score: number): { label: string; key: string } {
  if (score >= 85) return { label: "Hot Lead", key: "hot" };
  if (score >= 70) return { label: "Qualified", key: "qualified" };
  if (score >= 50) return { label: "Insight", key: "insight" };
  if (score >= 30) return { label: "Watch", key: "watch" };
  return { label: "Noise", key: "noise" };
}

export const tierColor: Record<string, string> = {
  hot: "#ff5c49",
  qualified: "#ffb020",
  insight: "#38e0b0",
  watch: "#5b9dff",
  noise: "#5a6579",
};
