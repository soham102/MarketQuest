"use client";

import { AlertTriangle, BadgeCheck, CircleHelp, Lightbulb, Newspaper, Radio, Scale, ShieldAlert } from "lucide-react";
import { RISK_PROFILES, SECTOR_COLORS, SECTORS, STOCK_MAP } from "@/content/market";
import type { RoundDefinition, SimulationState } from "@/lib/types";
import { formatINR, formatPct } from "@/lib/engine/money";
import { concentration, portfolioValue, sectorAllocation } from "@/lib/engine/portfolio";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Delta } from "@/components/ui/stat";
import { Callout } from "@/components/ui/misc";
import { PriceChart } from "@/components/charts/price-chart";
import { cn } from "@/lib/utils";

export function NewsCard({ round, sim }: { round: RoundDefinition; sim: SimulationState }) {
  const prevValue = sim.valueHistory.at(-1)?.value ?? 0;
  const nowValue = portfolioValue(sim, sim.prices);
  const openImpact = nowValue - prevValue;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-surface-2/50 px-5 py-3 sm:px-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warn">
          <Newspaper className="size-4" aria-hidden />
          Breaking · Round {round.id}
        </p>
      </div>
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold leading-snug tracking-tight text-fg sm:text-2xl">{round.headline}</h2>
          <p className="text-xs text-subtle">Source: {round.source}</p>
        </div>
        <p className="leading-relaxed text-fg/85">{round.background}</p>

        {round.marketOpen && (
          <div className="rounded-xl border border-border bg-surface-2/60 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-fg">
              <Radio className="size-4 text-down" aria-hidden />
              Market reaction so far: {round.marketOpen.headline}
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {round.marketOpen.moves.map((m) => (
                <li key={m.ticker} className="flex items-center gap-1.5">
                  <span className="font-medium text-muted">{m.ticker}</span>
                  <Delta pct={m.pct} />
                </li>
              ))}
            </ul>
            {sim.rounds.length > 0 && (
              <p className="mt-2 text-xs text-muted">
                Your portfolio has already moved {formatINR(openImpact, { signed: true })} since the end of last round. You trade at today&apos;s prices.
              </p>
            )}
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-subtle">What you know right now</h3>
          <ul className="flex flex-col gap-2">
            {round.facts.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-fg/90">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <Callout tone="brand" icon={<Lightbulb />} title="Questions to think about">
          <ul className="list-disc space-y-1 pl-4">
            {round.thinkAbout.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Callout>
      </div>
    </Card>
  );
}

export function CompanyPanel({ ticker, sim }: { ticker: string; sim: SimulationState }) {
  const stock = STOCK_MAP[ticker];
  const history = sim.priceHistory[ticker] ?? [];
  const points = history.slice(-16);
  const held = sim.holdings[ticker];
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs text-subtle">
            <span className="size-2 rounded-sm" style={{ background: SECTOR_COLORS[stock.sector] }} aria-hidden />
            {SECTORS[stock.sector].name}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-fg">
            {stock.name} <span className="text-muted">· {ticker}</span>
          </h3>
          <p className="mt-1 max-w-md text-sm text-muted">{stock.description}</p>
        </div>
        <div className="text-right">
          <p className="num text-2xl font-semibold text-fg">{formatINR(sim.prices[ticker])}</p>
          <p className="text-xs text-subtle">
            {held ? `You hold ${held.quantity} · avg ${formatINR(Math.round(held.costBasis / held.quantity))}` : "Not held"}
          </p>
        </div>
      </div>
      <PriceChart points={points} height={170} ariaLabel={`${stock.name} simulated price history`} />
      <p className="text-xs text-subtle">Simulated price history (fictional). W = weeks before the simulation; R = rounds.</p>
      <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4">
        {stock.facts.map((f) => (
          <div key={f.label}>
            <dt className="text-xs text-subtle">{f.label}</dt>
            <dd className="text-sm font-medium text-fg">{f.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-subtle">Company facts describe the business at the start of the simulation.</p>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Special context panels                                              */
/* ------------------------------------------------------------------ */

export function SpecialPanel({ round, sim }: { round: RoundDefinition; sim: SimulationState }) {
  if (round.special === "concentration-lab") return <ConcentrationLab sim={sim} />;
  if (round.special === "rebalance-check") return <RebalanceCheck sim={sim} />;
  if (round.special === "rumour-board") return <RumourBoard />;
  return null;
}

function AllocationBar({ parts, label }: { parts: { id: keyof typeof SECTOR_COLORS; pct: number }[]; label: string }) {
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-surface-3" role="img" aria-label={label}>
      {parts
        .filter((p) => p.pct > 0)
        .map((p) => (
          <div key={p.id} style={{ width: `${p.pct}%`, background: SECTOR_COLORS[p.id] }} className="border-r-2 border-surface last:border-r-0" />
        ))}
    </div>
  );
}

function ConcentrationLab({ sim }: { sim: SimulationState }) {
  const alloc = sectorAllocation(sim, sim.prices);
  const itPct = alloc.find((a) => a.id === "it")?.pct ?? 0;
  const c = concentration(sim, sim.prices);
  const profile = RISK_PROFILES[sim.profile];
  const shock = -12;
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h3 className="flex items-center gap-2 font-semibold text-fg">
        <Scale className="size-4 text-brand" aria-hidden /> Concentration lab
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
          <p className="text-sm font-medium">Riya&apos;s portfolio</p>
          <AllocationBar parts={[{ id: "it", pct: 80 }, { id: "cash", pct: 20 }]} label="Riya: 80% IT, 20% cash" />
          <p className="text-xs text-muted">80% IT · 20% cash</p>
          <p className="text-sm">
            If IT fell {Math.abs(shock)}%: <span className="num font-semibold text-down">{formatPct((80 * shock) / 100, { signed: true, digits: 1 })}</span>
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
          <p className="text-sm font-medium">Your portfolio</p>
          <AllocationBar parts={alloc.map((a) => ({ id: a.id, pct: a.pct }))} label="Your sector allocation" />
          <p className="text-xs text-muted">
            {alloc
              .filter((a) => a.pct > 0)
              .map((a) => `${a.id === "cash" ? "Cash" : SECTORS[a.id].name} ${a.pct.toFixed(0)}%`)
              .join(" · ")}
          </p>
          <p className="text-sm">
            If IT fell {Math.abs(shock)}%:{" "}
            <span className={cn("num font-semibold", itPct > 0 ? "text-down" : "text-muted")}>{formatPct((itPct * shock) / 100, { signed: true, digits: 1 })}</span>
          </p>
        </div>
      </div>
      <p className="text-sm text-muted">
        Your largest sector is{" "}
        <span className="font-medium text-fg">{c.maxSector ? `${SECTORS[c.maxSector].name} at ${c.maxSectorPct.toFixed(1)}%` : "— (all cash)"}</span>. Your{" "}
        {profile.name} profile caps any sector at {profile.maxSectorPct}%.
      </p>
    </Card>
  );
}

function RebalanceCheck({ sim }: { sim: SimulationState }) {
  const profile = RISK_PROFILES[sim.profile];
  const c = concentration(sim, sim.prices);
  const rows = [
    {
      label: "Invested in stocks",
      actual: c.investedPct,
      target: `${profile.targetInvestedPct}% ± 15`,
      ok: Math.abs(c.investedPct - profile.targetInvestedPct) <= 15,
    },
    { label: `Largest sector${c.maxSector ? ` (${SECTORS[c.maxSector].name})` : ""}`, actual: c.maxSectorPct, target: `≤ ${profile.maxSectorPct}%`, ok: c.maxSectorPct <= profile.maxSectorPct },
    { label: `Largest position${c.maxPosition ? ` (${c.maxPosition})` : ""}`, actual: c.maxPositionPct, target: `≤ ${profile.maxPositionPct}%`, ok: c.maxPositionPct <= profile.maxPositionPct },
  ];
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h3 className="flex items-center gap-2 font-semibold text-fg">
        <Scale className="size-4 text-brand" aria-hidden /> Allocation check · {profile.name} profile
      </h3>
      <table className="w-full text-sm">
        <caption className="sr-only">Your allocation versus your risk profile</caption>
        <thead>
          <tr className="text-left text-xs text-subtle">
            <th className="pb-2 font-medium">Measure</th>
            <th className="pb-2 text-right font-medium">Now</th>
            <th className="pb-2 text-right font-medium">Target</th>
            <th className="pb-2 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-border/60">
              <td className="py-2 text-muted">{r.label}</td>
              <td className="num py-2 text-right font-medium text-fg">{r.actual.toFixed(1)}%</td>
              <td className="num py-2 text-right text-muted">{r.target}</td>
              <td className="py-2 text-right">
                <Badge tone={r.ok ? "up" : "warn"}>{r.ok ? "On plan" : "Drifted"}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted">
        Prices have moved over the past rounds, so your weights may have drifted from your plan. Trades that bring every row to &ldquo;On plan&rdquo;
        count as rebalancing.
      </p>
    </Card>
  );
}

function RumourBoard() {
  const items = [
    { text: "Viral post: Urja 'secured' ₹5,000 crore contract (citing 'sources')", status: "unverified" as const },
    { text: "Urja: 'We do not comment on market speculation'", status: "verified" as const },
    { text: "Tender document: total size ₹6,000 crore, split among winners", status: "verified" as const },
    { text: "Exchange filings by Urja about the tender: none yet", status: "verified" as const },
    { text: "Messaging-app forward: 'Insider says buy before Friday'", status: "unverified" as const },
  ];
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h3 className="flex items-center gap-2 font-semibold text-fg">
        <ShieldAlert className="size-4 text-brand" aria-hidden /> Information board
      </h3>
      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li key={i.text} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2 text-sm">
            {i.status === "verified" ? (
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-up" aria-hidden />
            ) : (
              <CircleHelp className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
            )}
            <span className="flex-1 text-fg/90">{i.text}</span>
            <Badge tone={i.status === "verified" ? "up" : "warn"}>{i.status === "verified" ? "Official" : "Unverified"}</Badge>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-2 text-xs text-muted">
        <AlertTriangle className="size-3.5 text-warn" aria-hidden />
        Rumours often move prices before facts are known — check claims against official sources.
      </p>
    </Card>
  );
}
