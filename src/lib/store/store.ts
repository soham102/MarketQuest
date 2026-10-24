"use client";

import { useSyncExternalStore } from "react";
import { ACHIEVEMENTS } from "@/content/achievements";
import { advanceRound, answerKnowledgeCheck, createSimulation, resolveRound, type Decision } from "@/lib/engine/simulation";
import type { AnalyticsEvent, AnalyticsEventName, AppState, RiskProfileId } from "@/lib/types";
import { clearState, defaultState, getActiveUser, loadState, saveState, STORAGE_KEY, userStorageKey } from "./persistence";

/**
 * A tiny external store: one source of truth for progress, simulation and analytics,
 * persisted to localStorage. Engine functions are pure; this module only sequences them.
 */

export interface Snapshot {
  state: AppState;
  hydrated: boolean;
  storageError: string | null;
}

const MAX_EVENTS = 400;
const SERVER_SNAPSHOT: Snapshot = { state: defaultState(), hydrated: false, storageError: null };

let snapshot: Snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
/** localStorage key for the active scope: anonymous, or the signed-in user's cache. */
let scopeKey = STORAGE_KEY;

export type CommitReason = "update" | "reset";
const commitListeners = new Set<(state: AppState, reason: CommitReason) => void>();

function ensureLoaded() {
  if (snapshot.hydrated || typeof window === "undefined") return;
  // A returning signed-in user sees their own cached progress immediately; the sync layer
  // then confirms the session and refreshes from the cloud.
  const activeUser = getActiveUser();
  if (activeUser) scopeKey = userStorageKey(activeUser);
  const { state, error } = loadState(scopeKey);
  snapshot = { state, hydrated: true, storageError: error };
}

function emit() {
  for (const l of listeners) l();
}

/** Keeps multiple open tabs in sync. */
function onStorage(e: StorageEvent) {
  if (e.key !== scopeKey) return;
  const { state, error } = loadState(scopeKey);
  snapshot = { state, hydrated: true, storageError: error };
  emit();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  ensureLoaded();
  return snapshot;
}

function stampAchievements(state: AppState): AppState {
  let achievements = state.achievements;
  for (const a of ACHIEVEMENTS) {
    if (!achievements[a.id] && a.unlocked(state)) {
      achievements = { ...achievements, [a.id]: Date.now() };
    }
  }
  return achievements === state.achievements ? state : { ...state, achievements };
}

function withEvent(state: AppState, name: AnalyticsEventName, props?: AnalyticsEvent["props"]): AppState {
  const event: AnalyticsEvent = { name, at: Date.now(), ...(props ? { props } : {}) };
  return { ...state, analytics: [...state.analytics, event].slice(-MAX_EVENTS) };
}

