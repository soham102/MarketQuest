/**
 * Guided-tour content. Each step highlights the element marked with data-tour="<target>".
 * Steps without a target (or whose target isn't on screen) show as a centred card.
 */
export interface TourStep {
  target?: string;
  title: string;
  body: string;
}

const NAV_STEPS: TourStep[] = [
  { target: "nav-learn", title: "Learn", body: "Short, interactive lessons on how markets work — sliders, experiments and quick checks instead of long articles." },
  { target: "nav-simulate", title: "Simulate", body: "Ten rounds of fictional news. Trade with ₹1,00,000 of virtual money and see what happens." },
  { target: "nav-report", title: "Report", body: "After Round 10, your results and a personalised learning path appear here." },
];

const ACCOUNT_STEP: TourStep = {
  target: "header-account",
  title: "Save your progress",
  body: "Sign in with Google to keep your progress across devices. You can also keep going without an account.",
};

const HELP_STEP: TourStep = {
  target: "tour-helper",
  title: "Help is always here",
  body: "Click this button any time to replay the tour for the page you're on.",
};

export const TOURS: Record<string, TourStep[]> = {
  home: [
    { title: "Welcome to MarketQuest 👋", body: "Learn how the stock market works by making decisions — not memorising definitions. This quick tour shows you around." },
    ...NAV_STEPS,
    { target: "home-progress", title: "Your progress", body: "Track lessons completed, your current round and your virtual portfolio's value and P&L." },
    { target: "home-modules", title: "Start with a lesson", body: "Lessons are listed in a recommended order. Each takes under ten minutes." },
    ACCOUNT_STEP,
    HELP_STEP,
  ],
  general: [
    { title: "Finding your way around", body: "A quick look at where everything lives in MarketQuest." },
    { target: "nav-home", title: "Home", body: "Your dashboard: progress, recommended lessons and achievements." },
    ...NAV_STEPS,
    ACCOUNT_STEP,
    HELP_STEP,
  ],
  learn: [
    { title: "The concept library", body: "Every lesson is interactive and ends with a short knowledge check." },
    { target: "learn-search", title: "Search", body: "Look up a topic — try “P/E”, “inflation” or “diversification”." },
    { target: "learn-filters", title: "Filter by topic", body: "Narrow the library to one of five areas, from fundamentals to trading mechanics." },
    { target: "learn-card", title: "Open a lesson", body: "Each card shows the difficulty, time needed and whether you've finished it." },
    HELP_STEP,
  ],
  lesson: [
    { title: "How a lesson works", body: "Seven short steps: introduction, visual, worked example, experiment, knowledge check, apply it, and a summary." },
    { target: "lesson-progress", title: "Your place in the lesson", body: "See which step you're on. Progress is saved, so you can leave and come back." },
    { target: "lesson-content", title: "Interact as you learn", body: "Move sliders, step through examples and run experiments right here." },
    { target: "lesson-next", title: "Move on", body: "Use Next to continue. On the knowledge check, answer every question to unlock the next step." },
    HELP_STEP,
  ],
  lobby: [
    { title: "The simulation", body: "Ten rounds, ₹1,00,000 of virtual money, and fictional news. No real money is ever involved." },
    { target: "lobby-start", title: "Start or resume", body: "Choose a risk profile to begin — it sets the limits your decisions are compared against. Already playing? Resume from here." },
    { target: "lobby-rounds", title: "The ten rounds", body: "Each round teaches one idea. Completed rounds can be reviewed any time." },
    { target: "lobby-rules", title: "The rules", body: "Whole shares, a small 0.10% charge, no spending more than you have — and every round is final once confirmed." },
    HELP_STEP,
  ],
  terminal: [
    { title: "Your trading terminal", body: "Read the news, decide, and confirm. Here's how a round works." },
    { target: "terminal-summary", title: "Your portfolio", body: "Portfolio value, available cash and your profit or loss so far." },
    { target: "terminal-news", title: "1. Read the news", body: "The headline, background and facts you know right now. Prices react after you decide." },
    { target: "terminal-market", title: "2. Pick a stock", body: "All eight fictional companies. Stocks in the news are tagged; tap one to trade it." },
    { target: "terminal-order", title: "3. Place orders", body: "Choose buy or sell and a quantity. You'll see the cost and charges before adding it. You can stage several orders — or none, to hold." },
    { target: "terminal-decision", title: "4. Explain and confirm", body: "Say why you're deciding and what risk you see, then confirm. Your reasoning is judged separately from your profit." },
    HELP_STEP,
  ],
  debrief: [
    { title: "The debrief", body: "After every round, see what happened, why — and how your thinking measured up." },
    { target: "debrief-outcome", title: "What happened", body: "The news that followed and how each simulated price moved." },
    { target: "debrief-judge", title: "Judged four ways", body: "Profit, reasoning, risk awareness and understanding are assessed separately. A good decision can still lose money." },
    { target: "debrief-alternatives", title: "What if?", body: "Your round replayed with other decisions, from the same starting position." },
    { target: "debrief-check", title: "Knowledge check", body: "Answer one question to continue to the next round." },
    HELP_STEP,
  ],
  report: [
    { title: "Your final report", body: "Your financial results and your learning progress, reported separately on purpose." },
    { target: "report-performance", title: "Performance", body: "Returns, P&L and how your portfolio changed round by round." },
    { target: "report-learning", title: "Learning dimensions", body: "Five scores that never use profit. Tap any one to see exactly how it's calculated." },
    { target: "report-path", title: "What to study next", body: "A learning path built from the questions you missed." },
    HELP_STEP,
  ],
};

/** Pick the tour for the current page (and, in the simulator, the current phase). */
export function tourKeyFor(pathname: string, hasElement: (target: string) => boolean): keyof typeof TOURS {
  if (pathname === "/") return "home";
  if (pathname === "/learn") return "learn";
  if (pathname.startsWith("/learn/")) return "lesson";
  if (pathname === "/simulate") return "lobby";
  if (pathname.startsWith("/simulate/review")) return "debrief";
  if (pathname.startsWith("/simulate/play")) return hasElement("debrief-judge") ? "debrief" : hasElement("terminal-order") ? "terminal" : "general";
  if (pathname.startsWith("/simulate/report")) return hasElement("report-performance") ? "report" : "general";
  return "general";
}
