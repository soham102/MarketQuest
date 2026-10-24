/**
 * Pure conversion between the app's in-memory state and the cloud representation.
 * No network or Supabase code here — this is shared by the sync layer and its tests.
 */
import { portfolioValue } from "@/lib/engine/portfolio";
import type {
  AppState,
  ConceptProgress,
  Holding,
  RiskProfileId,
  RoundRecord,
  RoundScores,
  SimulationState,
  Transaction,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Payload sent to save_progress                                       */
/* ------------------------------------------------------------------ */

export interface ProgressPayload {
  onboarded: boolean;
  concepts: {
    slug: string;
    status: ConceptProgress["status"];
    step: number;
    quiz: ConceptProgress["quiz"];
    opened_at: number;
    completed_at: number | null;
  }[];
  achievements: { id: string; unlocked_at: number }[];
  simulation: SimulationPayload | null;
}

export interface SimulationPayload {
  client_started_at: number;
  risk_profile: RiskProfileId;
  status: SimulationState["status"];
  current_round: number;
  phase: SimulationState["phase"];
  cash_paise: number;
  realized_pnl_paise: number;
  charges_paise: number;
  prices: Record<string, number>;
  price_history: SimulationState["priceHistory"];
  value_history: SimulationState["valueHistory"];
  progress_rank: number;
  final_value_paise: number | null;
  holdings: { ticker: string; quantity: number; cost_basis_paise: number }[];
  orders: {
    txn_id: string;
    round: number;
    ticker: string;
    side: "buy" | "sell";
    quantity: number;
    price_paise: number;
    value_paise: number;
    charges_paise: number;
    realized_pnl_paise: number;
  }[];
  rounds: {
    round: number;
    path_id: string;
    rationale_id: string;
    risk_id: string;
    value_start_paise: number;
    value_before_paise: number;
    value_after_paise: number;
    knowledge_check_answer: number | null;
    scores: RoundScores;
    record: RoundRecord;
  }[];
}

/**
 * A number that only ever increases as a single simulation run progresses.
 * Every state change inside a run (resolving, answering the check, advancing, finishing)
 * raises it, so the server can reject writes from a stale tab or device.
 */
export function progressRank(sim: SimulationState): number {
  if (sim.status === "completed") return 10_000;
  const current = sim.rounds.find((r) => r.round === sim.currentRound);
  const answered = current && current.knowledgeCheckAnswer !== null ? 1 : 0;
  return sim.currentRound * 10 + (sim.phase === "debrief" ? 5 : 0) + answered;
}

export function toSimulationPayload(sim: SimulationState): SimulationPayload {
  return {
    client_started_at: sim.startedAt,
    risk_profile: sim.profile,
    status: sim.status,
    current_round: sim.currentRound,
    phase: sim.phase,
    cash_paise: sim.cash,
    realized_pnl_paise: sim.realizedPnl,
    charges_paise: sim.charges,
    prices: sim.prices,
    price_history: sim.priceHistory,
    value_history: sim.valueHistory,
    progress_rank: progressRank(sim),
    final_value_paise: sim.status === "completed" ? portfolioValue(sim, sim.prices) : null,
    holdings: Object.entries(sim.holdings)
      .filter(([, h]) => h.quantity > 0)
      .map(([ticker, h]) => ({ ticker, quantity: h.quantity, cost_basis_paise: h.costBasis })),
    orders: sim.transactions.map((t) => ({
      txn_id: t.id,
      round: t.round,
      ticker: t.ticker,
      side: t.side,
      quantity: t.quantity,
      price_paise: t.price,
      value_paise: t.value,
      charges_paise: t.charges,
      realized_pnl_paise: t.realizedPnl,
    })),
    rounds: sim.rounds.map((r) => ({
      round: r.round,
      path_id: r.pathId,
      rationale_id: r.rationaleId,
      risk_id: r.riskId,
      value_start_paise: r.valueStart,
      value_before_paise: r.valueBefore,
      value_after_paise: r.valueAfter,
      knowledge_check_answer: r.knowledgeCheckAnswer,
      scores: r.scores,
      record: r,
    })),
  };
}

export function toPayload(state: AppState): ProgressPayload {
  return {
    onboarded: state.onboarded,
    concepts: Object.entries(state.concepts).map(([slug, c]) => ({
      slug,
      status: c.status,
      step: c.step,
      quiz: c.quiz,
      opened_at: c.openedAt,
      completed_at: c.completedAt ?? null,
    })),
    achievements: Object.entries(state.achievements).map(([id, at]) => ({ id, unlocked_at: at })),
    simulation: state.simulation ? toSimulationPayload(state.simulation) : null,
  };
}

/* ------------------------------------------------------------------ */
/* Response from load_progress                                         */
/* ------------------------------------------------------------------ */

export interface CloudProgress {
  profile: { display_name: string | null; email: string | null; avatar_url: string | null; onboarded: boolean } | null;
  concepts: ProgressPayload["concepts"];
  achievements: ProgressPayload["achievements"];
  simulation:
    | (Omit<SimulationPayload, "rounds" | "orders"> & {
        orders: SimulationPayload["orders"];
        rounds: { round: number; knowledge_check_answer: number | null; scores: RoundScores; record: RoundRecord }[];
      })
    | null;
}

export class CloudDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudDataError";
  }
}

