"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CandlestickChart, ClipboardCheck, Lock, Sparkles, Wallet } from "lucide-react";
import { ACHIEVEMENTS } from "@/content/achievements";
import { CONCEPTS, RECOMMENDED_ORDER } from "@/content/concepts";
import { SIM_CONFIG } from "@/content/market";
import { useStore } from "@/lib/store/store";
import { conceptStatus, learningProgress, nextConcept, simulationSummary } from "@/lib/selectors";
import { formatINR } from "@/lib/engine/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Delta, Stat } from "@/components/ui/stat";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/ui/misc";
import { ConceptCard } from "@/components/learn/concept-card";
import { AchievementIcon } from "@/components/achievement-icon";
import { ValueChart } from "@/components/charts/value-chart";
import { cn } from "@/lib/utils";
import { SaveProgressPrompt } from "@/components/auth/save-progress-prompt";

const STEPS = [
  { icon: BookOpen, title: "Learn a concept", text: "Short, interactive lessons — move sliders, run experiments, check your understanding." },
  { icon: CandlestickChart, title: "Simulate 10 rounds", text: "React to fictional news with ₹1,00,000 of virtual money. Buy, sell or hold." },
  { icon: ClipboardCheck, title: "Review your reasoning", text: "Every round is debriefed: what happened, why, and what you might have missed." },
];

export function HomeDashboard() {
  const { state, hydrated } = useStore();

  if (!hydrated) return <HomeSkeleton />;

  const learning = learningProgress(state);
  const sim = simulationSummary(state);
  const next = nextConcept(state);
  const isNew = learning.completed === 0 && learning.inProgress === 0 && !sim.started;
  const modules = RECOMMENDED_ORDER.map((s) => CONCEPTS.find((c) => c.slug === s)!);
  const unlocked = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).sort(
    (a, b) => state.achievements[b.id] - state.achievements[a.id],
  );
  const locked = ACHIEVEMENTS.filter((a) => !state.achievements[a.id]);
  const simHref = sim.completed ? "/simulate/report" : sim.started ? "/simulate/play" : "/simulate";
  const simLabel = sim.completed ? "View your report" : sim.started ? `Continue round ${sim.currentRound}` : "Start the simulation";

  return (
    <div className="flex flex-col gap-10 animate-fade-up">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-8 sm:px-10 sm:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand/10 blur-3xl"
        />
        <div className="relative flex max-w-2xl flex-col gap-4">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border-strong bg-surface-2 px-3 py-1 text-xs font-medium text-muted">
            <Sparkles className="size-3.5 text-brand" aria-hidden />
            {isNew ? "Welcome to MarketQuest" : "Welcome back"}
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-4xl">
            Learn how the stock market works — by making decisions, not memorising definitions.
          </h1>
          <p className="text-base text-muted sm:text-lg">
            Explore interactive lessons, then manage a virtual ₹1,00,000 portfolio through ten fictional news events. Every
            decision is reviewed on its reasoning, not just its profit.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            {next ? (
              <Button asChild size="lg">
                <Link href={`/learn/${next.slug}`}>
                  {learning.completed + learning.inProgress === 0 ? "Start with: " : "Continue: "}
                  {next.title}
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href="/learn">
                  Review lessons <ArrowRight />
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline">
              <Link href={simHref}>
                {simLabel}
                <CandlestickChart />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SaveProgressPrompt />

      {isNew && (
        <section className="flex flex-col gap-4">
          <SectionHeading title="How MarketQuest works" description="New here? Start with a lesson — or jump straight into Round 1." />
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold text-brand">
                  {i + 1}
                </span>
                <div>
                  <p className="flex items-center gap-2 font-medium text-fg">
                    <s.icon className="size-4 text-muted" aria-hidden />
                    {s.title}
                  </p>
                  <p className="mt-1 text-sm text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Progress overview */}
      <section aria-label="Your progress" data-tour="home-progress" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-5">
          <Stat label="Learning" value={`${learning.pct}%`} hint={`${learning.completed} of ${learning.total} concepts completed`} icon={<BookOpen />} />
          <Progress value={learning.pct} label="Learning progress" className="mt-3" />
        </Card>
        <Card className="p-5">
          <Stat
            label="Simulation"
            value={sim.completed ? "Done" : sim.started ? `Round ${sim.currentRound}` : "—"}
            hint={sim.started ? `${sim.roundsCompleted} of ${SIM_CONFIG.totalRounds} rounds completed` : "Not started yet"}
            icon={<CandlestickChart />}
          />
          <Progress value={(sim.roundsCompleted / SIM_CONFIG.totalRounds) * 100} label="Simulation progress" className="mt-3" />
        </Card>
        <Card className="p-5">
          <Stat label="Portfolio value" value={formatINR(sim.value, { whole: true })} hint={sim.started ? `Cash ${formatINR(sim.cash, { whole: true })}` : "Virtual starting capital"} icon={<Wallet />} />
        </Card>
        <Card className="p-5">
          <Stat
            label="Simulation P&L"
            value={<Delta paise={sim.pnl} size="md" className="text-xl sm:text-2xl" />}
            hint={sim.started ? `${sim.pnlPct >= 0 ? "+" : "−"}${Math.abs(sim.pnlPct).toFixed(2)}% vs ₹1,00,000` : "Starts at ₹0"}
          />
        </Card>
      </section>

      {state.simulation && state.simulation.valueHistory.length > 1 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Portfolio value by round</CardTitle>
            <Link href="/simulate" className="text-sm text-brand hover:underline">
              Simulation lobby
            </Link>
          </CardHeader>
          <CardContent>
            <ValueChart points={state.simulation.valueHistory} height={200} />
          </CardContent>
        </Card>
      )}

      {/* Modules */}
      <section className="flex flex-col gap-4" data-tour="home-modules">
        <SectionHeading
          title="Learning modules"
          description={`All ${CONCEPTS.length} modules, in recommended order. Each lesson takes under ten minutes.`}
          action={
            <Link href="/learn" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              Search &amp; filter by topic <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((c) => (
            <ConceptCard key={c.slug} concept={c} status={conceptStatus(state, c.slug)} />
          ))}
        </div>
      </section>

      {/* Achievements */}
      <section className="flex flex-col gap-4">
        <SectionHeading title="Achievements" description={`${unlocked.length} of ${ACHIEVEMENTS.length} unlocked`} />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...unlocked.slice(0, 4), ...locked.slice(0, Math.max(0, 4 - unlocked.slice(0, 4).length))].map((a) => {
            const isUnlocked = !!state.achievements[a.id];
            return (
              <li
                key={a.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4",
                  isUnlocked ? "border-border bg-surface" : "border-dashed border-border bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    isUnlocked ? "bg-brand/15 text-brand" : "bg-surface-2 text-subtle",
                  )}
                >
                  {isUnlocked ? <AchievementIcon icon={a.icon} className="size-5" /> : <Lock className="size-4" aria-hidden />}
                </span>
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium", isUnlocked ? "text-fg" : "text-muted")}>{a.title}</p>
                  <p className="text-xs text-subtle">{a.description}</p>
                </div>
                <span className="sr-only">{isUnlocked ? "Unlocked" : "Locked"}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-busy="true" aria-label="Loading your progress">
      <Skeleton className="h-72 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-60 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
