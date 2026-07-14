"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, Opportunity } from "@/lib/api";
import { ScoreDial, ScoreExplain, TierBadge } from "@/components/score";
import { useUI } from "@/components/ui-context";

const STATUSES = ["new", "contacted", "responded", "interview", "pilot", "paid", "failed"];

export function OpportunityDrawer({ opp, onClose }: { opp: Opportunity | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { t } = useUI();
  const [note, setNote] = useState("");

  const mutate = useMutation({
    mutationFn: (body: Record<string, string>) => api.followUp(opp!.insight.content_id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunities"] }),
  });

  if (!opp) return null;
  const ins = opp.insight;

  return (
    <>
      <div className="fixed inset-0 z-20 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-30 flex h-screen w-[520px] max-w-[92vw] flex-col border-l border-line bg-ink-800 shadow-panel">
        {/* header */}
        <div className="flex items-start gap-4 border-b border-line p-5">
          <ScoreDial score={ins.opportunity_score} size={58} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <TierBadge score={ins.opportunity_score} />
              <span className="tag">{ins.opportunity_type}</span>
            </div>
            <h2 className="mt-2 font-display text-lg leading-snug text-chalk">{opp.title}</h2>
            <div className="mt-1 text-[11px] text-mist">
              r/{opp.subreddit} · u/{opp.author_username}
            </div>
          </div>
          <button onClick={onClose} className="text-mist hover:text-chalk">✕</button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <Block title={t("dw.summary")}>
            <p className="text-sm leading-relaxed text-chalk">{ins.summary_zh}</p>
          </Block>

          <div className="grid grid-cols-2 gap-3">
            <Meta label={t("dw.persona")} value={ins.persona} />
            <Meta label={t("dw.industry")} value={ins.industry || "—"} />
            <Meta label={t("feed.intent")} value={ins.purchase_intent} />
            <Meta label={t("dw.painSeverity")} value={`${ins.pain_severity}/100`} />
            <Meta label={t("dw.geography")} value={ins.geography || "—"} />
            <Meta label={t("dw.confidence")} value={`${Math.round(ins.confidence * 100)}%`} />
          </div>

          {ins.competitors.length > 0 && (
            <Block title={t("dw.competitors")}>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set([...ins.competitors, ...ins.current_tools])].map((c) => (
                  <span key={c} className="tag border-watch/30 text-watch">{c}</span>
                ))}
              </div>
            </Block>
          )}

          <Block title={t("dw.scoreExplain")}>
            <ScoreExplain breakdown={ins.score_breakdown_json} />
          </Block>

          {ins.evidence_json.length > 0 && (
            <Block title={t("dw.evidence")}>
              <div className="space-y-2">
                {ins.evidence_json.map((q, i) => (
                  <blockquote
                    key={i}
                    className="border-l-2 border-phosphor/50 bg-ink-700 px-3 py-2 text-[13px] italic text-mist"
                  >
                    “{q}”
                  </blockquote>
                ))}
              </div>
            </Block>
          )}

          <Block title={t("dw.action")}>
            <p className="rounded-lg border border-phosphor/25 bg-phosphor/5 px-3 py-2 text-sm text-chalk">
              {ins.suggested_action || "—"}
            </p>
          </Block>

          <a
            href={opp.permalink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-phosphor hover:underline"
          >
            {t("dw.openReddit")}
          </a>
        </div>

        {/* action bar */}
        <div className="space-y-3 border-t border-line bg-ink-800 p-5">
          <div className="flex gap-2">
            <button
              onClick={() => mutate.mutate({ label: "relevant" })}
              className="flex-1 rounded-lg bg-insight/15 py-2 text-sm font-semibold text-insight ring-1 ring-insight/30 hover:bg-insight/25"
            >
              {t("dw.relevant")}
            </button>
            <button
              onClick={() => mutate.mutate({ label: "irrelevant" })}
              className="flex-1 rounded-lg bg-ink-700 py-2 text-sm font-semibold text-mist hover:text-chalk"
            >
              {t("dw.irrelevant")}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => mutate.mutate({ status: s })}
                className={`rounded-md px-2.5 py-1 text-[11px] transition-colors ${
                  opp.follow_up_status === s
                    ? "bg-phosphor text-ink-900"
                    : "border border-line bg-ink-700 text-mist hover:text-chalk"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("dw.notePlaceholder")}
              className="flex-1 rounded-md border border-line bg-ink-700 px-3 py-1.5 text-sm text-chalk outline-none focus:border-phosphor/50"
            />
            <button
              onClick={() => note && mutate.mutate({ notes: note })}
              className="rounded-md bg-ink-600 px-3 text-sm text-chalk hover:bg-ink-500"
            >
              {t("common.save")}
            </button>
          </div>
          {mutate.isSuccess && <div className="text-[11px] text-insight">{t("dw.updated")}</div>}
        </div>
      </aside>
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-mist">{title}</h3>
      {children}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-700/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.1em] text-ink-400">{label}</div>
      <div className="mt-0.5 text-sm text-chalk">{value}</div>
    </div>
  );
}
