"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useUI } from "@/components/ui-context";

export default function ReportsPage() {
  const { t } = useUI();
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.projects });
  const pid = projects?.[0]?.id;
  const [md, setMd] = useState<string>("");

  const daily = useMutation({
    mutationFn: () => api.dailyReport(pid!),
    onSuccess: (r) => setMd(r.markdown),
  });
  const weekly = useMutation({
    mutationFn: () => api.weeklyReport(pid!),
    onSuccess: (r) => setMd(r.markdown),
  });

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <header className="animate-rise flex items-end justify-between">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-chalk">{t("rp.title")}</h1>
          <p className="mt-1 text-sm text-mist">{t("rp.sub")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => daily.mutate()}
            disabled={!pid || daily.isPending}
            className="rounded-lg bg-phosphor px-4 py-2 text-sm font-semibold text-ink-900 hover:brightness-110 disabled:opacity-40"
          >
            {daily.isPending ? t("rp.generating") : t("rp.daily")}
          </button>
          <button
            onClick={() => weekly.mutate()}
            disabled={!pid || weekly.isPending}
            className="rounded-lg border border-phosphor/40 bg-phosphor/10 px-4 py-2 text-sm font-semibold text-phosphor hover:bg-phosphor/20 disabled:opacity-40"
          >
            {weekly.isPending ? t("rp.generating") : t("rp.weekly")}
          </button>
          {pid && (
            <a
              href={api.csvUrl(pid)}
              className="rounded-lg border border-line bg-ink-700 px-4 py-2 text-sm text-chalk hover:border-phosphor/40"
            >
              {t("rp.exportCsv")}
            </a>
          )}
          {md && (
            <button
              onClick={() => downloadMd(md)}
              className="rounded-lg border border-line bg-ink-700 px-4 py-2 text-sm text-chalk hover:border-phosphor/40"
            >
              {t("rp.exportMd")}
            </button>
          )}
        </div>
      </header>

      <div className="panel animate-rise p-7" style={{ animationDelay: "60ms" }}>
        {md ? (
          <Markdown source={md} />
        ) : (
          <div className="py-16 text-center text-sm text-mist">
            {t("rp.empty")}
          </div>
        )}
      </div>
    </div>
  );
}

function downloadMd(md: string) {
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `medo-radar-daily-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Minimal Markdown renderer — headings, tables, list items, links. Enough for our reports. */
function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const out: JSX.Element[] = [];
  let table: string[][] = [];
  let key = 0;

  const flushTable = () => {
    if (!table.length) return;
    const [head, , ...body] = table; // row[1] is the |---| separator
    out.push(
      <div key={key++} className="my-4 overflow-hidden rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead className="bg-ink-700/60 text-mist">
            <tr>{head.map((h, i) => <th key={i} className="px-3 py-2 text-left font-medium">{h.trim()}</th>)}</tr>
          </thead>
          <tbody>
            {body.map((r, ri) => (
              <tr key={ri} className="border-t border-line">
                {r.map((c, ci) => <td key={ci} className="num px-3 py-2 text-chalk">{c.trim()}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    table = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("|")) {
      table.push(line.slice(1, -1).split("|"));
      continue;
    }
    flushTable();
    if (line.startsWith("# ")) out.push(<h1 key={key++} className="font-display text-2xl font-semibold text-chalk">{line.slice(2)}</h1>);
    else if (line.startsWith("## ")) out.push(<h2 key={key++} className="mt-5 border-b border-line pb-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-mist">{line.slice(3)}</h2>);
    else if (line.startsWith("- ")) out.push(<li key={key++} className="ml-4 list-disc text-sm text-chalk">{linkify(line.slice(2))}</li>);
    else if (line) out.push(<p key={key++} className="text-sm text-chalk">{linkify(line)}</p>);
  }
  flushTable();
  return <div className="space-y-1.5">{out}</div>;
}

function linkify(text: string): React.ReactNode {
  const m = text.match(/(https?:\/\/[^\s]+)/);
  if (!m) return text;
  const [before, after] = text.split(m[0]);
  return (
    <>
      {before}
      <a href={m[0]} target="_blank" rel="noreferrer" className="text-phosphor hover:underline">{m[0]}</a>
      {after}
    </>
  );
}
