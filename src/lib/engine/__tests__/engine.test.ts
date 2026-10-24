import { describe, expect, it } from "vitest";
import { SIM_CONFIG, STOCKS } from "@/content/market";
import { ROUNDS, getRound } from "@/content/rounds";
import type { Order, SimulationState } from "@/lib/types";
import { applyPct, formatINR, toPaise } from "../money";
import { chargesFor, executeOrder, maxAffordable, validateOrder, validateOrderBatch, type Ledger } from "../orders";
import {
  concentration,
  holdingViews,
  portfolioValue,
  sectorAllocation,
  totalPnl,
  unrealizedPnl,
} from "../portfolio";
import {
  advanceRound,
  answerKnowledgeCheck,
  applyMoves,
  createSimulation,
  resolveRound,
  simulateAlternative,
  SimulationError,
} from "../simulation";
import { assessLearning, netAction } from "../assessment";

const emptyLedger = (cash: number = SIM_CONFIG.initialCapital): Ledger => ({
  cash,
  holdings: {},
  realizedPnl: 0,
  charges: 0,
  transactions: [],
});

const prices = { KRTI: 500_00, SHKT: 800_00 };
const meta = { round: 1, id: "t" };

/** Accounting identity: value − capital = realised + unrealised − charges. */
function expectIdentity(s: { cash: number; holdings: Ledger["holdings"]; realizedPnl: number; charges: number }, p: Record<string, number>) {
  expect(totalPnl(s, p)).toBe(s.realizedPnl + unrealizedPnl(s, p) - s.charges);
}

describe("money", () => {
  it("converts and formats rupees with Indian grouping", () => {
    expect(toPaise(1234.565)).toBe(123457);
    expect(formatINR(100_000_00)).toBe("₹1,00,000.00");
    expect(formatINR(-1550)).toBe("−₹15.50");
    expect(formatINR(1550, { signed: true })).toBe("+₹15.50");
  });

  it("applies percentage moves deterministically to the nearest paisa", () => {
    expect(applyPct(520_00, 6)).toBe(551_20);
    expect(applyPct(1200_00, -7)).toBe(1116_00);
    expect(applyPct(333_33, 3.33)).toBe(applyPct(333_33, 3.33));
    expect(applyPct(100_00, 0)).toBe(100_00);
  });
});

describe("buying shares", () => {
  it("debits cash including charges and records cost basis", () => {
    const { ledger, transaction } = executeOrder(emptyLedger(), { ticker: "KRTI", side: "buy", quantity: 10 }, prices, meta);
    expect(transaction.value).toBe(5000_00);
    expect(transaction.charges).toBe(5_00);
    expect(ledger.cash).toBe(SIM_CONFIG.initialCapital - 5005_00);
    expect(ledger.holdings.KRTI).toEqual({ quantity: 10, costBasis: 5000_00 });
    expect(ledger.charges).toBe(5_00);
    expectIdentity(ledger, prices);
  });

  it("averages cost across multiple buys", () => {
    let l = executeOrder(emptyLedger(), { ticker: "KRTI", side: "buy", quantity: 10 }, prices, meta).ledger;
    l = executeOrder(l, { ticker: "KRTI", side: "buy", quantity: 10 }, { ...prices, KRTI: 600_00 }, meta).ledger;
    const view = holdingViews(l, { ...prices, KRTI: 600_00 })[0];
    expect(view.quantity).toBe(20);
    expect(view.avgCost).toBe(550_00);
    expect(view.unrealized).toBe(1000_00);
  });
});

describe("selling shares", () => {
  it("realises P&L against average cost and credits cash net of charges", () => {
    let l = executeOrder(emptyLedger(), { ticker: "KRTI", side: "buy", quantity: 10 }, prices, meta).ledger;
    const up = { ...prices, KRTI: 550_00 };
    const res = executeOrder(l, { ticker: "KRTI", side: "sell", quantity: 4 }, up, meta);
    l = res.ledger;
    expect(res.transaction.realizedPnl).toBe(200_00); // 4 × ₹50
    expect(l.holdings.KRTI).toEqual({ quantity: 6, costBasis: 3000_00 });
    expect(l.realizedPnl).toBe(200_00);
    expectIdentity(l, up);
  });

  it("removes the holding entirely on a full exit with no residual cost basis", () => {
    let l = executeOrder(emptyLedger(), { ticker: "KRTI", side: "buy", quantity: 3 }, { KRTI: 333_33 }, meta).ledger;
    l = executeOrder(l, { ticker: "KRTI", side: "sell", quantity: 1 }, { KRTI: 333_33 }, meta).ledger;
    l = executeOrder(l, { ticker: "KRTI", side: "sell", quantity: 2 }, { KRTI: 400_00 }, meta).ledger;
    expect(l.holdings.KRTI).toBeUndefined();
    expectIdentity(l, { KRTI: 400_00 });
  });
});

