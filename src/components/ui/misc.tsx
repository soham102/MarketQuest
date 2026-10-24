import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong px-6 py-8 text-center",
        className,
      )}
    >
      <div className="mb-1 rounded-full bg-surface-2 p-3 text-muted [&_svg]:size-5">{icon}</div>
      <p className="font-medium text-fg">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex flex-col gap-1">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>}
        <Tag className={cn("font-semibold tracking-tight text-fg", Tag === "h1" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl")}>
          {title}
        </Tag>
        {description && <p className="max-w-2xl text-sm text-muted sm:text-base">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Inline callout for notes, disclaimers and assumptions. */
export function Callout({
  icon,
  title,
  children,
  tone = "neutral",
  className,
}: {
  icon?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "warn" | "up" | "down";
  className?: string;
}) {
  const tones = {
    neutral: "border-border bg-surface-2 text-muted",
    brand: "border-brand/25 bg-brand/[0.07] text-fg/90",
    warn: "border-warn/25 bg-warn/[0.07] text-fg/90",
    up: "border-up/25 bg-up/[0.07] text-fg/90",
    down: "border-down/25 bg-down/[0.07] text-fg/90",
  } as const;
  const iconTones = { neutral: "text-muted", brand: "text-brand", warn: "text-warn", up: "text-up", down: "text-down" } as const;
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4 text-sm", tones[tone], className)}>
      {icon && <div className={cn("mt-0.5 shrink-0 [&_svg]:size-4", iconTones[tone])}>{icon}</div>}
      <div className="flex flex-col gap-1">
        {title && <p className="font-medium text-fg">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
