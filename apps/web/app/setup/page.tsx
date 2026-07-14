"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, ScanResult } from "@/lib/api";
import { useUI } from "@/components/ui-context";

const SEED_KEYWORDS = [
  "need a booking system", "appointment scheduling is a mess", "Mindbody alternative",
  "need a website", "website agency too expensive", "Wix alternative",
  "need an app for my business", "branded app for my gym",
  "build an MVP", "no CTO", "need a demo for investors",
];
const SEED_SUBS = ["smallbusiness", "Entrepreneur", "startups", "SaaS", "webdev"];

export default function SetupPage() {
  const qc = useQueryClient();
  const { t } = useUI();
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.projects });
  const pid = projects?.[0]?.id;

  const [name, setName] = useState("SMB Demand Radar");
  const [sub, setSub] = useState("");
  const [kw, setKw] = useState("");
  const [scan, setScan] = useState<ScanResult | null>(null);

  const { data: channels } = useQuery({
    queryKey: ["channels", pid],
    queryFn: () => api.channels(pid!),
    enabled: !!pid,
  });

  const createProject = useMutation({
    mutationFn: () => api.createProject({ name, status: "Active", alert_threshold: 85 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
  const addChannel = useMutation({
    mutationFn: (n: string) => api.addChannel(pid!, n),
    onSuccess: () => { setSub(""); qc.invalidateQueries({ queryKey: ["channels", pid] }); },
  });
  const addRule = useMutation({
    mutationFn: (v: string) => api.addRule(pid!, v),
    onSuccess: () => setKw(""),
  });
  const runScan = useMutation({
    mutationFn: () => api.scan(pid!, ["new", "hot"]),
    onSuccess: (r) => { setScan(r); qc.invalidateQueries({ queryKey: ["opportunities"] }); },
  });

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <header className="animate-rise">
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-chalk">{t("st.title")}</h1>
        <p className="mt-1 text-sm text-mist">{t("st.sub")}</p>
      </header>

      {/* Step 1 — project */}
      <Step n={1} title={t("st.project")} done={!!pid}>
        {pid ? (
          <div className="flex items-center gap-2 text-sm text-chalk">
            <span className="tag border-insight/30 text-insight">Active</span>
            {projects?.[0]?.name} <span className="text-ink-400">#{pid}</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder={t("st.projectName")} />
            <button onClick={() => createProject.mutate()} className={btnPrimary} disabled={createProject.isPending}>
              {t("st.createProject")}
            </button>
          </div>
        )}
      </Step>

      {/* Step 2 — subreddits */}
      <Step n={2} title={t("st.subreddits")} done={!!channels?.length} disabled={!pid}>
        <div className="flex gap-2">
          <input value={sub} onChange={(e) => setSub(e.target.value)} className={input} placeholder={t("st.subPlaceholder")} />
          <button onClick={() => sub && addChannel.mutate(sub)} className={btnGhost} disabled={!pid}>{t("st.add")}</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SEED_SUBS.map((s) => (
            <button key={s} onClick={() => addChannel.mutate(s)} disabled={!pid} className="tag hover:text-chalk">
              + r/{s}
            </button>
          ))}
        </div>
        {!!channels?.length && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {channels.map((c) => (
              <span key={c.id} className="tag border-phosphor/25 text-chalk">r/{c.channel_name}</span>
            ))}
          </div>
        )}
      </Step>

      {/* Step 3 — keywords */}
      <Step n={3} title={t("st.keywords")} disabled={!pid}>
        <div className="flex gap-2">
          <input value={kw} onChange={(e) => setKw(e.target.value)} className={input} placeholder={t("st.kwPlaceholder")} />
          <button onClick={() => kw && addRule.mutate(kw)} className={btnGhost} disabled={!pid}>{t("st.add")}</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SEED_KEYWORDS.map((k) => (
            <button key={k} onClick={() => addRule.mutate(k)} disabled={!pid} className="tag hover:text-chalk">
              + {k}
            </button>
          ))}
        </div>
      </Step>

      {/* Step 4 — scan */}
      <Step n={4} title={t("st.runScan")} disabled={!pid || !channels?.length}>
        <button onClick={() => runScan.mutate()} className={btnPrimary} disabled={runScan.isPending || !channels?.length}>
          {runScan.isPending ? t("st.scanning") : t("st.runScanBtn")}
        </button>
        {scan && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            <Stat label={t("st.collected")} value={scan.collected} />
            <Stat label={t("st.new")} value={scan.new_contents} />
            <Stat label={t("st.analyzedStat")} value={scan.analyzed} accent="#0d946c" />
            <Stat label={t("st.hotLeads")} value={scan.hot_leads} accent="#e33f2c" />
          </div>
        )}
        {scan && (
          <a href="/opportunities" className="mt-3 inline-block text-xs text-phosphor hover:underline">
            {t("st.viewFeed")}
          </a>
        )}
      </Step>

      {/* Task health */}
      <ScanRunsPanel pid={pid} />
    </div>
  );
}

