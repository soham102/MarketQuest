import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-border-strong bg-surface-2 px-3 text-sm text-fg placeholder:text-subtle transition-colors focus-visible:border-brand focus-visible:outline-none aria-[invalid=true]:border-down",
        className,
      )}
      {...props}
    />
  );
}
