"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  CircleDashed,
  FlaskConical,
  GitCompareArrows,
  Lightbulb,
  ListChecks,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { CONCEPT_MAP } from "@/content/concepts";
import { SIM_CONFIG } from "@/content/market";
import { bandFor } from "@/content/scoring";
import type { PathVerdict, RoundDefinition, RoundRecord } from "@/lib/types";
import { formatINR, formatPct, pctOf } from "@/lib/engine/money";
import { executeOrder, type Ledger } from "@/lib/engine/orders";
import { costBasisTotal, holdingsValue } from "@/lib/engine/portfolio";
import { simulateAlternative } from "@/lib/engine/simulation";
import { actions } from "@/lib/store/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Callout } from "@/components/ui/misc";
import { Delta } from "@/components/ui/stat";
import { KnowledgeCheck } from "@/components/learn/knowledge-check";
import { cn } from "@/lib/utils";
import { SaveProgressPrompt } from "@/components/auth/save-progress-prompt";
import { StagedOrders } from "./decision-panel";
import { RoundProgress } from "./portfolio-bits";

export const VERDICTS: Record<PathVerdict, { label: string; tone: "up" | "warn" | "down" }> = {
  reasonable: { label: "Well-reasoned", tone: "up" },
  defensible: { label: "Defensible, with trade-offs", tone: "warn" },
  risky: { label: "High-risk reasoning", tone: "down" },
};

/** Rebuild the post-trade position from the record so past rounds can be reviewed exactly. */
function positionAfterTrades(record: RoundRecord): Ledger {
  let ledger: Ledger = { cash: record.cashBefore, holdings: record.holdingsBefore, realizedPnl: 0, charges: 0, transactions: [] };
  record.orders.forEach((o, i) => {
    ledger = executeOrder(ledger, o, record.pricesBefore, { round: record.round, id: `replay-${i}` }).ledger;
  });
  return ledger;
}

function Section({
  icon,
  title,
  children,
  className,
  tour,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
  tour?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-4 p-5 sm:p-6", className)} data-tour={tour}>
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="text-brand [&_svg]:size-5">{icon}</span>
        {title}
      </h2>
      {children}
    </Card>
  );
}

