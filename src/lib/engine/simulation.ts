import { SIM_CONFIG, STOCKS } from "@/content/market";
import { ROUNDS, getRound } from "@/content/rounds";
import type {
  AlternativeDecision,
  Holding,
  Order,
  Paise,
  PriceMove,
  PricePoint,
  RiskProfileId,
  RoundDefinition,
  RoundRecord,
  SimulationState,
} from "@/lib/types";
import { classifyPath, scoreRound } from "./assessment";
import { applyPct } from "./money";
import { executeOrder, maxAffordable, OrderError, type Ledger } from "./orders";
import { portfolioValue } from "./portfolio";

export class SimulationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationError";
  }
}

/* ------------------------------------------------------------------ */
/* Prices                                                              */
/* ------------------------------------------------------------------ */

export function applyMoves(prices: Record<string, Paise>, moves: PriceMove[]): Record<string, Paise> {
  const next = { ...prices };
  for (const m of moves) {
    if (next[m.ticker] === undefined) throw new SimulationError(`Move references unknown ticker ${m.ticker}`);
    next[m.ticker] = applyPct(next[m.ticker], m.pct);
  }
  return next;
}

/** Deterministic pre-simulation history, computed backwards from each stock's start price. */
export function buildPreHistory(): Record<string, PricePoint[]> {
  const history: Record<string, PricePoint[]> = {};
  for (const s of STOCKS) {
    const points: PricePoint[] = [{ label: "Start", price: s.startPrice }];
    let p = s.startPrice;
    for (let i = s.preHistory.length - 1; i >= 0; i--) {
      p = Math.round((p * 10000) / (10000 + Math.round(s.preHistory[i] * 100)));
      points.unshift({ label: `W−${s.preHistory.length - i}`, price: p });
    }
    history[s.ticker] = points;
  }
  return history;
}

function appendHistory(
  history: Record<string, PricePoint[]>,
  prices: Record<string, Paise>,
  label: string,
): Record<string, PricePoint[]> {
  const next: Record<string, PricePoint[]> = {};
  for (const [ticker, points] of Object.entries(history)) {
    next[ticker] = [...points, { label, price: prices[ticker] }];
  }
  return next;
}

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */

function openRound(state: SimulationState, round: RoundDefinition): SimulationState {
  if (!round.marketOpen) return state;
  const prices = applyMoves(state.prices, round.marketOpen.moves);
  return {
    ...state,
    prices,
    priceHistory: appendHistory(state.priceHistory, prices, `R${round.id} open`),
  };
}

export function createSimulation(profile: RiskProfileId, now: number = Date.now()): SimulationState {
  const prices = Object.fromEntries(STOCKS.map((s) => [s.ticker, s.startPrice]));
  const base: SimulationState = {
    status: "in-progress",
    profile,
    startedAt: now,
    currentRound: 1,
    phase: "decision",
    cash: SIM_CONFIG.initialCapital,
    holdings: {},
    prices,
    priceHistory: buildPreHistory(),
    valueHistory: [{ label: "Start", round: 0, value: SIM_CONFIG.initialCapital }],
    transactions: [],
    realizedPnl: 0,
    charges: 0,
    rounds: [],
  };
  return openRound(base, getRound(1));
}

export interface Decision {
  orders: Order[];
  rationaleId: string;
  riskId: string;
}

/**
 * Execute the user's confirmed orders at decision-time prices, then apply the round's
 * scripted outcome. A round can be resolved exactly once.
 */
export function resolveRound(state: SimulationState, roundId: number, decision: Decision): SimulationState {
  if (state.status !== "in-progress") throw new SimulationError("The simulation is already complete.");
  if (roundId !== state.currentRound) throw new SimulationError(`Round ${roundId} is not the current round.`);
  if (state.phase !== "decision" || state.rounds.some((r) => r.round === roundId)) {
    throw new SimulationError(`Round ${roundId} has already been resolved.`);
  }
  const round = getRound(roundId);
  if (!round.rationales.some((r) => r.id === decision.rationaleId)) throw new SimulationError("Choose the reasoning behind your decision.");
  if (!round.risks.some((r) => r.id === decision.riskId)) throw new SimulationError("Choose the main risk you considered.");

  const pricesBefore = state.prices;
  const valueStart = state.valueHistory[state.valueHistory.length - 1]?.value ?? SIM_CONFIG.initialCapital;
  const valueBefore = portfolioValue(state, pricesBefore);

  // 1. Execute orders sequentially at decision-time prices.
  let ledger: Ledger = {
    cash: state.cash,
    holdings: state.holdings,
    realizedPnl: state.realizedPnl,
    charges: state.charges,
    transactions: state.transactions,
  };
  const transactionIds: string[] = [];
  decision.orders.forEach((order, i) => {
    try {
      const res = executeOrder(ledger, order, pricesBefore, { round: roundId, id: `r${roundId}-t${i + 1}` });
      ledger = res.ledger;
      transactionIds.push(res.transaction.id);
    } catch (e) {
      if (e instanceof OrderError) throw new OrderError(`Order ${i + 1}: ${e.message}`);
      throw e;
    }
  });
  const valueAfterTrades = portfolioValue(ledger, pricesBefore);

  // 2. Classify and score the decision on information available before the outcome.
  const ctx = { orders: decision.orders, prices: pricesBefore, after: ledger, profile: state.profile };
  const path = classifyPath(round, ctx);
  const scores = scoreRound(round, { ...decision, path }, ctx, state.profile);

  // 3. Apply the scripted outcome, step by step.
  let prices = pricesBefore;
  let history = state.priceHistory;
  for (const step of round.outcome) {
    prices = applyMoves(prices, step.moves);
    history = appendHistory(history, prices, `R${roundId} ${step.label}`);
  }
  const valueAfter = portfolioValue(ledger, prices);

  const record: RoundRecord = {
    round: roundId,
    orders: decision.orders,
    transactionIds,
    rationaleId: decision.rationaleId,
    riskId: decision.riskId,
    pathId: path.id,
    pricesBefore,
    pricesAfter: prices,
    valueStart,
    valueBefore,
    valueAfterTrades,
    valueAfter,
    realizedInRound: ledger.realizedPnl - state.realizedPnl,
    chargesInRound: ledger.charges - state.charges,
    cashBefore: state.cash,
    holdingsBefore: state.holdings,
    knowledgeCheckAnswer: null,
    scores,
  };

  return {
    ...state,
    ...ledger,
    prices,
    priceHistory: history,
    phase: "debrief",
    valueHistory: [...state.valueHistory, { label: `R${roundId}`, round: roundId, value: valueAfter }],
    rounds: [...state.rounds, record],
  };
}