describe("order validation", () => {
  const l = emptyLedger(10_000_00);
  it.each<[Order, RegExp]>([
    [{ ticker: "KRTI", side: "buy", quantity: 0 }, /at least 1/],
    [{ ticker: "KRTI", side: "buy", quantity: -5 }, /at least 1/],
    [{ ticker: "KRTI", side: "buy", quantity: 2.5 }, /whole/],
    [{ ticker: "KRTI", side: "buy", quantity: Number.NaN }, /whole number/],
    [{ ticker: "NOPE", side: "buy", quantity: 1 }, /Unknown stock/],
    [{ ticker: "KRTI", side: "buy", quantity: 20 }, /afford up to 19/],
    [{ ticker: "KRTI", side: "sell", quantity: 1 }, /don't own any/],
  ])("rejects %o", (order, message) => {
    const res = validateOrder(l, order, prices);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(message);
  });

  it("rejects selling more than owned", () => {
    const owned = executeOrder(l, { ticker: "KRTI", side: "buy", quantity: 5 }, prices, meta).ledger;
    const res = validateOrder(owned, { ticker: "KRTI", side: "sell", quantity: 6 }, prices);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/at most 5/);
  });

  it("computes max affordable quantity including charges", () => {
    expect(maxAffordable(10_000_00, 500_00)).toBe(19);
    const q = maxAffordable(SIM_CONFIG.initialCapital, 520_00);
    expect(q * 520_00 + chargesFor(q * 520_00)).toBeLessThanOrEqual(SIM_CONFIG.initialCapital);
    expect((q + 1) * 520_00 + chargesFor((q + 1) * 520_00)).toBeGreaterThan(SIM_CONFIG.initialCapital);
  });

  it("validates batches sequentially so cash can't be double-spent", () => {
    const orders: Order[] = [
      { ticker: "KRTI", side: "buy", quantity: 15 },
      { ticker: "KRTI", side: "buy", quantity: 5 },
    ];
    const res = validateOrderBatch(l, orders, prices);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.index).toBe(1);
  });

  it("allows selling shares bought earlier in the same batch", () => {
    const res = validateOrderBatch(l, [
      { ticker: "KRTI", side: "buy", quantity: 5 },
      { ticker: "KRTI", side: "sell", quantity: 5 },
    ], prices);
    expect(res.ok).toBe(true);
  });
});

describe("portfolio calculations", () => {
  it("values portfolio as cash + holdings and allocates by sector", () => {
    let l = executeOrder(emptyLedger(), { ticker: "KRTI", side: "buy", quantity: 20 }, prices, meta).ledger;
    l = executeOrder(l, { ticker: "SHKT", side: "buy", quantity: 10 }, prices, meta).ledger;
    expect(portfolioValue(l, prices)).toBe(l.cash + 20 * 500_00 + 10 * 800_00);
    const alloc = sectorAllocation(l, prices);
    expect(alloc.map((a) => a.id)).toEqual(["consumer", "banking", "cash"]);
    const c = concentration(l, prices);
    expect(c.sectorCount).toBe(2);
    expect(c.maxSector).toBe("consumer");
    expect(c.effectiveSectors).toBeGreaterThan(1.9);
  });
});

