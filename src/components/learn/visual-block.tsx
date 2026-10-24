"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { VisualBlock } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const toneText = { neutral: "text-fg", up: "text-up", down: "text-down" } as const;
const toneRing = { neutral: "border-brand", up: "border-up", down: "border-down" } as const;

/** Data-driven visual explanations: step-through flows, comparisons and bar charts. */
export function VisualBlockView({ block }: { block: VisualBlock }) {
  if (block.kind === "flow") return <FlowVisual block={block} />;
  if (block.kind === "compare") return <CompareVisual block={block} />;
  return <BarsVisual block={block} />;
}

function FlowVisual({ block }: { block: Extract<VisualBlock, { kind: "flow" }> }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setActive((a) => {
        if (a >= block.steps.length - 1) {
          setPlaying(false);
          return a;
        }
        return a + 1;
      });
    }, 1600);
    return () => clearInterval(t);
  }, [playing, block.steps.length]);

  const step = block.steps[active];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium text-fg">{block.title}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!playing && active === block.steps.length - 1) setActive(0);
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause /> : <Play />}
          {playing ? "Pause" : "Play"}
        </Button>
      </div>
      <ol className="flex flex-col gap-2 md:flex-row md:items-stretch md:gap-0" aria-label={block.title}>
        {block.steps.map((s, i) => {
          const tone = s.tone ?? "neutral";
          return (
            <li key={s.label} className="flex flex-1 items-center md:flex-col md:items-stretch">
              <button
                type="button"
                aria-current={i === active ? "step" : undefined}
                onClick={() => {
                  setPlaying(false);
                  setActive(i);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition-all md:h-full md:flex-col md:items-start",
                  i === active ? cn("bg-surface-3", toneRing[tone]) : i < active ? "border-border bg-surface-2" : "border-border bg-transparent opacity-60 hover:opacity-100",
                )}
              >
                <span className="num flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs text-muted">{i + 1}</span>
                <span className={cn("font-medium", i <= active ? toneText[tone] : "text-muted")}>{s.label}</span>
              </button>
              {i < block.steps.length - 1 && (
                <span aria-hidden className="hidden px-1 text-subtle md:block md:self-center">
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div key={active} className="animate-fade-up rounded-xl border border-border bg-surface-2/60 p-4" aria-live="polite">
        <p className="text-xs uppercase tracking-wider text-subtle">
          Step {active + 1} of {block.steps.length}
        </p>
        <p className={cn("mt-1 text-base", toneText[step.tone ?? "neutral"])}>{step.detail}</p>
      </div>
    </div>
  );
}

function CompareVisual({ block }: { block: Extract<VisualBlock, { kind: "compare" }> }) {
  const [focus, setFocus] = useState<"left" | "right" | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-fg">{block.title}</h3>
      <p className="text-sm text-muted">Select a side to focus on it.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["left", "right"] as const).map((side) => {
          const col = block[side];
          const tone = col.tone ?? "neutral";
          return (
            <button
              key={side}
              type="button"
              aria-pressed={focus === side}
              onClick={() => setFocus(focus === side ? null : side)}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-5 text-left transition-all",
                focus === side ? cn("bg-surface-3", toneRing[tone]) : "border-border bg-surface-2/50 hover:border-border-strong",
                focus && focus !== side && "opacity-50",
              )}
            >
              <span className={cn("text-base font-semibold", toneText[tone])}>{col.title}</span>
              <ul className="flex flex-col gap-2 text-sm text-fg/85">
                {col.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-subtle" />
                    {p}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BarsVisual({ block }: { block: Extract<VisualBlock, { kind: "bars" }> }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...block.bars.map((b) => b.value));
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-fg">{block.title}</h3>
      <ul className="flex flex-col gap-2">
        {block.bars.map((b, i) => (
          <li key={b.label}>
            <button
              type="button"
              onClick={() => setActive(active === i ? null : i)}
              onMouseEnter={() => setActive(i)}
              aria-expanded={active === i}
              className="grid w-full grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2 sm:grid-cols-[10rem_1fr_auto]"
            >
              <span className="truncate text-muted">{b.label}</span>
              <span className="relative h-3.5 rounded-full bg-surface-3">
                <span
                  className={cn("absolute inset-y-0 left-0 rounded-full transition-colors", active === i ? "bg-brand" : "bg-brand/55")}
                  style={{ width: `${(b.value / max) * 100}%` }}
                />
              </span>
              <span className="num w-14 text-right font-medium text-fg">{b.value}</span>
            </button>
            {active === i && <p className="px-2 pb-1 text-xs text-muted">{b.note}</p>}
          </li>
        ))}
      </ul>
      <p className="text-xs text-subtle">Unit: {block.unit}. Hover or tap a bar for context.</p>
    </div>
  );
}
