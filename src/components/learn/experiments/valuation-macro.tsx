"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, RotateCcw } from "lucide-react";
import { formatPct } from "@/lib/engine/money";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExperimentFrame, HBar, ModelNote, Readout, SliderControl } from "./frame";

const pct = (v: number) => `${v}%`;

/* ------------------------------------------------------------------ */
/* Earnings surprise                                                   */
/* ------------------------------------------------------------------ */

type Outlook = "raised" | "maintained" | "cut";
/** Illustrative reaction model — explained to the learner on screen. */
const OUTLOOK_EFFECT: Record<Outlook, number> = { raised: 5, maintained: 0, cut: -9 };
const SURPRISE_WEIGHT = 0.4;

export function EarningsSurpriseExperiment() {
  const [expected, setExpected] = useState(15);
  const [actual, setActual] = useState(22);
  const [outlook, setOutlook] = useState<Outlook>("cut");
  const surprise = actual - expected;
  const fromSurprise = surprise * SURPRISE_WEIGHT;
  const fromOutlook = OUTLOOK_EFFECT[outlook];
  const reaction = Math.max(-25, Math.min(25, fromSurprise + fromOutlook));

  return (
    <ExperimentFrame
      controls={
        <>
          <SliderControl label="Analysts expected profit growth" value={expected} onChange={setExpected} min={0} max={30} format={pct} />
          <SliderControl label="Actual profit growth" value={actual} onChange={setActual} min={-10} max={40} format={pct} />
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted">Management&apos;s outlook for next year</span>
            <Segmented<Outlook>
              label="Management outlook"
              value={outlook}
              onChange={setOutlook}
              options={[
                { value: "raised", label: "Raised" },
                { value: "maintained", label: "Same" },
                { value: "cut", label: "Cut" },
              ]}
            />
          </div>
          <ModelNote>
            Illustrative model: reaction ≈ {SURPRISE_WEIGHT} × surprise + outlook effect (raised +5%, cut −9%). Real reactions vary widely.
          </ModelNote>
        </>
      }
      output={
        <>
          <div className="grid grid-cols-2 gap-4">
            <Readout label="Earnings surprise" value={`${surprise > 0 ? "+" : ""}${surprise} pts`} tone={surprise > 0 ? "up" : surprise < 0 ? "down" : "neutral"} />
            <Readout label="Illustrative price reaction" value={formatPct(reaction, { signed: true, digits: 1 })} tone={reaction > 0 ? "up" : reaction < 0 ? "down" : "neutral"} big />
          </div>
          <div className="flex flex-col gap-2">
            <HBar label="From the surprise" value={fromSurprise} min={-15} max={15} display={formatPct(fromSurprise, { signed: true, digits: 1 })} color={fromSurprise >= 0 ? "var(--up)" : "var(--down)"} />
            <HBar label="From the outlook" value={fromOutlook} min={-15} max={15} display={formatPct(fromOutlook, { signed: true, digits: 1 })} color={fromOutlook >= 0 ? "var(--up)" : "var(--down)"} />
          </div>
          <p className="text-sm text-muted">
            {surprise > 0 && reaction < 0
              ? "A beat, yet the price falls: the weaker outlook outweighs one good quarter."
              : surprise < 0 && reaction > 0
                ? "A miss, yet the price rises: investors care more about the improved future."
                : "When the surprise and the outlook point the same way, the reaction is clearer."}
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* P/E valuation                                                       */
/* ------------------------------------------------------------------ */

const BASE_EPS = 14.4;
const BASE_PE = 77.5;

export function PeValuationExperiment() {
  const [eps, setEps] = useState(BASE_EPS);
  const [pe, setPe] = useState(BASE_PE);
  const base = BASE_EPS * BASE_PE;
  const price = eps * pe;
  const change = ((price - base) / base) * 100;

  return (
    <ExperimentFrame
      controls={
        <>
          <SliderControl label="Earnings per share (EPS)" value={eps} onChange={setEps} min={5} max={30} step={0.1} format={(v) => `₹${v.toFixed(2)}`} />
          <SliderControl label="P/E multiple investors pay" value={pe} onChange={setPe} min={10} max={100} step={0.5} format={(v) => `${v.toFixed(1)}×`} />
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => {
              setEps(BASE_EPS);
              setPe(BASE_PE);
            }}
          >
            <RotateCcw /> Reset to DhanSetu today
          </Button>
          <ModelNote>Starting point: DhanSetu Fintech with EPS ₹14.40 at 77.5× earnings ≈ ₹1,116.</ModelNote>
        </>
      }
      output={
        <>
          <div className="grid grid-cols-2 gap-4">
            <Readout label="Share price = EPS × P/E" value={`₹${price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} big />
            <Readout label="vs ₹1,116 today" value={formatPct(change, { signed: true, digits: 1 })} tone={change > 0.05 ? "up" : change < -0.05 ? "down" : "neutral"} big />
            <Readout label="Earnings yield" value={`${(100 / pe).toFixed(2)}%`} hint="₹ of profit per ₹100 invested (1 ÷ P/E)" />
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: "Shakti Bank", pe: 16 },
              { label: "Vyom Infotech", pe: 24 },
              { label: "Kriti Foods", pe: 38 },
              { label: "Your setting", pe },
            ].map((b) => (
              <HBar key={b.label} label={b.label} value={b.pe} max={100} display={`${b.pe.toFixed(1)}×`} color={b.label === "Your setting" ? "var(--brand)" : "var(--subtle)"} />
            ))}
          </div>
          <p className="text-sm text-muted">Try cutting the multiple from 77.5× to 65× with EPS unchanged — that alone is a 16% fall.</p>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Interest rate transmission                                          */
/* ------------------------------------------------------------------ */

const LOAN_SPREAD = 3.0; // lending rate = repo + spread (illustrative)
const BASE_REPO = 6.5;
/** Illustrative sensitivity: % share-price change per +1 point of repo rate. */
const SECTOR_SENSITIVITY = [
  { label: "Fintech lender", per: -14 },
  { label: "Auto", per: -10 },
  { label: "Debt-heavy energy", per: -8 },
  { label: "Consumer goods", per: -5 },
  { label: "IT exporter", per: -1 },
  { label: "Pharma", per: -1 },
  { label: "Bank (short run)", per: 4 },
];

function emi(principal: number, annualRate: number, months: number) {
  const r = annualRate / 12 / 100;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

export function RateTransmissionExperiment() {
  const [repo, setRepo] = useState(7.0);
  const loanRate = repo + LOAN_SPREAD;
  const monthly = emi(10_00_000, loanRate, 60);
  const baseMonthly = emi(10_00_000, BASE_REPO + LOAN_SPREAD, 60);
  const debt = 2000; // ₹ crore
  const interest = (debt * (repo + 2.5)) / 100;
  const delta = repo - BASE_REPO;

  return (
    <ExperimentFrame
      controls={
        <>
          <SliderControl label="RBI repo rate" value={repo} onChange={setRepo} min={4} max={9} step={0.25} format={(v) => `${v.toFixed(2)}%`} />
          <ModelNote>
            Assumes banks lend at repo + {LOAN_SPREAD} points and a power company borrows ₹2,000 crore at repo + 2.5 points. Sector bars are
            illustrative sensitivities, measured from a 6.50% starting rate.
          </ModelNote>
        </>
      }
      output={
        <>
          <div className="grid grid-cols-2 gap-4">
            <Readout
              label="EMI · ₹10 lakh car loan, 5 yrs"
              value={`₹${Math.round(monthly).toLocaleString("en-IN")}`}
              hint={`${monthly >= baseMonthly ? "+" : "−"}₹${Math.abs(Math.round(monthly - baseMonthly)).toLocaleString("en-IN")}/month vs 6.50%`}
            />
            <Readout label="Power company interest bill" value={`₹${interest.toFixed(0)} cr/yr`} hint={`At ${(repo + 2.5).toFixed(2)}% on ₹2,000 cr`} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-wider text-subtle">Illustrative share-price impact vs 6.50%</p>
            {SECTOR_SENSITIVITY.map((s) => {
              const v = s.per * delta;
              return (
                <HBar key={s.label} label={s.label} value={v} min={-35} max={35} display={formatPct(v, { signed: true, digits: 1 })} color={v >= 0 ? "var(--up)" : "var(--down)"} />
              );
            })}
          </div>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Inflation & pricing power                                           */
/* ------------------------------------------------------------------ */

type Brand = "strong" | "weak";
const ELASTICITY: Record<Brand, number> = { strong: 0.4, weak: 1.6 };

export function PricingPowerExperiment() {
  const [costRise, setCostRise] = useState(20);
  const [passThrough, setPassThrough] = useState(70);
  const [brand, setBrand] = useState<Brand>("strong");

  const basePrice = 100;
  const baseCost = 82;
  const raw = 45;
  const extraCost = (raw * costRise) / 100;
  const priceRise = (extraCost * passThrough) / 100;
  const newPrice = basePrice + priceRise;
  const newCost = baseCost + extraCost;
  const volumeChange = -((priceRise / basePrice) * 100) * ELASTICITY[brand];
  const baseMargin = ((basePrice - baseCost) / basePrice) * 100;
  const newMargin = ((newPrice - newCost) / newPrice) * 100;
  const baseProfit = basePrice - baseCost;
  const newProfit = (newPrice - newCost) * (1 + volumeChange / 100);
  const profitChange = ((newProfit - baseProfit) / baseProfit) * 100;

  return (
    <ExperimentFrame
      controls={
        <>
          <SliderControl label="Raw material cost increase" value={costRise} onChange={setCostRise} min={0} max={40} format={pct} />
          <SliderControl label="Share of extra cost passed to customers" value={passThrough} onChange={setPassThrough} min={0} max={100} step={5} format={pct} />
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted">Brand strength</span>
            <Segmented<Brand>
              label="Brand strength"
              value={brand}
              onChange={setBrand}
              options={[
                { value: "strong", label: "Strong brand" },
                { value: "weak", label: "Unbranded" },
              ]}
            />
          </div>
          <ModelNote>₹100 of sales; costs ₹82, of which raw materials ₹45. Volume falls with price rises — less for strong brands (illustrative).</ModelNote>
        </>
      }
      output={
        <>
          <div className="grid grid-cols-2 gap-4">
            <Readout label="Operating margin" value={`${newMargin.toFixed(1)}%`} hint={`was ${baseMargin.toFixed(1)}%`} tone={newMargin < baseMargin - 0.05 ? "down" : "neutral"} big />
            <Readout label="Profit change" value={formatPct(profitChange, { signed: true, digits: 1 })} tone={profitChange < -0.05 ? "down" : profitChange > 0.05 ? "up" : "neutral"} big />
            <Readout label="Price increase" value={`+${priceRise.toFixed(1)}%`} />
            <Readout label="Volume change" value={formatPct(volumeChange, { signed: true, digits: 1 })} tone={volumeChange < 0 ? "down" : "neutral"} />
          </div>
          <div className="flex flex-col gap-2">
            <HBar label="Margin before" value={baseMargin} max={25} display={`${baseMargin.toFixed(1)}%`} color="var(--subtle)" />
            <HBar label="Margin after" value={Math.max(newMargin, 0)} max={25} display={`${newMargin.toFixed(1)}%`} color="var(--brand)" />
          </div>
          <p className="text-sm text-muted">
            {brand === "strong"
              ? "Strong brands keep most customers when prices rise, so passing costs on protects profit."
              : "Without pricing power, raising prices drives customers away — passing on costs barely helps."}
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Information quality — source ranking                                */
/* ------------------------------------------------------------------ */

const SOURCES = [
  { id: "filing", text: "Stock-exchange filing by Urja", why: "Official, legally accountable disclosure." },
  { id: "tender", text: "Government tender document", why: "Official primary source for the contract's terms." },
  { id: "newspaper", text: "Business newspaper quoting Urja's CFO on record", why: "Named, accountable source — but second-hand." },
  { id: "analyst", text: "Brokerage analyst's estimate", why: "Informed opinion, not confirmation." },
  { id: "price", text: "Urja's share price jumping 9%", why: "Shows what traders believe, not what's true." },
  { id: "viral", text: "Viral post citing unnamed 'sources'", why: "Unverifiable and unaccountable." },
];
const INITIAL_ORDER = ["viral", "analyst", "filing", "price", "newspaper", "tender"];

export function InformationQualityExperiment() {
  const [order, setOrder] = useState(INITIAL_ORDER);
  const [checked, setChecked] = useState(false);
  const correctPos = (id: string) => SOURCES.findIndex((s) => s.id === id);
  // Score: items within one place of their correct rank (adjacent official sources are interchangeable).
  const score = order.filter((id, i) => Math.abs(correctPos(id) - i) <= 1).length;

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    setChecked(false);
  };

  return (
    <ExperimentFrame
      controls={
        <>
          <p className="text-sm text-muted">Order these sources from most reliable (top) to least reliable (bottom).</p>
          <ol className="flex flex-col gap-2">
            {order.map((id, i) => {
              const s = SOURCES.find((x) => x.id === id)!;
              const off = Math.abs(correctPos(id) - i);
              return (
                <li
                  key={id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border bg-surface-2 px-3 py-2 text-sm",
                    checked ? (off <= 1 ? "border-up/40" : "border-down/40") : "border-border",
                  )}
                >
                  <span className="num w-5 text-subtle">{i + 1}</span>
                  <span className="flex-1 text-fg/90">{s.text}</span>
                  <Button variant="ghost" size="icon" className="size-7" aria-label={`Move "${s.text}" up`} disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7" aria-label={`Move "${s.text}" down`} disabled={i === order.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown />
                  </Button>
                </li>
              );
            })}
          </ol>
          <Button onClick={() => setChecked(true)} className="self-start">
            Check my ranking
          </Button>
        </>
      }
      output={
        checked ? (
          <>
            <Readout label="Close to the reference ranking" value={`${score} of ${SOURCES.length}`} tone={score >= 5 ? "up" : "neutral"} big />
            <ol className="flex flex-col gap-2 text-sm">
              {SOURCES.map((s, i) => (
                <li key={s.id} className="flex gap-3">
                  <span className="num w-5 text-subtle">{i + 1}</span>
                  <span>
                    <span className="font-medium text-fg">{s.text}</span>
                    <span className="block text-muted">{s.why}</span>
                  </span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted">
            <CheckCircle2 className="size-6 text-subtle" aria-hidden />
            Arrange the list, then check your ranking to see the reasoning for each source.
          </div>
        )
      }
    />
  );
}
