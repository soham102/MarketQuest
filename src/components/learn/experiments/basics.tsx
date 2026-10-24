"use client";

import { useState } from "react";
import { chargesFor } from "@/lib/engine/orders";
import { formatINR, formatPct, pctOf } from "@/lib/engine/money";
import { Segmented } from "@/components/ui/segmented";
import { ExperimentFrame, HBar, ModelNote, Readout, SliderControl } from "./frame";

const rupees = (v: number) => `₹${v.toLocaleString("en-IN")}`;

/* ------------------------------------------------------------------ */
/* What is a stock? — ownership lab                                    */
/* ------------------------------------------------------------------ */

const TOTAL_SHARES = 35_00_00_000; // 35 crore shares
const BUY_PRICE = 520;

export function OwnershipExperiment() {
  const [shares, setShares] = useState(20);
  const [price, setPrice] = useState(551);
  const cost = shares * BUY_PRICE * 100;
  const value = shares * price * 100;
  const change = value - cost;
  const marketCap = (TOTAL_SHARES * price) / 1_00_00_000; // in crore

  return (
    <ExperimentFrame
      controls={
        <>
          <SliderControl label="Shares you buy at ₹520" value={shares} onChange={setShares} min={1} max={200} format={(v) => `${v} shares`} />
          <SliderControl label="Share price later" value={price} onChange={setPrice} min={300} max={800} format={rupees} />
          <ModelNote>Kriti Foods has 35 crore shares in total. Buying shares doesn&apos;t change the company — only who owns it.</ModelNote>
        </>
      }
      output={
        <>
          <div className="grid grid-cols-2 gap-4">
            <Readout label="You paid" value={formatINR(cost, { whole: true })} />
            <Readout label="Worth now" value={formatINR(value, { whole: true })} />
            <Readout
              label="Unrealised P&L"
              value={`${formatINR(change, { whole: true, signed: true })}`}
              tone={change > 0 ? "up" : change < 0 ? "down" : "neutral"}
              hint={formatPct(pctOf(change, cost), { signed: true })}
            />
            <Readout label="Company value" value={`₹${Math.round(marketCap).toLocaleString("en-IN")} cr`} hint="Price × 35 crore shares" />
          </div>
          <div className="rounded-lg bg-surface-3/60 p-3 text-sm text-muted">
            You own <span className="num font-semibold text-fg">1 in {Math.round(TOTAL_SHARES / shares).toLocaleString("en-IN")}</span> shares of
            Kriti Foods — and the same share of its future profits.
          </div>
          <div className="flex flex-col gap-2">
            <HBar label="Cost" value={cost} max={200 * 800 * 100} display={formatINR(cost, { whole: true })} color="var(--subtle)" />
            <HBar label="Value now" value={value} max={200 * 800 * 100} display={formatINR(value, { whole: true })} color={change >= 0 ? "var(--up)" : "var(--down)"} />
          </div>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Portfolio value & P&L — calculator                                  */
/* ------------------------------------------------------------------ */

export function PortfolioValueExperiment() {
  const [buy, setBuy] = useState(500);
  const [now, setNow] = useState(560);
  const [sell, setSell] = useState(8);
  const qty = 20;
  const startCash = 100_000_00;

  const buyValue = qty * buy * 100;
  const buyCharges = chargesFor(buyValue);
  const sellValue = sell * now * 100;
  const sellCharges = sell > 0 ? chargesFor(sellValue) : 0;
  const realized = sell * (now - buy) * 100;
  const remaining = qty - sell;
  const unrealized = remaining * (now - buy) * 100;
  const cash = startCash - buyValue - buyCharges + sellValue - sellCharges;
  const holdings = remaining * now * 100;
  const total = cash + holdings;
  const charges = buyCharges + sellCharges;
  const pnl = total - startCash;

  return (
    <ExperimentFrame
      controls={
        <>
          <SliderControl label="Buy price (20 shares)" value={buy} onChange={setBuy} min={300} max={800} step={5} format={rupees} />
          <SliderControl label="Current price" value={now} onChange={setNow} min={300} max={800} step={5} format={rupees} />
          <SliderControl label="Shares sold at current price" value={sell} onChange={setSell} min={0} max={20} format={(v) => `${v} of 20`} />
          <ModelNote>Starting cash ₹1,00,000. Charges are 0.10% of each order&apos;s value, as in the simulation.</ModelNote>
        </>
      }
      output={
        <>
          <div className="grid grid-cols-2 gap-4">
            <Readout label="Cash" value={formatINR(cash)} />
            <Readout label={`Holdings (${remaining} sh)`} value={formatINR(holdings)} />
            <Readout label="Portfolio value" value={formatINR(total)} big />
            <Readout label="Total P&L" value={formatINR(pnl, { signed: true })} tone={pnl > 0 ? "up" : pnl < 0 ? "down" : "neutral"} big />
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <HBar label="Realised" value={realized / 100} min={-10000} max={10000} display={formatINR(realized, { whole: true, signed: true })} color={realized >= 0 ? "var(--up)" : "var(--down)"} />
            <HBar label="Unrealised" value={unrealized / 100} min={-10000} max={10000} display={formatINR(unrealized, { whole: true, signed: true })} color={unrealized >= 0 ? "var(--up)" : "var(--down)"} />
            <HBar label="Charges" value={-charges / 100} min={-10000} max={10000} display={formatINR(-charges, { signed: true })} color="var(--warn)" />
          </div>
          <p className="num rounded-lg bg-surface-3/60 p-3 text-xs text-muted">
            Check: realised {formatINR(realized, { signed: true })} + unrealised {formatINR(unrealized, { signed: true })} − charges {formatINR(charges)} ={" "}
            <span className="font-semibold text-fg">{formatINR(realized + unrealized - charges, { signed: true })}</span>
          </p>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Order types — order book simulator                                  */
/* ------------------------------------------------------------------ */

type Level = { price: number; qty: number };
const ASKS: Level[] = [
  { price: 520.0, qty: 100 },
  { price: 520.5, qty: 150 },
  { price: 521.0, qty: 300 },
  { price: 522.0, qty: 450 },
];
const BIDS: Level[] = [
  { price: 519.5, qty: 120 },
  { price: 519.0, qty: 200 },
  { price: 518.5, qty: 250 },
  { price: 518.0, qty: 400 },
];
/** Bids left after a fast fall, used to illustrate stop-loss slippage. */
const BIDS_AFTER_FALL: Level[] = [
  { price: 509.0, qty: 80 },
  { price: 507.5, qty: 150 },
  { price: 505.0, qty: 300 },
  { price: 502.0, qty: 600 },
];

function fill(levels: Level[], qty: number, accept: (p: number) => boolean) {
  const fills: Level[] = [];
  let left = qty;
  for (const l of levels) {
    if (left <= 0 || !accept(l.price)) break;
    const q = Math.min(left, l.qty);
    fills.push({ price: l.price, qty: q });
    left -= q;
  }
  return { fills, unfilled: left };
}

type OrderKind = "market" | "limit" | "stop";

export function OrderBookExperiment() {
  const [kind, setKind] = useState<OrderKind>("market");
  const [qty, setQty] = useState(200);
  const [limit, setLimit] = useState(520);
  const stopTrigger = 512;

  const result =
    kind === "market"
      ? fill(ASKS, qty, () => true)
      : kind === "limit"
        ? fill(ASKS, qty, (p) => p <= limit)
        : fill(BIDS_AFTER_FALL, qty, () => true);
  const filledQty = qty - result.unfilled;
  const avg = filledQty ? result.fills.reduce((s, f) => s + f.price * f.qty, 0) / filledQty : 0;

  return (
    <ExperimentFrame
      controls={
        <>
          <Segmented<OrderKind>
            label="Order type"
            value={kind}
            onChange={setKind}
            options={[
              { value: "market", label: "Market buy" },
              { value: "limit", label: "Limit buy" },
              { value: "stop", label: "Stop-loss" },
            ]}
          />
          <SliderControl label="Quantity" value={qty} onChange={setQty} min={10} max={1000} step={10} format={(v) => `${v} shares`} />
          {kind === "limit" && (
            <SliderControl label="Your limit price" value={limit} onChange={setLimit} min={518} max={522} step={0.5} format={(v) => `₹${v.toFixed(2)}`} />
          )}
          {kind === "stop" && (
            <ModelNote>
              You hold shares at ₹520 with a stop-loss trigger at ₹{stopTrigger}. Bad news hits and the price gaps down past your trigger. Your
              sell order fills against whoever is still bidding.
            </ModelNote>
          )}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <BookSide title={kind === "stop" ? "Bids after the fall" : "Bids (buyers)"} levels={kind === "stop" ? BIDS_AFTER_FALL : BIDS} tone="up" />
            <BookSide title="Asks (sellers)" levels={ASKS} tone="down" />
          </div>
        </>
      }
      output={
        <>
          <div className="grid grid-cols-3 gap-4">
            <Readout label="Filled" value={`${filledQty}`} hint={`of ${qty}`} />
            <Readout label="Avg price" value={filledQty ? `₹${avg.toFixed(2)}` : "—"} />
            <Readout
              label={kind === "stop" ? "vs trigger" : "vs best ask"}
              value={filledQty ? `${(((avg - (kind === "stop" ? stopTrigger : ASKS[0].price)) / (kind === "stop" ? stopTrigger : ASKS[0].price)) * 100).toFixed(2)}%` : "—"}
              tone={kind === "stop" ? "down" : "neutral"}
            />
          </div>
          <table className="w-full text-sm">
            <caption className="mb-2 text-left text-xs uppercase tracking-wider text-subtle">Fills</caption>
            <thead>
              <tr className="text-left text-xs text-subtle">
                <th className="pb-1 font-medium">Price</th>
                <th className="pb-1 text-right font-medium">Shares</th>
                <th className="pb-1 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {result.fills.map((f) => (
                <tr key={f.price} className="num border-t border-border/60">
                  <td className="py-1.5">₹{f.price.toFixed(2)}</td>
                  <td className="py-1.5 text-right">{f.qty}</td>
                  <td className="py-1.5 text-right">₹{(f.price * f.qty).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
              {result.unfilled > 0 && (
                <tr className="border-t border-border/60 text-warn">
                  <td className="py-1.5" colSpan={3}>
                    {result.unfilled} shares {kind === "limit" ? "wait in the book at your limit" : "unfilled — not enough liquidity shown"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="text-sm text-muted">
            {kind === "market" && "A market order takes whatever is available. Bigger orders 'walk the book' to worse prices."}
            {kind === "limit" && "A limit order never pays more than your price — but it may only partly fill, or not at all."}
            {kind === "stop" && `Your stop triggered at ₹${stopTrigger}, but the fill came below it — slippage in a fast-moving market.`}
          </p>
        </>
      }
    />
  );
}

function BookSide({ title, levels, tone }: { title: string; levels: Level[]; tone: "up" | "down" }) {
  return (
    <table className="w-full">
      <caption className="mb-1 text-left text-subtle">{title}</caption>
      <tbody>
        {levels.map((l) => (
          <tr key={l.price} className="num">
            <td className={tone === "up" ? "text-up" : "text-down"}>₹{l.price.toFixed(2)}</td>
            <td className="text-right text-muted">{l.qty}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