describe("price changes", () => {
  it("applies scripted moves and rejects unknown tickers", () => {
    expect(applyMoves({ KRTI: 520_00 }, [{ ticker: "KRTI", pct: 6, reason: "" }])).toEqual({ KRTI: 551_20 });
    expect(() => applyMoves({ KRTI: 1 }, [{ ticker: "X", pct: 1, reason: "" }])).toThrow(SimulationError);
  });

  it("produces identical price paths on every run", () => {
    const run = () => {
      let s = createSimulation("balanced", 0);
      for (const r of ROUNDS) {
        s = resolveRound(s, r.id, { orders: [], rationaleId: r.rationales[0].id, riskId: r.risks[0].id });
        s = answerKnowledgeCheck(s, r.id, 0);
        s = advanceRound(s);
      }
      return s;
    };
    expect(run().prices).toEqual(run().prices);
    expect(run().status).toBe("completed");
  });

  it("matches authored facts in the round content", () => {
    let s = createSimulation("balanced", 0);
    for (let i = 1; i <= 3; i++) {
      s = resolveRound(s, i, { orders: [], rationaleId: getRound(i).rationales[0].id, riskId: getRound(i).risks[0].id });
      s = advanceRound(answerKnowledgeCheck(s, i, 0));
    }
    // Round 4 says DhanSetu trades at about ₹1,116.
    expect(s.prices.DHAN).toBe(1116_00);
  });
});

describe("simulation lifecycle", () => {
  const decide = (s: SimulationState, orders: Order[] = []) => {
    const r = getRound(s.currentRound);
    return resolveRound(s, r.id, { orders, rationaleId: r.rationales[0].id, riskId: r.risks[0].id });
  };

  it("starts with ₹1,00,000 and deterministic prices", () => {
    const s = createSimulation("balanced", 0);
    expect(s.cash).toBe(100_000_00);
    expect(s.currentRound).toBe(1);
    expect(s.phase).toBe("decision");
    for (const st of STOCKS) expect(s.prices[st.ticker]).toBe(st.startPrice);
    expect(s.priceHistory.KRTI.at(-1)!.price).toBe(520_00);
  });

  it("resolves a round with orders and keeps accounting consistent", () => {
    let s = createSimulation("balanced", 0);
    s = decide(s, [{ ticker: "KRTI", side: "buy", quantity: 30 }]);
    const rec = s.rounds[0];
    expect(s.phase).toBe("debrief");
    expect(s.holdings.KRTI.quantity).toBe(30);
    expect(s.prices.KRTI).toBe(551_20);
    expect(rec.valueAfter).toBe(portfolioValue(s, s.prices));
    expect(rec.valueAfter - rec.valueAfterTrades).toBe(30 * (551_20 - 520_00));
    expect(rec.pathId).toBe("measured-buy");
    expectIdentity(s, s.prices);
  });

  it("refuses to resolve the same round twice", () => {
    const s = decide(createSimulation("balanced", 0));
    expect(() => decide(s)).toThrow(/already been resolved/);
  });

  it("rejects invalid orders during resolution without changing state", () => {
    const s = createSimulation("balanced", 0);
    expect(() => decide(s, [{ ticker: "KRTI", side: "sell", quantity: 1 }])).toThrow(/Order 1/);
    expect(s.cash).toBe(100_000_00);
  });

  it("requires a knowledge-check answer before advancing, and counts only the first answer", () => {
    let s = decide(createSimulation("balanced", 0));
    expect(() => advanceRound(s)).toThrow(/knowledge check/);
    const correct = getRound(1).knowledgeCheck.correctIndex;
    const wrong = (correct + 1) % getRound(1).knowledgeCheck.options.length;
    s = answerKnowledgeCheck(s, 1, wrong);
    s = answerKnowledgeCheck(s, 1, correct);
    expect(s.rounds[0].knowledgeCheckAnswer).toBe(wrong);
    expect(s.rounds[0].scores.comprehension).toBe(0);
    s = advanceRound(s);
    expect(s.currentRound).toBe(2);
    expect(s.prices.ARYA).toBe(applyPct(690_00, 3)); // round 2 market-open move
  });

  it("restarting creates a fresh, independent simulation", () => {
    let s = decide(createSimulation("growth", 0), [{ ticker: "DHAN", side: "buy", quantity: 10 }]);
    expect(s.transactions.length).toBe(1);
    s = createSimulation("cautious", 1);
    expect(s.transactions).toEqual([]);
    expect(s.holdings).toEqual({});
    expect(s.rounds).toEqual([]);
    expect(s.profile).toBe("cautious");
    expect(totalPnl(s, s.prices)).toBe(0);
  });

  it("keeps the accounting identity across a full 10-round run with trading", () => {
    let s = createSimulation("balanced", 0);
    const plan: Record<number, Order[]> = {
      1: [{ ticker: "KRTI", side: "buy", quantity: 25 }, { ticker: "SHKT", side: "buy", quantity: 12 }],
      2: [{ ticker: "ARYA", side: "buy", quantity: 15 }],
      3: [{ ticker: "ARYA", side: "sell", quantity: 7 }, { ticker: "PRAN", side: "buy", quantity: 10 }],
      6: [{ ticker: "VYOM", side: "buy", quantity: 5 }],
      7: [{ ticker: "KRTI", side: "sell", quantity: 25 }],
      9: [{ ticker: "PRAN", side: "sell", quantity: 4 }],
    };
    for (const r of ROUNDS) {
      s = decide(s, plan[r.id] ?? []);
      expectIdentity(s, s.prices);
      s = advanceRound(answerKnowledgeCheck(s, r.id, r.knowledgeCheck.correctIndex));
    }
    expect(s.status).toBe("completed");
    expect(s.valueHistory).toHaveLength(11);
    expect(() => advanceRound(s)).toThrow(/complete/);
  });
});

