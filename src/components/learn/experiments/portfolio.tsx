"use client";

import { useState } from "react";
import { SECTOR_COLORS } from "@/content/market";
import type { SectorId } from "@/lib/types";
import { formatINR, formatPct } from "@/lib/engine/money";
import { Segmented } from "@/components/ui/segmented";
import { ExperimentFrame, HBar, ModelNote, Readout, SliderControl } from "./frame";

const pct = (v: number) => `${v}%`;

/* ------------------------------------------------------------------ */
/* Diversification                                                     */
/* ------------------------------------------------------------------ */

const DIV_SECTORS: { id: SectorId; name: string }[] = [
  { id: "it", name: "IT" },
  { id: "banking", name: "Banking" },
  { id: "consumer", name: "Consumer" },
  { id: "pharma", name: "Pharma" },
  { id: "energy", name: "Energy" },
];
type Shock = SectorId | "market";
const SHOCK_SIZE = -12;
const MARKET_SHOCK = -10;

export function DiversificationExperiment() {
  const [alloc, setAlloc] = useState<Record<string, number>>({ it: 80, banking: 0, consumer: 0, pharma: 0, energy: 0 });
  const [shock, setShock] = useState<Shock>("it");
  const invested = Object.values(alloc).reduce((a, b) => a + b, 0);
  const cash = 100 - invested;

  const setSector = (id: string, v: number) => {
    // Never let the total exceed 100%: clamp the moved slider to what's left.
    const others = invested - alloc[id];
    setAlloc({ ...alloc, [id]: Math.min(v, 100 - others) });
  };

  const loss = DIV_SECTORS.reduce((sum, s) => {
    const hit = shock === "market" ? MARKET_SHOCK : shock === s.id ? SHOCK_SIZE : 0;
    return sum + (alloc[s.id] * hit) / 100;
  }, 0);
  const hhi = invested > 0 ? DIV_SECTORS.reduce((sum, s) => sum + (alloc[s.id] / invested) ** 2, 0) : 0;
  const effective = hhi > 0 ? 1 / hhi : 0;
  const maxSector = Math.max(...DIV_SECTORS.map((s) => alloc[s.id]));

  return (
    <ExperimentFrame
      controls={
        <>
          {DIV_SECTORS.map((s) => (
            <SliderControl key={s.id} label={`${s.name}`} value={alloc[s.id]} onChange={(v) => setSector(s.id, v)} min={0} max={100} step={5} format={pct} />
          ))}
          <p className="num text-sm text-muted">
            Cash: <span className="font-semibold text-fg">{cash}%</span>
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted">Shock to apply</span>
            <Segmented<Shock>
              label="Shock"
              value={shock}
              onChange={setShock}
              options={[
                { value: "it", label: "IT −12%" },
                { value: "banking", label: "Banks −12%" },
                { value: "market", label: "Market −10%" },
              ]}
            />
          </div>
        </>
      }
      output={
        <>
          <div className="grid grid-cols-2 gap-4">
            <Readout label="Portfolio change" value={formatPct(loss, { signed: true, digits: 1 })} tone={loss < 0 ? "down" : "neutral"} big hint={formatINR(Math.round(loss * 1000_00), { whole: true, signed: true }) + " on ₹1,00,000"} />
            <Readout label="Effective sectors" value={effective.toFixed(1)} big hint="1 ÷ concentration (HHI)" />
            <Readout label="Largest sector" value={`${maxSector}%`} tone={maxSector > 35 ? "down" : "neutral"} />
          </div>
          <div className="flex h-4 overflow-hidden rounded-full bg-surface-3" role="img" aria-label="Allocation bar">
            {DIV_SECTORS.filter((s) => alloc[s.id] > 0).map((s) => (
              <div key={s.id} style={{ width: `${alloc[s.id]}%`, background: SECTOR_COLORS[s.id] }} className="border-r-2 border-surface last:border-r-0" />
            ))}
            {cash > 0 && <div style={{ width: `${cash}%`, background: SECTOR_COLORS.cash }} />}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {DIV_SECTORS.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: SECTOR_COLORS[s.id] }} aria-hidden />
                {s.name} {alloc[s.id]}%
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: SECTOR_COLORS.cash }} aria-hidden />
              Cash {cash}%
            </li>
          </ul>
          <p className="text-sm text-muted">
            {shock === "market"
              ? "A market-wide fall hits every sector at once — spreading out barely helps. Only cash cushions it."
              : "A sector shock only hits what you hold in that sector. Spread out, and it becomes a small dent."}
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Drawdowns                                                           */
/* ------------------------------------------------------------------ */

