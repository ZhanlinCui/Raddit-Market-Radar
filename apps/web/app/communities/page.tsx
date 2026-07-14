"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CHANNEL_TIER_COLOR } from "@/components/charts";
import { NoProject, PageHeader, Panel, useActiveProject } from "@/components/page-kit";
import { useUI } from "@/components/ui-context";

export default function CommunitiesPage() {
  const { t } = useUI();
  const { pid } = useActiveProject();
  const { data, isLoading } = useQuery({
    queryKey: ["communities", pid],
    queryFn: () => api.communities(pid!),
    enabled: !!pid,
  });

  if (!pid) return <NoProject />;
  const rows = data ?? [];

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <PageHeader title={t("cm.title")} sub={t("cm.sub", { n: rows.length })} />

      <div className="grid grid-cols-3 gap-4">
        {isLoading && [0, 1, 2].map((i) => <div key={i} className="panel h-40 animate-pulse" />)}
        {rows.map((c, i) => {
          const color = CHANNEL_TIER_COLOR[c.suggested_tier] ?? "#8493ad";
          return (
            <Panel key={c.subreddit} delay={i * 50} className="relative overflow-hidden">
              <div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
                style={{ backgroundColor: color }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-lg text-chalk">r/{c.subreddit}</div>
                  <div className="mt-0.5 text-[11px] text-mist">{t("cm.topPersona")} · {c.top_persona}</div>
                </div>
                <span
                  className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={{ color, backgroundColor: `${color}1a`, boxShadow: `inset 0 0 0 1px ${color}40` }}
                >
                  Tier {c.suggested_tier}
                </span>
              </div>

              <div className="mt-4 flex items-end gap-2">
                <span className="num text-4xl font-semibold" style={{ color }}>
                  {Math.round(c.channel_score)}
                </span>
                <span className="mb-1 text-[11px] text-ink-400">{t("cm.channelScore")}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <Metric label={t("cm.mContent")} value={c.total} />
                <Metric label={t("cm.mRelevant")} value={c.relevant} />
                <Metric label={t("cm.mHighIntent")} value={c.high_intent} />
                <Metric label={t("cm.mReachable")} value={c.reachable_ops} accent={color} />
              </div>

              <div className="mt-4 space-y-1.5">
                {Object.entries(c.score_breakdown.sub_scores)
                  .slice(0, 4)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="w-24 shrink-0 truncate text-[10px] text-ink-400">{k}</span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-700">
                        <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  ))}
              </div>
            </Panel>
          );
        })}
      </div>
      {!isLoading && rows.length === 0 && (
        <div className="panel py-16 text-center text-sm text-mist">{t("cm.empty")}</div>
      )}
    </div>
  );
}

function Metric({ label, value, accent = "#e6ecf5" }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-700/40 px-2.5 py-1.5">
      <div className="num text-lg font-semibold" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.08em] text-mist">{label}</div>
    </div>
  );
}