export function answerKnowledgeCheck(state: SimulationState, roundId: number, answer: number): SimulationState {
  const idx = state.rounds.findIndex((r) => r.round === roundId);
  if (idx === -1) throw new SimulationError(`Round ${roundId} has not been resolved yet.`);
  const record = state.rounds[idx];
  if (record.knowledgeCheckAnswer !== null) return state; // first answer counts
  const round = getRound(roundId);
  if (!Number.isInteger(answer) || answer < 0 || answer >= round.knowledgeCheck.options.length) {
    throw new SimulationError("Invalid answer.");
  }
  const correct = answer === round.knowledgeCheck.correctIndex;
  const rounds = [...state.rounds];
  rounds[idx] = {
    ...record,
    knowledgeCheckAnswer: answer,
    scores: { ...record.scores, comprehension: correct ? 100 : 0 },
  };
  return { ...state, rounds };
}

export function advanceRound(state: SimulationState): SimulationState {
  if (state.status !== "in-progress") throw new SimulationError("The simulation is already complete.");
  if (state.phase !== "debrief") throw new SimulationError("Resolve the current round before continuing.");
  const record = state.rounds.find((r) => r.round === state.currentRound);
  if (!record || record.knowledgeCheckAnswer === null) {
    throw new SimulationError("Answer the knowledge check before moving on.");
  }
  if (state.currentRound >= SIM_CONFIG.totalRounds) {
    return { ...state, status: "completed" };
  }
  const next = state.currentRound + 1;
  return openRound({ ...state, currentRound: next, phase: "decision" }, getRound(next));
}

/* ------------------------------------------------------------------ */
/* Hypothetical alternatives                                           */
/* ------------------------------------------------------------------ */

export interface AlternativeResult {
  alternative: AlternativeDecision;
  applicable: boolean;
  note?: string;
  valueAfter: Paise;
  /** Change from decision-time value (valueBefore) to after the outcome. */
  change: Paise;
}

/**
 * Replays the round from the user's actual pre-trade position with a different decision.
 * Uses the same prices and outcome as the real round, so results are directly comparable.
 */
export function simulateAlternative(record: RoundRecord, alt: AlternativeDecision): AlternativeResult {
  const round = getRound(record.round);
  const prices = record.pricesBefore;
  let ledger: Ledger = {
    cash: record.cashBefore,
    holdings: record.holdingsBefore as Record<string, Holding>,
    realizedPnl: 0,
    charges: 0,
    transactions: [],
  };
  const notes: string[] = [];

  alt.orders.forEach((spec, i) => {
    let quantity = 0;
    if (spec.side === "sell") {
      const held = ledger.holdings[spec.ticker]?.quantity ?? 0;
      quantity = spec.mode === "all" ? held : Math.min(held, spec.value ?? 0);
      if (quantity === 0) notes.push(`You held no ${spec.ticker} to sell.`);
    } else if (spec.mode === "qty") {
      quantity = Math.min(spec.value ?? 0, maxAffordable(ledger.cash, prices[spec.ticker]));
    } else {
      const budget = Math.min(ledger.cash, Math.round((spec.value ?? 0) * 100));
      quantity = maxAffordable(budget, prices[spec.ticker]);
      if (quantity === 0) notes.push(`Not enough cash to buy ${spec.ticker}.`);
    }
    if (quantity > 0) {
      ledger = executeOrder(ledger, { ticker: spec.ticker, side: spec.side, quantity }, prices, {
        round: record.round,
        id: `alt-${i}`,
      }).ledger;
    }
  });

  let after = prices;
  for (const step of round.outcome) after = applyMoves(after, step.moves);
  const valueAfter = portfolioValue(ledger, after);
  const applicable = alt.orders.length === 0 || notes.length < alt.orders.length;
  return {
    alternative: alt,
    applicable,
    note: notes.length ? notes.join(" ") : undefined,
    valueAfter,
    change: valueAfter - record.valueBefore,
  };
}

export { ROUNDS };
