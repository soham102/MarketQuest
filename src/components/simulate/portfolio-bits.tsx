"use client";

import { Briefcase, Check, Wallet } from "lucide-react";
import { SECTOR_COLORS, SECTORS, SIM_CONFIG, STOCKS, STOCK_MAP } from "@/content/market";
import type { Paise, SimulationState } from "@/lib/types";
import { formatINR, formatPct, pctOf } from "@/lib/engine/money";
import { holdingViews, portfolioValue, totalPnl, totalReturnPct, unrealizedPnl } from "@/lib/engine/portfolio";
import { Card } from "@/components/ui/card";
import { Delta, Stat } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

/** Prices at the end of the previous round (or the start), for "change since last round". */
export function previousPrices(sim: SimulationState): Record<string, Paise> {
  const last = sim.rounds.at(-1);
  if (last && sim.phase === "decision") return last.pricesAfter;
  if (sim.phase === "debrief") return sim.rounds.at(-1)!.pricesBefore;
  return Object.fromEntries(STOCKS.map((s) => [s.ticker, s.startPrice]));
}

export function PortfolioSummary({ sim, className }: { sim: SimulationState; className?: string }) {
  const value = portfolioValue(sim, sim.prices);
  const pnl = totalPnl(sim, sim.prices);
  const unreal = unrealizedPnl(sim, sim.prices);
  return (
    <Card className={cn("grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5", className)}>
      <Stat label="Portfolio value" value={formatINR(value)} icon={<Briefcase />} />
      <Stat label="Cash available" value={formatINR(sim.cash)} icon={<Wallet />} hint={`${formatPct(pctOf(sim.cash, value), { digits: 1 })} of portfolio`} />
      <Stat label="Unrealised P&L" value={<Delta paise={unreal} size="md" className="text-lg sm:text-xl" />} hint={`Realised ${formatINR(sim.realizedPnl, { signed: true })}`} />
      <Stat
        label="Total P&L"
        value={<Delta paise={pnl} size="md" className="text-lg sm:text-xl" />}
        hint={`${formatPct(totalReturnPct(sim, sim.prices), { signed: true })} on ${formatINR(SIM_CONFIG.initialCapital, { whole: true })}`}
      />
    </Card>
  );
}

export function HoldingsTable({ sim, compact = false }: { sim: Pick<SimulationState, "cash" | "holdings" | "prices">; compact?: boolean }) {
  const rows = holdingViews(sim, sim.prices);
  if (rows.length === 0) {
    return (
      <EmptyState icon={<Briefcase />} title="No holdings yet" className="py-6">
        You&apos;re fully in cash. Shares you buy will appear here with their average cost and P&amp;L.
      </EmptyState>
    );
  }
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className={cn("w-full text-sm", compact ? "min-w-[320px]" : "min-w-[480px]")}>
        <caption className="sr-only">Current holdings</caption>
        <thead>
          <tr className="text-left text-xs text-subtle">
            <th scope="col" className="px-1 pb-2 font-medium">Stock</th>
            <th scope="col" className="px-1 pb-2 text-right font-medium">Qty</th>
            {!compact && <th scope="col" className="px-1 pb-2 text-right font-medium">Avg cost</th>}
            {!compact && <th scope="col" className="px-1 pb-2 text-right font-medium">Price</th>}
            <th scope="col" className="px-1 pb-2 text-right font-medium">Value</th>
            <th scope="col" className="px-1 pb-2 text-right font-medium">Unrealised</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr key={h.ticker} className="num border-t border-border/60">
              <th scope="row" className="px-1 py-2 text-left font-normal">
                <span className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-sm" style={{ background: SECTOR_COLORS[h.sector] }} aria-hidden />
                  <span>
                    <span className="font-semibold text-fg">{h.ticker}</span>
                    <span className="block text-xs text-subtle">{formatPct(h.weightPct, { digits: 1 })} of portfolio</span>
                  </span>
                </span>
              </th>
              <td className="px-1 py-2 text-right">{h.quantity}</td>
              {!compact && <td className="px-1 py-2 text-right text-muted">{formatINR(h.avgCost)}</td>}
              {!compact && <td className="px-1 py-2 text-right">{formatINR(h.price)}</td>}
              <td className="px-1 py-2 text-right font-medium">{formatINR(h.value, { whole: true })}</td>
              <td className="px-1 py-2 text-right">
                <Delta paise={h.unrealized} />
                <span className="block text-xs text-subtle">{formatPct(h.unrealizedPct, { signed: true })}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarketWatch({
  sim,
  selected,
  onSelect,
  focus,
}: {
  sim: SimulationState;
  selected: string;
  onSelect: (ticker: string) => void;
  focus: string[];
}) {
  const prev = previousPrices(sim);
  const ordered = [...STOCKS].sort((a, b) => Number(focus.includes(b.ticker)) - Number(focus.includes(a.ticker)));
  return (
    <ul className="flex flex-col gap-1" aria-label="Market watch">
      {ordered.map((s) => {
        const price = sim.prices[s.ticker];
        const change = pctOf(price - prev[s.ticker], prev[s.ticker]);
        const held = sim.holdings[s.ticker]?.quantity ?? 0;
        const active = selected === s.ticker;
        return (
          <li key={s.ticker}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(s.ticker)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                active ? "border-brand/60 bg-brand/10" : "border-transparent hover:bg-surface-2",
              )}
            >
              <span className="size-2 shrink-0 rounded-sm" style={{ background: SECTOR_COLORS[s.sector] }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-fg">{s.ticker}</span>
                  {focus.includes(s.ticker) && <span className="rounded bg-warn/15 px-1.5 text-[10px] font-semibold uppercase text-warn">In the news</span>}
                  {held > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-up">
                      <Check className="size-3" aria-hidden />
                      {held}
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-subtle">
                  {s.name} · {SECTORS[s.sector].name}
                </span>
              </span>
              <span className="text-right">
                <span className="num block text-sm font-medium text-fg">{formatINR(price)}</span>
                <Delta pct={change} className="text-xs" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function RoundProgress({ current, completed, total = SIM_CONFIG.totalRounds }: { current: number; completed: number; total?: number }) {
  return (
    <ol className="flex items-center gap-1" aria-label={`Round ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done = n <= completed;
        const isCurrent = n === current && !done;
        return (
          <li
            key={n}
            className={cn("h-1.5 flex-1 rounded-full", done ? "bg-up" : isCurrent ? "bg-brand" : "bg-surface-3")}
            aria-label={`Round ${n}: ${done ? "completed" : isCurrent ? "current" : "upcoming"}`}
          />
        );
      })}
    </ol>
  );
}

export function stockLabel(ticker: string) {
  const s = STOCK_MAP[ticker];
  return s ? `${s.name} (${ticker})` : ticker;
}
