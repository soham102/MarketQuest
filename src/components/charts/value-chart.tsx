"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { SIM_CONFIG } from "@/content/market";
import type { ValuePoint } from "@/lib/types";
import { formatINR, formatINRCompact, formatPct, pctOf } from "@/lib/engine/money";
import { axisProps, TooltipCard } from "./chart-tooltip";

/** Portfolio value across rounds, with the ₹1,00,000 starting capital as a reference line. */
export function ValueChart({ points, height = 220 }: { points: ValuePoint[]; height?: number }) {
  const data = points.map((p) => ({ label: p.label, value: p.value / 100 }));
  const base = SIM_CONFIG.initialCapital / 100;
  const values = data.map((d) => d.value);
  const min = Math.min(base, ...values);
  const max = Math.max(base, ...values);
  const pad = Math.max((max - min) * 0.2, base * 0.01);
  const last = points.at(-1)?.value ?? SIM_CONFIG.initialCapital;
  const tone = last >= SIM_CONFIG.initialCapital ? "var(--up)" : "var(--down)";
  const gradientId = `value-fill-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <figure aria-label="Portfolio value by round" className="w-full">
      <AreaChart responsive style={{ width: "100%", height }} data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={tone} stopOpacity={0.22} />
            <stop offset="100%" stopColor={tone} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis
          {...axisProps}
          axisLine={false}
          width={60}
          domain={[Math.floor(min - pad), Math.ceil(max + pad)]}
          tickFormatter={(v: number) => formatINRCompact(v * 100)}
        />
        <ReferenceLine
          y={base}
          stroke="var(--subtle)"
          strokeDasharray="4 4"
          label={{ value: "Start ₹1L", position: "insideTopLeft", fill: "var(--subtle)", fontSize: 11 }}
        />
        <Tooltip
          cursor={{ stroke: "var(--border-strong)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as { label: string; value: number };
            const paise = Math.round(p.value * 100);
            return (
              <TooltipCard
                title={p.label === "Start" ? "Starting capital" : `After round ${p.label.slice(1)}`}
                rows={[
                  { label: "Value", value: formatINR(paise) },
                  { label: "Return", value: formatPct(pctOf(paise - SIM_CONFIG.initialCapital, SIM_CONFIG.initialCapital), { signed: true }) },
                ]}
              />
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={tone}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, fill: tone, stroke: "var(--surface)", strokeWidth: 2 }}
          activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
      <figcaption className="sr-only">
        Portfolio value went from {formatINR(SIM_CONFIG.initialCapital)} to {formatINR(last)}.
      </figcaption>
    </figure>
  );
}