/** Apply a state transition. Throws (without changing state) if the transition throws. */
function update(fn: (s: AppState) => AppState) {
  ensureLoaded();
  const next = stampAchievements(fn(snapshot.state));
  if (next === snapshot.state) return;
  const storageError = saveState(next, scopeKey);
  snapshot = { state: next, hydrated: true, storageError: storageError ?? snapshot.storageError };
  emit();
  for (const l of commitListeners) l(next, "update");
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

export function useStore(): Snapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export const actions = {
  completeOnboarding() {
    update((s) => ({ ...s, onboarded: true }));
  },

  openConcept(slug: string) {
    update((s) => {
      const existing = s.concepts[slug];
      const concepts = existing
        ? s.concepts
        : { ...s.concepts, [slug]: { status: "in-progress" as const, step: 0, quiz: {}, openedAt: Date.now() } };
      return withEvent({ ...s, concepts }, "concept_opened", { slug });
    });
  },

  setConceptStep(slug: string, step: number) {
    update((s) => {
      const c = s.concepts[slug];
      if (!c) return s;
      return { ...s, concepts: { ...s.concepts, [slug]: { ...c, step } } };
    });
  },

  answerConceptQuiz(slug: string, questionId: string, answer: number, correct: boolean) {
    update((s) => {
      const c = s.concepts[slug];
      if (!c || c.quiz[questionId]) return s; // first attempt counts
      const next = { ...s, concepts: { ...s.concepts, [slug]: { ...c, quiz: { ...c.quiz, [questionId]: { answer, correct } } } } };
      return withEvent(next, "knowledge_check_answered", { context: "lesson", slug, questionId, correct });
    });
  },

  completeConcept(slug: string) {
    update((s) => {
      const c = s.concepts[slug];
      if (!c || c.status === "completed") return s;
      const next = { ...s, concepts: { ...s.concepts, [slug]: { ...c, status: "completed" as const, completedAt: Date.now() } } };
      return withEvent(next, "concept_completed", { slug });
    });
  },

  startSimulation(profile: RiskProfileId) {
    update((s) => {
      if (s.simulation && s.simulation.status === "in-progress") return s;
      return withEvent({ ...s, simulation: createSimulation(profile) }, "simulation_started", { profile });
    });
  },

  restartSimulation(profile: RiskProfileId) {
    update((s) => {
      let next = withEvent(s, "simulation_restarted", { fromRound: s.simulation?.currentRound ?? 0 });
      next = { ...next, simulation: createSimulation(profile) };
      return withEvent(next, "simulation_started", { profile });
    });
  },

  submitDecision(roundId: number, decision: Decision) {
    update((s) => {
      if (!s.simulation) throw new Error("Start a simulation first.");
      let next: AppState = { ...s, simulation: resolveRound(s.simulation, roundId, decision) };
      for (const o of decision.orders) {
        next = withEvent(next, "order_submitted", { round: roundId, ticker: o.ticker, side: o.side, quantity: o.quantity });
      }
      const rec = next.simulation!.rounds.at(-1)!;
      return withEvent(next, "round_completed", { round: roundId, path: rec.pathId, orders: decision.orders.length });
    });
  },

  markDebriefViewed(roundId: number) {
    update((s) => {
      const seen = s.analytics.some((e) => e.name === "debrief_viewed" && e.props?.round === roundId && (s.simulation?.startedAt ?? 0) <= e.at);
      return seen ? s : withEvent(s, "debrief_viewed", { round: roundId });
    });
  },

  answerRoundCheck(roundId: number, answer: number, correct: boolean) {
    update((s) => {
      if (!s.simulation) return s;
      const rec = s.simulation.rounds.find((r) => r.round === roundId);
      if (!rec || rec.knowledgeCheckAnswer !== null) return s;
      const next = { ...s, simulation: answerKnowledgeCheck(s.simulation, roundId, answer) };
      return withEvent(next, "knowledge_check_answered", { context: "debrief", round: roundId, correct });
    });
  },

  advance() {
    update((s) => {
      if (!s.simulation) return s;
      const sim = advanceRound(s.simulation);
      const next = { ...s, simulation: sim };
      return sim.status === "completed" ? withEvent(next, "simulation_completed", { rounds: sim.rounds.length }) : next;
    });
  },

  resetAll() {
    clearState(scopeKey);
    snapshot = { state: defaultState(), hydrated: true, storageError: null };
    emit();
    for (const l of commitListeners) l(snapshot.state, "reset");
  },
};

/* ------------------------------------------------------------------ */
/* Scope control (used by the sync layer only)                         */
/* ------------------------------------------------------------------ */

export const storeScope = {
  get key() {
    return scopeKey;
  },
  getState(): AppState {
    ensureLoaded();
    return snapshot.state;
  },
  /** Switch to another storage scope and show the given state, without triggering a sync. */
  switchTo(key: string, state: AppState) {
    ensureLoaded();
    scopeKey = key;
    const storageError = saveState(state, key);
    snapshot = { state, hydrated: true, storageError };
    emit();
  },
  /** Replace the state in the current scope (e.g. with newer cloud data), without triggering a sync. */
  replace(state: AppState) {
    this.switchTo(scopeKey, state);
  },
  /** Notified after every user-driven change, so it can be saved to the cloud. */
  onCommit(fn: (state: AppState, reason: CommitReason) => void) {
    commitListeners.add(fn);
    return () => {
      commitListeners.delete(fn);
    };
  },
};
