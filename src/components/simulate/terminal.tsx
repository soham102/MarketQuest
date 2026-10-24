"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Info } from "lucide-react";
import { CONCEPT_MAP } from "@/content/concepts";
import { SIM_CONFIG } from "@/content/market";
import { getRound } from "@/content/rounds";
import type { Order, SimulationState } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/misc";
import { CompanyPanel, NewsCard, SpecialPanel } from "./briefing";
import { DecisionPanel } from "./decision-panel";
import { OrderTicket } from "./order-ticket";
import { HoldingsTable, MarketWatch, PortfolioSummary, RoundProgress } from "./portfolio-bits";

/** The decision screen for the current round. Keyed by round so staged orders reset each round. */
export function Terminal({ sim }: { sim: SimulationState }) {
  const round = getRound(sim.currentRound);
  const [ticker, setTicker] = useState(round.focusTickers[0]);
  const [staged, setStaged] = useState<Order[]>([]);

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/simulate" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
            <ArrowLeft className="size-4" aria-hidden /> Lobby
          </Link>
          <p className="num text-sm text-muted">
            Round <span className="font-semibold text-fg">{round.id}</span> of {SIM_CONFIG.totalRounds}
          </p>
        </div>
        <RoundProgress current={round.id} completed={sim.rounds.length} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{round.concepts.join(" · ")}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{round.title}</h1>
          <p className="mt-1 text-muted">{round.learningObjective}</p>
        </div>
      </header>

      <div data-tour="terminal-summary">
        <PortfolioSummary sim={sim} />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
          <div data-tour="terminal-news">
            <NewsCard round={round} sim={sim} />
          </div>
          <SpecialPanel round={round} sim={sim} />
          <CompanyPanel ticker={ticker} sim={sim} />
          <Callout icon={<BookOpen />} title="Need a refresher?">
            Related lesson{round.conceptSlugs.length > 1 ? "s" : ""}:{" "}
            {round.conceptSlugs.map((s, i) => (
              <span key={s}>
                {i > 0 && ", "}
                <Link href={`/learn/${s}`} className="text-brand underline-offset-4 hover:underline">
                  {CONCEPT_MAP[s]?.title}
                </Link>
              </span>
            ))}
            . Your staged orders are kept while you read.
          </Callout>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-5">
          <Card data-tour="terminal-market">
            <CardHeader>
              <CardTitle as="h2">Market watch</CardTitle>
            </CardHeader>
            <CardContent>
              <MarketWatch sim={sim} selected={ticker} onSelect={setTicker} focus={round.focusTickers} />
            </CardContent>
          </Card>

          <Card data-tour="terminal-order">
            <CardHeader>
              <CardTitle as="h2">Place an order</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTicket key={ticker} sim={sim} ticker={ticker} staged={staged} onAdd={(o) => setStaged([...staged, o])} />
            </CardContent>
          </Card>

          <Card data-tour="terminal-decision">
            <CardHeader>
              <CardTitle as="h2">Your decision</CardTitle>
            </CardHeader>
            <CardContent>
              <DecisionPanel round={round} sim={sim} staged={staged} onRemove={(i) => setStaged(staged.filter((_, j) => j !== i))} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Current holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <HoldingsTable sim={sim} compact />
            </CardContent>
          </Card>

          <p className="flex gap-2 text-xs leading-relaxed text-subtle">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Simplified, fictional scenario. Price movements are scripted to isolate one mechanism and do not predict real markets.
          </p>
        </div>
      </div>
    </div>
  );
}
