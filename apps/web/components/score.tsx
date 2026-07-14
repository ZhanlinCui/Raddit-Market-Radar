"use client";

import { ScoreBreakdown, tierColor, tierOf } from "@/lib/api";
import { useUI } from "@/components/ui-context";

/** Circular score dial. Radius chosen so circumference ≈ 100 for easy dash math. */
export function ScoreDial({ score, size = 52 }: { score: number; size?: number }) {
  const tier = tierOf(score);
  const color = tierColor[tier.key];
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, score)) / 100);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--ink-600))" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="num absolute text-sm font-semibold text-chalk">{Math.round(score)}</span>
    </div>
  );
}

export function TierBadge({ score }: { score: number }) {
  const tier = tierOf(score);
  const color = tierColor[tier.key];
  const { t } = useUI();
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{ color, backgroundColor: `${color}1a`, boxShadow: `inset 0 0 0 1px ${color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {t(`tier.${tier.key}`)}
    </span>
  );
}

/** Explainable stacked bar — every sub-score weighted contribution, hover for detail. */
export function ScoreExplain({ breakdown }: { breakdown: ScoreBreakdown }) {
  const { t } = useUI();
  if (!breakdown?.sub_scores) return null;
  const keys = Object.keys(breakdown.weighted);
  const total = breakdown.final || 1;
  return (
    <div className="space-y-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink-700">
        {keys.map((k) => {
          const w = (breakdown.weighted[k] / total) * 100;
          const hue = 150 + keys.indexOf(k) * 18;
          return (
            <div
              key={k}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${w}%`, backgroundColor: `hsl(${hue} 55% 55%)` }}
              title={`${t(`dim.${k}`)}: ${breakdown.weighted[k].toFixed(1)}`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {keys.map((k) => (
          <div key={k} className="flex items-center justify-between text-[11px]">
            <span className="text-mist">{t(`dim.${k}`)}</span>
            <span className="num text-chalk">
              {breakdown.sub_scores[k].toFixed(0)}
              <span className="text-ink-400">
                {" "}
                ×{breakdown.weights[k]} = {breakdown.weighted[k].toFixed(1)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
