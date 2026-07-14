"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api, Opportunity } from "@/lib/api";
import { TierBadge } from "@/components/score";
import { OpportunityDrawer } from "@/components/opportunity-drawer";
import { useUI } from "@/components/ui-context";

const INTENTS = ["", "explicit", "high", "medium", "low"];
const PERSONAS = ["", "SMB Owner", "Founder", "Developer", "Agency"];

export default function OpportunitiesPage() {
  const { t } = useUI();
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.projects });
  const pid = projects?.[0]?.id;

  const [minScore, setMinScore] = useState(0);
  const [persona, setPersona] = useState("");
  const [intent, setIntent] = useState("");
  const [selected, setSelected] = useState<Opportunity | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["opportunities", pid, minScore, persona, intent],
    queryFn: () =>
      api.opportunities({
        project_id: pid,
        min_score: minScore,
        persona: persona || undefined,
        purchase_intent: intent || undefined,
        limit: 200,
      }),
    enabled: !!pid,
  });

  const list = data ?? [];
  const subreddits = useMemo(() => [...new Set(list.map((o) => o.subreddit))], [list]);

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <header className="animate-rise flex items-end justify-between">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-chalk">
            {t("feed.title")}
          </h1>
          <p className="mt-1 text-sm text-mist">
            {t("feed.sub", { n: list.length, c: subreddits.length })}
          </p>
        </div>
      </header>

      {/* Filter rail */}
      <div className="panel animate-rise flex flex-wrap items-center gap-5 p-4" style={{ animationDelay: "60ms" }}>
        <Field label={t("feed.minScore", { n: minScore })}>
          <input
            type="range" min={0} max={100} value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-40 accent-[color:rgb(var(--phosphor))]"
          />
        </Field>
        <Field label={t("feed.persona")}>
          <Select value={persona} onChange={setPersona} options={PERSONAS} allLabel={t("common.all")} />
        </Field>
        <Field label={t("feed.intent")}>
          <Select value={intent} onChange={setIntent} options={INTENTS} allLabel={t("common.all")} />
        </Field>
        <div className="ml-auto flex gap-2">
          {["Hot ≥85", "Qualified ≥70", t("common.all")].map((q, i) => (
            <button
              key={i}
              onClick={() => setMinScore([85, 70, 0][i])}
              className="rounded-md border border-line bg-ink-700 px-2.5 py-1 text-[11px] text-mist hover:text-chalk"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && <Skeletons />}
        {!isLoading && list.map((o, i) => (
          <OppCard key={o.insight.id} o={o} onClick={() => setSelected(o)} delay={i * 40} />
        ))}
        {!isLoading && list.length === 0 && (
          <div className="panel py-16 text-center text-sm text-mist">{t("feed.empty")}</div>
        )}
      </div>

      <OpportunityDrawer opp={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function OppCard({ o, onClick, delay }: { o: Opportunity; onClick: () => void; delay: number }) {
  const { t } = useUI();
  const ins = o.insight;
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="panel group animate-rise flex w-full items-start gap-4 p-4 text-left transition-all hover:border-phosphor/30 hover:shadow-glow"
    >
      <div className="num grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-line bg-ink-700 text-lg font-semibold text-chalk">
        {Math.round(ins.opportunity_score)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TierBadge score={ins.opportunity_score} />
          <span className="tag">{ins.opportunity_type}</span>
          {ins.competitors.slice(0, 2).map((c) => (
            <span key={c} className="tag border-watch/30 text-watch">↝ {c}</span>
          ))}
        </div>
        <div className="mt-2 truncate font-medium text-chalk">{o.title}</div>
        <div className="mt-0.5 line-clamp-1 text-[13px] text-mist">{ins.summary_zh}</div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
          <span>r/{o.subreddit}</span>
          <span>· u/{o.author_username}</span>
          <span>· {ins.persona}</span>
          {ins.industry && <span>· {ins.industry}</span>}
          <span>· {ins.purchase_intent}</span>
          {ins.budget_signal && <span className="text-qualified">· 💰 {ins.budget_signal}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 text-[11px] text-mist">
        {o.label && (
          <span className={o.label === "relevant" ? "text-insight" : "text-noise"}>
            {o.label === "relevant" ? t("dw.relevant") : t("dw.irrelevant")}
          </span>
        )}
        <span className="text-ink-400">{o.follow_up_status}</span>
        <span className="text-phosphor opacity-0 transition-opacity group-hover:opacity-100">{t("feed.detail")}</span>
      </div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.12em] text-mist">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options, allLabel }: { value: string; onChange: (v: string) => void; options: string[]; allLabel: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-line bg-ink-700 px-2 py-1 text-sm text-chalk outline-none focus:border-phosphor/50"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o || allLabel}</option>
      ))}
    </select>
  );
}

function Skeletons() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="panel flex animate-pulse items-center gap-4 p-4">
          <div className="h-12 w-12 rounded-lg bg-ink-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-ink-700" />
            <div className="h-3 w-2/3 rounded bg-ink-700" />
          </div>
        </div>
      ))}
    </>
  );
}
