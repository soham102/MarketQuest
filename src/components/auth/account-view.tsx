"use client";

import Link from "next/link";
import { BookOpen, CandlestickChart, LogIn, LogOut, RefreshCcw, Receipt, Trash2, Trophy } from "lucide-react";
import { ACHIEVEMENTS } from "@/content/achievements";
import { SIM_CONFIG } from "@/content/market";
import { AUTH_CONFIGURED } from "@/lib/supabase/config";
import { learningProgress } from "@/lib/selectors";
import { useStore } from "@/lib/store/store";
import { sync, useSync } from "@/lib/sync/engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Stat } from "@/components/ui/stat";
import { Callout, EmptyState, SectionHeading } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { Avatar, saveStatusText, useSignOut } from "./user-menu";

export function AccountView() {
  const s = useSync();
  const { state, hydrated } = useStore();
  const { signOut } = useSignOut();

  if (!AUTH_CONFIGURED) {
    return (
      <EmptyState icon={<LogIn />} title="Accounts aren't set up yet" className="mx-auto mt-10 max-w-lg">
        Sign-in hasn&apos;t been configured on this deployment. Your progress is saved in this browser.
      </EmptyState>
    );
  }
  if (s.auth === "loading" || !hydrated) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading account">
        <Skeleton className="h-20" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }
  if (s.auth !== "signed-in" || !s.user) {
    return (
      <EmptyState
        icon={<LogIn />}
        title="You're signed out"
        className="mx-auto mt-10 max-w-lg"
        action={
          <Button asChild>
            <Link href="/sign-in?next=/account">Sign in</Link>
          </Button>
        }
      >
        Sign in to see and manage your saved progress.
      </EmptyState>
    );
  }

  const status = saveStatusText(s);
  const learning = learningProgress(state);
  const sim = state.simulation;
  const name = s.user.name ?? s.user.email ?? "Your account";

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <SectionHeading as="h1" eyebrow="Account" title="Your account" description="Your MarketQuest progress is saved to this account and syncs across devices." />

      <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar name={name} url={s.user.avatarUrl} size={56} />
          <div className="min-w-0">
            {s.user.name && <p className="truncate text-lg font-semibold text-fg">{s.user.name}</p>}
            {s.user.email && <p className="truncate text-sm text-muted">{s.user.email}</p>}
            <p className="mt-1 text-xs text-subtle">Signed in with Google</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => void signOut()}>
          <LogOut /> Sign out
        </Button>
      </Card>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle as="h2">Sync status</CardTitle>
          <Button variant="secondary" size="sm" onClick={() => void sync.syncNow()} disabled={s.save === "saving" || s.save === "syncing" || s.save === "expired"}>
            <RefreshCcw /> Sync now
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p
            role="status"
            className={cn(
              "flex items-center gap-2 text-sm",
              { up: "text-up", down: "text-down", warn: "text-warn", neutral: "text-muted" }[status.tone],
            )}
          >
            {status.icon} {status.text}
          </p>
          {s.lastSavedAt && (
            <p className="text-xs text-subtle">
              Last saved at{" "}
              <time dateTime={new Date(s.lastSavedAt).toISOString()}>
                {new Date(s.lastSavedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </time>
            </p>
          )}
          {s.save === "expired" && (
            <Callout tone="warn" title="Session expired">
              Sign in again to resume saving. Anything you do meanwhile is kept on this device and synced afterwards.{" "}
              <Link href="/sign-in?next=/account" className="font-medium text-brand hover:underline">
                Sign in again
              </Link>
            </Callout>
          )}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">What&apos;s saved</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="p-5">
            <Stat label="Lessons" value={`${learning.completed} / ${learning.total}`} hint="completed" icon={<BookOpen />} />
          </Card>
          <Card className="p-5">
            <Stat
              label="Simulation"
              value={!sim ? "—" : sim.status === "completed" ? "Done" : `Round ${sim.currentRound}`}
              hint={sim ? `${sim.rounds.length} of ${SIM_CONFIG.totalRounds} rounds` : "Not started"}
              icon={<CandlestickChart />}
            />
          </Card>
          <Card className="p-5">
            <Stat label="Orders" value={sim?.transactions.length ?? 0} hint="virtual trades" icon={<Receipt />} />
          </Card>
          <Card className="p-5">
            <Stat label="Achievements" value={`${Object.keys(state.achievements).length} / ${ACHIEVEMENTS.length}`} icon={<Trophy />} />
          </Card>
        </div>
      </section>

      <Card className="flex flex-col gap-4 border-down/30 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-fg">Delete saved progress</p>
          <p className="text-sm text-muted">Erases lessons, simulations, orders and achievements from your account. Your sign-in stays.</p>
        </div>
        <ConfirmDialog
          trigger={
            <Button variant="danger">
              <Trash2 /> Delete progress
            </Button>
          }
          destructive
          title="Delete all saved progress?"
          description="This permanently removes your MarketQuest progress from your account on every device. It can't be undone."
          confirmLabel="Delete permanently"
          onConfirm={() => void sync.deleteCloudProgress()}
        />
      </Card>
    </div>
  );
}
