"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, CloudOff, Info, X } from "lucide-react";
import { formatINR } from "@/lib/engine/money";
import { initSync, sync, useSync, type ConflictSide } from "@/lib/sync/engine";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Starts the auth/sync engine once and renders its global UI (toasts, conflict choice). */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initSync();
  }, []);
  return (
    <>
      {children}
      <SyncToast />
      <ConflictDialog />
    </>
  );
}

function SyncToast() {
  const { message } = useSync();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => sync.dismissMessage(), message.tone === "down" || message.tone === "warn" ? 9000 : 5000);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  const Icon = message.tone === "up" ? CheckCircle2 : message.tone === "down" ? CloudOff : message.tone === "warn" ? AlertTriangle : Info;
  const tone = { up: "text-up", down: "text-down", warn: "text-warn", neutral: "text-brand" }[message.tone];
  return (
    <div
      key={message.id}
      role={message.tone === "down" || message.tone === "warn" ? "alert" : "status"}
      className="fixed inset-x-4 bottom-20 z-[60] mx-auto flex max-w-md animate-fade-up items-start gap-3 rounded-xl border border-border-strong bg-surface/95 p-4 text-sm shadow-2xl shadow-black/50 backdrop-blur md:bottom-6"
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} aria-hidden />
      <p className="flex-1 text-fg/90">{message.text}</p>
      <button type="button" onClick={() => sync.dismissMessage()} className="rounded p-0.5 text-subtle hover:text-fg" aria-label="Dismiss">
        <X className="size-4" />
      </button>
    </div>
  );
}

function SideCard({ title, side, note }: { title: string; side: ConflictSide; note: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface-2/60 p-4">
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="num text-sm text-muted">
        {side.completed ? "Completed all 10 rounds" : `${side.roundsCompleted} round${side.roundsCompleted === 1 ? "" : "s"} completed`}
      </p>
      <p className="num text-sm text-muted">Portfolio {formatINR(side.valuePaise, { whole: true })}</p>
      <p className="text-xs text-subtle">{note}</p>
    </div>
  );
}

function ConflictDialog() {
  const { conflict } = useSync();
  const safeChoice = useRef<HTMLButtonElement>(null);
  return (
    <Dialog open={!!conflict}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          // Focus the non-destructive option first.
          e.preventDefault();
          safeChoice.current?.focus();
        }}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="[&>button:last-child]:hidden"
      >
        <DialogTitle>Which simulation should we keep?</DialogTitle>
        <DialogDescription>
          Your account already has a simulation, and you also played on this device before signing in. Simulations can&apos;t be combined, so choose
          one to continue. Your lesson progress has been merged automatically.
        </DialogDescription>
        {conflict && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SideCard title="Saved in your account" side={conflict.cloud} note="Currently shown." />
            <SideCard title="On this device" side={conflict.local} note="Played before signing in." />
          </div>
        )}
        <p className="mt-4 flex gap-2 text-xs text-subtle">
          <AlertTriangle className="size-3.5 shrink-0 text-warn" aria-hidden />
          If you keep this device&apos;s run, your account&apos;s run is kept as history but no longer shown. If you keep the account&apos;s run, this
          device&apos;s run is discarded.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => sync.resolveConflict("device")}>
            Keep this device&apos;s run
          </Button>
          <Button ref={safeChoice} onClick={() => sync.resolveConflict("account")}>
            Keep my account&apos;s run
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
