"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/** Two-panel layout: controls on one side, live results on the other. */
export function ExperimentFrame({ controls, output }: { controls: React.ReactNode; output: React.ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface-2/50 p-5">{controls}</div>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2/30 p-5" aria-live="polite">
        {output}
      </div>
    </div>
  );
}

export function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted">{label}</span>
        <span className="num text-sm font-semibold text-fg">{format(value)}</span>
      </div>
      <Slider label={label} value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

export function Readout({
  label,
  value,
  tone = "neutral",
  big = false,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "up" | "down" | "brand";
  big?: boolean;
  hint?: string;
}) {
  const tones = { neutral: "text-fg", up: "text-up", down: "text-down", brand: "text-brand" };
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wider text-subtle">{label}</span>
      <span className={cn("num font-semibold tracking-tight", big ? "text-3xl" : "text-lg", tones[tone])}>{value}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

/** Horizontal bar used for simple magnitude comparisons. Value label stays in ink colour. */
export function HBar({
  label,
  value,
  max,
  display,
  color = "var(--brand)",
  min = 0,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
  color?: string;
  min?: number;
}) {
  // Supports negative values: bar grows left/right from a zero line when min < 0.
  const span = max - min;
  const zero = ((0 - min) / span) * 100;
  const pos = ((Math.max(min, Math.min(max, value)) - min) / span) * 100;
  const left = Math.min(zero, pos);
  const width = Math.abs(pos - zero);
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[9rem_1fr_auto]">
      <span className="truncate text-muted">{label}</span>
      <div className="relative h-3 rounded-full bg-surface-3">
        {min < 0 && <div className="absolute inset-y-[-3px] w-px bg-border-strong" style={{ left: `${zero}%` }} />}
        <div
          className="absolute inset-y-0 rounded-full transition-[left,width] duration-300"
          style={{ left: `${left}%`, width: `${Math.max(width, value === 0 ? 0 : 1)}%`, background: color }}
        />
      </div>
      <span className="num w-16 text-right font-medium text-fg">{display}</span>
    </div>
  );
}

export function ModelNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-subtle">{children}</p>;
}
