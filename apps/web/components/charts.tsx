"use client";

/** Horizontal distribution bar with label + count. Shared by trend/community/competitor. */
export function DistBar({
  label,
  value,
  max,
  color = "#38e0b0",
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-chalk">{label}</span>
        <span className="num text-mist">
          {value}
          {suffix}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/** Vertical distribution as a labeled block list (for a distribution object). */
export function Distribution({
  data,
  color,
}: {
  data: Record<string, number>;
  color?: string;
}) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  if (entries.length === 0) return <div className="py-4 text-center text-xs text-ink-400">无数据</div>;
  return (
    <div className="space-y-2.5">
      {entries.map(([k, v], i) => (
        <DistBar
          key={k}
          label={k || "Unknown"}
          value={v}
          max={max}
          color={color || `hsl(${150 + i * 22} 55% 55%)`}
        />
      ))}
    </div>
  );
}

export const CHANNEL_TIER_COLOR: Record<string, string> = {
  A: "#38e0b0",
  B: "#5b9dff",
  C: "#ffb020",
  Watchlist: "#8493ad",
  Excluded: "#5a6579",
};
