import { describe, expect, it } from "vitest";
import { ROUNDS } from "@/content/rounds";
import { advanceRound, answerKnowledgeCheck, createSimulation, resolveRound } from "@/lib/engine/simulation";
import { defaultState } from "@/lib/store/persistence";
import type { AppState, SimulationState } from "@/lib/types";
import { mergeConcept, mergeStates, resolveSimulation } from "../merge";

function play(n: number, startedAt: number): SimulationState {
  let s = createSimulation("balanced", startedAt);
  for (const r of ROUNDS.slice(0, n)) {
    s = resolveRound(s, r.id, { orders: [], rationaleId: r.rationales[0].id, riskId: r.risks[0].id });
    s = advanceRound(answerKnowledgeCheck(s, r.id, 0));
  }
  return s;
}

const state = (sim: SimulationState | null, extra: Partial<AppState> = {}): AppState => ({ ...defaultState(), simulation: sim, ...extra });

describe("merging learning progress", () => {
  it("never downgrades completion and keeps first answers", () => {
    const merged = mergeConcept(
      { status: "in-progress", step: 2, quiz: { a: { answer: 1, correct: false }, b: { answer: 0, correct: true } }, openedAt: 50 },
      { status: "completed", step: 6, quiz: { a: { answer: 2, correct: true } }, openedAt: 100, completedAt: 200 },
    );
    expect(merged).toEqual({
      status: "completed",
      step: 6,
      quiz: { a: { answer: 2, correct: true }, b: { answer: 0, correct: true } },
      openedAt: 50,
      completedAt: 200,
    });
  });

  it("unions achievements keeping the earliest unlock", () => {
    const r = mergeStates(state(null, { achievements: { x: 5, y: 9 } }), { ...state(null), achievements: { x: 7 } }, "anonymous");
    expect(r.state.achievements).toEqual({ x: 5, y: 9 });
    expect(r.needsUpload).toBe(true);
  });
});

describe("resolving simulations", () => {
  it("same run: furthest progress wins", () => {
    expect(resolveSimulation(play(3, 1), play(5, 1), "anonymous").kind).toBe("cloud");
    expect(resolveSimulation(play(6, 1), play(5, 1), "anonymous").kind).toBe("local");
  });

  it("does not overwrite newer cloud progress with older local state", () => {
    const r = mergeStates(state(play(2, 1)), state(play(4, 1)), "account-cache");
    expect(r.state.simulation?.rounds).toHaveLength(4);
    expect(r.conflict).toBeNull();
  });

  it("account cache: the more recently started run wins (restart is explicit)", () => {
    expect(resolveSimulation(play(0, 2), play(7, 1), "account-cache").kind).toBe("local");
    expect(resolveSimulation(play(7, 1), play(0, 2), "account-cache").kind).toBe("cloud");
  });

  it("anonymous migration into an account that has its own run asks the user", () => {
    const r = mergeStates(state(play(3, 2)), state(play(5, 1)), "anonymous");
    expect(r.conflict).not.toBeNull();
    expect(r.state.simulation?.rounds).toHaveLength(5); // cloud stays authoritative until the user chooses
  });

  it("anonymous run with no rounds played never replaces a cloud run", () => {
    const r = mergeStates(state(play(0, 2)), state(play(5, 1)), "anonymous");
    expect(r.conflict).toBeNull();
    expect(r.state.simulation?.rounds).toHaveLength(5);
  });

  it("uploads local progress when the cloud is empty", () => {
    const r = mergeStates(state(play(2, 1)), state(null), "anonymous");
    expect(r.state.simulation?.rounds).toHaveLength(2);
    expect(r.needsUpload).toBe(true);
  });
});
