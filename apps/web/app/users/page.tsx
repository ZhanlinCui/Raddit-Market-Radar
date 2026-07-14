"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { NoProject, PageHeader, Panel, useActiveProject } from "@/components/page-kit";
import { useUI } from "@/components/ui-context";

export default function UsersPage() {
  const { t } = useUI();
  const { pid } = useActiveProject();
  const { data, isLoading } = useQuery({
    queryKey: ["active-users"],
    queryFn: () => api.activeUsers(),
    enabled: !!pid,
  });

  if (!pid) return <NoProject />;
  const rows = data ?? [];

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <PageHeader title={t("us.title")} sub={t("us.sub", { n: rows.length })} />

      <div className="grid grid-cols-2 gap-4">
        {isLoading && [0, 1, 2, 3].map((i) => <div key={i} className="panel h-36 animate-pulse" />)}
        {rows.map((u, i) => (
          <Panel key={u.username} delay={i * 50} className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <a
                  href={u.profile_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-display text-lg text-chalk hover:text-phosphor"
                >
                  u/{u.username} ↗
                </a>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-mist">
                  <span className="tag">{u.persona}</span>
                  <span>{t("us.relatedContent", { n: u.related_content_count })}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="num text-3xl font-semibold text-phosphor">{Math.round(u.active_score)}</div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-mist">{t("us.activeScore")}</div>
              </div>
            </div>

            {u.active_channels.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400">{t("us.activeChannels")}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {u.active_channels.map((c) => (
                    <span key={c} className="tag">r/{c}</span>
                  ))}
                </div>
              </div>
            )}

            {u.primary_topics.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400">{t("us.topics")}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {u.primary_topics.map((tp) => (
                    <span key={tp} className="tag border-phosphor/25 text-chalk">{tp}</span>
                  ))}
                </div>
              </div>
            )}
          </Panel>
        ))}
        {!isLoading && rows.length === 0 && (
          <div className="panel col-span-2 py-16 text-center text-sm text-mist">
            {t("us.empty")}
          </div>
        )}
      </div>
    </div>
  );
}
