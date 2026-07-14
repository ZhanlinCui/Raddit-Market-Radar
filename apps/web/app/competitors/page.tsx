"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { NoProject, PageHeader, Panel, useActiveProject } from "@/components/page-kit";
import { useUI } from "@/components/ui-context";

export default function CompetitorPage() {
  const { t } = useUI();
  const { pid } = useActiveProject();
  const { data, isLoading } = useQuery({
    queryKey: ["competitors", pid],
    queryFn: () => api.competitors(pid!),
    enabled: !!pid,
  });

  if (!pid) return <NoProject />;
  const rows = data ?? [];

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <PageHeader title={t("cp.title")} sub={t("cp.sub", { n: rows.length })} />

      <div className="space-y-4">
        {isLoading && [0, 1].map((i) => <div key={i} className="panel h-32 animate-pulse" />)}
        {rows.map((c, i) => (
          <Panel key={c.competitor} delay={i * 60} className="grid grid-cols-[220px_1fr] gap-6">
            <div>
              <div className="font-display text-xl text-chalk">{c.competitor}</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat label={t("cp.mentions")} value={c.mentions} />
                <Stat label={t("cp.switch")} value={c.switch_signals} accent="#e33f2c" />
                <Stat label={t("cp.price")} value={c.price_complaints} accent="#c57a00" />
                <Stat label={t("cp.avgPain")} value={c.avg_pain} accent="#2a6ce0" />
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              {c.quotes.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-mist">
                    {t("cp.quotes")}
                  </div>
                  <div className="space-y-1.5">
                    {c.quotes.map((q, qi) => (
                      <blockquote
                        key={qi}
                        className="border-l-2 border-watch/50 bg-ink-700 px-3 py-1.5 text-[13px] italic text-mist"
                      >
                        “{q}”
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}
              {c.examples.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-mist">
                    {t("cp.related")}
                  </div>
                  <div className="space-y-1">
                    {c.examples.map((e, ei) => (
                      <a
                        key={ei}
                        href={e.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-[13px] text-chalk hover:text-phosphor"
                      >
                        <span className="num text-mist">{Math.round(e.score)}</span>
                        <span className="truncate">{e.title}</span>
                        <span className="text-ink-400">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        ))}
        {!isLoading && rows.length === 0 && (
          <div className="panel py-16 text-center text-sm text-mist">{t("cp.empty")}</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = "#e6ecf5" }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-700/40 px-2.5 py-1.5 text-center">
      <div className="num text-xl font-semibold" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.08em] text-mist">{label}</div>
    </div>
  );
}