export function DrawdownExperiment() {
  const [fall, setFall] = useState(30);
  const f = fall / 100;
  const needed = (f / (1 - f)) * 100;
  const years = (r: number) => Math.log(1 / (1 - f)) / Math.log(1 + r / 100);
  // Curve of required gain for falls 0..80%
  const pts = Array.from({ length: 81 }, (_, i) => {
    const x = i / 100;
    return { x: i, y: (x / (1 - x)) * 100 };
  });
  const W = 300;
  const H = 140;
  const maxY = 400;
  const px = (x: number) => (x / 80) * W;
  const py = (y: number) => H - (Math.min(y, maxY) / maxY) * H;

  return (
    <ExperimentFrame
      controls={
        <>
          <SliderControl label="Size of the fall" value={fall} onChange={setFall} min={5} max={80} format={(v) => `−${v}%`} />
          <ModelNote>Recovery times assume a steady annual return, which real markets never deliver — it&apos;s only to show scale.</ModelNote>
        </>
      }
      output={
        <>
          <div className="grid grid-cols-2 gap-4">
            <Readout label="₹1,00,000 becomes" value={formatINR(Math.round((1 - f) * 100_000_00), { whole: true })} tone="down" />
            <Readout label="Gain needed to recover" value={`+${needed.toFixed(1)}%`} tone="brand" big />
          </div>
          <figure aria-label={`Recovery curve. A ${fall}% fall needs a ${needed.toFixed(1)}% gain.`}>
            <svg viewBox={`-30 -6 ${W + 40} ${H + 28}`} className="w-full" role="img" aria-hidden>
              {[0, 100, 200, 300, 400].map((y) => (
                <g key={y}>
                  <line x1={0} x2={W} y1={py(y)} y2={py(y)} stroke="var(--border)" />
                  <text x={-6} y={py(y) + 4} textAnchor="end" fontSize="9" fill="var(--subtle)">
                    {y}%
                  </text>
                </g>
              ))}
              <polyline points={pts.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")} fill="none" stroke="var(--brand)" strokeWidth="2" />
              <line x1={px(fall)} x2={px(fall)} y1={0} y2={H} stroke="var(--subtle)" strokeDasharray="3 3" />
              <circle cx={px(fall)} cy={py(needed)} r="5" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2" />
              {[0, 20, 40, 60, 80].map((x) => (
                <text key={x} x={px(x)} y={H + 16} textAnchor="middle" fontSize="9" fill="var(--subtle)">
                  −{x}%
                </text>
              ))}
            </svg>
          </figure>
          <div className="grid grid-cols-3 gap-3">
            {[8, 12, 15].map((r) => (
              <Readout key={r} label={`At ${r}%/yr`} value={`${years(r).toFixed(1)} yrs`} />
            ))}
          </div>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Rebalancing                                                         */
/* ------------------------------------------------------------------ */

export function RebalancingExperiment() {
  const [target, setTarget] = useState(60);
  const [stockReturn, setStockReturn] = useState(40);
  const start = 100_000;
  const stocks0 = (start * target) / 100;
  const cash0 = start - stocks0;
  const stocks1 = stocks0 * (1 + stockReturn / 100);
  const total1 = stocks1 + cash0;
  const drifted = (stocks1 / total1) * 100;
  const targetStocks = (total1 * target) / 100;
  const trade = targetStocks - stocks1;

  return (
    <ExperimentFrame
      controls={
        <>
          <SliderControl label="Target share in stocks" value={target} onChange={setTarget} min={20} max={90} step={5} format={pct} />
          <SliderControl label="Stock return since last review" value={stockReturn} onChange={setStockReturn} min={-40} max={60} step={5} format={(v) => `${v > 0 ? "+" : ""}${v}%`} />
          <ModelNote>₹1,00,000 split between stocks and cash (cash earns nothing here).</ModelNote>
        </>
      }
      output={
        <>
          <div className="grid grid-cols-2 gap-4">
            <Readout label="Stocks now" value={`${drifted.toFixed(1)}%`} hint={`target ${target}%`} tone={Math.abs(drifted - target) > 5 ? "down" : "neutral"} big />
            <Readout
              label="Rebalancing trade"
              value={Math.abs(trade) < 1 ? "None" : `${trade < 0 ? "Sell" : "Buy"} ₹${Math.abs(Math.round(trade)).toLocaleString("en-IN")}`}
              tone="brand"
              big
            />
          </div>
          <div className="flex flex-col gap-2">
            <HBar label="Target" value={target} max={100} display={`${target}%`} color="var(--subtle)" />
            <HBar label="Drifted" value={drifted} max={100} display={`${drifted.toFixed(1)}%`} color="var(--brand)" />
          </div>
          <p className="text-sm text-muted">
            {stockReturn > 0
              ? "After a rally, stocks become a bigger share — more risk than you chose. Rebalancing sells some winners."
              : stockReturn < 0
                ? "After a fall, stocks shrink below target. Rebalancing buys more, which can feel uncomfortable."
                : "No drift, no trade."}
          </p>
        </>
      }
    />
  );
}
