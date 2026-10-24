import { CONCEPT_MAP } from "@/content/concepts";
import { getRound } from "@/content/rounds";
import type { AppState, RoundRecord } from "@/lib/types";

export interface ConceptEvidence {
  slug: string;
  title: string;
  correct: number;
  total: number;
  /** Human-readable reasons for each incorrect answer. */
  misses: string[];
}

/** Combine lesson-quiz and round knowledge-check answers per concept. */
export function conceptEvidence(state: AppState): ConceptEvidence[] {
  const map = new Map<string, ConceptEvidence>();
  const get = (slug: string) => {
    if (!map.has(slug)) map.set(slug, { slug, title: CONCEPT_MAP[slug]?.title ?? slug, correct: 0, total: 0, misses: [] });
    return map.get(slug)!;
  };

  for (const [slug, progress] of Object.entries(state.concepts)) {
    const concept = CONCEPT_MAP[slug];
    if (!concept) continue;
    for (const q of concept.quiz) {
      const a = progress.quiz[q.id];
      if (!a) continue;
      const e = get(slug);
      e.total += 1;
      if (a.correct) e.correct += 1;
      else e.misses.push(`Lesson question: “${q.question}”`);
    }
  }

  for (const r of state.simulation?.rounds ?? []) {
    if (r.knowledgeCheckAnswer === null) continue;
    const round = getRound(r.round);
    const correct = r.knowledgeCheckAnswer === round.knowledgeCheck.correctIndex;
    for (const slug of round.conceptSlugs) {
      const e = get(slug);
      e.total += 1;
      if (correct) e.correct += 1;
      else e.misses.push(`Round ${round.id} check: “${round.knowledgeCheck.question}”`);
    }
  }

  return [...map.values()];
}

export function strongestConcepts(evidence: ConceptEvidence[]) {
  return evidence
    .filter((e) => e.total >= 2 && e.correct === e.total)
    .sort((a, b) => b.total - a.total);
}

export function conceptsToRevise(evidence: ConceptEvidence[]) {
  return evidence
    .filter((e) => e.misses.length > 0)
    .sort((a, b) => a.correct / a.total - b.correct / b.total || b.misses.length - a.misses.length);
}

export interface LearningPathStep {
  slug: string;
  title: string;
  reason: string;
  completed: boolean;
}

/**
 * Personalised path: concepts with incorrect answers first (weakest first), then
 * concepts behind rounds where the decision was classified as high-risk.
 */
export function learningPath(state: AppState): LearningPathStep[] {
  const steps: LearningPathStep[] = [];
  const seen = new Set<string>();
  for (const e of conceptsToRevise(conceptEvidence(state))) {
    seen.add(e.slug);
    steps.push({
      slug: e.slug,
      title: e.title,
      reason: `${e.misses.length} incorrect answer${e.misses.length === 1 ? "" : "s"} — e.g. ${e.misses[0]}`,
      completed: state.concepts[e.slug]?.status === "completed",
    });
  }
  for (const r of state.simulation?.rounds ?? []) {
    const round = getRound(r.round);
    const path = round.paths.find((p) => p.id === r.pathId);
    if (path?.verdict !== "risky") continue;
    const slug = round.conceptSlugs[0];
    if (seen.has(slug)) continue;
    seen.add(slug);
    steps.push({
      slug,
      title: CONCEPT_MAP[slug]?.title ?? slug,
      reason: `Round ${round.id} decision was classified as “${path.label}”.`,
      completed: state.concepts[slug]?.status === "completed",
    });
  }
  return steps;
}

export function roundChange(r: RoundRecord) {
  return r.valueAfter - r.valueStart;
}

export function extremeRounds(rounds: RoundRecord[]) {
  if (rounds.length === 0) return { best: null, worst: null };
  const sorted = [...rounds].sort((a, b) => roundChange(b) - roundChange(a));
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}
