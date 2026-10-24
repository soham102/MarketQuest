/**
 * Shared domain types for MarketQuest.
 *
 * Money is always stored as integer paise (₹1 = 100 paise) so that cash,
 * cost basis and P&L stay exact. Convert to rupees only for display.
 */

export type Paise = number;

/* ------------------------------------------------------------------ */
/* Market universe                                                     */
/* ------------------------------------------------------------------ */

export type SectorId =
  | "consumer"
  | "banking"
  | "it"
  | "auto"
  | "pharma"
  | "energy"
  | "fintech";

export interface Sector {
  id: SectorId;
  name: string;
  description: string;
}

export interface Stock {
  ticker: string;
  name: string;
  sector: SectorId;
  description: string;
  /** Starting price in paise. */
  startPrice: Paise;
  /** Percentage moves (oldest first) used to build the deterministic pre-history chart. */
  preHistory: number[];
  facts: { label: string; value: string }[];
}

/* ------------------------------------------------------------------ */
/* Simulation content                                                  */
/* ------------------------------------------------------------------ */

export type RiskProfileId = "cautious" | "balanced" | "growth";

export interface RiskProfile {
  id: RiskProfileId;
  name: string;
  summary: string;
  /** Target share of the portfolio held in stocks (rest is cash). */
  targetInvestedPct: number;
  /** Sector weight (of the total portfolio) above which concentration is flagged. */
  maxSectorPct: number;
  /** Single-stock weight (of the total portfolio) above which sizing is flagged. */
  maxPositionPct: number;
}

export interface PriceMove {
  ticker: string;
  /** Percentage change, e.g. -4.5 for −4.5 %. */
  pct: number;
  reason: string;
}

export interface OutcomeStep {
  label: string;
  headline: string;
  detail: string;
  moves: PriceMove[];
}

export interface ChoiceOption {
  id: string;
  text: string;
  /** 0–100 rubric score for this choice. */
  score: number;
  feedback: string;
}

export interface RationaleOption extends ChoiceOption {
  /** Actions consistent with this reasoning; used for the consistency dimension. */
  impliedActions: DecisionAction[];
}

export type DecisionAction = "buy" | "sell" | "hold";

export type PathMatcher =
  | { kind: "hold" }
  | {
      kind: "buy";
      tickers?: string[];
      /** Combined weight of `tickers` after trading, as % of portfolio. */
      minExposurePct?: number;
      maxExposurePct?: number;
    }
  | { kind: "sell"; tickers?: string[]; fullExit?: boolean }
  | {
      kind: "portfolio";
      /** Largest sector weight (of total portfolio) after trading must be at or below this. */
      maxSectorPct?: number;
      /** Largest sector weight must be at or above this (used to detect concentration). */
      minSectorPct?: number;
      minCashPct?: number;
      maxCashPct?: number;
      /** Restrict to rounds where the user actually traded. */
      traded?: boolean;
      /** Net direction of the user's orders. */
      action?: DecisionAction;
      /** True = sector, position and invested-share limits of the user's risk profile are all met. */
      withinProfile?: boolean;
    }
  | { kind: "other" };

export type PathVerdict = "reasonable" | "defensible" | "risky";

export interface DecisionPath {
  id: string;
  label: string;
  match: PathMatcher;
  verdict: PathVerdict;
  /** 0–100 rubric score for decision quality given information available. */
  score: number;
  feedback: string;
  tradeOffs: string;
}

export interface AlternativeOrderSpec {
  ticker: string;
  side: OrderSide;
  /** "amount" = spend up to this many rupees; "all" = sell entire position; "qty" = exact quantity */
  mode: "amount" | "all" | "qty";
  value?: number;
}

export interface AlternativeDecision {
  id: string;
  label: string;
  description: string;
  orders: AlternativeOrderSpec[];
}

