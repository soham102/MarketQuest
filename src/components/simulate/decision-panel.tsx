"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Hand, Trash2 } from "lucide-react";
import type { Order, RoundDefinition, SimulationState } from "@/lib/types";
import { formatINR } from "@/lib/engine/money";
import { chargesFor } from "@/lib/engine/orders";
import { portfolioValue } from "@/lib/engine/portfolio";
import { actions } from "@/lib/store/store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ledgerAfter } from "./order-ticket";

export function StagedOrders({ orders, prices, onRemove }: { orders: Order[]; prices: Record<string, number>; onRemove?: (i: number) => void }) {
  if (orders.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-dashed border-border-strong px-3 py-3 text-sm text-muted">
        <Hand className="size-4 shrink-0" aria-hidden />
        <span>
          No orders staged — confirming now means you <span className="font-medium text-fg">hold</span> this round.
        </span>
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {orders.map((o, i) => {
        const value = o.quantity * prices[o.ticker];
        return (
          <li key={i} className="flex items-center gap-3 rounded-lg border border-border bg-surface-2/50 px-3 py-2 text-sm">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] font-bold uppercase",
                o.side === "buy" ? "bg-up/15 text-up" : "bg-down/15 text-down",
              )}
            >
              {o.side}
            </span>
            <span className="flex-1">
              <span className="num font-medium text-fg">{o.quantity}</span> × {o.ticker}
              <span className="num block text-xs text-subtle">
                {formatINR(value)} + {formatINR(chargesFor(value))} charges
              </span>
            </span>
            {onRemove && (
              <Button variant="ghost" size="icon" className="size-8" aria-label={`Remove ${o.side} ${o.quantity} ${o.ticker}`} onClick={() => onRemove(i)}>
                <Trash2 />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ChoiceGroup({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: { id: string; text: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-fg">{legend}</legend>
      {options.map((o) => (
        <label
          key={o.id}
          className={cn(
            "flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
            value === o.id ? "border-brand bg-brand/10 text-fg" : "border-border text-fg/85 hover:border-border-strong hover:bg-surface-2",
          )}
        >
          <input
            type="radio"
            name={name}
            value={o.id}
            checked={value === o.id}
            onChange={() => onChange(o.id)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
          />
          {o.text}
        </label>
      ))}
    </fieldset>
  );
}

export function DecisionPanel({
  round,
  sim,
  staged,
  onRemove,
}: {
  round: RoundDefinition;
  sim: SimulationState;
  staged: Order[];
  onRemove: (i: number) => void;
}) {
  const [rationale, setRationale] = useState("");
  const [risk, setRisk] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const after = ledgerAfter(sim, staged);
  const ready = rationale !== "" && risk !== "";
  const rationaleText = round.rationales.find((r) => r.id === rationale)?.text;

  const confirm = () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      actions.submitDecision(round.id, { orders: staged, rationaleId: rationale, riskId: risk });
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong resolving this round.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="staged-heading" className="flex flex-col gap-3">
        <h3 id="staged-heading" className="text-sm font-semibold uppercase tracking-wider text-subtle">
          Your orders this round
        </h3>
        <StagedOrders orders={staged} prices={sim.prices} onRemove={onRemove} />
      </section>

      <ChoiceGroup legend={round.rationaleQuestion} name={`rationale-${round.id}`} options={round.rationales} value={rationale} onChange={setRationale} />
      <ChoiceGroup legend={round.riskQuestion} name={`risk-${round.id}`} options={round.risks} value={risk} onChange={setRisk} />

      {error && (
        <p role="alert" className="flex gap-2 rounded-lg border border-down/40 bg-down/10 p-3 text-sm text-down">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button size="lg" disabled={!ready || submitting} onClick={() => setOpen(true)}>
          <CheckCircle2 /> Review &amp; confirm decision
        </Button>
        {!ready && <p className="text-center text-xs text-subtle">Choose your reasoning and the main risk to continue.</p>}
      </div>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={staged.length ? `Confirm ${staged.length} order${staged.length === 1 ? "" : "s"}` : "Confirm: hold this round"}
        confirmLabel={submitting ? "Resolving…" : "Confirm & see what happens"}
        onConfirm={confirm}
        description={
          <div className="flex flex-col gap-4">
            <StagedOrders orders={staged} prices={sim.prices} />
            <dl className="num grid grid-cols-2 gap-2 rounded-lg bg-surface-2 p-3 text-sm">
              <dt className="text-muted">Cash after orders</dt>
              <dd className="text-right font-medium text-fg">{formatINR(after.cash)}</dd>
              <dt className="text-muted">Portfolio value</dt>
              <dd className="text-right font-medium text-fg">{formatINR(portfolioValue(after, sim.prices))}</dd>
            </dl>
            {rationaleText && (
              <p className="text-sm">
                <span className="text-subtle">Your reasoning: </span>
                <span className="text-fg/90">{rationaleText}</span>
              </p>
            )}
            <p className="text-xs text-subtle">
              Once confirmed, this round can&apos;t be changed. The scenario&apos;s next developments will then play out.
            </p>
          </div>
        }
      />
    </div>
  );
}
