import { beforeAll, describe, expect, it } from "vitest";
import { ROUNDS } from "@/content/rounds";
import { advanceRound, answerKnowledgeCheck, createSimulation, resolveRound } from "@/lib/engine/simulation";
import type { AppState, Order, SimulationState } from "@/lib/types";
import { defaultState } from "@/lib/store/persistence";
import { progressRank, stateFromCloud, toPayload, type CloudProgress } from "../mapping";
import { createTestDb } from "./pg-harness";

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";

type Db = Awaited<ReturnType<typeof createTestDb>>;

/** Play `n` rounds with a fixed plan so state is deterministic. */
function play(n: number, startedAt = 1_700_000_000_000): SimulationState {
  let s = createSimulation("balanced", startedAt);
  const plan: Record<number, Order[]> = {
    1: [{ ticker: "KRTI", side: "buy", quantity: 30 }, { ticker: "SHKT", side: "buy", quantity: 10 }],
    2: [{ ticker: "KRTI", side: "sell", quantity: 10 }],
    3: [{ ticker: "PRAN", side: "buy", quantity: 12 }],
  };
  for (const r of ROUNDS.slice(0, n)) {
    s = resolveRound(s, r.id, { orders: plan[r.id] ?? [], rationaleId: r.rationales[0].id, riskId: r.risks[0].id });
    s = answerKnowledgeCheck(s, r.id, r.knowledgeCheck.correctIndex);
    s = advanceRound(s);
  }
  return s;
}

function appState(sim: SimulationState | null): AppState {
  return {
    ...defaultState(),
    onboarded: true,
    concepts: {
      "pe-ratio": { status: "completed", step: 6, quiz: { "pe-q1": { answer: 1, correct: true } }, openedAt: 1_700_000_000_000, completedAt: 1_700_000_100_000 },
    },
    achievements: { "first-lesson": 1_700_000_100_000 },
    simulation: sim,
  };
}

