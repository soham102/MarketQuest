import { RISK_PROFILES } from "@/content/market";
import { SCORING, type DimensionId } from "@/content/scoring";
import type {
  DecisionAction,
  DecisionPath,
  Order,
  Paise,
  PathMatcher,
  RiskProfileId,
  RoundDefinition,
  RoundScores,
  SimulationState,
  ConceptProgress,
} from "@/lib/types";
import { concentration, holdingsValue, portfolioValue, type PortfolioLike } from "./portfolio";
import { pctOf } from "./money";

/** Net direction of a set of orders. Mixed orders resolve by net cash flow. */
export function netAction(orders: Order[], prices: Record<string, Paise>): DecisionAction {
  if (orders.length === 0) return "hold";
  let net = 0;
  for (const o of orders) net += (o.side === "buy" ? 1 : -1) * o.quantity * (prices[o.ticker] ?? 0);
  return net >= 0 ? "buy" : "sell";
}

function netFlowFor(orders: Order[], tickers: string[] | undefined, prices: Record<string, Paise>) {
  let buy = 0;
  let sell = 0;
  for (const o of orders) {
    if (tickers && !tickers.includes(o.ticker)) continue;
    const v = o.quantity * (prices[o.ticker] ?? 0);
    if (o.side === "buy") buy += v;
    else sell += v;
  }
  return { buy, sell };
}

export interface MatchContext {
  orders: Order[];
  prices: Record<string, Paise>;
  /** Portfolio immediately after trades, before outcome moves. */
  after: PortfolioLike;
  profile: RiskProfileId;
}

/** Whether a portfolio respects every limit of a risk profile. */
export function withinProfile(after: PortfolioLike, prices: Record<string, Paise>, profileId: RiskProfileId): boolean {
  const profile = RISK_PROFILES[profileId];
  const c = concentration(after, prices);
  return (
    c.maxSectorPct <= profile.maxSectorPct &&
    c.maxPositionPct <= profile.maxPositionPct &&
    Math.abs(c.investedPct - profile.targetInvestedPct) <= SCORING.profileTolerancePct
  );
}

export function matches(m: PathMatcher, ctx: MatchContext): boolean {
  switch (m.kind) {
    case "hold":
      return ctx.orders.length === 0;
    case "buy": {
      const { buy, sell } = netFlowFor(ctx.orders, m.tickers, ctx.prices);
      if (buy <= sell) return false;
      if (m.minExposurePct === undefined && m.maxExposurePct === undefined) return true;
      const total = portfolioValue(ctx.after, ctx.prices);
      const tickers = m.tickers ?? Object.keys(ctx.after.holdings);
      const exposure = tickers.reduce((s, t) => s + (ctx.after.holdings[t]?.quantity ?? 0) * (ctx.prices[t] ?? 0), 0);
      const pct = pctOf(exposure, total);
      if (m.minExposurePct !== undefined && pct < m.minExposurePct) return false;
      if (m.maxExposurePct !== undefined && pct > m.maxExposurePct) return false;
      return true;
    }
    case "sell": {
      const { buy, sell } = netFlowFor(ctx.orders, m.tickers, ctx.prices);
      if (sell <= buy) return false;
      if (m.fullExit) {
        const tickers = m.tickers ?? [];
        return tickers.every((t) => (ctx.after.holdings[t]?.quantity ?? 0) === 0);
      }
      return true;
    }
    case "portfolio": {
      if (m.traded !== undefined && m.traded !== ctx.orders.length > 0) return false;
      if (m.action !== undefined && m.action !== netAction(ctx.orders, ctx.prices)) return false;
      if (m.withinProfile !== undefined && m.withinProfile !== withinProfile(ctx.after, ctx.prices, ctx.profile)) return false;
      const c = concentration(ctx.after, ctx.prices);
      if (m.maxSectorPct !== undefined && c.maxSectorPct > m.maxSectorPct) return false;
      if (m.minSectorPct !== undefined && c.maxSectorPct < m.minSectorPct) return false;
      if (m.minCashPct !== undefined && c.cashPct < m.minCashPct) return false;
      if (m.maxCashPct !== undefined && c.cashPct > m.maxCashPct) return false;
      return true;
    }
    case "other":
      return true;
  }
}

