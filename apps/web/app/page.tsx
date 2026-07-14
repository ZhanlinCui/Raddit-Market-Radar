"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api, Opportunity, tierOf } from "@/lib/api";
import { TierBadge } from "@/components/score";
import { useUI } from "@/components/ui-context";

function useFirstProject() {
  return useQuery({ queryKey: ["projects"], queryFn: api.projects });
}

export default function OverviewPage() {
  const { t } = useUI();
  const { data: projects } = useFirstProject();
  const pid = projects?.[0]?.id;

  const { data: opps } = useQuery({
    queryKey: ["opportunities", pid, "overview"],
    queryFn: () => api.opportunities({ project_id: pid, limit: 200 }),
    enabled: !!pid,
  });

  const list = opps ?? [];
  const hot = list.filter((o) => o.insight.opportunity_score >= 85);
  const qualified = list.filter(
    (o) => o.insight.opportunity_score >= 70 && o.insight.opportunity_score < 85
  );
  const competitors = new Map<string, number>();
  const industries = new Map<string, number>();
  list.forEach((o) => {
    o.insight.competitors.forEach((c) => competitors.set(c, (competitors.get(c) || 0) + 1));
    if (o.insight.industry) industries.set(o.insight.industry, (industries.get(o.insight.industry) || 0) + 1);
  });

  if (!pid) return <EmptyState />;

  return (
    <div className="mx-auto max-w-[1180px] space-y-7">
      <header className="animate-rise">
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-chalk">
          {t("ov.title")}
        </h1>
        <p className="mt-1 text-sm text-mist">
          {projects?.[0]?.name} · {t("ov.sub", { n: list.length })}
        </p>
      </header>

      <div className="grid grid-cols-4 gap-4">
        <Kpi label={t("ov.hotLeads")} value={hot.length} accent="var(--tw-hot)" color="#e33f2c" hint={t("ov.hotHint")} delay={0} />
        <Kpi label={t("ov.qualified")} value={qualified.length} color="#c57a00" hint={t("ov.qualifiedHint")} delay={60} />
        <Kpi label={t("ov.analyzed")} value={list.length} color="#0d946c" hint={t("ov.analyzedHint")} delay={120} />
        <Kpi
          label={t("ov.competitorSignals")}
          value={[...competitors.values()].reduce((a, b) => a + b, 0)}
          color="#2a6ce0"
          hint={t("ov.competitorHint")}
          delay={180}
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <section className="panel col-span-2 animate-rise p-5" style={{ animationDelay: "220ms" }}>
          <SectionTitle>{t("ov.topOpportunities")}</SectionTitle>
          <div className="mt-3 divide-y divide-line">
            {list.slice(0, 6).map((o) => (
              <TopRow key={o.insight.id} o={o} />
            ))}
            {list.length === 0 && <Hollow>{t("ov.emptyRun")}</Hollow>}
          </div>
          <Link
            href="/opportunities"
            className="mt-4 inline-flex items-center gap-1 text-xs text-phosphor hover:underline"
          >
            {t("common.viewFeed")}
          </Link>
        </section>

        <div className="space-y-5">
          <section className="panel animate-rise p-5" style={{ animationDelay: "280ms" }}>
            <SectionTitle>{t("ov.competitorSignals")}</SectionTitle>
            <div className="mt-3 space-y-2">
              {[...competitors.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => (
                <Bar key={name} label={name} value={n} max={Math.max(...competitors.values(), 1)} color="#2a6ce0" />
              ))}
              {competitors.size === 0 && <Hollow>{t("ov.noCompetitor")}</Hollow>}
            </div>
          </section>

          <section className="panel animate-rise p-5" style={{ animationDelay: "340ms" }}>
            <SectionTitle>{t("ov.topIndustries")}</SectionTitle>
            <div className="mt-3 space-y-2">
              {[...industries.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => (
                <Bar key={name} label={name} value={n} max={Math.max(...industries.values(), 1)} color="#0d946c" />
              ))}
              {industries.size === 0 && <Hollow>{t("ov.noIndustry")}</Hollow>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, color, hint, delay }: { label: string; value: number; color: string; hint: string; delay: number; accent?: string }) {
  return (
    <div className="panel relative animate-rise overflow-hidden p-5" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: color }}
      />
      <div className="text-[11px] uppercase tracking-[0.14em] text-mist">{label}</div>
      <div className="num mt-2 text-4xl font-semibold text-chalk">{value}</div>
      <div className="mt-1 text-[11px] text-ink-400">{hint}</div>
      <div className="mt-3 h-0.5 w-10 rounded-full" style={{ backgroundColor: color }} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-mist">{children}</h2>;
}

function TopRow({ o }: { o: Opportunity }) {
  return (
    <Link href="/opportunities" className="flex items-center gap-3 py-3 transition-colors hover:bg-ink-700/30">
      <TierBadge score={o.insight.opportunity_score} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-chalk">{o.title}</div>
        <div className="text-[11px] text-mist">
          r/{o.subreddit} · {o.insight.persona} · {o.insight.purchase_intent}
        </div>
      </div>
      <span className="num text-sm text-chalk">{Math.round(o.insight.opportunity_score)}</span>
    </Link>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-chalk">{label}</span>
        <span className="num text-mist">{value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function Hollow({ children }: { children: React.ReactNode }) {
  return <div className="py-6 text-center text-xs text-ink-400">{children}</div>;
}

function EmptyState() {
  const { t } = useUI();
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <div className="font-display text-2xl text-chalk">{t("common.noProjectTitle")}</div>
      <p className="mt-2 text-sm text-mist">{t("common.noProjectBody")}</p>
      <Link
        href="/setup"
        className="mt-6 inline-flex rounded-lg bg-phosphor px-4 py-2 text-sm font-semibold text-ink-900 hover:brightness-110"
      >
        {t("common.goSetup")}
      </Link>
    </div>
  );
}