describe("database: schema, RLS and save/load RPCs", () => {
  let t: Db;

  beforeAll(async () => {
    t = await createTestDb();
    await t.createUser(ALICE, "alice@example.com", "Alice A");
    await t.createUser(BOB, "bob@example.com", "Bob B");
  }, 60_000);

  it("creates a profile from Google metadata on sign-up", async () => {
    const rows = await t.as(ALICE, (q) => q<{ display_name: string; email: string }>(`select display_name, email from public.profiles`));
    expect(rows).toEqual([{ display_name: "Alice A", email: "alice@example.com" }]);
  });

  it("round-trips a full simulation exactly", async () => {
    const sim = play(3);
    const res = await t.saveProgress(ALICE, toPayload(appState(sim)));
    expect(res.simulation_applied).toBe(true);
    const restored = stateFromCloud((await t.loadProgress(ALICE)) as CloudProgress);
    expect(restored.simulation).toEqual(sim);
    expect(restored.concepts["pe-ratio"].quiz).toEqual({ "pe-q1": { answer: 1, correct: true } });
    expect(restored.achievements["first-lesson"]).toBe(1_700_000_100_000);
    expect(restored.onboarded).toBe(true);
  });

  it("is idempotent: repeating a save duplicates nothing", async () => {
    const payload = toPayload(appState(play(3)));
    await t.saveProgress(ALICE, payload);
    await t.saveProgress(ALICE, payload);
    const counts = await t.as(ALICE, (q) =>
      q<{ orders: number; rounds: number; sessions: number }>(
        `select (select count(*)::int from public.sim_orders) as orders,
                (select count(*)::int from public.round_history) as rounds,
                (select count(*)::int from public.simulation_sessions) as sessions`,
      ),
    );
    expect(counts[0]).toEqual({ orders: 4, rounds: 3, sessions: 1 });
  });

  it("rejects stale progress from an older tab or device", async () => {
    const older = play(2);
    const res = await t.saveProgress(ALICE, toPayload(appState(older)));
    expect(res.simulation_applied).toBe(false);
    expect(res.stored_rank).toBe(progressRank(play(3)));
    const restored = stateFromCloud((await t.loadProgress(ALICE)) as CloudProgress);
    expect(restored.simulation?.rounds).toHaveLength(3);
  });

  it("advances when progress moves forward and keeps the first knowledge-check answer", async () => {
    let sim = play(3);
    sim = resolveRound(sim, 4, { orders: [], rationaleId: ROUNDS[3].rationales[0].id, riskId: ROUNDS[3].risks[0].id });
    const wrong = (ROUNDS[3].knowledgeCheck.correctIndex + 1) % 4;
    sim = answerKnowledgeCheck(sim, 4, wrong);
    expect((await t.saveProgress(ALICE, toPayload(appState(sim)))).simulation_applied).toBe(true);

    // A forged later payload claiming the correct answer must not replace the first one.
    const forged = structuredClone(sim);
    forged.rounds[3] = { ...forged.rounds[3], knowledgeCheckAnswer: ROUNDS[3].knowledgeCheck.correctIndex };
    const forgedAdvanced = advanceRound(forged);
    await t.saveProgress(ALICE, toPayload(appState(forgedAdvanced)));
    const restored = stateFromCloud((await t.loadProgress(ALICE)) as CloudProgress);
    expect(restored.simulation?.rounds[3].knowledgeCheckAnswer).toBe(wrong);
  });

  it("never downgrades completed lessons or replaces first quiz answers", async () => {
    const payload = toPayload({
      ...appState(null),
      concepts: { "pe-ratio": { status: "in-progress", step: 1, quiz: { "pe-q1": { answer: 3, correct: false } }, openedAt: 1_800_000_000_000 } },
    });
    await t.saveProgress(ALICE, payload);
    const restored = stateFromCloud((await t.loadProgress(ALICE)) as CloudProgress);
    expect(restored.concepts["pe-ratio"]).toMatchObject({ status: "completed", step: 6, quiz: { "pe-q1": { answer: 1, correct: true } } });
  });

  it("a restart creates a new session; load returns the newest", async () => {
    const fresh = createSimulation("growth", 1_800_000_000_000);
    await t.saveProgress(ALICE, toPayload(appState(fresh)));
    const restored = stateFromCloud((await t.loadProgress(ALICE)) as CloudProgress);
    expect(restored.simulation?.startedAt).toBe(1_800_000_000_000);
    expect(restored.simulation?.rounds).toHaveLength(0);
    const sessions = await t.as(ALICE, (q) => q(`select id from public.simulation_sessions`));
    expect(sessions).toHaveLength(2); // the finished/older run is kept as history
  });

  describe("data isolation", () => {
    it("another user sees none of Alice's rows", async () => {
      const counts = await t.as(BOB, (q) =>
        q<{ n: number }>(
          `select (select count(*) from public.profiles where id <> $1)
                + (select count(*) from public.concept_progress)
                + (select count(*) from public.simulation_sessions)
                + (select count(*) from public.sim_orders)
                + (select count(*) from public.round_history)
                + (select count(*) from public.holdings) as n`,
          [BOB],
        ),
      );
      expect(Number(counts[0].n)).toBe(0);
      expect(stateFromCloud((await t.loadProgress(BOB)) as CloudProgress).simulation).toBeNull();
    });

    it("cannot update or delete Alice's rows", async () => {
      const updated = await t.as(BOB, (q) => q(`update public.simulation_sessions set cash_paise = 1 returning id`));
      const deleted = await t.as(BOB, (q) => q(`delete from public.sim_orders returning txn_id`));
      expect(updated).toHaveLength(0);
      expect(deleted).toHaveLength(0);
      const aliceCash = await t.as(ALICE, (q) => q<{ c: string }>(`select cash_paise::text as c from public.simulation_sessions order by client_started_at limit 1`));
      expect(aliceCash[0].c).not.toBe("1");
    });

    it("cannot insert rows owned by Alice or attach rows to her session", async () => {
      const aliceSession = await t.as(ALICE, (q) => q<{ id: string }>(`select id from public.simulation_sessions limit 1`));
      await expect(
        t.as(BOB, (q) => q(`insert into public.concept_progress (user_id, concept_slug, status) values ($1, 'x', 'completed')`, [ALICE])),
      ).rejects.toThrow(/row-level security/);
      await expect(
        t.as(BOB, (q) =>
          q(`insert into public.holdings (session_id, ticker, quantity, cost_basis_paise) values ($1, 'KRTI', 1, 100)`, [aliceSession[0].id]),
        ),
      ).rejects.toThrow();
    });

    it("ignores any user id smuggled into the payload", async () => {
      const payload = { ...toPayload(appState(play(1, 1_900_000_000_000))), user_id: ALICE, simulation: { ...toPayload(appState(play(1, 1_900_000_000_000))).simulation, user_id: ALICE } };
      await t.saveProgress(BOB, payload);
      const bobSessions = await t.as(BOB, (q) => q<{ user_id: string }>(`select user_id from public.simulation_sessions`));
      expect(bobSessions).toEqual([{ user_id: BOB }]);
      const aliceSessions = await t.as(ALICE, (q) => q(`select id from public.simulation_sessions where client_started_at = 1900000000000`));
      expect(aliceSessions).toHaveLength(0);
    });

    it("delete_my_progress only removes the caller's own data", async () => {
      await t.as(BOB, (q) => q(`select public.delete_my_progress()`));
      const bob = stateFromCloud((await t.loadProgress(BOB)) as CloudProgress);
      expect(bob.simulation).toBeNull();
      const alice = stateFromCloud((await t.loadProgress(ALICE)) as CloudProgress);
      expect(alice.simulation).not.toBeNull();
      expect(Object.keys(alice.concepts)).toContain("pe-ratio");
    });

    it("anonymous visitors can't read data or call the RPCs", async () => {
      await expect(t.as(null, (q) => q(`select * from public.simulation_sessions`))).rejects.toThrow(/permission denied/);
      await expect(t.as(null, (q) => q(`select public.load_progress()`))).rejects.toThrow(/permission denied/);
    });
  });
});