export function Debrief({ round, record, mode, completedRounds }: { round: RoundDefinition; record: RoundRecord; mode: "live" | "review"; completedRounds: number }) {
  const router = useRouter();
  const path = round.paths.find((p) => p.id === record.pathId)!;
  const rationale = round.rationales.find((r) => r.id === record.rationaleId);
  const risk = round.risks.find((r) => r.id === record.riskId);
  const verdict = VERDICTS[path.verdict];
  const outcome = record.valueAfter - record.valueBefore;
  const roundChange = record.valueAfter - record.valueStart;
  const after = useMemo(() => positionAfterTrades(record), [record]);
  const unrealizedAfter = holdingsValue(after, record.pricesAfter) - costBasisTotal(after);
  const alternatives = useMemo(() => round.alternatives.map((a) => simulateAlternative(record, a)), [round, record]);
  const answered = record.knowledgeCheckAnswer !== null;
  const isFinal = round.id === SIM_CONFIG.totalRounds;

  useEffect(() => {
    if (mode === "live") actions.markDebriefViewed(round.id);
  }, [mode, round.id]);

  const movedTickers = Array.from(new Set(round.outcome.flatMap((s) => s.moves.map((m) => m.ticker))));

  const continueOn = () => {
    actions.advance();
    if (isFinal) router.push("/simulate/report");
    else window.scrollTo({ top: 0 });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <header className="flex flex-col gap-4">
        <RoundProgress current={round.id} completed={completedRounds} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Round {round.id} debrief · {round.title}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{round.headline}</h1>
        </div>
      </header>

      {/* 1. Decision */}
      <Section icon={<ListChecks />} title="Your decision">
        <StagedOrders orders={record.orders} prices={record.pricesBefore} />
        {rationale && (
          <p className="text-sm">
            <span className="text-subtle">Your reasoning: </span>
            <span className="text-fg/90">&ldquo;{rationale.text}&rdquo;</span>
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Classified as:</span>
          <Badge tone="neutral" className="text-fg">
            {path.label}
          </Badge>
        </div>
      </Section>

      {/* 2-4. What happened & portfolio */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section icon={<TrendingUp />} title="What happened next" tour="debrief-outcome">
          <ol className="flex flex-col gap-3">
            {round.outcome.map((s) => (
              <li key={s.label} className="rounded-xl border border-border bg-surface-2/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{s.label}</p>
                <p className="mt-1 font-medium text-fg">{s.headline}</p>
                <p className="mt-1 text-sm text-muted">{s.detail}</p>
              </li>
            ))}
          </ol>
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[360px] text-sm">
              <caption className="mb-2 text-left text-xs uppercase tracking-wider text-subtle">Simulated price changes since your decision</caption>
              <thead>
                <tr className="text-left text-xs text-subtle">
                  <th className="px-1 pb-1 font-medium">Stock</th>
                  <th className="px-1 pb-1 text-right font-medium">Before</th>
                  <th className="px-1 pb-1 text-right font-medium">After</th>
                  <th className="px-1 pb-1 text-right font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {movedTickers.map((t) => {
                  const b = record.pricesBefore[t];
                  const a = record.pricesAfter[t];
                  return (
                    <tr key={t} className="num border-t border-border/60">
                      <th scope="row" className="px-1 py-1.5 text-left font-medium text-fg">
                        {t}
                        {(after.holdings[t]?.quantity ?? 0) > 0 && <span className="ml-1.5 text-[10px] font-semibold uppercase text-brand">held</span>}
                      </th>
                      <td className="px-1 py-1.5 text-right text-muted">{formatINR(b)}</td>
                      <td className="px-1 py-1.5 text-right">{formatINR(a)}</td>
                      <td className="px-1 py-1.5 text-right">
                        <Delta pct={pctOf(a - b, b)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <details className="group rounded-lg border border-border p-3 text-sm">
            <summary className="cursor-pointer font-medium text-fg">Why each price moved</summary>
            <ul className="mt-2 flex flex-col gap-1.5 text-muted">
              {round.outcome.flatMap((s) =>
                s.moves.map((m) => (
                  <li key={`${s.label}-${m.ticker}`}>
                    <span className="font-medium text-fg">{m.ticker}</span> ({s.label}, {formatPct(m.pct, { signed: true, digits: 1 })}): {m.reason}
                  </li>
                )),
              )}
            </ul>
          </details>
        </Section>

        <Section icon={<GitCompareArrows />} title="Your portfolio">
          <dl className="num grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted">Value at decision time</dt>
            <dd className="text-right font-medium text-fg">{formatINR(record.valueBefore)}</dd>
            <dt className="text-muted">Value after the outcome</dt>
            <dd className="text-right font-medium text-fg">{formatINR(record.valueAfter)}</dd>
            <dt className="text-muted">Change from your decision</dt>
            <dd className="text-right">
              <Delta paise={outcome} pct={pctOf(outcome, record.valueBefore)} />
            </dd>
            {record.valueBefore !== record.valueStart && (
              <>
                <dt className="text-muted">Whole round, incl. market-open move</dt>
                <dd className="text-right">
                  <Delta paise={roundChange} />
                </dd>
              </>
            )}
            <dt className="border-t border-border pt-3 text-muted">Realised P&amp;L this round</dt>
            <dd className="border-t border-border pt-3 text-right">
              <Delta paise={record.realizedInRound} />
            </dd>
            <dt className="text-muted">Unrealised P&amp;L on holdings now</dt>
            <dd className="text-right">
              <Delta paise={unrealizedAfter} />
            </dd>
            <dt className="text-muted">Charges paid this round</dt>
            <dd className="text-right text-fg">{formatINR(record.chargesInRound)}</dd>
          </dl>
          <p className="text-xs text-subtle">
            Change from your decision includes charges. Realised P&amp;L is measured against your average cost; unrealised P&amp;L covers every share you still hold.
          </p>
        </Section>
      </div>

      {/* Scorecard: outcome vs process */}
      <Section icon={<Brain />} title="How to judge this round" tour="debrief-judge">
        <p className="text-sm text-muted">
          A good decision can lose money and a poor one can make money. These four questions are assessed separately.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ScoreCard
            title="Was the outcome profitable?"
            badge={outcome > 0 ? { label: "Profitable", tone: "up" } : outcome < 0 ? { label: "Loss", tone: "down" } : { label: "Flat", tone: "neutral" }}
            body={`Your portfolio ${outcome >= 0 ? "gained" : "lost"} ${formatINR(Math.abs(outcome))} after your decision. This reflects the scenario's outcome — not by itself the quality of your thinking.`}
          />
          <ScoreCard
            title="Was the decision reasonable given what you knew?"
            badge={{ label: verdict.label, tone: verdict.tone }}
            score={record.scores.reasoning}
            body={`${path.feedback} ${rationale ? `On your reasoning: ${rationale.feedback}` : ""}`}
          />
          <ScoreCard
            title="Did you recognise the risks?"
            badge={{ label: bandFor(record.scores.risk).label, tone: bandFor(record.scores.risk).tone }}
            score={record.scores.risk}
            body={risk ? `You flagged: “${risk.text}” — ${risk.feedback}` : "No risk recorded."}
          />
          <ScoreCard
            title="Did you understand the concept?"
            badge={
              answered
                ? record.scores.comprehension === 100
                  ? { label: "Understood", tone: "up" }
                  : { label: "Revise", tone: "warn" }
                : { label: "Answer the check below", tone: "neutral" }
            }
            body={answered ? "Based on your first answer to this round's knowledge check." : "Complete the knowledge check at the end of this debrief."}
          />
        </div>
        <Callout tone="neutral" icon={<Lightbulb />} title="Trade-offs">
          {path.tradeOffs}
        </Callout>
      </Section>

      {/* 5-7. Concept, why, risks */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section icon={<BookOpen />} title="The concept">
          <div className="flex flex-wrap gap-2">
            {round.concepts.map((c) => (
              <Badge key={c} tone="brand">
                {c}
              </Badge>
            ))}
          </div>
          <p className="leading-relaxed text-fg/85">{round.whyItHappened}</p>
          <div className="flex flex-wrap gap-2">
            {round.conceptSlugs.map((s) => (
              <Button key={s} asChild variant="outline" size="sm">
                <Link href={`/learn/${s}`}>
                  <BookOpen /> {CONCEPT_MAP[s]?.title}
                </Link>
              </Button>
            ))}
          </div>
        </Section>
        <div className="flex flex-col gap-6">
          <Section icon={<AlertTriangle />} title="Risks you may have overlooked">
            <ul className="flex flex-col gap-2">
              {round.overlookedRisks.map((r) => (
                <li key={r} className="flex gap-2 text-sm text-fg/85">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          </Section>
          <Section icon={<FlaskConical />} title="Scenario assumptions">
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
              {round.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="text-xs text-subtle">Simplified scenarios isolate one mechanism. They don&apos;t reproduce the full complexity of real markets.</p>
          </Section>
        </div>
      </div>

      {/* 8. Alternatives */}
      <Section icon={<GitCompareArrows />} title="Alternative decisions" tour="debrief-alternatives">
        <p className="text-sm text-muted">
          Replayed from your exact starting position with the same prices. This uses hindsight you didn&apos;t have — compare the trade-offs, not just the numbers.
        </p>
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <caption className="sr-only">Hypothetical results of alternative decisions</caption>
            <thead>
              <tr className="text-left text-xs text-subtle">
                <th className="px-1 pb-2 font-medium">Decision</th>
                <th className="px-1 pb-2 text-right font-medium">Value after</th>
                <th className="px-1 pb-2 text-right font-medium">Change</th>
                <th className="px-1 pb-2 text-right font-medium">vs yours</th>
              </tr>
            </thead>
            <tbody>
              <tr className="num border-t border-border/60 bg-brand/5">
                <th scope="row" className="px-1 py-2 text-left font-medium text-fg">
                  Your decision
                  <span className="block text-xs font-normal text-subtle">{path.label}</span>
                </th>
                <td className="px-1 py-2 text-right">{formatINR(record.valueAfter)}</td>
                <td className="px-1 py-2 text-right">
                  <Delta paise={outcome} />
                </td>
                <td className="px-1 py-2 text-right text-subtle">—</td>
              </tr>
              {alternatives.map((a) => (
                <tr key={a.alternative.id} className="num border-t border-border/60">
                  <th scope="row" className="px-1 py-2 text-left font-normal">
                    <span className="font-medium text-fg">{a.alternative.label}</span>
                    <span className="block text-xs text-subtle">{a.applicable ? a.alternative.description : a.note}</span>
                  </th>
                  {a.applicable ? (
                    <>
                      <td className="px-1 py-2 text-right">{formatINR(a.valueAfter)}</td>
                      <td className="px-1 py-2 text-right">
                        <Delta paise={a.change} />
                      </td>
                      <td className="px-1 py-2 text-right">
                        <Delta paise={a.valueAfter - record.valueAfter} />
                      </td>
                    </>
                  ) : (
                    <td colSpan={3} className="px-1 py-2 text-right text-xs text-subtle">
                      Not applicable to your position
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 9. Knowledge check & continue */}
      <Section icon={<ShieldCheck />} title="Knowledge check" tour="debrief-check">
        <KnowledgeCheck
          check={round.knowledgeCheck}
          answered={record.knowledgeCheckAnswer}
          onAnswer={(answer, correct) => actions.answerRoundCheck(round.id, answer, correct)}
        />
      </Section>

      {mode === "live" && <SaveProgressPrompt />}

      {mode === "live" ? (
        <div data-sticky-cta className="sticky bottom-20 z-30 flex flex-col items-center gap-2 rounded-2xl border border-border-strong bg-surface/95 p-4 shadow-2xl shadow-black/40 backdrop-blur sm:flex-row sm:justify-between md:bottom-4">
          <p className="flex items-center gap-2 text-sm text-muted">
            {answered ? <CheckCircle2 className="size-4 text-up" aria-hidden /> : <CircleDashed className="size-4" aria-hidden />}
            {answered ? "Debrief complete." : "Answer the knowledge check to continue."}
          </p>
          <Button size="lg" disabled={!answered} onClick={continueOn}>
            {isFinal ? "See your final report" : `Continue to Round ${round.id + 1}`} <ArrowRight />
          </Button>
        </div>
      ) : (
        <div className="flex justify-between gap-3">
          <Button asChild variant="outline">
            <Link href="/simulate">Back to lobby</Link>
          </Button>
          {round.id < SIM_CONFIG.totalRounds && round.id < completedRounds && (
            <Button asChild variant="ghost">
              <Link href={`/simulate/review/${round.id + 1}`}>
                Review Round {round.id + 1} <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreCard({
  title,
  badge,
  body,
  score,
}: {
  title: string;
  badge: { label: string; tone: "up" | "down" | "warn" | "neutral" };
  body: string;
  score?: number;
}) {
  const Icon = badge.tone === "up" ? CheckCircle2 : badge.tone === "down" ? XCircle : badge.tone === "warn" ? AlertTriangle : CircleDashed;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-2/40 p-4">
      <p className="text-sm font-medium text-fg">{title}</p>
      <div className="flex items-center gap-2">
        <Badge tone={badge.tone}>
          <Icon aria-hidden /> {badge.label}
        </Badge>
        {score !== undefined && <span className="num text-xs text-subtle">Rubric score {score}/100</span>}
      </div>
      <p className="text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
