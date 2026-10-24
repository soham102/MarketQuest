"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  indicatorClassName,
  label,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
  label: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <ProgressPrimitive.Root
      value={v}
      aria-label={label}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-surface-3", className)}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full rounded-full bg-brand transition-[width] duration-500 ease-out", indicatorClassName)}
        style={{ width: `${v}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
