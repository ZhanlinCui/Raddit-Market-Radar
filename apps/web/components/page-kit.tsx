"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUI } from "@/components/ui-context";

/** The MVP is single-project; every analytics page targets the first project. */
export function useActiveProject() {
  const { data } = useQuery({ queryKey: ["projects"], queryFn: api.projects });
  return { project: data?.[0], pid: data?.[0]?.id };
}

export function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <header className="animate-rise">
      <h1 className="font-display text-[26px] font-semibold tracking-tight text-chalk">{title}</h1>
      <p className="mt-1 text-sm text-mist">{sub}</p>
    </header>
  );
}

export function NoProject() {
  const { t } = useUI();
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <div className="font-display text-2xl text-chalk">{t("common.noProjectTitle")}</div>
      <p className="mt-2 text-sm text-mist">{t("common.noProjectBody")}</p>
      <a
        href="/setup"
        className="mt-6 inline-flex rounded-lg bg-phosphor px-4 py-2 text-sm font-semibold text-ink-900 hover:brightness-110"
      >
        {t("common.goSetup")}
      </a>
    </div>
  );
}

export function Panel({
  title,
  children,
  delay = 0,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <section className={`panel animate-rise p-5 ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {title && (
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-mist">{title}</h2>
      )}
      {children}
    </section>
  );
}