const txnIndex = (id: string) => Number(id.split("-t")[1] ?? 0);

/** Rebuild an engine SimulationState from cloud rows. Throws CloudDataError if malformed. */
export function simulationFromCloud(s: NonNullable<CloudProgress["simulation"]>): SimulationState {
  if (typeof s.client_started_at !== "number" || typeof s.cash_paise !== "number" || !s.prices || !Array.isArray(s.rounds)) {
    throw new CloudDataError("Saved simulation is incomplete.");
  }
  const holdings: Record<string, Holding> = {};
  for (const h of s.holdings ?? []) holdings[h.ticker] = { quantity: Number(h.quantity), costBasis: Number(h.cost_basis_paise) };

  const transactions: Transaction[] = [...(s.orders ?? [])]
    .sort((a, b) => a.round - b.round || txnIndex(a.txn_id) - txnIndex(b.txn_id))
    .map((o) => ({
      id: o.txn_id,
      round: o.round,
      ticker: o.ticker,
      side: o.side,
      quantity: Number(o.quantity),
      price: Number(o.price_paise),
      value: Number(o.value_paise),
      charges: Number(o.charges_paise),
      realizedPnl: Number(o.realized_pnl_paise),
    }));

  const rounds: RoundRecord[] = [...s.rounds]
    .sort((a, b) => a.round - b.round)
    .map((r) => ({ ...r.record, knowledgeCheckAnswer: r.knowledge_check_answer, scores: r.scores }));

  return {
    status: s.status,
    profile: s.risk_profile,
    startedAt: Number(s.client_started_at),
    currentRound: s.current_round,
    phase: s.phase,
    cash: Number(s.cash_paise),
    holdings,
    prices: s.prices,
    priceHistory: s.price_history,
    valueHistory: s.value_history,
    transactions,
    realizedPnl: Number(s.realized_pnl_paise),
    charges: Number(s.charges_paise),
    rounds,
  };
}

/** The account's state as stored in the cloud (analytics stay on the device). */
export function stateFromCloud(cloud: CloudProgress): Pick<AppState, "onboarded" | "concepts" | "achievements" | "simulation"> {
  const concepts: AppState["concepts"] = {};
  for (const c of cloud.concepts ?? []) {
    concepts[c.slug] = {
      status: c.status,
      step: c.step,
      quiz: c.quiz ?? {},
      openedAt: Number(c.opened_at),
      ...(c.completed_at !== null && c.completed_at !== undefined ? { completedAt: Number(c.completed_at) } : {}),
    };
  }
  const achievements: AppState["achievements"] = {};
  for (const a of cloud.achievements ?? []) achievements[a.id] = Number(a.unlocked_at);
  return {
    onboarded: cloud.profile?.onboarded ?? false,
    concepts,
    achievements,
    simulation: cloud.simulation ? simulationFromCloud(cloud.simulation) : null,
  };
}