export function classifyPath(round: RoundDefinition, ctx: MatchContext): DecisionPath {
  return round.paths.find((p) => matches(p.match, ctx)) ?? round.paths[round.paths.length - 1];
}

export function sizingScore(after: PortfolioLike, prices: Record<string, Paise>, profileId: RiskProfileId): number {
  const profile = RISK_PROFILES[profileId];
  const c = concentration(after, prices);
  const s = SCORING.risk.sizing;
  if (c.maxPositionPct > profile.maxPositionPct * 1.5 || c.maxSectorPct > profile.maxSectorPct * 1.5) return s.severe;
  if (c.maxPositionPct > profile.maxPositionPct || c.maxSectorPct > profile.maxSectorPct) return s.breached;
  return s.withinLimits;
}

export function diversificationScore(
  after: PortfolioLike,
  prices: Record<string, Paise>,
  profileId: RiskProfileId,
): number | null {
  const total = portfolioValue(after, prices);
  const invested = holdingsValue(after, prices);
  const rules = SCORING.diversification;
  if (pctOf(invested, total) < rules.minInvestedPct) return null;
  const c = concentration(after, prices);
  let score = Math.round(((c.effectiveSectors - 1) / (rules.fullScoreSectors - 1)) * 100);
  score = Math.max(0, Math.min(100, score));
  if (c.maxSectorPct <= RISK_PROFILES[profileId].maxSectorPct) score = Math.max(score, rules.withinCapFloor);
  return score;
}

export function scoreRound(
  round: RoundDefinition,
  input: { rationaleId: string; riskId: string; path: DecisionPath; orders: Order[] },
  ctx: MatchContext,
  profileId: RiskProfileId,
): RoundScores {
  const rationale = round.rationales.find((r) => r.id === input.rationaleId);
  const risk = round.risks.find((r) => r.id === input.riskId);
  const rationaleScore = rationale?.score ?? 0;
  const reasoning = Math.round(
    rationaleScore * SCORING.reasoning.rationaleWeight + input.path.score * SCORING.reasoning.pathWeight,
  );
  const riskScore = Math.round(
    (risk?.score ?? 0) * SCORING.risk.choiceWeight + sizingScore(ctx.after, ctx.prices, profileId) * SCORING.risk.sizingWeight,
  );
  const action = netAction(input.orders, ctx.prices);
  return {
    reasoning,
    risk: riskScore,
    diversification: diversificationScore(ctx.after, ctx.prices, profileId),
    consistent: rationale ? rationale.impliedActions.includes(action) : false,
    comprehension: null,
  };
}

/* ------------------------------------------------------------------ */
/* Aggregate learning assessment                                       */
/* ------------------------------------------------------------------ */

export interface DimensionResult {
  id: DimensionId;
  name: string;
  description: string;
  score: number | null;
  /** How many observations fed this score; shown so users don't over-read small samples. */
  samples: number;
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function assessLearning(
  sim: SimulationState | null,
  concepts: Record<string, ConceptProgress>,
): { dimensions: DimensionResult[]; overall: number | null } {
  const rounds = sim?.rounds ?? [];
  const quizAnswers = Object.values(concepts).flatMap((c) => Object.values(c.quiz));
  const checkAnswers = rounds.filter((r) => r.scores.comprehension !== null).map((r) => r.scores.comprehension!);
  const comprehensionSamples = [...quizAnswers.map((q) => (q.correct ? 100 : 0)), ...checkAnswers];

  const values: Record<DimensionId, { score: number | null; samples: number }> = {
    comprehension: { score: avg(comprehensionSamples), samples: comprehensionSamples.length },
    reasoning: { score: avg(rounds.map((r) => r.scores.reasoning)), samples: rounds.length },
    risk: { score: avg(rounds.map((r) => r.scores.risk)), samples: rounds.length },
    diversification: (() => {
      const scored = rounds.map((r) => r.scores.diversification).filter((s): s is number => s !== null);
      return { score: avg(scored), samples: scored.length };
    })(),
    consistency: {
      score: rounds.length ? Math.round((rounds.filter((r) => r.scores.consistent).length / rounds.length) * 100) : null,
      samples: rounds.length,
    },
  };

  const dimensions = SCORING.dimensions.map((d) => ({ ...d, ...values[d.id] }));
  const scored = dimensions.map((d) => d.score).filter((s): s is number => s !== null);
  return { dimensions, overall: avg(scored) };
}
