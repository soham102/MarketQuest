"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Info,
  Lock,
  Medal,
  RotateCcw,
  Route,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { CONCEPTS } from "@/content/concepts";
import { RISK_PROFILES, SIM_CONFIG } from "@/content/market";
import { getRound } from "@/content/rounds";
import { bandFor } from "@/content/scoring";
import { assessLearning } from "@/lib/engine/assessment";
import { formatINR, formatPct, pctOf } from "@/lib/engine/money";
import { portfolioValue, sectorAllocation, totalPnl, totalReturnPct, unrealizedPnl } from "@/lib/engine/portfolio";
import { conceptEvidence, conceptsToRevise, extremeRounds, learningPath, roundChange, strongestConcepts } from "@/lib/report";
import { learningProgress } from "@/lib/selectors";
import { actions, useStore } from "@/lib/store/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Delta, Stat } from "@/components/ui/stat";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout, EmptyState, SectionHeading } from "@/components/ui/misc";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { ValueChart } from "@/components/charts/value-chart";
import { cn } from "@/lib/utils";
import { SaveProgressPrompt } from "@/components/auth/save-progress-prompt";
import { VERDICTS } from "./debrief";
import { HoldingsTable } from "./portfolio-bits";

export function Report() {
  const { state, hydrated } = useStore();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading report">
        <Skeleton className="h-24" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const sim = state.simulation;
  if (!sim || sim.status !== "completed") {
    const done = sim?.rounds.length ?? 0;
    return (
      <div className="flex flex-col gap-8 animate-fade-up">
        <SectionHeading as="h1" eyebrow="Report" title="Your final report" />
        <EmptyState
          icon={<Lock />}
          title="Your report unlocks after Round 10"
          className="mx-auto max-w-lg"
          action={
            <Button asChild>
              <Link href={sim ? "/simulate/play" : "/simulate"}>{sim ? `Continue round ${sim.currentRound}` : "Start the simulation"}</Link>
            </Button>
          }
        >
          <p>
            {done} of {SIM_CONFIG.totalRounds} rounds completed.
          </p>
          <Progress value={(done / SIM_CONFIG.totalRounds) * 100} label="Rounds completed" className="mt-3" />
        </EmptyState>
      </div>
    );
  }

  const value = portfolioValue(sim, sim.prices);
  const pnl = totalPnl(sim, sim.prices);
  const { dimensions, overall } = assessLearning(sim, state.concepts);
  const evidence = conceptEvidence(state);
  const strongest = strongestConcepts(evidence);
  const revise = conceptsToRevise(evidence);
  const path = learningPath(state);
  const { best, worst } = extremeRounds(sim.rounds);
  const learning = learningProgress(state);
  const checksCorrect = sim.rounds.filter((r) => r.scores.comprehension === 100).length;

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <SectionHeading
        as="h1"
        eyebrow="Final report"
        title="Your MarketQuest results"
        description={`Ten rounds completed on the ${RISK_PROFILES[sim.profile].name} profile. Performance and learning are reported separately — on purpose.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/simulate/review/1">
                <ClipboardList /> Review rounds
              </Link>
            </Button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              trigger={
                <Button variant="danger">
                  <RotateCcw /> Restart
                </Button>
              }
              destructive
              title="Start a new simulation?"
              description={`This erases this simulation and its report. You'll start again with ₹1,00,000 on the ${RISK_PROFILES[sim.profile].name} profile; lesson progress is kept.`}
              confirmLabel="Erase & restart"
              onConfirm={() => {
                actions.restartSimulation(sim.profile);
                router.push("/simulate/play");
              }}
            />
          </div>
        }
      />

      <Callout tone="warn" icon={<Info />} title="Simulation results are not a forecast">
        These results come from ten simplified, fictional scenarios. They do not predict how you, or any real investment, would perform. Doing well here does
        not guarantee real-world investing success.
      </Callout>

      <SaveProgressPrompt />

      {/* Financial performance */}
      <section aria-labelledby="perf-heading" className="flex flex-col gap-4" data-tour="report-performance">
        <h2 id="perf-heading" className="text-lg font-semibold tracking-tight">
          Financial performance
        </h2>
        <Card className="grid grid-cols-2 gap-5 p-5 sm:p-6 lg:grid-cols-4">
          <Stat label="Starting capital" value={formatINR(SIM_CONFIG.initialCapital, { whole: true })} />
          <Stat label="Final value" value={formatINR(value)} />
          <Stat label="Absolute return" value={<Delta paise={pnl} size="md" className="text-lg sm:text-xl" />} />
          <Stat label="Percentage return" value={<Delta pct={totalReturnPct(sim, sim.prices)} size="md" className="text-lg sm:text-xl" />} />
          <Stat label="Realised P&L" value={<Delta paise={sim.realizedPnl} />} />
          <Stat label="Unrealised P&L" value={<Delta paise={unrealizedPnl(sim, sim.prices)} />} />
          <Stat label="Charges paid" value={formatINR(sim.charges)} />
          <Stat label="Orders placed" value={sim.transactions.length} />
        </Card>
        <p className="num text-xs text-subtle">
          Check: realised {formatINR(sim.realizedPnl, { signed: true })} + unrealised {formatINR(unrealizedPnl(sim, sim.prices), { signed: true })} − charges{" "}
          {formatINR(sim.charges)} = {formatINR(pnl, { signed: true })}
        </p>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle as="h3">Portfolio value across rounds</CardTitle>
            </CardHeader>
            <CardContent>
              <ValueChart points={sim.valueHistory} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle as="h3">Final sector allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <AllocationChart slices={sectorAllocation(sim, sim.prices)} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {best && (
            <ExtremeCard icon={<TrendingUp />} label="Largest simulated gain" round={best.round} change={roundChange(best)} base={best.valueStart} />
          )}
          {worst && (
            <ExtremeCard icon={<TrendingDown />} label="Largest simulated loss" round={worst.round} change={roundChange(worst)} base={worst.valueStart} />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle as="h3">Final holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <HoldingsTable sim={sim} />
          </CardContent>
        </Card>
      </section>

      {/* Learning */}
      <section aria-labelledby="learning-heading" className="flex flex-col gap-4" data-tour="report-learning">
        <h2 id="learning-heading" className="text-lg font-semibold tracking-tight">
          Learning assessment
        </h2>
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle as="h3">Five learning dimensions</CardTitle>
              <CardDescription>None of these use profit. Each is scored from an explicit rubric; tap a dimension to see how.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {dimensions.map((d) => {
                const band = d.score !== null ? bandFor(d.score) : null;
                return (
                  <details key={d.id} className="group">
                    <summary className="flex cursor-pointer list-none flex-col gap-2 [&::-webkit-details-marker]:hidden">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-fg underline-offset-4 group-hover:underline">{d.name}</span>
                        <span className="flex items-center gap-2">
                          {band && <Badge tone={band.tone === "neutral" ? "warn" : band.tone}>{band.label}</Badge>}
                          <span className="num w-12 text-right text-sm font-semibold text-fg">{d.score ?? "—"}</span>
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-surface-3">
                        <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${d.score ?? 0}%` }} />
                      </div>
                    </summary>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {d.description} Based on {d.samples} observation{d.samples === 1 ? "" : "s"}.
                    </p>
                  </details>
                );
              })}
              <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-2 p-4">
                <span className="text-sm text-muted">Overall learning score (average of scored dimensions)</span>
                <span className="num text-2xl font-semibold text-fg">{overall ?? "—"}</span>
              </div>
              <p className="text-xs text-subtle">
                Ten simulated decisions are a small sample. Treat these scores as feedback on this exercise, not as a measure of investing skill.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card className="p-5">
              <Stat label="Lessons completed" value={`${learning.completed} / ${learning.total}`} hint={`${CONCEPTS.length - learning.completed} remaining`} icon={<BookOpen />} />
              <Progress value={learning.pct} label="Lessons completed" className="mt-3" />
              <div className="mt-5">
                <Stat label="Debrief checks correct" value={`${checksCorrect} / ${SIM_CONFIG.totalRounds}`} />
              </div>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle as="h3" className="flex items-center gap-2">
                  <Medal className="size-4 text-up" aria-hidden /> Strongest concepts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {strongest.length ? (
                  <ul className="flex flex-col gap-2">
                    {strongest.slice(0, 5).map((e) => (
                      <li key={e.slug} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2 text-fg">
                          <CheckCircle2 className="size-4 text-up" aria-hidden /> {e.title}
                        </span>
                        <span className="num text-xs text-subtle">
                          {e.correct}/{e.total}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Answer at least two questions on a concept (lesson + debrief) without a miss to see it here.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle as="h3" className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-warn" aria-hidden /> Concepts to revise
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revise.length ? (
                  <ul className="flex flex-col gap-2">
                    {revise.map((e) => (
                      <li key={e.slug} className="flex items-center justify-between gap-2 text-sm">
                        <Link href={`/learn/${e.slug}`} className="flex items-center gap-2 text-fg hover:text-brand">
                          <XCircle className="size-4 text-warn" aria-hidden /> {e.title}
                        </Link>
                        <span className="num text-xs text-subtle">
                          {e.correct}/{e.total}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No incorrect answers recorded — nicely done.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card data-tour="report-path">
          <CardHeader>
            <CardTitle as="h3" className="flex items-center gap-2">
              <Route className="size-4 text-brand" aria-hidden /> Your personalised learning path
            </CardTitle>
            <CardDescription>Built from your incorrect knowledge-check answers, then from rounds where your decision carried high risk.</CardDescription>
          </CardHeader>
          <CardContent>
            {path.length ? (
              <ol className="flex flex-col gap-3">
                {path.map((p, i) => (
                  <li key={p.slug} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
                    <span className="num flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold text-brand">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-fg">{p.title}</p>
                      <p className="text-sm text-muted">{p.reason}</p>
                    </div>
                    <Button asChild variant={p.completed ? "outline" : "primary"} size="sm">
                      <Link href={`/learn/${p.slug}`}>
                        {p.completed ? "Revisit lesson" : "Start lesson"} <ArrowRight />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">
                No gaps detected from your answers or decisions. Explore the{" "}
                <Link href="/learn" className="text-brand hover:underline">
                  concept library
                </Link>{" "}
                for lessons you haven&apos;t opened yet.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Round by round */}
      <section aria-labelledby="rounds-heading" className="flex flex-col gap-4">
        <h2 id="rounds-heading" className="text-lg font-semibold tracking-tight">
          Round by round
        </h2>
        <Card className="p-2 sm:p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Summary of each round</caption>
              <thead>
                <tr className="text-left text-xs text-subtle">
                  <th className="px-2 pb-2 font-medium">Round</th>
                  <th className="px-2 pb-2 font-medium">Your decision</th>
                  <th className="px-2 pb-2 font-medium">Reasoning</th>
                  <th className="px-2 pb-2 text-right font-medium">Round P&amp;L</th>
                  <th className="px-2 pb-2 text-center font-medium">Check</th>
                  <th className="px-2 pb-2" />
                </tr>
              </thead>
              <tbody>
                {sim.rounds.map((r) => {
                  const round = getRound(r.round);
                  const p = round.paths.find((x) => x.id === r.pathId)!;
                  const v = VERDICTS[p.verdict];
                  return (
                    <tr key={r.round} className="border-t border-border/60">
                      <td className="px-2 py-2.5">
                        <span className="num text-subtle">{r.round}.</span> <span className="text-fg">{round.title}</span>
                      </td>
                      <td className="px-2 py-2.5 text-muted">{p.label}</td>
                      <td className="px-2 py-2.5">
                        <Badge tone={v.tone}>{v.label}</Badge>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <Delta paise={roundChange(r)} />
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        {r.scores.comprehension === 100 ? (
                          <CheckCircle2 className="mx-auto size-4 text-up" aria-label="Correct" />
                        ) : (
                          <XCircle className="mx-auto size-4 text-down" aria-label="Incorrect" />
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <Link href={`/simulate/review/${r.round}`} className="text-brand hover:underline">
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}

function ExtremeCard({ icon, label, round, change, base }: { icon: React.ReactNode; label: string; round: number; change: number; base: number }) {
  const r = getRound(round);
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5", change >= 0 ? "bg-up/15 text-up" : "bg-down/15 text-down")}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-subtle">{label}</p>
        <p className="truncate font-medium text-fg">
          Round {round}: {r.title}
        </p>
      </div>
      <div className="text-right">
        <Delta paise={change} />
        <p className="num text-xs text-subtle">{formatPct(pctOf(change, base), { signed: true })}</p>
      </div>
    </Card>
  );
}
