/**
 * Conflict resolution when local progress meets cloud progress at sign-in.
 *
 * Learning progress merges automatically and losslessly:
 *   - a concept is completed if either side completed it; step is the furthest reached;
 *   - first quiz answers are kept (cloud's answer wins if both answered, since it was recorded first or elsewhere);
 *   - achievements are unioned, keeping the earliest unlock time.
 *
 * Simulations can't be merged (they're different decision histories), so:
 *   - Same run on both sides (same startedAt): the one further along wins.
 *   - This account's own cached copy vs cloud: the more recently started run wins — a restart is an explicit action.
 *   - Anonymous progress being migrated into an account that already has a run: if both have played rounds,
 *     the user is asked. Until they answer, cloud stays authoritative and nothing is overwritten.
 */
import type { AppState, ConceptProgress, SimulationState } from "@/lib/types";
import { progressRank } from "./mapping";

export type LocalSource = "anonymous" | "account-cache";
export type CloudState = Pick<AppState, "onboarded" | "concepts" | "achievements" | "simulation">;

export function mergeConcept(local: ConceptProgress, cloud: ConceptProgress): ConceptProgress {
  const completed = local.status === "completed" || cloud.status === "completed";
  const completedAt = [cloud.completedAt, local.completedAt].filter((v): v is number => typeof v === "number");
  return {
    status: completed ? "completed" : "in-progress",
    step: Math.max(local.step, cloud.step),
    quiz: { ...local.quiz, ...cloud.quiz },
    openedAt: Math.min(local.openedAt, cloud.openedAt),
    ...(completedAt.length ? { completedAt: Math.min(...completedAt) } : {}),
  };
}

export function mergeConcepts(local: AppState["concepts"], cloud: AppState["concepts"]): AppState["concepts"] {
  const out: AppState["concepts"] = { ...cloud };
  for (const [slug, c] of Object.entries(local)) out[slug] = cloud[slug] ? mergeConcept(c, cloud[slug]) : c;
  return out;
}

export function mergeAchievements(local: AppState["achievements"], cloud: AppState["achievements"]): AppState["achievements"] {
  const out = { ...cloud };
  for (const [id, at] of Object.entries(local)) out[id] = out[id] ? Math.min(out[id], at) : at;
  return out;
}

export interface SimulationSummary {
  startedAt: number;
  roundsCompleted: number;
  status: SimulationState["status"];
}

export const summarize = (s: SimulationState): SimulationSummary => ({
  startedAt: s.startedAt,
  roundsCompleted: s.rounds.length,
  status: s.status,
});

export type SimulationResolution =
  | { kind: "local"; simulation: SimulationState | null }
  | { kind: "cloud"; simulation: SimulationState | null }
  | { kind: "conflict"; local: SimulationState; cloud: SimulationState };

export function resolveSimulation(local: SimulationState | null, cloud: SimulationState | null, source: LocalSource): SimulationResolution {
  if (!local) return { kind: "cloud", simulation: cloud };
  if (!cloud) return { kind: "local", simulation: local };
  if (local.startedAt === cloud.startedAt) {
    return progressRank(local) > progressRank(cloud) ? { kind: "local", simulation: local } : { kind: "cloud", simulation: cloud };
  }
  if (source === "account-cache") {
    return local.startedAt > cloud.startedAt ? { kind: "local", simulation: local } : { kind: "cloud", simulation: cloud };
  }
  // Anonymous run vs an existing account run.
  if (local.rounds.length === 0) return { kind: "cloud", simulation: cloud };
  if (cloud.rounds.length === 0) return { kind: "local", simulation: local };
  return { kind: "conflict", local, cloud };
}

export interface MergeResult {
  state: AppState;
  /** Set when the user must choose which simulation to keep. `state` uses the cloud run meanwhile. */
  conflict: { local: SimulationState; cloud: SimulationState } | null;
  /** True when the merged state contains anything the cloud doesn't yet have. */
  needsUpload: boolean;
}

export function mergeStates(local: AppState, cloud: CloudState, source: LocalSource): MergeResult {
  const concepts = mergeConcepts(local.concepts, cloud.concepts);
  const achievements = mergeAchievements(local.achievements, cloud.achievements);
  const sim = resolveSimulation(local.simulation, cloud.simulation, source);
  const simulation = sim.kind === "conflict" ? sim.cloud : sim.simulation;

  const state: AppState = {
    ...local,
    onboarded: local.onboarded || cloud.onboarded,
    concepts,
    achievements,
    simulation,
  };
  const needsUpload =
    JSON.stringify(concepts) !== JSON.stringify(cloud.concepts) ||
    JSON.stringify(achievements) !== JSON.stringify(cloud.achievements) ||
    state.onboarded !== cloud.onboarded ||
    (sim.kind === "local" && sim.simulation !== null);

  return { state, conflict: sim.kind === "conflict" ? { local: sim.local, cloud: sim.cloud } : null, needsUpload };
}
