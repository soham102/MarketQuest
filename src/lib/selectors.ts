import { CONCEPTS, RECOMMENDED_ORDER } from "@/content/concepts";
import { SIM_CONFIG } from "@/content/market";
import { portfolioValue, totalPnl, totalReturnPct, unrealizedPnl } from "@/lib/engine/portfolio";
import type { AppState, ConceptModule } from "@/lib/types";

export function learningProgress(state: AppState) {
  const completed = CONCEPTS.filter((c) => state.concepts[c.slug]?.status === "completed").length;
  const inProgress = CONCEPTS.filter((c) => state.concepts[c.slug]?.status === "in-progress").length;
  return { completed, inProgress, total: CONCEPTS.length, pct: Math.round((completed / CONCEPTS.length) * 100) };
}

export function conceptStatus(state: AppState, slug: string): "not-started" | "in-progress" | "completed" {
  return state.concepts[slug]?.status ?? "not-started";
}

/** In-progress lesson first, otherwise the next uncompleted lesson in recommended order. */
export function nextConcept(state: AppState): ConceptModule | null {
  const inProgress = RECOMMENDED_ORDER.find((s) => state.concepts[s]?.status === "in-progress");
  const slug = inProgress ?? RECOMMENDED_ORDER.find((s) => state.concepts[s]?.status !== "completed");
  return slug ? CONCEPTS.find((c) => c.slug === slug) ?? null : null;
}

export function simulationSummary(state: AppState) {
  const sim = state.simulation;
  if (!sim) {
    return {
      started: false,
      completed: false,
      roundsCompleted: 0,
      currentRound: 0,
      value: SIM_CONFIG.initialCapital,
      cash: SIM_CONFIG.initialCapital,
      pnl: 0,
      pnlPct: 0,
      unrealized: 0,
      realized: 0,
    };
  }
  return {
    started: true,
    completed: sim.status === "completed",
    roundsCompleted: sim.rounds.length,
    currentRound: sim.currentRound,
    value: portfolioValue(sim, sim.prices),
    cash: sim.cash,
    pnl: totalPnl(sim, sim.prices),
    pnlPct: totalReturnPct(sim, sim.prices),
    unrealized: unrealizedPnl(sim, sim.prices),
    realized: sim.realizedPnl,
  };
}
