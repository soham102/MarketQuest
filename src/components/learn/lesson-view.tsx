"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CandlestickChart,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FlaskConical,
  HelpCircle,
  Lightbulb,
  PartyPopper,
  Target,
} from "lucide-react";
import { CATEGORIES, CONCEPT_MAP } from "@/content/concepts";
import { getRound } from "@/content/rounds";
import type { ConceptModule } from "@/lib/types";
import { actions, useStore } from "@/lib/store/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { EXPERIMENTS } from "./experiments";
import { KnowledgeCheck } from "./knowledge-check";
import { VisualBlockView } from "./visual-block";

const STEPS = [
  { id: "intro", label: "Introduction", icon: BookOpen },
  { id: "visual", label: "Visual explanation", icon: Eye },
  { id: "example", label: "Worked example", icon: Lightbulb },
  { id: "experiment", label: "Experiment", icon: FlaskConical },
  { id: "check", label: "Knowledge check", icon: HelpCircle },
  { id: "apply", label: "Apply it", icon: Target },
  { id: "done", label: "Complete", icon: PartyPopper },
] as const;

export function LessonView({ concept }: { concept: ConceptModule }) {
  const { state, hydrated } = useStore();
  const progress = state.concepts[concept.slug];

  useEffect(() => {
    actions.openConcept(concept.slug);
  }, [concept.slug]);

  if (!hydrated || !progress) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading lesson">
        <Skeleton className="h-24" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const step = Math.min(progress.step, STEPS.length - 1);
  const answeredAll = concept.quiz.every((q) => progress.quiz[q.id]);
  const canAdvance = STEPS[step].id !== "check" || answeredAll;

  const go = (next: number) => {
    if (next === STEPS.length - 1) actions.completeConcept(concept.slug);
    actions.setConceptStep(concept.slug, next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const category = CATEGORIES.find((c) => c.id === concept.category);

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted">
        <Link href="/learn" className="hover:text-fg">
          Learn
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span>{category?.name}</span>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{concept.difficulty}</Badge>
          <Badge>
            <Clock aria-hidden /> {concept.minutes} min
          </Badge>
          {progress.status === "completed" && (
            <Badge tone="up">
              <CheckCircle2 aria-hidden /> Completed
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{concept.title}</h1>
        <p className="max-w-2xl text-muted">{concept.summary}</p>
      </header>

      <div className="flex flex-col gap-2" data-tour="lesson-progress">
        <div className="flex items-center justify-between text-xs text-subtle">
          <span>
            Step {step + 1} of {STEPS.length}: <span className="text-fg">{STEPS[step].label}</span>
          </span>
          <span className="num">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} label="Lesson progress" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <ol className="hidden flex-col gap-1 lg:flex" aria-label="Lesson steps">
          {STEPS.map((s, i) => {
            const reachable = i <= step || progress.status === "completed";
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!reachable}
                  aria-current={i === step ? "step" : undefined}
                  onClick={() => go(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    i === step ? "bg-surface-2 text-fg" : reachable ? "text-muted hover:bg-surface-2/60 hover:text-fg" : "text-subtle/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                      i < step || progress.status === "completed" ? "border-up/40 bg-up/10 text-up" : i === step ? "border-brand text-brand" : "border-border",
                    )}
                  >
                    {i < step || (progress.status === "completed" && i !== step) ? <Check className="size-3.5" aria-hidden /> : i + 1}
                  </span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>

        <Card className="flex min-w-0 flex-col p-5 sm:p-7" data-tour="lesson-content">
          <div key={step} className="flex animate-fade-up flex-col gap-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              {(() => {
                const Icon = STEPS[step].icon;
                return <Icon className="size-5 text-brand" aria-hidden />;
              })()}
              {STEPS[step].label}
            </h2>
            <StepBody concept={concept} stepId={STEPS[step].id} />
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
            <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              <ArrowLeft /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <div className="flex items-center gap-3">
                {!canAdvance && <span className="hidden text-xs text-subtle sm:inline">Answer all questions to continue</span>}
                <Button onClick={() => go(step + 1)} disabled={!canAdvance} data-tour="lesson-next">
                  {step === STEPS.length - 2 ? "Finish lesson" : "Next"} <ArrowRight />
                </Button>
              </div>
            ) : (
              <Button asChild variant="outline">
                <Link href="/learn">Back to library</Link>
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StepBody({ concept, stepId }: { concept: ConceptModule; stepId: (typeof STEPS)[number]["id"] }) {
  switch (stepId) {
    case "intro":
      return <IntroStep concept={concept} />;
    case "visual":
      return <VisualBlockView block={concept.visual} />;
    case "example":
      return <WorkedExample concept={concept} />;
    case "experiment":
      return <ExperimentStep concept={concept} />;
    case "check":
      return <CheckStep concept={concept} />;
    case "apply":
      return <ApplyStep concept={concept} />;
    case "done":
      return <DoneStep concept={concept} />;
  }
}

function IntroStep({ concept }: { concept: ConceptModule }) {
  return (
    <>
      <p className="text-xl font-medium leading-snug text-fg">{concept.intro.hook}</p>
      {concept.intro.paragraphs.map((p) => (
        <p key={p} className="leading-relaxed text-fg/85">
          {p}
        </p>
      ))}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-subtle">Key terms</h3>
        <dl className="grid gap-3 sm:grid-cols-3">
          {concept.intro.keyTerms.map((k) => (
            <div key={k.term} className="rounded-xl border border-border bg-surface-2/50 p-4">
              <dt className="font-medium text-fg">{k.term}</dt>
              <dd className="mt-1 text-sm text-muted">{k.definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}

function WorkedExample({ concept }: { concept: ConceptModule }) {
  const ex = concept.workedExample;
  const [shown, setShown] = useState(1);
  const all = shown >= ex.steps.length;
  return (
    <>
      <div>
        <h3 className="font-medium text-fg">{ex.title}</h3>
        <p className="mt-1 text-fg/85">{ex.setup}</p>
      </div>
      <ol className="flex flex-col gap-2">
        {ex.steps.slice(0, shown).map((s, i) => (
          <li key={s.label} className="animate-fade-up rounded-xl border border-border bg-surface-2/50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <span className="text-sm text-muted">
                <span className="num mr-2 text-subtle">{i + 1}.</span>
                {s.label}
              </span>
              <span className="num font-semibold text-fg">{s.value}</span>
            </div>
            {s.note && <p className="mt-2 text-xs text-muted">{s.note}</p>}
          </li>
        ))}
      </ol>
      {!all ? (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShown(shown + 1)}>
            Show next step
          </Button>
          <Button variant="ghost" onClick={() => setShown(ex.steps.length)}>
            Show all
          </Button>
        </div>
      ) : (
        <Callout tone="brand" icon={<Lightbulb />} title="Takeaway">
          {ex.takeaway}
        </Callout>
      )}
    </>
  );
}

function ExperimentStep({ concept }: { concept: ConceptModule }) {
  const Experiment = EXPERIMENTS[concept.experiment.id];
  return (
    <>
      <div>
        <h3 className="font-medium text-fg">{concept.experiment.title}</h3>
        <p className="mt-1 text-fg/85">{concept.experiment.prompt}</p>
      </div>
      <Experiment />
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-subtle">What to notice</h3>
        <ul className="flex flex-col gap-2 text-sm text-fg/85">
          {concept.experiment.observe.map((o) => (
            <li key={o} className="flex gap-2">
              <Eye className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              {o}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function CheckStep({ concept }: { concept: ConceptModule }) {
  const { state } = useStore();
  const progress = state.concepts[concept.slug];
  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted">Your first answer to each question counts towards your concept comprehension score.</p>
      {concept.quiz.map((q, i) => (
        <KnowledgeCheck
          key={q.id}
          index={i}
          check={q}
          answered={progress?.quiz[q.id]?.answer ?? null}
          onAnswer={(answer, correct) => actions.answerConceptQuiz(concept.slug, q.id, answer, correct)}
        />
      ))}
    </div>
  );
}

function ApplyStep({ concept }: { concept: ConceptModule }) {
  const { state } = useStore();
  const round = getRound(concept.applyRound);
  const sim = state.simulation;
  const resolved = sim?.rounds.some((r) => r.round === round.id);

  let cta: { href: string; label: string };
  let note: string;
  if (!sim) {
    cta = { href: "/simulate", label: "Open the simulation" };
    note = "You haven't started the simulation yet. You'll meet this concept in Round " + round.id + ".";
  } else if (resolved) {
    cta = { href: `/simulate/review/${round.id}`, label: `Review Round ${round.id}` };
    note = "You've already played this round — revisit the debrief with fresh eyes.";
  } else if (sim.currentRound === round.id) {
    cta = { href: "/simulate/play", label: `Play Round ${round.id} now` };
    note = "This is your current round — a perfect time to apply what you just learned.";
  } else {
    cta = { href: "/simulate/play", label: `Continue to Round ${sim.currentRound}` };
    note = `You're on Round ${sim.currentRound}; this concept comes up in Round ${round.id}.`;
  }

  return (
    <>
      <p className="leading-relaxed text-fg/85">{concept.applyText}</p>
      <div className="rounded-2xl border border-border bg-surface-2/50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">Round {round.id} · {round.title}</p>
        <p className="mt-2 text-lg font-medium leading-snug text-fg">{round.headline}</p>
        <p className="mt-2 text-sm text-muted">{round.learningObjective}</p>
        <p className="mt-4 text-sm text-muted">{note}</p>
        <Button asChild className="mt-4">
          <Link href={cta.href}>
            <CandlestickChart /> {cta.label}
          </Link>
        </Button>
      </div>
    </>
  );
}

function DoneStep({ concept }: { concept: ConceptModule }) {
  const { state } = useStore();
  const progress = state.concepts[concept.slug];
  const correct = concept.quiz.filter((q) => progress?.quiz[q.id]?.correct).length;
  const next = concept.next ? CONCEPT_MAP[concept.next] : null;
  const nextDone = next && state.concepts[next.slug]?.status === "completed";
  return (
    <>
      <div className="flex items-center gap-4 rounded-2xl border border-up/25 bg-up/[0.06] p-5">
        <span className="flex size-12 items-center justify-center rounded-full bg-up/15 text-up">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-fg">Lesson complete</p>
          <p className="text-sm text-muted">
            Knowledge check: <span className="num font-medium text-fg">{correct} of {concept.quiz.length}</span> correct on the first try.
          </p>
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-subtle">What you now understand</h3>
        <ul className="flex flex-col gap-2">
          {concept.takeaways.map((t) => (
            <li key={t} className="flex gap-2 text-fg/90">
              <Check className="mt-1 size-4 shrink-0 text-up" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </div>
      {correct < concept.quiz.length && (
        <Callout tone="warn" icon={<HelpCircle />}>
          You missed {concept.quiz.length - correct} question{concept.quiz.length - correct === 1 ? "" : "s"}. Revisit the worked example and
          experiment — it will show up in your final report as a concept to revise.
        </Callout>
      )}
      {next && (
        <div className="rounded-2xl border border-border bg-surface-2/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Recommended next</p>
          <p className="mt-1 text-lg font-medium text-fg">{next.title}</p>
          <p className="mt-1 text-sm text-muted">{next.summary}</p>
          <Button asChild className="mt-4">
            <Link href={`/learn/${next.slug}`}>
              {nextDone ? "Review" : "Start"} {next.title} <ArrowRight />
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
