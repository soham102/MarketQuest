/**
 * Explicit scoring rubric. Profit never feeds into any learning dimension.
 * Every number here is shown to learners on the report so the scoring is transparent.
 */
export const SCORING = {
  dimensions: [
    {
      id: "comprehension",
      name: "Concept comprehension",
      description: "Share of knowledge checks (lessons and debriefs) you answered correctly on the first attempt.",
    },
    {
      id: "reasoning",
      name: "Decision reasoning",
      description:
        "Average of two rubric scores each round: the quality of the reason you gave, and how reasonable your action was given only the information available before the outcome.",
    },
    {
      id: "risk",
      name: "Risk awareness",
      description:
        "70% from the risk you identified before deciding, 30% from position sizing against your chosen risk profile's limits.",
    },
    {
      id: "diversification",
      name: "Portfolio diversification",
      description:
        "Based on how many sectors effectively carry your invested money, with a floor when no sector exceeds your profile's limit. Rounds where under 15% was invested are not scored.",
    },
    {
      id: "consistency",
      name: "Consistency",
      description: "Share of rounds where your action (buy, sell or hold) matched the reasoning you said you were following.",
    },
  ],
  /** How far (percentage points) invested share may sit from the profile target and still count as "on plan". */
  profileTolerancePct: 15,
  reasoning: { rationaleWeight: 0.5, pathWeight: 0.5 },
  risk: {
    choiceWeight: 0.7,
    sizingWeight: 0.3,
    /** Sizing score when within all limits / one limit breached / a position over 1.5× the cap. */
    sizing: { withinLimits: 100, breached: 60, severe: 25 },
  },
  diversification: {
    /** Below this invested share, diversification is not scored for the round. */
    minInvestedPct: 15,
    /** Effective sectors needed for a full score. */
    fullScoreSectors: 4,
    /** Score floor when the largest sector is within the profile's cap. */
    withinCapFloor: 60,
  },
  /** Bands used to describe scores in words; we avoid implying expertise from few decisions. */
  bands: [
    { min: 80, label: "Strong", tone: "up" as const },
    { min: 55, label: "Developing", tone: "neutral" as const },
    { min: 0, label: "Needs revision", tone: "down" as const },
  ],
} as const;

export type DimensionId = (typeof SCORING.dimensions)[number]["id"];

export function bandFor(score: number) {
  return SCORING.bands.find((b) => score >= b.min) ?? SCORING.bands[SCORING.bands.length - 1];
}