export interface KnowledgeCheck {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface RoundDefinition {
  id: number;
  slug: string;
  title: string;
  concepts: string[];
  learningObjective: string;
  headline: string;
  source: string;
  background: string;
  facts: string[];
  focusTickers: string[];
  /** Moves that happen as the news breaks, before the user can trade. */
  marketOpen?: { headline: string; moves: PriceMove[] };
  /** Optional context panel (e.g. comparison portfolios) rendered by key. */
  special?: "concentration-lab" | "rebalance-check" | "rumour-board";
  thinkAbout: string[];
  rationaleQuestion: string;
  rationales: RationaleOption[];
  riskQuestion: string;
  risks: ChoiceOption[];
  outcome: OutcomeStep[];
  assumptions: string[];
  whyItHappened: string;
  overlookedRisks: string[];
  paths: DecisionPath[];
  alternatives: AlternativeDecision[];
  knowledgeCheck: KnowledgeCheck;
  conceptSlugs: string[];
}

/* ------------------------------------------------------------------ */
/* Simulation state                                                    */
/* ------------------------------------------------------------------ */

export type OrderSide = "buy" | "sell";

export interface Order {
  ticker: string;
  side: OrderSide;
  quantity: number;
}

export interface Holding {
  quantity: number;
  /** Total cost basis of the remaining shares, in paise (excludes charges). */
  costBasis: Paise;
}

export interface Transaction {
  id: string;
  round: number;
  ticker: string;
  side: OrderSide;
  quantity: number;
  price: Paise;
  value: Paise;
  charges: Paise;
  /** Realised P&L for sells (excludes charges); 0 for buys. */
  realizedPnl: Paise;
}

export interface PricePoint {
  label: string;
  price: Paise;
}

export interface ValuePoint {
  label: string;
  round: number;
  value: Paise;
}

export interface RoundScores {
  reasoning: number;
  risk: number;
  diversification: number | null;
  consistent: boolean;
  comprehension: number | null;
}

export interface RoundRecord {
  round: number;
  orders: Order[];
  transactionIds: string[];
  rationaleId: string;
  riskId: string;
  pathId: string;
  pricesBefore: Record<string, Paise>;
  pricesAfter: Record<string, Paise>;
  /** Portfolio value at the end of the previous round (before any market-open move). */
  valueStart: Paise;
  /** Portfolio value at decision time (after market-open moves, before trades). */
  valueBefore: Paise;
  /** Portfolio value immediately after trades (before price moves). */
  valueAfterTrades: Paise;
  /** Portfolio value after the scenario's price moves. */
  valueAfter: Paise;
  realizedInRound: Paise;
  chargesInRound: Paise;
  /** Snapshot of state before this round's trades, used for alternatives and review. */
  cashBefore: Paise;
  holdingsBefore: Record<string, Holding>;
  knowledgeCheckAnswer: number | null;
  scores: RoundScores;
}

export type SimulationStatus = "in-progress" | "completed";
export type RoundPhase = "decision" | "debrief";

export interface SimulationState {
  status: SimulationStatus;
  profile: RiskProfileId;
  startedAt: number;
  currentRound: number;
  phase: RoundPhase;
  cash: Paise;
  holdings: Record<string, Holding>;
  prices: Record<string, Paise>;
  priceHistory: Record<string, PricePoint[]>;
  valueHistory: ValuePoint[];
  transactions: Transaction[];
  realizedPnl: Paise;
  charges: Paise;
  rounds: RoundRecord[];
}

/* ------------------------------------------------------------------ */
/* Learning content & progress                                        */
/* ------------------------------------------------------------------ */

export type ConceptCategory =
  | "fundamentals"
  | "valuation"
  | "macro"
  | "portfolio"
  | "trading";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type VisualBlock =
  | {
      kind: "flow";
      title: string;
      steps: { label: string; detail: string; tone?: "neutral" | "up" | "down" }[];
    }
  | {
      kind: "compare";
      title: string;
      left: { title: string; points: string[]; tone?: "neutral" | "up" | "down" };
      right: { title: string; points: string[]; tone?: "neutral" | "up" | "down" };
    }
  | {
      kind: "bars";
      title: string;
      unit: string;
      bars: { label: string; value: number; note: string }[];
    };

export type ExperimentId =
  | "ownership"
  | "earnings-surprise"
  | "rate-transmission"
  | "pe-valuation"
  | "pricing-power"
  | "diversification"
  | "drawdown"
  | "information-quality"
  | "rebalancing"
  | "order-book"
  | "portfolio-value";

export interface ConceptModule {
  slug: string;
  title: string;
  category: ConceptCategory;
  difficulty: Difficulty;
  minutes: number;
  summary: string;
  preview: "pie" | "line" | "bars" | "flow" | "book" | "gauge";
  intro: { hook: string; paragraphs: string[]; keyTerms: { term: string; definition: string }[] };
  visual: VisualBlock;
  workedExample: {
    title: string;
    setup: string;
    steps: { label: string; value: string; note?: string }[];
    takeaway: string;
  };
  experiment: { id: ExperimentId; title: string; prompt: string; observe: string[] };
  quiz: KnowledgeCheck[];
  applyRound: number;
  applyText: string;
  takeaways: string[];
  next?: string;
}

export interface ConceptProgress {
  status: "in-progress" | "completed";
  step: number;
  /** First-attempt answers by question id. */
  quiz: Record<string, { answer: number; correct: boolean }>;
  openedAt: number;
  completedAt?: number;
}

/* ------------------------------------------------------------------ */
/* Analytics & achievements                                            */
/* ------------------------------------------------------------------ */

export type AnalyticsEventName =
  | "concept_opened"
  | "concept_completed"
  | "simulation_started"
  | "order_submitted"
  | "round_completed"
  | "debrief_viewed"
  | "knowledge_check_answered"
  | "simulation_completed"
  | "simulation_restarted";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  at: number;
  props?: Record<string, string | number | boolean>;
}

export interface AppState {
  version: number;
  onboarded: boolean;
  concepts: Record<string, ConceptProgress>;
  simulation: SimulationState | null;
  achievements: Record<string, number>;
  analytics: AnalyticsEvent[];
}
