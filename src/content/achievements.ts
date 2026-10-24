import type { AppState } from "@/lib/types";
import { CONCEPTS } from "./concepts";
import { concentration } from "@/lib/engine/portfolio";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: "book" | "books" | "trophy" | "shuffle" | "flag" | "brain" | "shield" | "anchor" | "graduation" | "receipt";
  unlocked: (s: AppState) => boolean;
}

const completedConcepts = (s: AppState) => Object.values(s.concepts).filter((c) => c.status === "completed").length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-lesson", title: "First lesson", description: "Completed your first concept module.", icon: "book", unlocked: (s) => completedConcepts(s) >= 1 },
  { id: "five-lessons", title: "Concept explorer", description: "Completed five concept modules.", icon: "books", unlocked: (s) => completedConcepts(s) >= 5 },
  { id: "all-lessons", title: "Full syllabus", description: "Completed every concept module.", icon: "graduation", unlocked: (s) => completedConcepts(s) >= CONCEPTS.length },
  { id: "first-trade", title: "First order", description: "Placed your first virtual order.", icon: "receipt", unlocked: (s) => (s.simulation?.transactions.length ?? 0) > 0 },
  {
    id: "diversified",
    title: "Spread out",
    description: "Held stocks in three or more sectors at once.",
    icon: "shuffle",
    unlocked: (s) => !!s.simulation && concentration(s.simulation, s.simulation.prices).sectorCount >= 3,
  },
  { id: "halfway", title: "Halfway there", description: "Completed five simulation rounds.", icon: "flag", unlocked: (s) => (s.simulation?.rounds.length ?? 0) >= 5 },
  {
    id: "sharp-mind",
    title: "Sharp mind",
    description: "Answered three debrief knowledge checks correctly.",
    icon: "brain",
    unlocked: (s) => (s.simulation?.rounds.filter((r) => r.scores.comprehension === 100).length ?? 0) >= 3,
  },
  {
    id: "rumour-proof",
    title: "Rumour-proof",
    description: "Didn't buy into the Round 8 rumour.",
    icon: "shield",
    unlocked: (s) => ["wait", "trim"].includes(s.simulation?.rounds.find((r) => r.round === 8)?.pathId ?? ""),
  },
  {
    id: "steady-hands",
    title: "Steady hands",
    description: "Avoided an all-or-nothing reaction in the Round 7 crash.",
    icon: "anchor",
    unlocked: (s) => ["hold", "selective-buy", "partial-sell"].includes(s.simulation?.rounds.find((r) => r.round === 7)?.pathId ?? ""),
  },
  { id: "graduate", title: "MarketQuest graduate", description: "Completed all ten simulation rounds.", icon: "trophy", unlocked: (s) => s.simulation?.status === "completed" },
];
