"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { NoProject, PageHeader, Panel, useActiveProject } from "@/components/page-kit";
import { useUI } from "@/components/ui-context";

const DIMS = [
  ["intent", "se.dimIntent"],
  ["icp_match", "se.dimIcp"],
  ["pain_severity", "se.dimPain"],
  ["medo_fit", "se.dimFit"],
  ["urgency", "se.dimUrgency"],
  ["budget", "se.dimBudget"],
  ["engagement", "se.dimEngagement"],
  ["freshness", "se.dimFreshness"],
] as const;

const DEFAULT_WEIGHTS: Record<string, number> = {
  intent: 0.25, icp_match: 0.2, pain_severity: 0.15, medo_fit: 0.15,
  urgency: 0.1, budget: 0.05, engagement: 0.05, freshness: 0.05,
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const { t } = useUI();
  const { project, pid } = useActiveProject();
  const { data: status } = useQuery({ queryKey: ["status"], queryFn: api.status });

  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (project?.settings_json?.score_weights) {
      setWeights({ ...DEFAULT_WEIGHTS, ...project.settings_json.score_weights });
    }
  }, [project]);

  const sum = Object.values(weights).reduce((a, b) => a + b, 0);

  const save = useMutation({
    mutationFn: async () => {
      await api.updateProject(pid!, {
        name: project!.name,
        status: project!.status,
        settings_json: { score_weights: weights },
      });
      return api.rescore(pid!);
    },
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (!pid) return <NoProject />;

  return (
    <div className="mx-auto max-w-[900px] space-y-5">
      <PageHeader title={t("se.title")} sub={t("se.sub")} />

      <Panel title={t("se.runMode")} delay={0}>
        <div className="grid grid-cols-3 gap-3">
          <Mode label={t("se.dataSource")} value={status?.source_mode ?? "…"} mock={status?.source_mode === "mock"} />
          <Mode label={t("se.llmProvider")} value={status?.llm_mode ?? "…"} mock={status?.llm_mode === "mock"} />
          <Mode
            label={t("se.scheduler")}
            value={status?.scheduler_enabled ? `on · ${status.scan_interval_minutes}m` : "off"}
            mock={!status?.scheduler_enabled}
          />
        </div>
        <p className="mt-3 text-[11px] text-ink-400">{t("se.modeHint")}</p>
      </Panel>

      <Panel title={t("se.weights")} delay={60}>
        <div className="space-y-3">
          {DIMS.map(([key, labelKey]) => (
            <div key={key} className="flex items-center gap-4">
              <span className="w-24 shrink-0 text-sm text-chalk">{t(labelKey)}</span>
              <input
                type="range" min={0} max={0.5} step={0.05}
                value={weights[key]}
                onChange={(e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))}
                className="flex-1 accent-[color:rgb(var(--phosphor))]"
              />
              <span className="num w-12 text-right text-sm text-mist">{weights[key].toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className={`text-sm ${Math.abs(sum - 1) < 0.001 ? "text-insight" : "text-qualified"}`}>
            {t("se.weightSum", { n: sum.toFixed(2) })} {Math.abs(sum - 1) < 0.001 ? "✓" : t("se.weightSumHint")}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setWeights(DEFAULT_WEIGHTS)}
              className="rounded-lg border border-line bg-ink-700 px-3 py-2 text-sm text-mist hover:text-chalk"
            >
              {t("se.reset")}
            </button>
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="rounded-lg bg-phosphor px-4 py-2 text-sm font-semibold text-ink-900 hover:brightness-110 disabled:opacity-40"
            >
              {save.isPending ? t("se.saving") : t("se.saveRescore")}
            </button>
          </div>
        </div>
        {saved && <div className="mt-2 text-[12px] text-insight">{t("se.saved")}</div>}
      </Panel>
    </div>
  );
}

function Mode({ label, value, mock }: { label: string; value: string; mock: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-ink-700/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.1em] text-mist">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${mock ? "text-qualified" : "text-insight"}`}>{value}</div>
    </div>
  );
}
