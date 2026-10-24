"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Slider({
  className,
  label,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & { label: string }) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex h-6 w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-surface-3">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-brand" />
      </SliderPrimitive.Track>
      {(props.value ?? props.defaultValue ?? [0]).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={label}
          className="block size-5 rounded-full border-2 border-brand bg-fg shadow transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
