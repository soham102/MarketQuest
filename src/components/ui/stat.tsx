import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR, formatPct } from "@/lib/engine/money";

export function Stat({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-subtle [&_svg]:size-3.5">
        {icon}
        {label}
      </div>
      <div className="num truncate text-xl font-semibold tracking-tight text-fg sm:text-2xl">{value}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}

/** Signed money/percentage change with an arrow icon, so direction is never conveyed by colour alone. */
export function Delta({
  paise,
  pct,
  className,
  size = "sm",
}: {
  paise?: number;
  pct?: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const v = paise ?? pct ?? 0;
  const tone = v > 0 ? "text-up" : v < 0 ? "text-down" : "text-muted";
  const Icon = v > 0 ? ArrowUpRight : ArrowDownRight;
  let text = "";
  if (paise !== undefined) text = formatINR(paise, { signed: true });
  if (pct !== undefined) text += paise !== undefined ? ` (${formatPct(pct, { signed: true })})` : formatPct(pct, { signed: true });
  return (
    <span className={cn("num inline-flex items-center gap-0.5 font-medium", tone, size === "md" ? "text-base" : "text-sm", className)}>
      {v !== 0 && <Icon className={size === "md" ? "size-4" : "size-3.5"} aria-hidden />}
      <span className="sr-only">{v > 0 ? "up " : v < 0 ? "down " : "unchanged "}</span>
      {text}
    </span>
  );
}
