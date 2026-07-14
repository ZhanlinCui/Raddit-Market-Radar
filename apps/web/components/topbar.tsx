"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUI } from "@/components/ui-context";

export function Topbar() {
  const { data: status } = useQuery({ queryKey: ["status"], queryFn: api.status });
  const { theme, locale, toggleTheme, toggleLocale, t } = useUI();
  const mock = status?.source_mode === "mock";

  return (
    <header className="sticky top-0 z-10 flex h-[60px] items-center justify-between border-b border-line bg-ink-900/70 px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="font-display text-[15px] text-chalk">{t("top.title")}</span>
        <span className="h-4 w-px bg-line" />
        <span className="text-xs text-mist">{t("top.subtitle")}</span>
      </div>

      <div className="flex items-center gap-2.5">
        {status && (
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium ${
              mock
                ? "border-qualified/40 bg-qualified/10 text-qualified"
                : "border-insight/40 bg-insight/10 text-insight"
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${mock ? "bg-qualified" : "bg-insight"}`} />
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${mock ? "bg-qualified" : "bg-insight"}`} />
            </span>
            {mock ? "MOCK MODE" : "LIVE"} · src:{status.source_mode} · llm:{status.llm_mode}
          </div>
        )}

        <button
          onClick={toggleLocale}
          className="rounded-md border border-line bg-ink-700 px-2.5 py-1 text-[12px] font-medium text-mist transition-colors hover:text-chalk"
          title="Switch language"
        >
          {locale === "zh" ? "中 / EN" : "EN / 中"}
        </button>
        <button
          onClick={toggleTheme}
          className="grid h-7 w-7 place-items-center rounded-md border border-line bg-ink-700 text-mist transition-colors hover:text-chalk"
          title="Toggle theme"
        >
          {theme === "light" ? "☾" : "☀"}
        </button>
      </div>
    </header>
  );
}
