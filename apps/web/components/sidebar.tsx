"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUI } from "@/components/ui-context";

const nav = [
  { href: "/", key: "nav.overview", glyph: "◎" },
  { href: "/opportunities", key: "nav.opportunities", glyph: "◆" },
  { href: "/communities", key: "nav.communities", glyph: "⬢" },
  { href: "/trends", key: "nav.trends", glyph: "◈" },
  { href: "/competitors", key: "nav.competitors", glyph: "⊚" },
  { href: "/users", key: "nav.users", glyph: "◐" },
  { href: "/setup", key: "nav.setup", glyph: "⬡" },
  { href: "/reports", key: "nav.reports", glyph: "▤" },
  { href: "/settings", key: "nav.settings", glyph: "⚙" },
];

export function Sidebar() {
  const path = usePathname();
  const { t } = useUI();
  return (
    <aside className="sticky top-0 flex h-screen w-[230px] shrink-0 flex-col border-r border-line bg-ink-800/70 px-4 py-6 backdrop-blur">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-lg border border-phosphor/40 bg-phosphor/10">
          <span className="absolute inset-0 animate-sweep bg-gradient-to-r from-transparent via-phosphor/25 to-transparent" />
          <span className="text-phosphor">◍</span>
        </div>
        <div className="leading-tight">
          <div className="font-display text-[17px] font-semibold tracking-tight text-chalk">
            MeDo Radar
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-mist">
            {t("brand.tagline")}
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-phosphor/10 text-chalk shadow-[inset_0_0_0_1px_rgb(var(--phosphor)/0.25)]"
                  : "text-mist hover:bg-ink-700 hover:text-chalk"
              }`}
            >
              <span className={`text-base ${active ? "text-phosphor" : "text-ink-400 group-hover:text-mist"}`}>
                {n.glyph}
              </span>
              {t(n.key)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-line bg-ink-700 p-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-mist">{t("brand.northStar")}</div>
        <div className="mt-1 font-display text-sm leading-snug text-chalk">
          {t("brand.northStarBody")}
        </div>
      </div>
    </aside>
  );
}
