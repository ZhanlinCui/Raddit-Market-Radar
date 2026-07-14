"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Locale, translate } from "@/lib/i18n";

type Theme = "light" | "dark";

interface UICtx {
  theme: Theme;
  locale: Locale;
  toggleTheme: () => void;
  toggleLocale: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<UICtx | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [locale, setLocale] = useState<Locale>("zh");

  // Load persisted prefs on mount. URL params (?lang=en&theme=dark) win, for shareable links.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qpTheme = params.get("theme") as Theme | null;
    const qpLang = params.get("lang") as Locale | null;
    const t = qpTheme || (localStorage.getItem("ui.theme") as Theme) || "light";
    const l = qpLang || (localStorage.getItem("ui.locale") as Locale) || "zh";
    setTheme(t === "dark" ? "dark" : "light");
    setLocale(l === "en" ? "en" : "zh");
  }, []);

  // Reflect theme + lang on <html>.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ui.theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
    localStorage.setItem("ui.locale", locale);
  }, [locale]);

  const toggleTheme = () => setTheme((v) => (v === "light" ? "dark" : "light"));
  const toggleLocale = () => setLocale((v) => (v === "zh" ? "en" : "zh"));
  const t = (key: string, vars?: Record<string, string | number>) => translate(key, locale, vars);

  return (
    <Ctx.Provider value={{ theme, locale, toggleTheme, toggleLocale, t }}>{children}</Ctx.Provider>
  );
}

export function useUI(): UICtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
