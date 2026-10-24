"use client";

/** Shared tooltip shell so every chart's hover layer looks the same. Text uses ink tokens, never series colours. */
export function TooltipCard({ title, rows }: { title: string; rows: { label: string; value: string; swatch?: string }[] }) {
  return (
    <div className="min-w-36 rounded-lg border border-border-strong bg-surface/95 px-3 py-2 text-xs shadow-xl shadow-black/30 backdrop-blur">
      <p className="mb-1 font-medium text-muted">{title}</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted">
            {r.swatch && <span className="size-2 rounded-full" style={{ background: r.swatch }} aria-hidden />}
            {r.label}
          </span>
          <span className="num font-semibold text-fg">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export const axisProps = {
  stroke: "var(--subtle)",
  tick: { fill: "var(--subtle)", fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: "var(--border-strong)" },
} as const;
