"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloudUpload, X } from "lucide-react";
import { useStore } from "@/lib/store/store";
import { useSync } from "@/lib/sync/engine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "marketquest:v1:save-prompt-dismissed";

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Invites anonymous learners with some progress to sign in so it isn't tied to one browser. */
export function SaveProgressPrompt({ className }: { className?: string }) {
  const s = useSync();
  const { state, hydrated } = useStore();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(() => (typeof window === "undefined" ? true : readDismissed()));

  const hasProgress = Object.keys(state.concepts).length > 0 || !!state.simulation;
  if (!hydrated || s.auth !== "signed-out" || dismissed || !hasProgress) return null;

  return (
    <aside
      aria-label="Save your progress"
      className={cn("flex flex-col gap-3 rounded-2xl border border-brand/30 bg-brand/[0.07] p-4 sm:flex-row sm:items-center sm:gap-4", className)}
    >
      <CloudUpload className="hidden size-6 shrink-0 text-brand sm:block" aria-hidden />
      <div className="flex-1">
        <p className="font-medium text-fg">Your progress lives only in this browser</p>
        <p className="text-sm text-muted">Sign in with Google to save it to an account and continue on any device. Nothing you&apos;ve done will be lost.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm">
          <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`}>Save my progress</Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Dismiss"
          onClick={() => {
            setDismissed(true);
            try {
              window.localStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
          }}
        >
          <X />
        </Button>
      </div>
    </aside>
  );
}
