import type { Paise } from "@/lib/types";

/** Convert rupees (possibly fractional) to integer paise. */
export function toPaise(rupees: number): Paise {
  return Math.round(rupees * 100);
}

export function toRupees(paise: Paise): number {
  return paise / 100;
}

/** Apply a percentage move to a price and round to the nearest paisa. */
export function applyPct(price: Paise, pct: number): Paise {
  // Work in hundredths of a percent to avoid binary-fraction drift.
  const bps = Math.round(pct * 100);
  return Math.round((price * (10000 + bps)) / 10000);
}

/** Integer-safe percentage (as a number with 2 dp) of part over whole. */
export function pctOf(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 10000) / 100;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format paise as ₹1,00,000.00 (Indian digit grouping). */
export function formatINR(paise: Paise, opts: { whole?: boolean; signed?: boolean } = {}): string {
  const formatter = opts.whole ? inrWhole : inr;
  const text = formatter.format(Math.abs(paise) / 100);
  if (paise < 0) return `−${text}`;
  if (opts.signed && paise > 0) return `+${text}`;
  return text;
}

/** Compact rupee format for chart axes: ₹1.2L, ₹95K. */
export function formatINRCompact(paise: Paise): string {
  const r = paise / 100;
  const abs = Math.abs(r);
  const sign = r < 0 ? "−" : "";
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

export function formatPct(pct: number, opts: { signed?: boolean; digits?: number } = {}): string {
  const digits = opts.digits ?? 2;
  const text = `${Math.abs(pct).toFixed(digits)}%`;
  if (pct < 0) return `−${text}`;
  if (opts.signed && pct > 0) return `+${text}`;
  return text;
}
