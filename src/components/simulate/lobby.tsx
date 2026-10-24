"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ClipboardList, Lock, Play, PlayCircle, RotateCcw, ScrollText, Target } from "lucide-react";
import { RISK_PROFILES, SIM_CONFIG } from "@/content/market";
import { ROUNDS } from "@/content/rounds";
import type { RiskProfileId } from "@/lib/types";
import { formatINR } from "@/lib/engine/money";
import { actions, useStore } from "@/lib/store/store";
import { simulationSummary } from "@/lib/selectors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Delta, Stat } from "@/components/ui/stat";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

const RULES = [
  `You start with ${formatINR(SIM_CONFIG.initialCapital, { whole: true })} of virtual cash. No real money is involved.`,
  "Each round brings a fictional news event. Read it, then buy, sell or hold any of eight fictional companies.",
  "Orders use whole shares and fill at the price shown. A simplified 0.10% charge applies to every order.",
  "You can't spend more cash than you have, sell shares you don't own, or short-sell.",
  "Before confirming, you state your reasoning and the main risk you see. Once confirmed, a round can't be redone.",
  "Prices then move according to a scripted, deterministic scenario — the same for everyone — and a debrief explains why.",
];

function ProfilePicker({ value, onChange, name }: { value: RiskProfileId; onChange: (v: RiskProfileId) => void; name: string }) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-3">
      <legend className="sr-only">Choose a risk profile</legend>
      {Object.values(RISK_PROFILES).map((p) => (
        <label
          key={p.id}
          className={cn(
            "flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors",
            value === p.id ? "border-brand bg-brand/10" : "border-border hover:border-border-strong hover:bg-surface-2",
          )}
        >
          <span className="flex items-center gap-2">
            <input
              type="radio"
              name={name}
              value={p.id}
              checked={value === p.id}
              onChange={() => onChange(p.id)}
              className="size-4 accent-[var(--brand)]"
            />
            <span className="font-semibold text-fg">{p.name}</span>
          </span>
          <span className="text-sm text-muted">{p.summary}</span>
          <span className="num text-xs text-subtle">
            Target {p.targetInvestedPct}% invested · sector cap {p.maxSectorPct}% · stock cap {p.maxPositionPct}%
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function Lobby() {
  const { state, hydrated } = useStore();
  const router = useRouter();
  const [profile, setProfile] = useState<RiskProfileId>("balanced");
  const [restartProfile, setRestartProfile] = useState<RiskProfileId | null>(null);

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading simulation lobby">
        <Skeleton className="h-28" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const sim = state.simulation;
  const summary = simulationSummary(state);
  const currentProfile = sim?.profile ?? "balanced";

  const start = () => {
    actions.startSimulation(profile);
    router.push("/simulate/play");
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <SectionHeading
        as="h1"
        eyebrow="Simulation"
        title="Ten rounds. ₹1,00,000. Your decisions."
        description="React to ten fictional news events with virtual money. Each round is followed by a debrief that judges your reasoning separately from your profit."
      />

      {!sim ? (
        <Card data-tour="lobby-start">
          <CardHeader>
            <CardTitle as="h2">1. Choose your risk profile</CardTitle>
            <CardDescription>
              Your profile sets the limits your decisions are compared against — how much to invest and how concentrated to be. It doesn&apos;t change the
              scenarios.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <ProfilePicker value={profile} onChange={setProfile} name="profile-start" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                Starting capital: <span className="num font-semibold text-fg">{formatINR(SIM_CONFIG.initialCapital, { whole: true })}</span> virtual cash
              </p>
              <Button size="lg" onClick={start}>
                <Play /> Start the simulation
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex flex-col gap-6 p-5 sm:p-6" data-tour="lobby-start">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge tone={sim.status === "completed" ? "up" : "brand"}>{sim.status === "completed" ? "Completed" : "In progress"}</Badge>
              <Badge>{RISK_PROFILES[sim.profile].name} profile</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <ConfirmDialog
                open={restartProfile !== null}
                onOpenChange={(o) => setRestartProfile(o ? currentProfile : null)}
                trigger={
                  <Button variant="danger">
                    <RotateCcw /> Restart
                  </Button>
                }
                destructive
                title="Restart the simulation?"
                confirmLabel="Erase progress & restart"
                onConfirm={() => {
                  actions.restartSimulation(restartProfile ?? currentProfile);
                  setRestartProfile(null);
                  router.push("/simulate/play");
                }}
                description={
                  <div className="flex flex-col gap-4">
                    <p>
                      This permanently erases your current portfolio, trades and {summary.roundsCompleted} completed round
                      {summary.roundsCompleted === 1 ? "" : "s"}. Your lesson progress is kept.
                    </p>
                    <ProfilePicker value={restartProfile ?? currentProfile} onChange={setRestartProfile} name="profile-restart" />
                  </div>
                }
              />
              {sim.status === "completed" ? (
                <Button asChild>
                  <Link href="/simulate/report">
                    <ClipboardList /> View report
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/simulate/play">
                    <PlayCircle /> Resume round {sim.currentRound}
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Rounds done" value={`${summary.roundsCompleted} / ${SIM_CONFIG.totalRounds}`} />
            <Stat label="Current round" value={sim.status === "completed" ? "—" : sim.currentRound} hint={sim.phase === "debrief" && sim.status !== "completed" ? "Debrief pending" : undefined} />
            <Stat label="Starting capital" value={formatINR(SIM_CONFIG.initialCapital, { whole: true })} />
            <Stat label="Cash" value={formatINR(summary.cash, { whole: true })} />
            <Stat label="Portfolio value" value={formatINR(summary.value, { whole: true })} hint={<Delta paise={summary.pnl} className="text-xs" />} />
          </div>
          <Progress value={(summary.roundsCompleted / SIM_CONFIG.totalRounds) * 100} label="Rounds completed" />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" data-tour="lobby-rounds">
          <CardHeader>
            <CardTitle as="h2">The ten rounds</CardTitle>
            <CardDescription>Each round isolates one idea. Completed rounds can be reviewed at any time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2">
              {ROUNDS.map((r) => {
                const done = sim?.rounds.some((x) => x.round === r.id);
                const current = sim && sim.status !== "completed" && sim.currentRound === r.id;
                const body = (
                  <>
                    <span
                      className={cn(
                        "num flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        done ? "bg-up/15 text-up" : current ? "bg-brand/20 text-brand" : "bg-surface-2 text-subtle",
                      )}
                    >
                      {done ? <CheckCircle2 className="size-4" aria-label="Completed" /> : r.id}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-fg">{r.title}</span>
                      <span className="block truncate text-xs text-subtle">{r.concepts.join(" · ")}</span>
                    </span>
                    {done ? (
                      <span className="flex items-center gap-1 text-xs text-brand">
                        Review <ArrowRight className="size-3.5" aria-hidden />
                      </span>
                    ) : current ? (
                      <Badge tone="brand">Current</Badge>
                    ) : (
                      <Lock className="size-4 text-subtle" aria-label="Locked" />
                    )}
                  </>
                );
                return (
                  <li key={r.id}>
                    {done ? (
                      <Link href={`/simulate/review/${r.id}`} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-surface-2">
                        {body}
                      </Link>
                    ) : current ? (
                      <Link href="/simulate/play" className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand/5 px-3 py-2.5 transition-colors hover:bg-brand/10">
                        {body}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 opacity-75">{body}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card data-tour="lobby-rules">
            <CardHeader>
              <CardTitle as="h2" className="flex items-center gap-2">
                <ScrollText className="size-4 text-brand" aria-hidden /> Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2.5 text-sm text-fg/85">
                {RULES.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle as="h2" className="flex items-center gap-2">
                <Target className="size-4 text-brand" aria-hidden /> What you&apos;ll practise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-sm text-fg/85">
                {[
                  "Reading news for what it changes about future profits",
                  "Sizing positions so one mistake can't sink you",
                  "Telling verified facts from speculation",
                  "Separating good decisions from lucky outcomes",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-up" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-subtle">
                Simulated performance doesn&apos;t predict real-world results. This is education, not investment advice.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
