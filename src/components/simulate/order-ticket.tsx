"use client";

import { useState } from "react";
import { AlertCircle, Minus, Plus, ShoppingCart } from "lucide-react";
import { SIM_CONFIG, STOCK_MAP } from "@/content/market";
import type { Order, OrderSide, SimulationState } from "@/lib/types";
import { formatINR } from "@/lib/engine/money";
import { chargesFor, maxAffordable, validateOrderBatch, type Ledger } from "@/lib/engine/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";

export function ledgerOf(sim: SimulationState): Ledger {
  return { cash: sim.cash, holdings: sim.holdings, realizedPnl: sim.realizedPnl, charges: sim.charges, transactions: sim.transactions };
}

/** Ledger after the staged orders (already validated when they were added). */
export function ledgerAfter(sim: SimulationState, staged: Order[]): Ledger {
  const res = validateOrderBatch(ledgerOf(sim), staged, sim.prices);
  return res.ok ? res.ledger : ledgerOf(sim);
}

export function OrderTicket({
  sim,
  ticker,
  staged,
  onAdd,
}: {
  sim: SimulationState;
  ticker: string;
  staged: Order[];
  onAdd: (order: Order) => void;
}) {
  const [side, setSide] = useState<OrderSide>("buy");
  const [qtyText, setQtyText] = useState("");
  const [touched, setTouched] = useState(false);

  const stock = STOCK_MAP[ticker];
  const price = sim.prices[ticker];
  const after = ledgerAfter(sim, staged);
  const held = after.holdings[ticker]?.quantity ?? 0;
  const maxBuy = maxAffordable(after.cash, price);

  const quantity = qtyText.trim() === "" ? NaN : Number(qtyText);
  const order: Order = { ticker, side, quantity };
  const check = validateOrderBatch(ledgerOf(sim), [...staged, order], sim.prices);
  const error = qtyText.trim() === "" ? "Enter how many shares to " + side + "." : !check.ok ? check.error : null;
  const valid = !error;

  const value = Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity) * price : 0;
  const charges = chargesFor(value);
  const total = side === "buy" ? value + charges : value - charges;

  const setQty = (q: number) => {
    setQtyText(q > 0 ? String(q) : "");
    setTouched(true);
  };
  const presets =
    side === "buy"
      ? [5000, 10000, 25000].map((amt) => ({
          label: `₹${amt / 1000}K`,
          qty: maxAffordable(Math.min(after.cash, amt * 100), price),
        }))
      : [
          { label: "Half", qty: Math.floor(held / 2) },
          { label: "All", qty: held },
        ];

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    onAdd({ ticker, side, quantity });
    setQtyText("");
    setTouched(false);
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      aria-label={`Order ticket for ${stock.name}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-fg">
            {stock.name} <span className="text-muted">· {ticker}</span>
          </p>
          <p className="text-xs text-subtle">Select another stock from the market watch</p>
        </div>
        <p className="num text-lg font-semibold text-fg">{formatINR(price)}</p>
      </div>

      <Segmented<OrderSide>
        label="Order side"
        value={side}
        onChange={(v) => {
          setSide(v);
          setTouched(false);
        }}
        options={[
          { value: "buy", label: "Buy", activeClassName: "!bg-up/20 !text-up" },
          { value: "sell", label: "Sell", activeClassName: "!bg-down/20 !text-down" },
        ]}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor={`qty-${ticker}`} className="flex justify-between text-sm text-muted">
          <span>Quantity (whole shares)</span>
          <span className="num text-xs text-subtle">
            {side === "buy" ? `Max affordable: ${maxBuy}` : `You hold: ${held}`}
          </span>
        </label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="Decrease quantity" onClick={() => setQty(Math.max(0, (Number(qtyText) || 0) - 1))}>
            <Minus />
          </Button>
          <Input
            id={`qty-${ticker}`}
            inputMode="numeric"
            type="number"
            min={1}
            step={1}
            value={qtyText}
            placeholder="0"
            aria-invalid={touched && !valid}
            aria-describedby={`qty-help-${ticker}`}
            onChange={(e) => {
              setQtyText(e.target.value);
              setTouched(true);
            }}
            className="num text-center text-base"
          />
          <Button type="button" variant="outline" size="icon" aria-label="Increase quantity" onClick={() => setQty((Number(qtyText) || 0) + 1)}>
            <Plus />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={p.qty === 0}
              onClick={() => setQty(p.qty)}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg disabled:opacity-40"
            >
              {p.label}
              {p.qty > 0 && <span className="num ml-1 text-subtle">({p.qty})</span>}
            </button>
          ))}
          {side === "buy" && maxBuy > 0 && (
            <button
              type="button"
              onClick={() => setQty(maxBuy)}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:border-border-strong hover:text-fg"
            >
              Max <span className="num text-subtle">({maxBuy})</span>
            </button>
          )}
        </div>
      </div>

      <dl className="num flex flex-col gap-1.5 rounded-xl bg-surface-2/70 p-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Order value</dt>
          <dd className="text-fg">{formatINR(value)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">{SIM_CONFIG.chargeLabel}</dt>
          <dd className="text-fg">{formatINR(charges)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-1.5 font-medium">
          <dt className="text-fg">{side === "buy" ? "Cash needed" : "Cash you receive"}</dt>
          <dd className="text-fg">{formatINR(total)}</dd>
        </div>
        <div className="flex justify-between text-xs">
          <dt className="text-subtle">Cash after staged orders</dt>
          <dd className="text-subtle">{formatINR(after.cash)}</dd>
        </div>
      </dl>

      <p id={`qty-help-${ticker}`} role={touched && error ? "alert" : undefined} className={cn("min-h-5 text-sm", touched && error ? "text-down" : "text-subtle")}>
        {touched && error ? (
          <span className="flex gap-1.5">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </span>
        ) : (
          "Orders fill at the price shown. You can stage several orders, then confirm them together."
        )}
      </p>

      <Button type="submit" variant={side === "buy" ? "buy" : "sell"} disabled={touched && !valid}>
        <ShoppingCart /> Add {side} order
      </Button>
    </form>
  );
}
