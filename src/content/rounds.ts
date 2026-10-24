import type { RoundDefinition } from "@/lib/types";
import { arrangeOptions } from "./arrange";

/**
 * The 10-round curriculum. All companies, news and price moves are hypothetical.
 * Each move carries the mechanism it illustrates; other stocks are held constant
 * where possible so a round isolates one idea. These scenarios do not predict real markets.
 */
const AUTHORED_ROUNDS: RoundDefinition[] = [
  /* ---------------------------------------------------------------- */
  {
    id: 1,
    slug: "first-investment",
    title: "Understanding the stock market",
    concepts: ["Stocks", "Ownership", "Price changes", "Buy / sell / hold"],
    learningObjective: "Understand what owning a share means and how your portfolio value changes when prices move.",
    headline: "Kriti Foods to open three new plants, expanding into Odisha, Assam and Bihar",
    source: "Company press release · verified exchange filing",
    background:
      "Kriti Foods makes packaged staples and snacks. It announced a ₹1,200 crore expansion that will add about 15% to its production capacity over the next 18 months. The company says it will pay for the plants from cash it has already earned, without new borrowing. This is your first decision: you have ₹1,00,000 of virtual cash and no shares yet.",
    facts: [
      "Each Kriti share is a tiny slice of ownership in the company's future profits.",
      "The expansion is funded from internal cash — the company has almost no debt.",
      "New plants take 18 months to build; extra sales will not show up immediately.",
      "Kriti trades at about 38 times its annual earnings per share, so investors already expect steady growth.",
    ],
    focusTickers: ["KRTI"],
    thinkAbout: [
      "What exactly do you own when you buy a share?",
      "How much of your ₹1,00,000 would you be comfortable seeing fall in value?",
      "Is this news already confirmed, and how soon will it affect profits?",
    ],
    rationaleQuestion: "Which statement best describes your reasoning?",
    rationales: [
      {
        id: "measured",
        text: "The expansion could grow future profits, so I'm buying a modest amount to start learning how ownership works.",
        score: 90,
        impliedActions: ["buy"],
        feedback: "Connects the news to future profits and keeps the position small — a sound first step.",
      },
      {
        id: "guaranteed",
        text: "Good news means the price is guaranteed to go up, so buying is a sure win.",
        score: 15,
        impliedActions: ["buy"],
        feedback: "No news guarantees a price rise. Prices reflect what investors already expect, and plans can change.",
      },
      {
        id: "observe",
        text: "I want to see how prices react to news before committing money.",
        score: 80,
        impliedActions: ["hold"],
        feedback: "Observing first is a legitimate choice. The trade-off is that you learn less from a position you don't hold.",
      },
      {
        id: "maximise",
        text: "I'll invest most of my money in Kriti to maximise my gain.",
        score: 25,
        impliedActions: ["buy"],
        feedback: "Sizing for maximum gain ignores maximum loss. One company and one headline is a narrow base for most of your money.",
      },
    ],
    riskQuestion: "What is the most important risk to keep in mind?",
    risks: [
      { id: "execution", text: "The expansion could be delayed or cost more than planned, hurting profits.", score: 100, feedback: "Yes — execution risk is the main company-specific risk here." },
      { id: "concentration", text: "Putting a large share of my money into a single company.", score: 90, feedback: "Good — concentration magnifies any company-specific surprise." },
      { id: "none", text: "There is little risk because the company is growing and has no debt.", score: 10, feedback: "Low debt lowers one risk, but growth plans and share prices can still disappoint." },
    ],
    outcome: [
      {
        label: "2 weeks",
        headline: "Analysts raise Kriti's long-term volume estimates",
        detail:
          "Brokerage analysts updated their models to include the new capacity. Because the expansion is funded without debt, they see little risk to the balance sheet.",
        moves: [{ ticker: "KRTI", pct: 6, reason: "Higher expected future profits, funded without new debt, raise what investors will pay per share." }],
      },
    ],
    assumptions: [
      "Investors treat the debt-free expansion as a credible signal of higher future earnings.",
      "All other stocks are held constant to isolate how one company's news changes one share price.",
      "You trade at the price shown when the news breaks; in real markets prices often react within seconds.",
    ],
    whyItHappened:
      "A share's price reflects what investors expect the company to earn in the future. The expansion raised those expectations, so buyers were willing to pay more. If you owned shares, your portfolio value rose even though you didn't sell — that is an unrealised gain. It becomes realised only when you sell.",
    overlookedRisks: [
      "The 6% rise came from changed expectations, not higher profits yet. If construction is delayed, expectations can fall back.",
      "A gain on paper (unrealised) can disappear before you sell.",
      "Transaction charges reduce returns on small, frequent trades.",
    ],
    paths: [
      { id: "all-in", label: "Large bet on one headline", match: { kind: "buy", tickers: ["KRTI"], minExposurePct: 40 }, verdict: "risky", score: 30, feedback: "You put a large share of your portfolio into one company on day one. It worked this time, but the reasoning carried a lot of single-company risk.", tradeOffs: "Bigger positions magnify both gains and losses. A smaller position would have taught the same lesson with less downside." },
      { id: "measured-buy", label: "Measured first position", match: { kind: "buy", tickers: ["KRTI"] }, verdict: "reasonable", score: 85, feedback: "You took a position sized to learn, linked to verified news about future profits.", tradeOffs: "A smaller stake earns a smaller gain, but it keeps cash available for later opportunities." },
      { id: "watch", label: "Watched before committing", match: { kind: "hold" }, verdict: "reasonable", score: 75, feedback: "Holding cash while you learn is a defensible choice for a first decision.", tradeOffs: "You missed this gain, but you avoided risk you weren't yet comfortable with. Both are valid." },
      { id: "elsewhere", label: "Invested elsewhere", match: { kind: "buy" }, verdict: "defensible", score: 65, feedback: "You invested, but not on the basis of today's news. That's fine if you had a separate reason.", tradeOffs: "Investing without a clear reason makes it harder to learn from the result." },
      { id: "other", label: "Other approach", match: { kind: "other" }, verdict: "defensible", score: 60, feedback: "Your decision didn't fit the usual patterns for this scenario.", tradeOffs: "Reflect on whether your action matched the reason you gave." },
    ],
    alternatives: [
      { id: "small", label: "Buy ₹10,000 of Kriti", description: "A small learning position.", orders: [{ ticker: "KRTI", side: "buy", mode: "amount", value: 10000 }] },
      { id: "large", label: "Buy ₹60,000 of Kriti", description: "A concentrated bet on one headline.", orders: [{ ticker: "KRTI", side: "buy", mode: "amount", value: 60000 }] },
      { id: "hold", label: "Stay in cash", description: "No trades this round.", orders: [] },
    ],
    knowledgeCheck: {
      id: "r1-kc",
      question: "You buy 20 shares at ₹500 each. The price rises to ₹530 and you have not sold. Which statement is true?",
      options: [
        "You have an unrealised gain of ₹600.",
        "You have a realised gain of ₹600.",
        "Your gain is ₹30, because the price rose by ₹30.",
        "Nothing has changed until you sell.",
      ],
      correctIndex: 0,
      explanation:
        "20 shares × ₹30 rise = ₹600. It is unrealised because you still hold the shares — it can grow or shrink until you sell. Your portfolio value has changed, even though no money has moved.",
    },
    conceptSlugs: ["what-is-a-stock", "portfolio-value-pnl"],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 2,
    slug: "earnings-surprise",
    title: "Company earnings",
    concepts: ["Revenue", "Profit", "Earnings growth", "Earnings surprises", "Guidance"],
    learningObjective: "Understand why good reported results do not always lead to rising prices.",
    headline: "Aryavart Motors beats profit estimates — but cuts its full-year outlook",
    source: "Quarterly results filing and management conference call",
    background:
      "Aryavart Motors reported quarterly profit up 22% from last year; analysts had expected 15%. The stock jumped 3% when results came out. But on the afternoon call, management cut its full-year sales-volume forecast from 12% growth to 7%, citing costlier steel and slowing rural demand.",
    marketOpen: {
      headline: "Morning: shares jump on the headline profit beat",
      moves: [{ ticker: "ARYA", pct: 3, reason: "Initial reaction to profit beating estimates, before the outlook was discussed." }],
    },
    facts: [
      "Revenue: ₹9,840 crore, up 14% year on year (estimate: 12%).",
      "Net profit: ₹812 crore, up 22% (estimate: 15%) — an earnings surprise.",
      "Guidance cut: full-year volume growth now 7%, down from 12%.",
      "Before results, the stock traded at 27 times earnings — pricing in strong growth.",
    ],
    focusTickers: ["ARYA"],
    thinkAbout: [
      "Does the share price reflect the past quarter or expected future profits?",
      "What had investors already expected before the results?",
      "Which matters more for the next year: last quarter's beat or the new outlook?",
    ],
    rationaleQuestion: "Which statement best describes your reasoning?",
    rationales: [
      { id: "outlook", text: "The lower outlook matters more than one strong quarter, so I'll reduce or avoid Aryavart.", score: 90, impliedActions: ["sell", "hold"], feedback: "Correctly weighs forward-looking guidance over backward-looking results." },
      { id: "beat", text: "Profit beat estimates by a wide margin, so the stock should keep rising.", score: 30, impliedActions: ["buy"], feedback: "The beat was already reflected in the morning jump. Prices look forward, and the outlook just got weaker." },
      { id: "wait", text: "The signals conflict, so I'll wait for analysts to digest the call.", score: 80, impliedActions: ["hold"], feedback: "Recognising mixed signals and waiting is a reasonable, humble response." },
      { id: "contrarian", text: "Others will overreact to the outlook cut; I'll buy a small amount for the long term.", score: 55, impliedActions: ["buy"], feedback: "A long-term contrarian view can be defensible, but it needs a reason why the market is wrong, not just a hope." },
    ],
    riskQuestion: "What risk is most important here?",
    risks: [
      { id: "expectations", text: "Future profit estimates may fall after the guidance cut, pulling the price down.", score: 100, feedback: "Exactly — the outlook resets expectations for the next four quarters." },
      { id: "chasing", text: "Buying after a jump means paying a price that already reflects good news.", score: 85, feedback: "Good — chasing a move often means paying for news that's already priced in." },
      { id: "none", text: "The company is profitable, so the downside is limited.", score: 15, feedback: "Profitable companies can still fall sharply when expected growth slows." },
    ],
    outcome: [
      {
        label: "1 week",
        headline: "Analysts cut Aryavart's earnings forecasts by 9%",
        detail: "Most brokerages lowered next year's profit estimates to reflect the slower volume outlook and higher steel costs.",
        moves: [{ ticker: "ARYA", pct: -8, reason: "Lower expected future earnings at a similar valuation multiple mean a lower fair price." }],
      },
    ],
    assumptions: [
      "Investors value the company on next year's expected profits, not last quarter's.",
      "The valuation multiple stays roughly unchanged; the price falls because earnings estimates fall.",
      "Other stocks are held constant to isolate the earnings-versus-outlook effect.",
    ],
    whyItHappened:
      "The profit beat was backward-looking and was priced in within hours. The outlook cut changed what investors expect for the next year. With estimates down about 9% and the valuation multiple steady, the price fell about 8%, more than erasing the morning jump. Markets trade on the gap between results and expectations — and on how expectations change.",
    overlookedRisks: [
      "'Better than expected' only helps if the future also looks better than expected.",
      "Buying after a jump means paying for good news that's already in the price.",
      "Management commentary on calls can move prices as much as the numbers.",
    ],
    paths: [
      { id: "big-beat-buy", label: "Large buy on the headline beat", match: { kind: "buy", tickers: ["ARYA"], minExposurePct: 25 }, verdict: "risky", score: 25, feedback: "You built a large position based on the backward-looking beat while the forward-looking outlook weakened.", tradeOffs: "If guidance had been raised, this could have worked — but the information available pointed the other way." },
      { id: "beat-buy", label: "Bought the beat", match: { kind: "buy", tickers: ["ARYA"] }, verdict: "defensible", score: 45, feedback: "A small position limits damage, but the reasoning leaned on last quarter rather than next year.", tradeOffs: "Long-term investors sometimes buy into guidance cuts — but usually only after the price has adjusted." },
      { id: "trim", label: "Reduced Aryavart exposure", match: { kind: "sell", tickers: ["ARYA"] }, verdict: "reasonable", score: 85, feedback: "You responded to the change in expected future profits.", tradeOffs: "Selling on one guidance cut can be an overreaction if the slowdown proves temporary; it also costs charges." },
      { id: "wait", label: "Waited for clarity", match: { kind: "hold" }, verdict: "reasonable", score: 75, feedback: "Not acting on conflicting signals is a sound default.", tradeOffs: "If you already held Aryavart, holding meant accepting the downside to see how the story develops." },
      { id: "elsewhere", label: "Traded other stocks", match: { kind: "buy" }, verdict: "defensible", score: 65, feedback: "You acted, but not on this round's information.", tradeOffs: "Make sure each trade has its own reason." },
      { id: "other", label: "Other approach", match: { kind: "other" }, verdict: "defensible", score: 60, feedback: "Your decision didn't fit the usual patterns for this scenario.", tradeOffs: "Check that your action matched your stated reasoning." },
    ],
    alternatives: [
      { id: "buy", label: "Buy ₹20,000 of Aryavart", description: "Act on the profit beat.", orders: [{ ticker: "ARYA", side: "buy", mode: "amount", value: 20000 }] },
      { id: "sell", label: "Sell all Aryavart", description: "Act on the outlook cut.", orders: [{ ticker: "ARYA", side: "sell", mode: "all" }] },
      { id: "hold", label: "No trades", description: "Wait for clarity.", orders: [] },
    ],
    knowledgeCheck: {
      id: "r2-kc",
      question: "A company beats profit estimates by 10% but cuts next year's growth forecast. Why might its share price fall?",
      options: [
        "Share prices reflect expected future profits, and a weaker outlook can outweigh one good quarter.",
        "Stock exchanges penalise companies that change their forecasts.",
        "Beating estimates always causes prices to fall.",
        "The share price is fixed until the next quarterly result.",
      ],
      correctIndex: 0,
      explanation:
        "Investors pay for future profits. A beat tells you about the past; guidance tells you about the future. When the future looks weaker than previously expected, the fair price can fall even after strong results.",
    },
    conceptSlugs: ["earnings-expectations"],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 3,
    slug: "rbi-rate-hike",
    title: "Interest rates and the RBI",
    concepts: ["Repo rate", "Borrowing costs", "Monetary policy transmission", "Sector sensitivity"],
    learningObjective: "Explore how a rate hike can affect banks, IT companies and consumer goods companies differently.",
    headline: "RBI unexpectedly raises repo rate by 0.50 percentage points to 7.00%",
    source: "Reserve Bank of India monetary policy statement",
    background:
      "Most economists expected the RBI to keep its policy (repo) rate at 6.50%. Instead, it raised it to 7.00% to fight persistent inflation. Banks typically pass higher rates on to home, car and business loans within weeks, while deposit rates tend to rise more slowly.",
    facts: [
      "Repo rate: 6.50% → 7.00% (surprise; consensus expected no change).",
      "A ₹10 lakh, 5-year car loan at 9.5% has an EMI of about ₹21,000; at 10% it rises to about ₹21,250.",
      "About 75% of Aryavart Motors' buyers use loans.",
      "Urja Renewables carries debt of 2.1× its equity; DhanSetu Fintech borrows to fund its lending book.",
      "Vyom and Tarang earn most revenue from overseas clients, so domestic rates matter less to their sales.",
    ],
    focusTickers: ["SHKT", "VYOM", "KRTI"],
    thinkAbout: [
      "Which companies' customers borrow to buy their products?",
      "Which companies themselves carry a lot of debt?",
      "Do banks gain or lose when rates rise — and could both be true?",
    ],
    rationaleQuestion: "Which statement best describes your reasoning?",
    rationales: [
      { id: "sensitivity", text: "Rate-sensitive sectors like autos and debt-heavy firms may suffer, so I'll reduce exposure to them or tilt toward less sensitive ones.", score: 90, impliedActions: ["sell", "buy", "hold"], feedback: "Thinks in terms of transmission and sector sensitivity — the core idea." },
      { id: "bank-margin", text: "Banks may earn wider margins as loan rates rise faster than deposit rates.", score: 75, impliedActions: ["buy", "hold"], feedback: "A valid mechanism, but higher rates can also slow loan growth and raise defaults." },
      { id: "dip", text: "Prices will dip, so it's a good time to buy whatever falls most.", score: 30, impliedActions: ["buy"], feedback: "The stocks that fall most on a rate hike are often the ones whose businesses are most hurt by it." },
      { id: "long-term", text: "One rate decision doesn't change my long-term plan; I'll hold.", score: 70, impliedActions: ["hold"], feedback: "Reasonable for a diversified portfolio, but worth checking how rate-sensitive your holdings are." },
    ],
    riskQuestion: "What risk is most important here?",
    risks: [
      { id: "transmission", text: "Higher EMIs could reduce demand for loan-funded purchases like cars.", score: 100, feedback: "Yes — that's monetary policy transmission reaching company sales." },
      { id: "debt", text: "Companies with heavy debt will pay more interest, squeezing profits.", score: 95, feedback: "Right — balance-sheet sensitivity is the other key channel." },
      { id: "it", text: "IT exporters will be hit hardest because they are technology companies.", score: 20, feedback: "IT exporters mostly earn from overseas clients, so domestic rates matter less to them." },
    ],
    outcome: [
      {
        label: "1 week",
        headline: "Markets digest the surprise hike; banks raise lending rates",
        detail: "Major banks raised their loan rates within days. Auto dealers reported softer enquiries. Rate-sensitive and highly valued stocks fell the most.",
        moves: [
          { ticker: "SHKT", pct: 2, reason: "Loan rates reprice faster than deposit rates, widening the bank's interest margin in the short run." },
          { ticker: "VYOM", pct: -0.5, reason: "Little direct exposure to Indian rates; a small dip from slightly lower market valuations." },
          { ticker: "TRNG", pct: -0.5, reason: "Same as Vyom — mostly overseas revenue." },
          { ticker: "KRTI", pct: -2.5, reason: "Higher EMIs leave households less to spend on discretionary snacks and premium products." },
          { ticker: "ARYA", pct: -5, reason: "Most buyers use loans; costlier EMIs directly reduce car and two-wheeler demand." },
          { ticker: "DHAN", pct: -7, reason: "Higher funding costs for its lending book, and high-growth valuations are sensitive to rates." },
          { ticker: "URJA", pct: -4, reason: "Debt-heavy power developer faces higher refinancing costs." },
          { ticker: "PRAN", pct: -0.5, reason: "Medicine demand barely depends on borrowing; small market-wide dip." },
        ],
      },
    ],
    assumptions: [
      "Banks pass on higher rates to borrowers faster than to depositors (common, but not guaranteed).",
      "Each sector's move reflects one dominant channel; real reactions mix many factors.",
      "The size of each move is illustrative of relative sensitivity, not a forecast.",
    ],
    whyItHappened:
      "A repo-rate hike makes borrowing costlier across the economy — this is monetary policy transmission. Companies whose customers borrow (autos) or who borrow heavily themselves (Urja, DhanSetu) were hit hardest. Consumer goods felt a smaller squeeze through household budgets. IT exporters and pharma, whose demand barely depends on Indian loans, barely moved. Shakti Bank rose because its loan rates reset faster than its deposit costs — though over time, slower loan growth and more defaults could offset that.",
    overlookedRisks: [
      "Banks benefit from margins at first but can suffer later if borrowers struggle to repay.",
      "Buying the biggest fallers right after a hike means buying the businesses most affected by it.",
      "Rate cycles last months; one decision is rarely the last.",
    ],
    paths: [
      { id: "buy-sensitive", label: "Bought rate-sensitive stocks", match: { kind: "buy", tickers: ["ARYA", "DHAN", "URJA"] }, verdict: "risky", score: 35, feedback: "You added to the businesses most exposed to higher borrowing costs, right after the surprise.", tradeOffs: "Some investors buy weakness deliberately — but that needs a view on why the rate impact is temporary." },
      { id: "trim-sensitive", label: "Trimmed rate-sensitive exposure", match: { kind: "sell", tickers: ["ARYA", "DHAN", "URJA", "KRTI"] }, verdict: "reasonable", score: 80, feedback: "You reduced exposure to businesses that higher rates hurt most.", tradeOffs: "If inflation cools and rates fall later, these stocks may rebound; selling also costs charges." },
      { id: "bank", label: "Bought the bank", match: { kind: "buy", tickers: ["SHKT"] }, verdict: "defensible", score: 70, feedback: "You acted on the margin-expansion mechanism.", tradeOffs: "Higher rates widen margins but may slow loan growth and raise bad loans over time." },
      { id: "rotate", label: "Rotated toward less sensitive sectors", match: { kind: "buy", tickers: ["VYOM", "TRNG", "PRAN"] }, verdict: "reasonable", score: 75, feedback: "You favoured businesses whose demand depends little on Indian borrowing costs.", tradeOffs: "IT and pharma carry their own risks — currency, overseas demand and regulation." },
      { id: "hold", label: "Held steady", match: { kind: "hold" }, verdict: "reasonable", score: 70, feedback: "Not reacting to one policy decision is reasonable for a long-term investor.", tradeOffs: "It works best if you've checked your portfolio isn't heavily tilted to rate-sensitive sectors." },
      { id: "other", label: "Other approach", match: { kind: "other" }, verdict: "defensible", score: 60, feedback: "Your trades didn't map clearly to rate sensitivity.", tradeOffs: "Ask which channel — demand, debt or margins — each trade was meant to address." },
    ],
    alternatives: [
      { id: "auto-dip", label: "Buy ₹20,000 of Aryavart", description: "Buy the most loan-dependent business.", orders: [{ ticker: "ARYA", side: "buy", mode: "amount", value: 20000 }] },
      { id: "bank", label: "Buy ₹20,000 of Shakti Bank", description: "Bet on wider bank margins.", orders: [{ ticker: "SHKT", side: "buy", mode: "amount", value: 20000 }] },
      { id: "pharma", label: "Buy ₹20,000 of Pranali Pharma", description: "Rotate to a rate-insensitive sector.", orders: [{ ticker: "PRAN", side: "buy", mode: "amount", value: 20000 }] },
    ],
    knowledgeCheck: {
      id: "r3-kc",
      question: "After a surprise repo-rate hike, which business is usually most directly affected?",
      options: [
        "A carmaker whose buyers mostly use loans.",
        "An IT exporter whose clients are in the US.",
        "A medicine maker selling essential drugs.",
        "All companies are affected equally.",
      ],
      correctIndex: 0,
      explanation:
        "Higher repo rates feed through to loan EMIs. Businesses whose customers borrow to buy — like cars — feel it most directly. Overseas-focused IT and essential medicines are much less sensitive.",
    },
    conceptSlugs: ["interest-rates-rbi"],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 4,
    slug: "valuation-pe",
    title: "Valuation and the P/E ratio",
    concepts: ["Earnings per share", "Price-to-earnings ratio", "Valuation expectations"],
    learningObjective: "Understand how expectations and valuation multiples affect stock prices.",
    headline: "DhanSetu Fintech cuts profit-growth forecast from 40% to 22% after new lending rules",
    source: "Company investor update following new RBI digital-lending guidelines",
    background:
      "DhanSetu has grown profits about 40% a year and investors have paid a premium for that growth. New rules cap the fees digital lenders can charge. DhanSetu now expects profit growth of about 22% a year — still fast, but much slower than investors had assumed.",
    facts: [
      "Earnings per share (last 12 months): ₹14.40.",
      "At about ₹1,116, the P/E ratio is roughly 77.5 (₹1,116 ÷ ₹14.40).",
      "Vyom Infotech, growing ~10% a year, trades at a P/E of about 24.",
      "High P/E ratios usually mean investors expect high growth for many years.",
    ],
    focusTickers: ["DHAN"],
    thinkAbout: [
      "What growth rate was the P/E of 77.5 assuming?",
      "If growth nearly halves, what P/E might investors be willing to pay?",
      "Is a fall in price the same thing as the stock becoming 'cheap'?",
    ],
    rationaleQuestion: "Which statement best describes your reasoning?",
    rationales: [
      { id: "derate", text: "The high P/E assumed fast growth; with slower growth the multiple may shrink, so I'll reduce or avoid DhanSetu.", score: 90, impliedActions: ["sell", "hold"], feedback: "Links valuation to growth expectations — the key insight." },
      { id: "still-growing", text: "22% growth is still excellent, so it remains a great company to buy.", score: 45, impliedActions: ["buy"], feedback: "A great company can still be a poor investment if its price assumed even more." },
      { id: "cheap", text: "If the price drops, the stock becomes cheap — I'll buy.", score: 25, impliedActions: ["buy"], feedback: "A lower price isn't automatically cheap; compare price to earnings and growth." },
      { id: "compare", text: "I'll compare its valuation with slower-growing peers before deciding, and not act today.", score: 80, impliedActions: ["hold"], feedback: "Comparing multiples against growth is exactly what valuation analysis is for." },
    ],
    riskQuestion: "What risk is most important here?",
    risks: [
      { id: "multiple", text: "The P/E multiple could fall as investors re-price lower growth.", score: 100, feedback: "Yes — multiple compression can hurt more than the earnings change itself." },
      { id: "regulation", text: "Further regulatory changes could cut profits again.", score: 80, feedback: "Good — regulatory risk is real for lending businesses." },
      { id: "none", text: "Fast-growing companies rarely fall much.", score: 10, feedback: "Highly valued growth stocks often fall hardest when growth disappoints." },
    ],
    outcome: [
      {
        label: "1 week",
        headline: "Investors re-price DhanSetu as a slower-growth business",
        detail: "Several funds reduced holdings. The stock now trades at about 65 times earnings — still a premium, but lower.",
        moves: [{ ticker: "DHAN", pct: -16, reason: "Lower expected growth justifies a lower P/E: the multiple compresses from ~77.5 to ~65 with EPS unchanged." }],
      },
    ],
    assumptions: [
      "Earnings per share are unchanged this week; only the multiple investors pay changes.",
      "A new 'fair' multiple of ~65 reflects 22% growth — an illustrative figure, not a formula.",
      "Other stocks are held constant to isolate valuation.",
    ],
    whyItHappened:
      "Price = EPS × P/E. EPS didn't change, but the P/E investors were willing to pay fell from about 77.5 to about 65 because the growth that justified the premium shrank. That alone produced a 16% fall. High-multiple stocks are especially sensitive to changes in expected growth: small changes in the future story create large changes in today's price.",
    overlookedRisks: [
      "Even after falling, a P/E of 65 still assumes years of strong growth.",
      "'It's fallen a lot, so it's cheap' ignores whether the fall reflects real changes.",
      "Regulatory risk can hit a whole business model, not just one quarter.",
    ],
    paths: [
      { id: "big-buy", label: "Large buy into a high valuation", match: { kind: "buy", tickers: ["DHAN"], minExposurePct: 20 }, verdict: "risky", score: 25, feedback: "You took a large position in an expensive stock just as its growth assumption broke.", tradeOffs: "If the market had shrugged off the rules, this could have paid off — but the valuation left little margin for error." },
      { id: "buy", label: "Bought the growth story", match: { kind: "buy", tickers: ["DHAN"] }, verdict: "defensible", score: 45, feedback: "A smaller position, but based on growth that was just revised down.", tradeOffs: "Some long-term investors accept high valuations for quality — they usually size cautiously." },
      { id: "sell", label: "Reduced DhanSetu", match: { kind: "sell", tickers: ["DHAN"] }, verdict: "reasonable", score: 85, feedback: "You recognised that the valuation depended on growth that had changed.", tradeOffs: "If growth re-accelerates, you may miss a recovery." },
      { id: "hold", label: "Held and compared", match: { kind: "hold" }, verdict: "reasonable", score: 75, feedback: "Staying out of an expensive stock with weakening growth is reasonable.", tradeOffs: "If you already held DhanSetu, holding meant absorbing the re-rating." },
      { id: "elsewhere", label: "Bought other stocks", match: { kind: "buy" }, verdict: "defensible", score: 65, feedback: "You acted elsewhere — fine if each trade had its own reason.", tradeOffs: "Compare their valuations too." },
      { id: "other", label: "Other approach", match: { kind: "other" }, verdict: "defensible", score: 60, feedback: "Your trades didn't map clearly to this scenario.", tradeOffs: "Revisit how price, EPS and P/E connect." },
    ],
    alternatives: [
      { id: "buy", label: "Buy ₹25,000 of DhanSetu", description: "Bet that growth still justifies the price.", orders: [{ ticker: "DHAN", side: "buy", mode: "amount", value: 25000 }] },
      { id: "sell", label: "Sell all DhanSetu", description: "Exit as the growth assumption breaks.", orders: [{ ticker: "DHAN", side: "sell", mode: "all" }] },
      { id: "vyom", label: "Buy ₹25,000 of Vyom Infotech", description: "Prefer a lower-multiple, steadier business.", orders: [{ ticker: "VYOM", side: "buy", mode: "amount", value: 25000 }] },
    ],
    knowledgeCheck: {
      id: "r4-kc",
      question: "A company's EPS is ₹20 and its share trades at ₹1,000 (P/E 50). If investors now pay a P/E of 35 and EPS is unchanged, what is the new price?",
      options: ["₹700", "₹1,000", "₹350", "₹1,750"],
      correctIndex: 0,
      explanation: "Price = EPS × P/E = ₹20 × 35 = ₹700 — a 30% fall with no change in earnings. That's multiple compression.",
    },
    conceptSlugs: ["pe-ratio"],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 5,
    slug: "inflation-margins",
    title: "Inflation and consumer demand",
    concepts: ["Inflation", "Input costs", "Purchasing power", "Pricing power", "Margins"],
    learningObjective: "Explore how rising costs and pricing power affect profit margins.",
    headline: "Inflation rises to 6.8%; palm oil and wheat prices jump, squeezing food makers",
    source: "Government CPI release and commodity exchange data",
    background:
      "Consumer price inflation rose to 6.8%. Palm oil is up 30% and wheat up 18% in three months. Raw materials are about 55% of Kriti Foods' costs. Kriti announced a 5% price increase on its main brands; historically it has passed on about 70% of cost increases. Smaller unbranded rivals have less ability to raise prices.",
    facts: [
      "Kriti's operating margin: 18% last year.",
      "Kriti expects margins to dip temporarily as price rises lag cost increases.",
      "Strong brands let companies raise prices without losing many customers — pricing power.",
      "Aryavart Motors also faces higher steel costs but has less pricing power in entry-level cars.",
    ],
    focusTickers: ["KRTI", "ARYA"],
    thinkAbout: [
      "If costs rise 10% and you can only raise prices 5%, what happens to your margin?",
      "Will customers keep buying if prices rise?",
      "Which company can pass costs on more easily?",
    ],
    rationaleQuestion: "Which statement best describes your reasoning?",
    rationales: [
      { id: "pricing-power", text: "Kriti's brands give it pricing power, so margins should dip but recover; I'm comfortable holding or buying a little.", score: 85, impliedActions: ["hold", "buy"], feedback: "Separates a temporary margin squeeze from long-term damage — thoughtful." },
      { id: "margin-squeeze", text: "Margins will be squeezed near-term, so I'll reduce exposure to companies with weak pricing power.", score: 85, impliedActions: ["sell", "hold"], feedback: "Focuses on the businesses least able to pass on costs — also sound." },
      { id: "inflation-good", text: "Inflation means prices go up, so all stocks will rise.", score: 15, impliedActions: ["buy"], feedback: "Inflation raises costs as well as prices; it often squeezes profits and valuations." },
      { id: "unsure", text: "I'm unsure how inflation affects these companies, so I'll avoid trading.", score: 60, impliedActions: ["hold"], feedback: "Not acting when unsure is fine — the debrief will help fill the gap." },
    ],
    riskQuestion: "What risk is most important here?",
    risks: [
      { id: "margin", text: "Costs rising faster than selling prices will shrink profit margins.", score: 100, feedback: "Yes — that's the central mechanism." },
      { id: "volume", text: "Customers may buy less after price increases.", score: 85, feedback: "Good — higher prices can reduce volumes, especially for discretionary items." },
      { id: "none", text: "Big companies are protected from inflation.", score: 15, feedback: "Size helps, but even leading brands usually absorb part of the cost increase." },
    ],
    outcome: [
      {
        label: "Next quarter",
        headline: "Kriti's margin dips to 16.5%; Aryavart's falls further",
        detail: "Kriti's price increase recovered most of the cost rise; volumes dipped 2%. Aryavart couldn't raise prices much without losing buyers.",
        moves: [
          { ticker: "KRTI", pct: -3, reason: "Margin fell from 18% to 16.5%; pricing power limited the damage." },
          { ticker: "ARYA", pct: -2.5, reason: "Weak pricing power in entry-level vehicles meant a larger share of steel costs hit profits." },
          { ticker: "PRAN", pct: -1, reason: "Price controls on some essential medicines limit how much cost inflation can be passed on." },
        ],
      },
    ],
    assumptions: [
      "Kriti passes on about 70% of its cost increase, in line with its history.",
      "Volumes dip modestly (2%) after the price increase.",
      "Moves are limited to companies with clear input-cost exposure; others are held constant.",
    ],
    whyItHappened:
      "Margin = (price − cost) ÷ price. When costs rise faster than prices, margins shrink. Kriti's strong brands let it raise prices enough to recover most of the increase, so its stock fell only modestly. Aryavart had less room to raise prices, so more of the cost hit profits. Pricing power — the ability to raise prices without losing many customers — is one of the most valuable traits in an inflationary period.",
    overlookedRisks: [
      "Price increases can reduce volumes, especially for discretionary products.",
      "Inflation often leads to higher interest rates, adding a second headwind (see Round 3).",
      "Pricing power is tested over several quarters, not one.",
    ],
    paths: [
      { id: "big-krti", label: "Large buy into the cost squeeze", match: { kind: "buy", tickers: ["KRTI"], minExposurePct: 25 }, verdict: "risky", score: 35, feedback: "Pricing power is a good argument, but a large position ahead of a known margin squeeze adds concentration risk.", tradeOffs: "Long-term investors sometimes buy quality during temporary pressure — usually in steps." },
      { id: "krti", label: "Backed pricing power", match: { kind: "buy", tickers: ["KRTI"] }, verdict: "defensible", score: 65, feedback: "A reasonable long-term view, sized modestly.", tradeOffs: "Short-term margin pressure still lowered the price; patience is required." },
      { id: "arya", label: "Bought the weaker price-setter", match: { kind: "buy", tickers: ["ARYA"] }, verdict: "risky", score: 35, feedback: "Aryavart had the weakest pricing power facing the same cost rise.", tradeOffs: "It could rebound if steel prices fall — but that's a bet on commodities." },
      { id: "sell", label: "Reduced cost-exposed stocks", match: { kind: "sell", tickers: ["KRTI", "ARYA", "PRAN"] }, verdict: "defensible", score: 70, feedback: "You reduced exposure to the margin squeeze.", tradeOffs: "Selling quality brands on temporary pressure can mean missing the recovery." },
      { id: "hold", label: "Held through the squeeze", match: { kind: "hold" }, verdict: "reasonable", score: 75, feedback: "A temporary margin dip doesn't always require action.", tradeOffs: "Works if you're confident the pressure is temporary and your holdings have pricing power." },
      { id: "other", label: "Other approach", match: { kind: "other" }, verdict: "defensible", score: 60, feedback: "Your trades didn't map clearly to cost exposure.", tradeOffs: "Ask which companies can pass on costs." },
    ],
    alternatives: [
      { id: "krti", label: "Buy ₹15,000 of Kriti", description: "Back pricing power.", orders: [{ ticker: "KRTI", side: "buy", mode: "amount", value: 15000 }] },
      { id: "arya", label: "Buy ₹15,000 of Aryavart", description: "Buy the weaker price-setter.", orders: [{ ticker: "ARYA", side: "buy", mode: "amount", value: 15000 }] },
      { id: "hold", label: "No trades", description: "Hold through the squeeze.", orders: [] },
    ],
    knowledgeCheck: {
      id: "r5-kc",
      question: "Raw material costs rise 10% for every food company. Which company is best placed to protect its margins?",
      options: [
        "One with strong brands that can raise prices without losing many customers.",
        "One with the lowest share price.",
        "One that sells unbranded products competing mainly on price.",
        "One that has just announced a share buyback.",
      ],
      correctIndex: 0,
      explanation: "Pricing power — loyal customers who accept higher prices — lets a company pass on cost increases and protect its margins. Price-competitive, unbranded sellers usually absorb more of the cost.",
    },
    conceptSlugs: ["inflation-pricing-power"],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 6,
    slug: "diversification",
    title: "Diversification",
    concepts: ["Sector allocation", "Concentration risk", "Diversification", "Correlation"],
    learningObjective: "Understand how diversification reduces exposure to sector-specific shocks — without eliminating all risk.",
    headline: "IT stocks hit 52-week highs as investors pile in; one analyst flags US client budgets",
    source: "Market report and brokerage research note",
    background:
      "IT stocks rallied this week on hopes of a strong deal season. Your friend Riya has put 80% of her portfolio into Vyom and Tarang. One brokerage analyst warns that large US banks — major IT clients — are reviewing technology budgets, but nothing has been announced. Review how concentrated your own portfolio is before the next move.",
    special: "concentration-lab",
    marketOpen: {
      headline: "IT rally: Vyom and Tarang hit 52-week highs",
      moves: [
        { ticker: "VYOM", pct: 4, reason: "Optimism about a strong deal season." },
        { ticker: "TRNG", pct: 6, reason: "Smaller IT firms often move more in sector rallies." },
      ],
    },
    facts: [
      "Riya's portfolio: 80% IT (Vyom and Tarang), 20% cash.",
      "Tarang earns 48% of its revenue from just five clients, mostly US banks.",
      "IT stocks tend to move together because they share the same clients and drivers — they are highly correlated.",
      "Nothing about US budgets has been confirmed; this is an analyst's warning, not news.",
    ],
    focusTickers: ["VYOM", "TRNG"],
    thinkAbout: [
      "What share of your portfolio sits in one sector right now?",
      "If one sector fell 10%, how much would your total portfolio fall?",
      "Do Vyom and Tarang really diversify each other?",
    ],
    rationaleQuestion: "Which statement best describes your reasoning?",
    rationales: [
      { id: "spread", text: "I'll keep any single sector within my risk profile's limit, whatever happens to IT next.", score: 95, impliedActions: ["buy", "sell", "hold"], feedback: "Rule-based diversification protects you without needing to predict the next move." },
      { id: "momentum", text: "IT is rallying, so I'll add more — the trend is my friend.", score: 25, impliedActions: ["buy"], feedback: "Chasing a rally increases concentration exactly when a sector looks most crowded." },
      { id: "two-stocks", text: "I own two different IT companies, so I'm already diversified.", score: 20, impliedActions: ["hold", "buy"], feedback: "Two companies in one sector share the same risks; that isn't sector diversification." },
      { id: "predict", text: "The analyst is probably right, so I'll sell all IT to avoid the fall.", score: 55, impliedActions: ["sell"], feedback: "Reducing concentration is sensible; treating one analyst's warning as a certain prediction isn't." },
    ],
    riskQuestion: "What risk is most important here?",
    risks: [
      { id: "concentration", text: "Too much of a portfolio in one sector means one piece of bad news hits most of it.", score: 100, feedback: "Exactly — concentration risk." },
      { id: "correlation", text: "Stocks in the same sector tend to fall together.", score: 95, feedback: "Yes — high correlation limits how much two same-sector stocks diversify each other." },
      { id: "missing-out", text: "Missing out on further gains if IT keeps rising.", score: 30, feedback: "A real feeling, but it's an opportunity cost, not the main risk to your capital." },
    ],
    outcome: [
      {
        label: "2 days",
        headline: "A major US bank cuts its contract with Tarang by 30%; IT sector sells off",
        detail: "Tarang's largest client reduced spending. Investors worried other clients would follow and sold IT stocks broadly. Defensive sectors saw small inflows.",
        moves: [
          { ticker: "TRNG", pct: -15, reason: "Direct loss of revenue from its largest client." },
          { ticker: "VYOM", pct: -9, reason: "Shares the same client base and drivers; investors assume budget cuts may spread." },
          { ticker: "KRTI", pct: 1, reason: "Small rotation into defensive consumer stocks." },
          { ticker: "PRAN", pct: 1, reason: "Small rotation into defensive pharma stocks." },
        ],
      },
    ],
    assumptions: [
      "Same-sector stocks are assumed highly correlated; both IT names fall together.",
      "Rotation into defensive sectors is small and illustrative.",
      "The shock was not knowable in advance — the analyst warning was one opinion among many.",
    ],
    whyItHappened:
      "Bad news for one IT company became bad news for the whole sector, because IT companies share clients and drivers. A portfolio like Riya's — 80% IT — fell about 9.6% in two days, while a portfolio spread across five sectors would have fallen far less. Diversification didn't need anyone to predict the shock; it limited the damage from whichever sector got hit. But it doesn't remove market-wide risk, as the next round shows.",
    overlookedRisks: [
      "Owning several companies in one sector is not diversification.",
      "Rallies make concentrated portfolios look smart until they don't.",
      "Diversification reduces sector risk, but not the risk of the whole market falling.",
    ],
    paths: [
      { id: "chase", label: "Chased the rally into concentration", match: { kind: "buy", tickers: ["VYOM", "TRNG"], minExposurePct: 35 }, verdict: "risky", score: 20, feedback: "You increased exposure to one sector to a large share of your portfolio, just as it looked most crowded.", tradeOffs: "Had the rally continued you'd have gained — but the outcome depended on one sector's luck." },
      { id: "diversified-trade", label: "Built or kept a spread portfolio", match: { kind: "portfolio", traded: true, withinProfile: true }, verdict: "reasonable", score: 90, feedback: "After your trades, no sector or stock exceeded your profile's limits.", tradeOffs: "In a strong IT rally, a diversified portfolio would lag a concentrated one — that's the price of protection." },
      { id: "reduce-it", label: "Reduced IT exposure", match: { kind: "sell", tickers: ["VYOM", "TRNG"] }, verdict: "reasonable", score: 75, feedback: "You lowered your sector concentration.", tradeOffs: "If you sold because you predicted the fall, remember: the next warning may be wrong." },
      { id: "already-spread", label: "Already within limits — held", match: { kind: "portfolio", traded: false, withinProfile: true }, verdict: "reasonable", score: 80, feedback: "Your portfolio already met your profile's diversification limits, so no action was needed.", tradeOffs: "Holding is efficient when your allocation is already where you want it." },
      { id: "add-it", label: "Added more IT", match: { kind: "buy", tickers: ["VYOM", "TRNG"] }, verdict: "defensible", score: 45, feedback: "A smaller addition to an already hot sector.", tradeOffs: "Check what share of your total portfolio sits in one sector afterwards." },
      { id: "hold", label: "Held without checking limits", match: { kind: "hold" }, verdict: "defensible", score: 55, feedback: "You didn't trade, but your portfolio sat outside your profile's limits.", tradeOffs: "Doing nothing is a decision too — review concentration regularly." },
      { id: "other", label: "Other approach", match: { kind: "other" }, verdict: "defensible", score: 60, feedback: "Your trades changed your portfolio, but limits weren't fully met.", tradeOffs: "Compare your sector weights against your profile's cap." },
    ],
    alternatives: [
      { id: "riya", label: "Follow Riya: buy ₹30,000 of IT", description: "Add ₹15,000 each of Vyom and Tarang.", orders: [{ ticker: "VYOM", side: "buy", mode: "amount", value: 15000 }, { ticker: "TRNG", side: "buy", mode: "amount", value: 15000 }] },
      { id: "exit-it", label: "Sell all IT", description: "Exit Vyom and Tarang entirely.", orders: [{ ticker: "VYOM", side: "sell", mode: "all" }, { ticker: "TRNG", side: "sell", mode: "all" }] },
      { id: "spread", label: "Spread ₹20,000 across defensives", description: "₹10,000 each of Kriti and Pranali.", orders: [{ ticker: "KRTI", side: "buy", mode: "amount", value: 10000 }, { ticker: "PRAN", side: "buy", mode: "amount", value: 10000 }] },
    ],
    knowledgeCheck: {
      id: "r6-kc",
      question: "Which statement about diversification is correct?",
      options: [
        "It reduces the impact of one company's or sector's bad news, but cannot remove the risk of the whole market falling.",
        "Owning five IT companies is as diversified as owning five companies in five sectors.",
        "A diversified portfolio cannot lose money.",
        "Diversification guarantees higher returns.",
      ],
      correctIndex: 0,
      explanation: "Spreading money across sectors that don't move together limits the damage from any one shock. But when the entire market falls, most stocks fall together — diversification reduces risk, it doesn't eliminate it.",
    },
    conceptSlugs: ["diversification"],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 7,
    slug: "market-crash",
    title: "Market-wide crash",
    concepts: ["Volatility", "Drawdowns", "Risk tolerance", "Liquidity", "Behavioural biases"],
    learningObjective: "Explore the trade-offs of holding, reducing exposure or buying during a sharp downturn.",
    headline: "Global sell-off: overseas bank failure triggers the market's worst day in two years",
    source: "Exchange data and international news wires",
    background:
      "A large overseas bank collapsed overnight, sparking fears of a global credit crunch. Indian markets opened sharply lower and every stock in your universe fell. Social media is full of panic, and also full of people saying 'buy the dip'. Nobody knows whether the fall will deepen or reverse.",
    marketOpen: {
      headline: "Every sector falls as global panic spreads",
      moves: [
        { ticker: "SHKT", pct: -9, reason: "Banks are hit first on credit-crunch fears." },
        { ticker: "VYOM", pct: -7, reason: "Overseas clients may cut spending in a downturn." },
        { ticker: "TRNG", pct: -8, reason: "Heavy exposure to US financial clients." },
        { ticker: "KRTI", pct: -5, reason: "Defensive, but still sold in a broad panic." },
        { ticker: "ARYA", pct: -10, reason: "Cyclical demand is expected to weaken." },
        { ticker: "PRAN", pct: -4, reason: "Most defensive, but not immune." },
        { ticker: "URJA", pct: -11, reason: "Debt-heavy firms suffer most when credit tightens." },
        { ticker: "DHAN", pct: -13, reason: "High-valuation, credit-dependent stocks fall most." },
      ],
    },
    facts: [
      "Your portfolio has already fallen with the market — check the change since last round.",
      "Market-wide falls hit almost every stock at once; diversification across sectors helps less.",
      "Historical crashes have sometimes reversed in days and sometimes lasted years.",
      "Selling during panic can mean selling at the worst prices; buying can mean catching a falling knife.",
    ],
    focusTickers: ["SHKT", "DHAN", "URJA", "PRAN"],
    thinkAbout: [
      "How would you feel if your portfolio fell another 10% tomorrow?",
      "If you sell now, when would you buy back — and how would you decide?",
      "Is any cash you hold meant for spending soon (in real life, that changes everything)?",
    ],
    rationaleQuestion: "Which statement best describes your reasoning?",
    rationales: [
      { id: "plan", text: "I'll stick to my risk profile: rebalance gradually and keep a cash buffer, without predicting the bottom.", score: 95, impliedActions: ["hold", "buy", "sell"], feedback: "A plan made before the panic is the best defence against emotional decisions." },
      { id: "panic", text: "Prices are collapsing — I need to sell everything before it gets worse.", score: 30, impliedActions: ["sell"], feedback: "Fear-driven selling often locks in losses at low prices. Valid only if your risk tolerance was truly exceeded." },
      { id: "all-in", text: "Crashes always recover, so I'll put all my cash in now.", score: 20, impliedActions: ["buy"], feedback: "Not every decline recovers quickly, or at all. Going all-in leaves no buffer if it falls further." },
      { id: "tolerance", text: "This fall is more than I can tolerate, so I'll reduce exposure to a level I can sleep with.", score: 75, impliedActions: ["sell"], feedback: "Honest about risk tolerance — a legitimate reason to reduce, ideally in part." },
    ],
    riskQuestion: "What risk is most important here?",
    risks: [
      { id: "further", text: "Prices could fall further before any recovery — or not recover for a long time.", score: 100, feedback: "Yes — uncertainty runs both ways." },
      { id: "behaviour", text: "Making an emotional decision I'll regret, like selling at the low or betting everything.", score: 95, feedback: "Good — behavioural biases are often the biggest risk in a crash." },
      { id: "none", text: "There's no risk in buying because prices are already low.", score: 10, feedback: "'Low' prices can always go lower." },
    ],
    outcome: [
      {
        label: "Day 2",
        headline: "Contagion fears deepen; markets fall again",
        detail: "Two more overseas lenders reported losses. Selling continued, and some smaller stocks briefly had few buyers — a liquidity squeeze.",
        moves: [
          { ticker: "SHKT", pct: -4, reason: "Further credit fears." },
          { ticker: "VYOM", pct: -3, reason: "Continued global selling." },
          { ticker: "TRNG", pct: -4, reason: "Continued global selling." },
          { ticker: "KRTI", pct: -2, reason: "Broad selling, smaller impact." },
          { ticker: "ARYA", pct: -5, reason: "Demand fears deepen." },
          { ticker: "PRAN", pct: -1.5, reason: "Defensive, smaller impact." },
          { ticker: "URJA", pct: -5, reason: "Credit tightness hurts debt-heavy firms." },
          { ticker: "DHAN", pct: -6, reason: "Funding concerns for lending businesses." },
        ],
      },
      {
        label: "Week 2",
        headline: "Central banks announce liquidity support; markets partially recover",
        detail: "Coordinated central-bank action calmed credit markets. Stocks recovered part of their losses, but most remain below pre-crash levels.",
        moves: [
          { ticker: "SHKT", pct: 5, reason: "Liquidity support eases funding fears." },
          { ticker: "VYOM", pct: 3.5, reason: "Relief rally." },
          { ticker: "TRNG", pct: 4, reason: "Relief rally." },
          { ticker: "KRTI", pct: 2.5, reason: "Relief rally." },
          { ticker: "ARYA", pct: 5, reason: "Relief rally in cyclicals." },
          { ticker: "PRAN", pct: 2, reason: "Smaller fall, smaller rebound." },
          { ticker: "URJA", pct: 4, reason: "Credit conditions ease somewhat." },
          { ticker: "DHAN", pct: 5, reason: "Funding concerns ease." },
        ],
      },
    ],
    assumptions: [
      "This scenario follows one plausible path — a further fall, then a partial recovery. Many real crashes kept falling for months.",
      "Net of both steps, most stocks end close to the decision-time price, so neither panic-selling nor all-in buying is rewarded by luck.",
      "Liquidity is assumed sufficient for your orders; in real crashes, smaller stocks can be hard to trade.",
    ],
    whyItHappened:
      "In a market-wide panic, correlations jump: almost everything falls together, regardless of sector. From your decision point, prices fell another 1.5–6%, then partially recovered after central banks acted, ending near where you decided. Sellers avoided the Day 2 dip but locked in losses and paid charges; buyers rode the Day 2 drop before the recovery. The lesson isn't 'always buy' or 'always sell' — it's that crash decisions should follow a plan you made when calm, sized so you can survive a further fall.",
    overlookedRisks: [
      "Not every decline recovers; some markets took years to regain their highs.",
      "A 50% fall needs a 100% gain to recover — drawdowns are asymmetric.",
      "Going all-in removes your ability to act if prices fall further.",
    ],
    paths: [
      { id: "all-in", label: "Went all-in during the crash", match: { kind: "portfolio", action: "buy", maxCashPct: 10 }, verdict: "risky", score: 25, feedback: "You deployed nearly all your cash without knowing if the fall would deepen.", tradeOffs: "If the market had rebounded sharply you'd have gained most — but you had no buffer if it kept falling." },
      { id: "panic-sell", label: "Sold nearly everything", match: { kind: "portfolio", action: "sell", minCashPct: 85 }, verdict: "defensible", score: 45, feedback: "You moved almost entirely to cash during the panic.", tradeOffs: "This protects against further falls but locks in losses and leaves you deciding when to re-enter." },
      { id: "selective-buy", label: "Bought selectively, kept a buffer", match: { kind: "buy" }, verdict: "reasonable", score: 75, feedback: "You added some exposure while keeping cash in reserve.", tradeOffs: "If prices keep falling, you'll have losses — but also cash to act again." },
      { id: "partial-sell", label: "Reduced exposure partly", match: { kind: "sell" }, verdict: "defensible", score: 65, feedback: "You lowered risk to a level you can tolerate.", tradeOffs: "Partial reductions balance regret either way; they still cost charges." },
      { id: "hold", label: "Held through the volatility", match: { kind: "hold" }, verdict: "reasonable", score: 75, feedback: "You avoided an emotional reaction.", tradeOffs: "Holding is reasonable only if your portfolio's risk already matches your tolerance." },
      { id: "other", label: "Other approach", match: { kind: "other" }, verdict: "defensible", score: 60, feedback: "Your trades didn't map clearly to a crash response.", tradeOffs: "Write down your crash plan before the next one." },
    ],
    alternatives: [
      { id: "sell-all", label: "Sell everything", description: "Move entirely to cash at decision-time prices.", orders: [
        { ticker: "SHKT", side: "sell", mode: "all" }, { ticker: "VYOM", side: "sell", mode: "all" }, { ticker: "TRNG", side: "sell", mode: "all" }, { ticker: "KRTI", side: "sell", mode: "all" },
        { ticker: "ARYA", side: "sell", mode: "all" }, { ticker: "PRAN", side: "sell", mode: "all" }, { ticker: "URJA", side: "sell", mode: "all" }, { ticker: "DHAN", side: "sell", mode: "all" },
      ] },
      { id: "buy-dip", label: "Buy ₹40,000 of the hardest-hit", description: "₹20,000 each of DhanSetu and Urja.", orders: [{ ticker: "DHAN", side: "buy", mode: "amount", value: 20000 }, { ticker: "URJA", side: "buy", mode: "amount", value: 20000 }] },
      { id: "hold", label: "Hold", description: "No trades.", orders: [] },
    ],
    knowledgeCheck: {
      id: "r7-kc",
      question: "A stock falls 50%. What percentage gain does it need to get back to its original price?",
      options: ["100%", "50%", "25%", "75%"],
      correctIndex: 0,
      explanation: "₹100 → ₹50 is a 50% fall. Getting from ₹50 back to ₹100 requires doubling — a 100% gain. Deep drawdowns are hard to recover from, which is why position sizing matters.",
    },
    conceptSlugs: ["volatility-drawdowns"],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 8,
    slug: "rumour",
    title: "Rumours versus verified information",
    concepts: ["Information quality", "Uncertainty", "Confirmation bias", "Market expectations"],
    learningObjective: "Distinguish verified information from speculation and avoid treating rumours as facts.",
    headline: "Viral posts claim Urja Renewables will win a ₹5,000 crore government solar contract",
    source: "Unverified social media posts and messaging-app forwards",
    background:
      "A widely shared post claims Urja has 'secured' a ₹5,000 crore government solar tender, citing 'sources'. Urja's stock jumped 9% within hours. The company says it 'does not comment on market speculation'. The tender results are due in three days. Public records show the total tender is ₹6,000 crore, to be split among several bidders.",
    special: "rumour-board",
    marketOpen: {
      headline: "Urja jumps 9% on social media buzz",
      moves: [{ ticker: "URJA", pct: 9, reason: "Traders buy on the rumour, pricing in a large contract win." }],
    },
    facts: [
      "No stock-exchange filing has been made by Urja.",
      "The tender (₹6,000 crore total) will be split among multiple winners — official tender document.",
      "Urja is one of seven qualified bidders.",
      "A ₹5,000 crore win would be about half of Urja's market value — an extraordinary claim.",
    ],
    focusTickers: ["URJA"],
    thinkAbout: [
      "Who is the source, and how would they know?",
      "What do official documents say about the size of the tender?",
      "If the rumour is partly true, how much is already in the price?",
    ],
    rationaleQuestion: "Which statement best describes your reasoning?",
    rationales: [
      { id: "verify", text: "This is unverified and the official tender facts contradict its size; I'll wait for the exchange filing.", score: 95, impliedActions: ["hold", "sell"], feedback: "Weighs source quality and checks the claim against official information." },
      { id: "fomo", text: "Everyone is talking about it, so it must be true — I'll buy before it rises more.", score: 10, impliedActions: ["buy"], feedback: "Popularity isn't verification. Rumours often move prices before the facts disappoint." },
      { id: "small-bet", text: "It might be true; I'll buy a small amount just in case.", score: 40, impliedActions: ["buy"], feedback: "Small sizing limits damage, but the price already includes much of the rumoured upside." },
      { id: "take-profit", text: "If I already own Urja, the rumour pop is a chance to trim at a higher price.", score: 80, impliedActions: ["sell", "hold"], feedback: "Uses the speculation to manage risk rather than add to it." },
    ],
    riskQuestion: "What risk is most important here?",
    risks: [
      { id: "false", text: "The rumour may be false or exaggerated, and the price could give back its gain.", score: 100, feedback: "Yes — a rumour premium can unwind quickly." },
      { id: "confirmation", text: "I might only look for information that confirms what I hope is true.", score: 90, feedback: "Good — confirmation bias makes rumours feel more credible than they are." },
      { id: "missing", text: "Missing out if the stock keeps rising.", score: 25, feedback: "Fear of missing out is the emotion rumours exploit." },
    ],
    outcome: [
      {
        label: "Day 3",
        headline: "Official: Urja wins a ₹900 crore share of the tender",
        detail: "The exchange filing confirmed Urja won ₹900 crore — positive news, but far smaller than the rumoured ₹5,000 crore.",
        moves: [{ ticker: "URJA", pct: -7.5, reason: "The rumour premium unwinds; the real (smaller) win supports a small net gain from before the rumour." }],
      },
    ],
    assumptions: [
      "The verified ₹900 crore win is worth roughly +1% to Urja's value versus before the rumour.",
      "Traders who bought on the rumour sell once facts disappoint expectations.",
      "Other stocks are held constant to isolate the information effect.",
    ],
    whyItHappened:
      "The rumour pushed Urja up 9% as traders priced in a huge contract. When the official filing showed a ₹900 crore win, expectations reset: the price fell 7.5%, ending only about 1% above where it was before the rumour. The real news was good — but much less good than the rumour. Anyone who bought on the rumour paid for something that never existed. The information was available to check: the tender's official size made a ₹5,000 crore win for one bidder very unlikely.",
    overlookedRisks: [
      "A rumour that's 'partly true' can still lose you money if the price assumed the full story.",
      "Unverified posts can be deliberate 'pump' attempts.",
      "Official sources — exchange filings, regulators, company statements — are the standard to wait for.",
    ],
    paths: [
      { id: "big-rumour", label: "Big bet on a rumour", match: { kind: "buy", tickers: ["URJA"], minExposurePct: 15 }, verdict: "risky", score: 15, feedback: "You built a large position on unverified information that conflicted with official facts.", tradeOffs: "If the rumour had been true, you'd have gained — but the evidence pointed to exaggeration." },
      { id: "rumour", label: "Bought on the rumour", match: { kind: "buy", tickers: ["URJA"] }, verdict: "risky", score: 35, feedback: "A small position, but still acting on speculation after the price had jumped.", tradeOffs: "Small sizing limited the damage — a good instinct applied to a poor information source." },
      { id: "trim", label: "Trimmed into the rumour pop", match: { kind: "sell", tickers: ["URJA"] }, verdict: "reasonable", score: 80, feedback: "You used the speculative jump to reduce risk.", tradeOffs: "Had the rumour been true, you'd have sold too early." },
      { id: "wait", label: "Waited for verification", match: { kind: "hold" }, verdict: "reasonable", score: 85, feedback: "You treated the rumour as unconfirmed and didn't act.", tradeOffs: "Waiting sometimes means missing a true story — a price worth paying for avoiding false ones." },
      { id: "elsewhere", label: "Traded other stocks", match: { kind: "buy" }, verdict: "defensible", score: 65, feedback: "You stayed away from the rumour stock.", tradeOffs: "Make sure your other trades had verified reasons." },
      { id: "other", label: "Other approach", match: { kind: "other" }, verdict: "defensible", score: 60, feedback: "Your trades didn't map clearly to this scenario.", tradeOffs: "Rank your sources before acting." },
    ],
    alternatives: [
      { id: "buy", label: "Buy ₹20,000 of Urja", description: "Act on the rumour.", orders: [{ ticker: "URJA", side: "buy", mode: "amount", value: 20000 }] },
      { id: "sell", label: "Sell all Urja", description: "Trim into the speculative jump.", orders: [{ ticker: "URJA", side: "sell", mode: "all" }] },
      { id: "wait", label: "Wait for the filing", description: "No trades.", orders: [] },
    ],
    knowledgeCheck: {
      id: "r8-kc",
      question: "Which source is most reliable for confirming that a company has won a contract?",
      options: [
        "An official filing by the company on the stock exchange.",
        "A viral social media post citing 'sources'.",
        "A messaging-app forward from a friend who trades.",
        "A sudden rise in the share price.",
      ],
      correctIndex: 0,
      explanation: "Listed companies must disclose material events through exchange filings, which carry legal accountability. Prices and posts can move on speculation; neither confirms anything.",
    },
    conceptSlugs: ["rumours-vs-facts"],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 9,
    slug: "rebalancing",
    title: "Portfolio rebalancing",
    concepts: ["Asset allocation", "Portfolio weights", "Risk exposure", "Rebalancing"],
    learningObjective: "Review portfolio exposure against a plan rather than reacting to recent winners and losers.",
    headline: "Quarterly review: Pranali surges on a US drug approval — time to check your allocation",
    source: "US FDA approval notice and company filing",
    background:
      "Pranali Pharma won US approval for a generic heart medicine and its stock jumped 10%. Over the past rounds your portfolio has drifted with market moves: some holdings grew, others shrank, and your cash share changed. Compare your current weights with the target in your risk profile.",
    special: "rebalance-check",
    marketOpen: {
      headline: "Pranali jumps 10% on US approval",
      moves: [{ ticker: "PRAN", pct: 10, reason: "Approval adds a new revenue stream in a regulated, higher-margin market." }],
    },
    facts: [
      "Your risk profile sets a target invested share and maximum sector and position weights.",
      "Rebalancing means trading back toward those targets — selling some of what grew, adding to what shrank or to cash.",
      "A recent winner isn't automatically overvalued; a recent loser isn't automatically cheap.",
      "Two other companies have also applied for approval of the same generic.",
    ],
    focusTickers: ["PRAN"],
    thinkAbout: [
      "Which of your weights are furthest from your profile's limits?",
      "Are you tempted to buy more of what just went up? Why?",
      "What would you do if you had no idea what happens next?",
    ],
    rationaleQuestion: "Which statement best describes your reasoning?",
    rationales: [
      { id: "plan", text: "I'll trade back toward my target weights, regardless of which stocks recently rose or fell.", score: 95, impliedActions: ["buy", "sell", "hold"], feedback: "Rule-based rebalancing keeps your risk where you chose it." },
      { id: "winner", text: "Pranali is on a roll — I'll add more to my winner.", score: 25, impliedActions: ["buy"], feedback: "Adding to winners without checking weights lets concentration grow unnoticed." },
      { id: "loser", text: "I'll sell my worst performers so I don't have to look at losses.", score: 30, impliedActions: ["sell"], feedback: "Selling losers to avoid discomfort is emotional, not a portfolio decision." },
      { id: "on-plan", text: "My portfolio is already close to target, so no trades are needed.", score: 80, impliedActions: ["hold"], feedback: "Correct if true — check the comparison panel." },
    ],
    riskQuestion: "What risk is most important here?",
    risks: [
      { id: "drift", text: "My portfolio's risk has drifted away from the level I chose.", score: 100, feedback: "Exactly — drift silently changes your risk." },
      { id: "recency", text: "Recency bias: assuming recent winners will keep winning.", score: 90, feedback: "Good — past moves don't predict future ones." },
      { id: "none", text: "Winners always keep rising, so there's no risk in holding more.", score: 10, feedback: "Momentum can reverse — especially when competition is coming." },
    ],
    outcome: [
      {
        label: "1 month",
        headline: "Competitors' approvals expected; broader market edges up",
        detail: "Two rivals are expected to launch the same generic, which may lower prices. Elsewhere, markets drifted modestly higher as conditions calmed.",
        moves: [
          { ticker: "PRAN", pct: -3, reason: "Expected competition may lower the drug's selling price; part of the approval gain fades." },
          { ticker: "SHKT", pct: 1.5, reason: "Calmer credit conditions." },
          { ticker: "VYOM", pct: 1, reason: "Modest market drift." },
          { ticker: "TRNG", pct: 1, reason: "Modest market drift." },
          { ticker: "KRTI", pct: 1, reason: "Modest market drift." },
          { ticker: "ARYA", pct: 1.5, reason: "Modest recovery in cyclicals." },
          { ticker: "URJA", pct: 1, reason: "Modest market drift." },
          { ticker: "DHAN", pct: 2, reason: "Modest recovery in growth stocks." },
        ],
      },
    ],
    assumptions: [
      "The competitive threat was public information (rival applications), even if its timing was not.",
      "Market drift is small and broad to avoid rewarding any particular rebalancing trade by luck.",
      "Rebalancing is judged against your own risk profile's limits.",
    ],
    whyItHappened:
      "Pranali gave back some gains as competition emerged, while the rest of the market drifted up slightly. Rebalancing out of an overweight winner happened to help here — but that's not why it's done. Rebalancing is a risk-control habit: it keeps your exposure where you decided it should be, so that any single stock's or sector's surprise can only hurt you as much as you planned.",
    overlookedRisks: [
      "Rebalancing can mean selling a winner that keeps winning — that's the accepted trade-off.",
      "Frequent rebalancing adds charges; many investors rebalance on a schedule or when weights drift beyond a band.",
      "Drift can also come from cash: a big cash pile changes your risk as much as an overweight stock.",
    ],
    paths: [
      { id: "chase", label: "Added to the recent winner", match: { kind: "buy", tickers: ["PRAN"] }, verdict: "risky", score: 30, feedback: "You increased exposure to the stock that had just jumped, without reference to your target.", tradeOffs: "Momentum sometimes continues — but your weights now depend on it." },
      { id: "rebalanced", label: "Rebalanced back to plan", match: { kind: "portfolio", traded: true, withinProfile: true }, verdict: "reasonable", score: 90, feedback: "After your trades, your portfolio met every limit of your risk profile.", tradeOffs: "You may sell winners early — the cost of keeping risk under control." },
      { id: "partial", label: "Traded, but still off plan", match: { kind: "portfolio", traded: true }, verdict: "defensible", score: 60, feedback: "You traded, but your portfolio is still outside at least one profile limit.", tradeOffs: "Check the comparison panel for which limit is breached." },
      { id: "on-plan", label: "Already on plan — held", match: { kind: "portfolio", traded: false, withinProfile: true }, verdict: "reasonable", score: 85, feedback: "Your portfolio was already within all limits, so no trades were needed.", tradeOffs: "Holding avoids unnecessary charges." },
      { id: "drift", label: "Left the drift in place", match: { kind: "hold" }, verdict: "defensible", score: 45, feedback: "Your portfolio was outside your profile's limits and you didn't adjust it.", tradeOffs: "Small drift can be tolerated; large drift means your risk is no longer what you chose." },
      { id: "other", label: "Other approach", match: { kind: "other" }, verdict: "defensible", score: 60, feedback: "Your decision didn't fit the usual patterns.", tradeOffs: "Compare your weights to your targets." },
    ],
    alternatives: [
      { id: "add-winner", label: "Buy ₹20,000 of Pranali", description: "Add to the recent winner.", orders: [{ ticker: "PRAN", side: "buy", mode: "amount", value: 20000 }] },
      { id: "trim-winner", label: "Sell all Pranali", description: "Lock in the approval gain.", orders: [{ ticker: "PRAN", side: "sell", mode: "all" }] },
      { id: "hold", label: "No trades", description: "Leave weights as they are.", orders: [] },
    ],
    knowledgeCheck: {
      id: "r9-kc",
      question: "Your target is 60% stocks and 40% cash. After a rally, you're at 75% stocks and 25% cash. What does rebalancing mean here?",
      options: [
        "Selling some stocks to move back toward 60/40.",
        "Buying more stocks because they're rising.",
        "Waiting until stocks fall back to 60% on their own.",
        "Moving everything to cash.",
      ],
      correctIndex: 0,
      explanation: "Rebalancing restores your chosen mix. Selling some stocks brings risk back to the level you picked — even though it means trimming what has been doing well.",
    },
    conceptSlugs: ["rebalancing"],
  },

  /* ---------------------------------------------------------------- */
  {
    id: 10,
    slug: "final-challenge",
    title: "The final investment challenge",
    concepts: ["Earnings", "Valuation", "Macroeconomic news", "Diversification", "Risk management"],
    learningObjective: "Combine everything you've learned into one integrated portfolio decision.",
    headline: "Three stories break at once: Vyom beats estimates, inflation cools, Aryavart recalls 40,000 vehicles",
    source: "Exchange filings, government CPI release and regulator notice",
    background:
      "Three developments arrive together. Vyom Infotech beat estimates and kept its guidance, trading at a P/E of about 22. Inflation cooled to 4.5% and the RBI said a rate cut 'is possible' at its next meeting. Aryavart Motors recalled 40,000 vehicles for a braking fault; it estimates the cost at ₹300 crore but says the figure may rise. Set your portfolio for the weeks ahead using everything you've learned.",
    marketOpen: {
      headline: "Morning reactions: Vyom up, Aryavart down, banks edge higher",
      moves: [
        { ticker: "VYOM", pct: 3, reason: "Earnings beat with guidance maintained." },
        { ticker: "ARYA", pct: -6, reason: "Recall costs and reputational damage." },
        { ticker: "SHKT", pct: 1, reason: "Cooling inflation improves the rate outlook." },
      ],
    },
    facts: [
      "Vyom: beat with guidance maintained; P/E ≈ 22 (reasonable for ~10% growth).",
      "Inflation 4.5%; RBI signals a possible cut — not a confirmed one.",
      "Aryavart: recall cost estimate ₹300 crore, 'may rise'; uncertainty is high.",
      "Your risk profile's limits still apply: invested share, maximum sector and position weights.",
    ],
    focusTickers: ["VYOM", "ARYA", "SHKT"],
    thinkAbout: [
      "Which of these stories is verified, and which is only a signal?",
      "What happens to your portfolio if the recall cost doubles?",
      "After your trades, are you within your profile's limits?",
    ],
    rationaleQuestion: "Which statement best describes your reasoning?",
    rationales: [
      { id: "integrated", text: "I'll keep sector and position weights within my limits, favour verified strength at sensible valuations, and avoid big bets on uncertain news.", score: 95, impliedActions: ["buy", "sell", "hold"], feedback: "Integrates valuation, information quality and risk limits." },
      { id: "dip", text: "Aryavart's fall is a bargain; I'll buy heavily before it recovers.", score: 25, impliedActions: ["buy"], feedback: "The recall cost is explicitly uncertain; buying heavily assumes the worst is priced in." },
      { id: "rate-cut", text: "A rate cut is coming for sure, so I'll load up on rate-sensitive stocks.", score: 40, impliedActions: ["buy"], feedback: "A signal isn't a decision — and even a cut may be partly priced in." },
      { id: "cash", text: "Too much is happening; I'll move mostly to cash.", score: 50, impliedActions: ["sell", "hold"], feedback: "Defensible if uncertainty exceeds your tolerance, but cash also drifts from your plan." },
    ],
    riskQuestion: "What risk is most important here?",
    risks: [
      { id: "recall", text: "Aryavart's recall costs could rise further, as the company warned.", score: 90, feedback: "Yes — open-ended costs are a key uncertainty." },
      { id: "portfolio", text: "Any single story going wrong shouldn't be able to sink my whole portfolio.", score: 100, feedback: "Exactly — portfolio-level thinking beats story-by-story betting." },
      { id: "rates", text: "There's no risk: rates will definitely be cut.", score: 15, feedback: "Signals are not commitments; data can change the RBI's mind." },
    ],
    outcome: [
      {
        label: "Week 1",
        headline: "Aryavart doubles its recall cost estimate to ₹600 crore",
        detail: "An inspection found more vehicles affected. The company warned of a weaker quarter.",
        moves: [{ ticker: "ARYA", pct: -4, reason: "Higher recall costs reduce expected profits further." }],
      },
      {
        label: "Week 2",
        headline: "RBI cuts repo rate by 0.25 percentage points",
        detail: "The cut matched the RBI's signal, so markets had partly expected it. Rate-sensitive sectors rose most.",
        moves: [
          { ticker: "SHKT", pct: 2, reason: "Lower rates support loan growth." },
          { ticker: "ARYA", pct: 3, reason: "Cheaper car loans support demand, partly offsetting recall worries." },
          { ticker: "DHAN", pct: 4, reason: "Lower funding costs; growth valuations benefit from lower rates." },
          { ticker: "KRTI", pct: 1.5, reason: "Lower EMIs leave households more to spend." },
          { ticker: "URJA", pct: 3.5, reason: "Cheaper refinancing for a debt-heavy business." },
          { ticker: "VYOM", pct: 0.5, reason: "Little domestic rate sensitivity." },
          { ticker: "TRNG", pct: 1, reason: "Little domestic rate sensitivity." },
          { ticker: "PRAN", pct: 0.5, reason: "Little domestic rate sensitivity." },
        ],
      },
      {
        label: "Week 3",
        headline: "Weak US jobs data revives global slowdown worries",
        detail: "IT stocks slipped on concerns about US client spending; domestic sectors were little changed.",
        moves: [
          { ticker: "VYOM", pct: -2.5, reason: "US slowdown risk to IT demand." },
          { ticker: "TRNG", pct: -3.5, reason: "Higher dependence on US financial clients." },
        ],
      },
    ],
    assumptions: [
      "Three sequential developments test different concepts: company risk, macro policy and global demand.",
      "The rate cut was partly expected, so moves are moderate.",
      "No single story dominates; diversified portfolios experience offsetting moves.",
    ],
    whyItHappened:
      "Each development hit a different part of the market. Aryavart's recall worsened (company-specific risk), the rate cut lifted rate-sensitive sectors (macro transmission), and US worries hit IT (sector correlation). A concentrated portfolio's result depended on which single story it bet on; a diversified one saw gains and losses partly offset. That's the integrated lesson: you can't control outcomes, but you can control position sizes, information quality and how much any one story can hurt you.",
    overlookedRisks: [
      "'Possible' rate cuts are not guaranteed; you were fortunate this signal was followed through.",
      "Company-specific crises often get worse before they get better.",
      "Even a well-diversified portfolio rises and falls with the overall market.",
    ],
    paths: [
      { id: "concentrated", label: "Concentrated bet", match: { kind: "portfolio", minSectorPct: 45 }, verdict: "risky", score: 30, feedback: "After your trades, one sector held 45% or more of your portfolio.", tradeOffs: "If that sector's story goes right, you gain the most — and if not, you lose the most." },
      { id: "recall-dip", label: "Bought the recall dip heavily", match: { kind: "buy", tickers: ["ARYA"], minExposurePct: 15 }, verdict: "risky", score: 35, feedback: "You took a large position into an open-ended, company-specific risk.", tradeOffs: "Contrarian buying can work, but the company itself warned costs could rise." },
      { id: "balanced", label: "Balanced, rules-based portfolio", match: { kind: "portfolio", withinProfile: true }, verdict: "reasonable", score: 90, feedback: "Your portfolio met every limit of your risk profile going into a period of mixed news.", tradeOffs: "Balanced portfolios rarely top the leaderboard, but they rarely sink either." },
      { id: "cash", label: "Mostly in cash", match: { kind: "portfolio", minCashPct: 80 }, verdict: "defensible", score: 55, feedback: "You stayed largely out of the market.", tradeOffs: "Low risk, but your cash share drifted from your plan and you missed diversified gains." },
      { id: "other", label: "Partly balanced", match: { kind: "other" }, verdict: "defensible", score: 65, feedback: "Your portfolio avoided a big single bet but breached at least one profile limit.", tradeOffs: "Check which limit and why." },
    ],
    alternatives: [
      { id: "arya", label: "Buy ₹30,000 of Aryavart", description: "Bet the recall is over-priced.", orders: [{ ticker: "ARYA", side: "buy", mode: "amount", value: 30000 }] },
      { id: "spread", label: "Spread ₹30,000 across 3 sectors", description: "₹10,000 each of Vyom, Shakti Bank and Kriti.", orders: [{ ticker: "VYOM", side: "buy", mode: "amount", value: 10000 }, { ticker: "SHKT", side: "buy", mode: "amount", value: 10000 }, { ticker: "KRTI", side: "buy", mode: "amount", value: 10000 }] },
      { id: "hold", label: "No trades", description: "Keep your current portfolio.", orders: [] },
    ],
    knowledgeCheck: {
      id: "r10-kc",
      question: "Which best describes a sound investing process?",
      options: [
        "Size positions within limits, act on verified information and valuation, and accept that outcomes can still be negative.",
        "Pick the stock with the best story and invest heavily so the gains matter.",
        "Judge every decision by whether it made money.",
        "Trade frequently so you can react to every piece of news.",
      ],
      correctIndex: 0,
      explanation: "Good process controls what you can control: position sizes, information quality and valuation discipline. Outcomes include luck — a good decision can lose money and a poor one can make money in the short run.",
    },
    conceptSlugs: ["pe-ratio", "interest-rates-rbi", "diversification", "earnings-expectations"],
  },
];

export const ROUNDS: RoundDefinition[] = AUTHORED_ROUNDS.map((r) => ({ ...r, knowledgeCheck: arrangeOptions(r.knowledgeCheck) }));

export function getRound(id: number): RoundDefinition {
  const round = ROUNDS.find((r) => r.id === id);
  if (!round) throw new Error(`Unknown round ${id}`);
  return round;
}
