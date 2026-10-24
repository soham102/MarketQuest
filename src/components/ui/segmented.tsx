"use client";

import { RadioGroup } from "radix-ui";
import { cn } from "@/lib/utils";

/** Accessible segmented control (arrow keys move between options). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; activeClassName?: string }[];
  label: string;
  className?: string;
}) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(v) => onChange(v as T)}
      aria-label={label}
      orientation="horizontal"
      className={cn("flex rounded-lg border border-border bg-surface-2 p-1", className)}
    >
      {options.map((o) => (
        <RadioGroup.Item
          key={o.value}
          value={o.value}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-fg data-[state=checked]:bg-surface-3 data-[state=checked]:text-fg [&_svg]:size-4",
            value === o.value && o.activeClassName,
          )}
        >
          {o.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
