import { SIM_CONFIG, STOCK_MAP } from "@/content/market";
import type { Holding, Order, Paise, Transaction } from "@/lib/types";
import { formatINR } from "./money";
import type { PortfolioLike } from "./portfolio";

export interface Ledger extends PortfolioLike {
  realizedPnl: Paise;
  charges: Paise;
  transactions: Transaction[];
}

export type ValidationResult = { ok: true } | { ok: false; error: string };

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

/** Simplified transaction charges for an order value, rounded to the nearest paisa. */
export function chargesFor(value: Paise): Paise {
  return Math.round(value * SIM_CONFIG.chargeRate);
}

export function orderValue(order: Pick<Order, "quantity">, price: Paise): Paise {
  return order.quantity * price;
}

/** Cash needed (buy) or received (sell) for an order, after charges. */
export function netCashImpact(order: Order, price: Paise): Paise {
  const value = orderValue(order, price);
  const charges = chargesFor(value);
  return order.side === "buy" ? -(value + charges) : value - charges;
}

/** Largest whole number of shares affordable with the given cash, including charges. */
export function maxAffordable(cash: Paise, price: Paise): number {
  if (price <= 0 || cash <= 0) return 0;
  let qty = Math.floor(cash / (price * (1 + SIM_CONFIG.chargeRate)));
  // Guard against rounding at the boundary.
  while (qty > 0 && qty * price + chargesFor(qty * price) > cash) qty -= 1;
  while ((qty + 1) * price + chargesFor((qty + 1) * price) <= cash) qty += 1;
  return qty;
}

export function validateOrder(
  ledger: PortfolioLike,
  order: Order,
  prices: Record<string, Paise>,
): ValidationResult {
  const stock = STOCK_MAP[order.ticker];
  if (!stock) return { ok: false, error: `Unknown stock "${order.ticker}".` };
  const price = prices[order.ticker];
  if (!price || price <= 0) return { ok: false, error: `No price is available for ${order.ticker}.` };

  const q = order.quantity;
  if (typeof q !== "number" || !Number.isFinite(q) || Number.isNaN(q)) {
    return { ok: false, error: "Enter a quantity as a whole number of shares." };
  }
  if (!Number.isInteger(q)) {
    return { ok: false, error: "This simulation uses whole shares only — enter a whole number like 5 or 12." };
  }
  if (q <= 0) return { ok: false, error: "Quantity must be at least 1 share." };
  if (q > SIM_CONFIG.maxQuantityPerOrder) {
    return { ok: false, error: `Orders are limited to ${SIM_CONFIG.maxQuantityPerOrder.toLocaleString("en-IN")} shares.` };
  }

  if (order.side === "buy") {
    const value = q * price;
    const needed = value + chargesFor(value);
    if (needed > ledger.cash) {
      const max = maxAffordable(ledger.cash, price);
      return {
        ok: false,
        error:
          `This order needs ${formatINR(needed)} including charges, but you have ${formatINR(ledger.cash)} in cash. ` +
          (max > 0 ? `You can afford up to ${max} share${max === 1 ? "" : "s"} of ${order.ticker}.` : `You can't afford any shares of ${order.ticker} right now.`),
      };
    }
    return { ok: true };
  }

  const held = ledger.holdings[order.ticker]?.quantity ?? 0;
  if (held === 0) {
    return {
      ok: false,
      error: `You don't own any ${order.ticker} shares, so there is nothing to sell. (Short selling isn't part of this simulation.)`,
    };
  }
  if (q > held) {
    return { ok: false, error: `You own ${held} share${held === 1 ? "" : "s"} of ${order.ticker}, so you can sell at most ${held}.` };
  }
  return { ok: true };
}

/** Execute one order at the given price. Throws OrderError if invalid. Returns a new ledger. */
export function executeOrder<T extends Ledger>(
  ledger: T,
  order: Order,
  prices: Record<string, Paise>,
  meta: { round: number; id: string },
): { ledger: T; transaction: Transaction } {
  const check = validateOrder(ledger, order, prices);
  if (!check.ok) throw new OrderError(check.error);

  const price = prices[order.ticker];
  const value = order.quantity * price;
  const charges = chargesFor(value);
  const holdings: Record<string, Holding> = { ...ledger.holdings };
  const existing = holdings[order.ticker] ?? { quantity: 0, costBasis: 0 };
  let realized = 0;
  let cash = ledger.cash;

  if (order.side === "buy") {
    holdings[order.ticker] = {
      quantity: existing.quantity + order.quantity,
      costBasis: existing.costBasis + value,
    };
    cash -= value + charges;
  } else {
    // Remove a proportional slice of cost basis; a full exit removes all of it so no residue remains.
    const basisRemoved =
      order.quantity === existing.quantity
        ? existing.costBasis
        : Math.round((existing.costBasis * order.quantity) / existing.quantity);
    realized = value - basisRemoved;
    const remainingQty = existing.quantity - order.quantity;
    if (remainingQty === 0) {
      delete holdings[order.ticker];
    } else {
      holdings[order.ticker] = { quantity: remainingQty, costBasis: existing.costBasis - basisRemoved };
    }
    cash += value - charges;
  }

  const transaction: Transaction = {
    id: meta.id,
    round: meta.round,
    ticker: order.ticker,
    side: order.side,
    quantity: order.quantity,
    price,
    value,
    charges,
    realizedPnl: realized,
  };

  return {
    ledger: {
      ...ledger,
      cash,
      holdings,
      realizedPnl: ledger.realizedPnl + realized,
      charges: ledger.charges + charges,
      transactions: [...ledger.transactions, transaction],
    },
    transaction,
  };
}

/**
 * Validate a batch of orders in sequence (later orders see the effect of earlier ones).
 * Returns the index and message of the first failure, if any.
 */
export function validateOrderBatch(
  ledger: Ledger,
  orders: Order[],
  prices: Record<string, Paise>,
): { ok: true; ledger: Ledger } | { ok: false; index: number; error: string } {
  let current = ledger;
  for (let i = 0; i < orders.length; i++) {
    const check = validateOrder(current, orders[i], prices);
    if (!check.ok) return { ok: false, index: i, error: check.error };
    current = executeOrder(current, orders[i], prices, { round: 0, id: `preview-${i}` }).ledger;
  }
  return { ok: true, ledger: current };
}
