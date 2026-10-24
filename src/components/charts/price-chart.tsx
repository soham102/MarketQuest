"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { PricePoint } from "@/lib/types";
import { formatINR, formatPct, pctOf } from "@/lib/engine/money";
import { axisProps, TooltipCard } from "./chart-tooltip";

/**
 * Single-series price history. One series, so no legend; the title names it.
 * `markFrom` draws a dashed marker where the current round's decision point is.
 */
export function PriceChart({
  points,
  height = 180,
  markLabel,
  ariaLabel,
}: {
  points: PricePoint[];
  height?: number;
  markLabel?: string;
  ariaLabel: string;
}) {
  const data = points.map((p) => ({ label: p.label, price: p.price / 100 }));
  const first = points[0]?.price ?? 0;
  const last = points.at(-1)?.price ?? 0;
  const up = last >= first;
  const stroke = up ? "var(--up)" : "var(--down)";
  const values = data.map((d) => d.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.15, max * 0.01);

  return (
    <figure aria-label={ariaLabel} className="w-full">
      <LineChart responsive style={{ width: "100%", height }} data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
        <YAxis
          {...axisProps}
          axisLine={false}
          width={56}
          domain={[Math.floor(min - pad), Math.ceil(max + pad)]}
          tickFormatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
        />
        {markLabel && <ReferenceLine x={markLabel} stroke="var(--subtle)" strokeDasharray="4 4" />}
        <Tooltip
          cursor={{ stroke: "var(--border-strong)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as { label: string; price: number };
            const change = pctOf(Math.round(p.price * 100) - first, first);
            return (
              <TooltipCard
                title={p.label}
                rows={[
                  { label: "Price", value: formatINR(Math.round(p.price * 100)) },
                  { label: "vs first point", value: formatPct(change, { signed: true }) },
                ]}
              />
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke={stroke}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2, fill: stroke }}
          isAnimationActive={false}
        />
      </LineChart>
      <figcaption className="sr-only">
        Price moved from {formatINR(first)} to {formatINR(last)} over {points.length} points.
      </figcaption>
    </figure>
  );
}