describe("alternatives and assessment", () => {
  it("replays an alternative from the same starting position", () => {
    const s = resolveRound(createSimulation("balanced", 0), 1, { orders: [], rationaleId: "observe", riskId: "execution" });
    const rec = s.rounds[0];
    const alt = simulateAlternative(rec, getRound(1).alternatives[0]);
    const qty = maxAffordable(10_000_00, 520_00);
    expect(alt.valueAfter).toBe(100_000_00 - qty * 520_00 - chargesFor(qty * 520_00) + qty * 551_20);
    const hold = simulateAlternative(rec, getRound(1).alternatives[2]);
    expect(hold.change).toBe(0);
  });

  it("marks sell alternatives as not applicable when nothing is held", () => {
    let s = createSimulation("balanced", 0);
    s = advanceRound(answerKnowledgeCheck(resolveRound(s, 1, { orders: [], rationaleId: "observe", riskId: "execution" }), 1, 0));
    s = resolveRound(s, 2, { orders: [], rationaleId: "wait", riskId: "expectations" });
    const res = simulateAlternative(s.rounds[1], getRound(2).alternatives[1]);
    expect(res.applicable).toBe(false);
  });

  it("scores learning separately from profit", () => {
    let s = createSimulation("balanced", 0);
    s = resolveRound(s, 1, { orders: [{ ticker: "KRTI", side: "buy", quantity: 150 }], rationaleId: "guaranteed", riskId: "none" });
    const rec = s.rounds[0];
    expect(rec.valueAfter).toBeGreaterThan(rec.valueBefore); // profitable…
    expect(rec.pathId).toBe("all-in");
    expect(rec.scores.reasoning).toBeLessThan(40); // …but poorly reasoned
    expect(rec.scores.risk).toBeLessThan(40);
    expect(rec.scores.consistent).toBe(true);
    const a = assessLearning(s, {});
    expect(a.dimensions.find((d) => d.id === "reasoning")!.score).toBe(rec.scores.reasoning);
  });

  it("derives net action from orders", () => {
    expect(netAction([], prices)).toBe("hold");
    expect(netAction([{ ticker: "KRTI", side: "sell", quantity: 1 }], prices)).toBe("sell");
  });
});

describe("content integrity", () => {
  it("varies the correct answer position and keeps it valid", async () => {
    const { CONCEPTS } = await import("@/content/concepts");
    const checks = [...ROUNDS.map((r) => r.knowledgeCheck), ...CONCEPTS.flatMap((c) => c.quiz)];
    for (const c of checks) {
      expect(c.correctIndex).toBeGreaterThanOrEqual(0);
      expect(c.correctIndex).toBeLessThan(c.options.length);
    }
    expect(new Set(checks.map((c) => c.correctIndex)).size).toBeGreaterThan(2);
  });

  it("every round has paths, alternatives, a catch-all and valid concept links", async () => {
    const { CONCEPT_MAP } = await import("@/content/concepts");
    expect(ROUNDS).toHaveLength(SIM_CONFIG.totalRounds);
    for (const r of ROUNDS) {
      expect(r.paths.length).toBeGreaterThanOrEqual(2);
      expect(r.paths.at(-1)!.match.kind).toBe("other");
      expect(r.alternatives.length).toBeGreaterThanOrEqual(2);
      expect(r.assumptions.length).toBeGreaterThan(0);
      for (const s of r.conceptSlugs) expect(CONCEPT_MAP[s]).toBeDefined();
      for (const step of r.outcome) for (const m of step.moves) expect(m.reason.length).toBeGreaterThan(5);
    }
  });
});
