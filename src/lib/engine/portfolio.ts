import { SECTOR_ORDER, SIM_CONFIG, STOCK_MAP } from "@/content/market";
import type { Holding, Paise, SectorId } from "@/lib/types";
import { pctOf } from "./money";

/** Minimal shape needed to value a portfolio, so alternatives can reuse these helpers. */
export interface PortfolioLike {
  cash: Paise;
  holdings: Record<string, Holding>;
}

export function holdingsValue(p: PortfolioLike, prices: Record<string, Paise>): Paise {
  let total = 0;
  for (const [ticker, h] of Object.entries(p.holdings)) {
    total += h.quantity * (prices[ticker] ?? 0);
  }
  return total;
}

/** Portfolio value = available cash + current market value of holdings. */
export function portfolioValue(p: PortfolioLike, prices: Record<string, Paise>): Paise {
  return p.cash + holdingsValue(p, prices);
}

export function costBasisTotal(p: PortfolioLike): Paise {
  return Object.values(p.holdings).reduce((sum, h) => sum + h.costBasis, 0);
}

export function unrealizedPnl(p: PortfolioLike, prices: Record<string, Paise>): Paise {
  return holdingsValue(p, prices) - costBasisTotal(p);
}

/** Total P&L = portfolio value − initial capital (no deposits/withdrawals are modelled). */
export function totalPnl(p: PortfolioLike, prices: Record<string, Paise>): Paise {
  return portfolioValue(p, prices) - SIM_CONFIG.initialCapital;
}

export function totalReturnPct(p: PortfolioLike, prices: Record<string, Paise>): number {
  return pctOf(totalPnl(p, prices), SIM_CONFIG.initialCapital);
}

export interface HoldingView {
  ticker: string;
  name: string;
  sector: SectorId;
  quantity: number;
  avgCost: Paise;
  price: Paise;
  value: Paise;
  costBasis: Paise;
  unrealized: Paise;
  unrealizedPct: number;
  weightPct: number;
}

export function holdingViews(p: PortfolioLike, prices: Record<string, Paise>): HoldingView[] {
  const total = portfolioValue(p, prices);
  return Object.entries(p.holdings)
    .filter(([, h]) => h.quantity > 0)
    .map(([ticker, h]) => {
      const stock = STOCK_MAP[ticker];
      const price = prices[ticker] ?? 0;
      const value = h.quantity * price;
      return {
        ticker,
        name: stock?.name ?? ticker,
        sector: stock?.sector ?? "consumer",
        quantity: h.quantity,
        avgCost: Math.round(h.costBasis / h.quantity),
        price,
        value,
        costBasis: h.costBasis,
        unrealized: value - h.costBasis,
        unrealizedPct: pctOf(value - h.costBasis, h.costBasis),
        weightPct: pctOf(value, total),
      };
    })
    .sort((a, b) => b.value - a.value);
}

export interface AllocationSlice {
  id: SectorId | "cash";
  value: Paise;
  pct: number;
}

/** Sector allocation of the total portfolio (including cash), in fixed sector order. */
export function sectorAllocation(p: PortfolioLike, prices: Record<string, Paise>): AllocationSlice[] {
  const total = portfolioValue(p, prices);
  const bySector = new Map<SectorId, Paise>();
  for (const [ticker, h] of Object.entries(p.holdings)) {
    const sector = STOCK_MAP[ticker]?.sector;
    if (!sector || h.quantity <= 0) continue;
    bySector.set(sector, (bySector.get(sector) ?? 0) + h.quantity * (prices[ticker] ?? 0));
  }
  const slices: AllocationSlice[] = SECTOR_ORDER.filter((s) => (bySector.get(s) ?? 0) > 0).map((s) => ({
    id: s,
    value: bySector.get(s)!,
    pct: pctOf(bySector.get(s)!, total),
  }));
  slices.push({ id: "cash", value: p.cash, pct: pctOf(p.cash, total) });
  return slices;
}

export interface ConcentrationStats {
  investedPct: number;
  cashPct: number;
  /** Largest sector weight as % of the total portfolio. */
  maxSectorPct: number;
  maxSector: SectorId | null;
  /** Largest single-stock weight as % of the total portfolio. */
  maxPositionPct: number;
  maxPosition: string | null;
  sectorCount: number;
  /** 1 / HHI of sector weights within the invested portion. 0 when nothing is invested. */
  effectiveSectors: number;
}

export function concentration(p: PortfolioLike, prices: Record<string, Paise>): ConcentrationStats {
  const total = portfolioValue(p, prices);
  const invested = holdingsValue(p, prices);
  const slices = sectorAllocation(p, prices).filter((s) => s.id !== "cash");
  const views = holdingViews(p, prices);

  let hhi = 0;
  for (const s of slices) {
    const w = invested > 0 ? s.value / invested : 0;
    hhi += w * w;
  }
  const topSector = slices.reduce<AllocationSlice | null>((top, s) => (!top || s.value > top.value ? s : top), null);
  const topPosition = views[0] ?? null;

  return {
    investedPct: pctOf(invested, total),
    cashPct: pctOf(p.cash, total),
    maxSectorPct: topSector ? topSector.pct : 0,
    maxSector: topSector ? (topSector.id as SectorId) : null,
    maxPositionPct: topPosition ? topPosition.weightPct : 0,
    maxPosition: topPosition ? topPosition.ticker : null,
    sectorCount: slices.length,
    effectiveSectors: hhi > 0 ? Math.round((1 / hhi) * 100) / 100 : 0,
  };
}
