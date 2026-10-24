"use client";

import { Pie, PieChart, Tooltip } from "recharts";
import { SECTOR_COLORS, SECTORS } from "@/content/market";
import type { AllocationSlice } from "@/lib/engine/portfolio";
import { formatINR, formatPct } from "@/lib/engine/money";
import { TooltipCard } from "./chart-tooltip";

const nameOf = (id: AllocationSlice["id"]) => (id === "cash" ? "Cash" : SECTORS[id].name);

/** Sector allocation donut with a legend table (identity is never colour-alone). */
export function AllocationChart({ slices, size = 168 }: { slices: AllocationSlice[]; size?: number }) {
  const data = slices
    .filter((s) => s.value > 0)
    .map((s) => ({ name: nameOf(s.id), value: s.value, pct: s.pct, fill: SECTOR_COLORS[s.id] }));

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <figure aria-label="Sector allocation" className="shrink-0" style={{ width: size, height: size }}>
        <PieChart width={size} height={size}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={size * 0.32}
            outerRadius={size * 0.48}
            stroke="var(--surface)"
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof data)[number];
              return (
                <TooltipCard
                  title={p.name}
                  rows={[
                    { label: "Value", value: formatINR(p.value) },
                    { label: "Weight", value: formatPct(p.pct, { digits: 1 }) },
                  ]}
                />
              );
            }}
          />
        </PieChart>
      </figure>
      <table className="w-full text-sm">
        <caption className="sr-only">Allocation by sector</caption>
        <thead className="sr-only">
          <tr>
            <th>Sector</th>
            <th>Weight</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.name} className="border-b border-border/60 last:border-0">
              <td className="py-1.5">
                <span className="flex items-center gap-2 text-muted">
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: d.fill }} aria-hidden />
                  {d.name}
                </span>
              </td>
              <td className="num py-1.5 text-right font-medium text-fg">{formatPct(d.pct, { digits: 1 })}</td>
              <td className="num hidden py-1.5 pl-3 text-right text-muted sm:table-cell">{formatINR(d.value, { whole: true })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