function ScanRunsPanel({ pid }: { pid?: number }) {
  const { t } = useUI();
  const { data: runs } = useQuery({
    queryKey: ["scan-runs", pid],
    queryFn: () => api.scanRuns(pid!),
    enabled: !!pid,
    refetchInterval: 5000,
  });
  if (!pid || !runs?.length) return null;
  return (
    <section className="panel animate-rise p-5" style={{ animationDelay: "300ms" }}>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-mist">
        {t("st.taskHealth")}
      </h2>
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-700 text-mist">
            <tr>
              {["#", t("th.trigger"), t("th.mode"), t("th.status"), t("st.collected"), t("st.new"), t("st.analyzedStat"), t("th.failed"), "Hot", t("th.duration")].map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="num px-3 py-1.5 text-mist">{r.id}</td>
                <td className="px-3 py-1.5">
                  <span className="tag">{r.trigger}</span>
                </td>
                <td className="px-3 py-1.5 text-mist">{r.mode}</td>
                <td className="px-3 py-1.5">
                  <span className={r.status === "ok" ? "text-insight" : "text-hot"}>● {r.status}</span>
                </td>
                <td className="num px-3 py-1.5 text-chalk">{r.collected}</td>
                <td className="num px-3 py-1.5 text-chalk">{r.new_contents}</td>
                <td className="num px-3 py-1.5 text-chalk">{r.analyzed}</td>
                <td className="num px-3 py-1.5 text-mist">{r.failed}</td>
                <td className="num px-3 py-1.5 text-hot">{r.hot_leads}</td>
                <td className="num px-3 py-1.5 text-ink-400">{r.duration_ms}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const input = "flex-1 rounded-lg border border-line bg-ink-700 px-3 py-2 text-sm text-chalk outline-none focus:border-phosphor/50";
const btnPrimary = "rounded-lg bg-phosphor px-4 py-2 text-sm font-semibold text-ink-900 hover:brightness-110 disabled:opacity-40";
const btnGhost = "rounded-lg border border-line bg-ink-700 px-4 py-2 text-sm text-chalk hover:border-phosphor/40 disabled:opacity-40";

function Step({ n, title, children, done, disabled }: { n: number; title: string; children: React.ReactNode; done?: boolean; disabled?: boolean }) {
  return (
    <section className={`panel animate-rise p-5 ${disabled ? "opacity-50" : ""}`} style={{ animationDelay: `${n * 60}ms` }}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`num grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${done ? "bg-insight text-ink-900" : "border border-line text-mist"}`}>
          {done ? "✓" : n}
        </span>
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-mist">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-700 p-3 text-center">
      <div className="num text-2xl font-semibold" style={{ color: accent || "rgb(var(--chalk))" }}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-mist">{label}</div>
    </div>
  );
}
