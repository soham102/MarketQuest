import type { ConceptCategory, ConceptModule } from "@/lib/types";
import { arrangeOptions } from "./arrange";

export const CATEGORIES: { id: ConceptCategory; name: string; description: string }[] = [
  { id: "fundamentals", name: "Stock market fundamentals", description: "What shares are and how their value changes." },
  { id: "valuation", name: "Company analysis & valuation", description: "Earnings, expectations and what a share is worth." },
  { id: "macro", name: "Macroeconomics & news", description: "Interest rates, inflation and the quality of information." },
  { id: "portfolio", name: "Portfolio management & risk", description: "Diversification, drawdowns and staying on plan." },
  { id: "trading", name: "Trading mechanics & order types", description: "How orders actually get filled." },
];

const AUTHORED_CONCEPTS: ConceptModule[] = [
  /* ---------------------------------------------------------------- */
  {
    slug: "what-is-a-stock",
    title: "What is a stock?",
    category: "fundamentals",
    difficulty: "Beginner",
    minutes: 6,
    summary: "Shares are slices of ownership. See how owning a few changes with the company's value.",
    preview: "pie",
    intro: {
      hook: "When you buy a share, you buy a tiny piece of a real business.",
      paragraphs: [
        "A company divides its ownership into millions of equal pieces called shares. Owning one share of Kriti Foods means you own a tiny fraction of its factories, brands and future profits.",
        "Shares trade on stock exchanges like the NSE and BSE. Their price changes every second as buyers and sellers update their views on what the company's future profits are worth.",
      ],
      keyTerms: [
        { term: "Share (stock)", definition: "A unit of ownership in a company." },
        { term: "Market capitalisation", definition: "Share price × total shares — the market's total value for the company." },
        { term: "Buy / sell / hold", definition: "The three basic decisions: add ownership, reduce it, or keep what you have." },
      ],
    },
    visual: {
      kind: "flow",
      title: "From company to your portfolio",
      steps: [
        { label: "Company", detail: "Kriti Foods is worth ₹18,200 crore and is split into 35 crore shares." },
        { label: "Share", detail: "Each share is worth ₹520 (₹18,200 cr ÷ 35 cr shares)." },
        { label: "You buy 20", detail: "You pay 20 × ₹520 = ₹10,400 and now own 20 shares." },
        { label: "Price moves", detail: "If investors expect higher profits, the price might rise to ₹551.", tone: "up" },
        { label: "Your value", detail: "Your 20 shares are now worth ₹11,020 — up ₹620 on paper.", tone: "up" },
      ],
    },
    workedExample: {
      title: "Owning a slice of Kriti Foods",
      setup: "You buy 20 shares of Kriti Foods at ₹520 each. A week later the price is ₹551.20.",
      steps: [
        { label: "Cost of purchase", value: "20 × ₹520 = ₹10,400" },
        { label: "Value now", value: "20 × ₹551.20 = ₹11,024" },
        { label: "Change in value", value: "₹11,024 − ₹10,400 = +₹624", note: "This is an unrealised gain — it exists only on paper until you sell." },
        { label: "Return", value: "₹624 ÷ ₹10,400 = +6.0%" },
      ],
      takeaway: "Your gain depends on how many shares you own and how far the price moves — not on the price itself.",
    },
    experiment: {
      id: "ownership",
      title: "Ownership lab",
      prompt: "Choose how many shares to buy and move the share price. Watch your ownership and value change.",
      observe: [
        "Buying more shares doesn't change the company — only your slice of it.",
        "A 10% price move changes your holding's value by 10%, whatever the number of shares.",
      ],
    },
    quiz: [
      {
        id: "stock-q1",
        question: "What do you own when you buy a share of a company?",
        options: ["A small part-ownership of the company", "A loan you've made to the company", "A guaranteed share of next year's profit", "A product the company makes"],
        correctIndex: 0,
        explanation: "A share is a unit of ownership. Lending to a company is a bond; profits are never guaranteed.",
      },
      {
        id: "stock-q2",
        question: "You own 50 shares. The price falls from ₹200 to ₹180. What is the change in your holding's value?",
        options: ["−₹1,000", "−₹20", "−₹180", "Nothing, until you sell"],
        correctIndex: 0,
        explanation: "50 shares × ₹20 fall = ₹1,000 fall in value. It's unrealised until you sell, but your portfolio value has still changed.",
      },
    ],
    applyRound: 1,
    applyText: "Make your first virtual investment when Kriti Foods announces an expansion.",
    takeaways: [
      "A share is part-ownership of a business and its future profits.",
      "Your holding's value = shares owned × current price.",
      "Gains and losses are unrealised until you sell.",
    ],
    next: "portfolio-value-pnl",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "portfolio-value-pnl",
    title: "Portfolio value & P&L",
    category: "fundamentals",
    difficulty: "Beginner",
    minutes: 7,
    summary: "Cash plus holdings, realised versus unrealised — the accounting behind every portfolio.",
    preview: "bars",
    intro: {
      hook: "Your portfolio isn't just your shares — it's your shares plus your cash.",
      paragraphs: [
        "Portfolio value = cash + the current market value of everything you hold. Buying shares doesn't change your portfolio value much; it swaps cash for shares (minus small charges).",
        "Profit and loss (P&L) comes in two kinds. Realised P&L is locked in when you sell. Unrealised P&L is the change in value of shares you still hold.",
      ],
      keyTerms: [
        { term: "Average cost", definition: "Total amount paid for your current shares ÷ number of shares." },
        { term: "Realised P&L", definition: "Profit or loss locked in by selling, measured against average cost." },
        { term: "Unrealised P&L", definition: "Current value of your shares minus what you paid for them." },
      ],
    },
    visual: {
      kind: "compare",
      title: "Realised vs unrealised",
      left: { title: "Unrealised", tone: "neutral", points: ["You still hold the shares", "Changes every time the price moves", "Can grow or disappear before you sell"] },
      right: { title: "Realised", tone: "up", points: ["You sold the shares", "Fixed at the sale price", "Cash is back in your account"] },
    },
    workedExample: {
      title: "Two buys, one sale",
      setup: "You buy 10 shares at ₹500, then 10 more at ₹600. Later you sell 5 at ₹650. Ignore charges for now.",
      steps: [
        { label: "Total cost", value: "₹5,000 + ₹6,000 = ₹11,000 for 20 shares" },
        { label: "Average cost", value: "₹11,000 ÷ 20 = ₹550 per share" },
        { label: "Realised P&L on sale", value: "5 × (₹650 − ₹550) = +₹500" },
        { label: "Remaining position", value: "15 shares at ₹550 average = ₹8,250 cost" },
        { label: "Unrealised P&L at ₹650", value: "15 × ₹100 = +₹1,500" },
      ],
      takeaway: "Total P&L = realised + unrealised − charges. It always equals portfolio value minus the money you started with.",
    },
    experiment: {
      id: "portfolio-value",
      title: "P&L calculator",
      prompt: "Set a buy price, a current price and how many shares to sell. See how P&L splits between realised and unrealised.",
      observe: ["Selling converts unrealised P&L into realised P&L — the total doesn't change at the moment of sale.", "Charges reduce total P&L on every trade."],
    },
    quiz: [
      {
        id: "pnl-q1",
        question: "You have ₹40,000 cash and shares worth ₹60,000. What is your portfolio value?",
        options: ["₹1,00,000", "₹60,000", "₹40,000", "₹20,000"],
        correctIndex: 0,
        explanation: "Portfolio value = cash + market value of holdings = ₹40,000 + ₹60,000.",
      },
      {
        id: "pnl-q2",
        question: "Selling a share for more than its average cost creates…",
        options: ["A realised gain", "An unrealised gain", "No gain, because cash was received", "A dividend"],
        correctIndex: 0,
        explanation: "Selling locks in the difference between sale price and average cost — a realised gain.",
      },
    ],
    applyRound: 1,
    applyText: "Track your portfolio value, cash and P&L from your very first trade.",
    takeaways: ["Portfolio value = cash + holdings.", "Average cost determines realised P&L.", "Total P&L = realised + unrealised − charges."],
    next: "order-types",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "earnings-expectations",
    title: "Earnings & expectations",
    category: "valuation",
    difficulty: "Beginner",
    minutes: 8,
    summary: "Why a profit beat can still send a stock down: prices trade on expectations.",
    preview: "line",
    intro: {
      hook: "Markets don't react to whether results are good — they react to whether results are better than expected.",
      paragraphs: [
        "Every quarter, listed companies report revenue (sales) and profit (what's left after costs). Analysts publish estimates beforehand, so the market already has expectations built into the price.",
        "An earnings surprise is the gap between actual and expected results. But management's guidance about the future often matters even more, because a share's value depends on future profits.",
      ],
      keyTerms: [
        { term: "Revenue", definition: "Total sales before any costs." },
        { term: "Earnings surprise", definition: "Actual profit minus the average analyst estimate." },
        { term: "Guidance", definition: "Management's forecast for future periods." },
      ],
    },
    visual: {
      kind: "flow",
      title: "How results move a price",
      steps: [
        { label: "Expectations", detail: "Analysts expect 15% profit growth; the price already reflects it." },
        { label: "Results", detail: "Profit grows 22% — a positive surprise.", tone: "up" },
        { label: "Initial jump", detail: "The stock rises 3% on the headline.", tone: "up" },
        { label: "Guidance", detail: "Management cuts next year's outlook from 12% to 7% volume growth.", tone: "down" },
        { label: "Re-pricing", detail: "Analysts lower estimates; the stock ends lower than before results.", tone: "down" },
      ],
    },
    workedExample: {
      title: "A beat that falls",
      setup: "A stock trades at ₹700 at 27× expected earnings of ₹25.9. After results, next year's estimate falls 9%.",
      steps: [
        { label: "Old expected EPS", value: "₹25.90" },
        { label: "New expected EPS", value: "₹25.90 × 0.91 ≈ ₹23.57" },
        { label: "Same multiple (27×)", value: "27 × ₹23.57 ≈ ₹636" },
        { label: "Change", value: "≈ −9%, despite the profit beat" },
      ],
      takeaway: "Last quarter is history. The price follows what investors now expect for the future.",
    },
    experiment: {
      id: "earnings-surprise",
      title: "Surprise simulator",
      prompt: "Set expected and actual profit growth, then choose management's outlook. See the illustrative price reaction.",
      observe: ["A big beat with a cut outlook can still produce a fall.", "A small miss with raised guidance can produce a rise."],
    },
    quiz: [
      {
        id: "earn-q1",
        question: "What is an earnings surprise?",
        options: ["The difference between actual and expected profit", "Any profit above zero", "A sudden dividend", "A change in share price"],
        correctIndex: 0,
        explanation: "Surprises are measured against expectations — that's what moves prices.",
      },
      {
        id: "earn-q2",
        question: "Why can guidance matter more than reported results?",
        options: ["Share value depends on future profits, and guidance is about the future", "Guidance is audited and results are not", "Results are always already known", "Regulators require prices to follow guidance"],
        correctIndex: 0,
        explanation: "Reported results describe the past. Investors pay for the future, which guidance speaks to directly.",
      },
    ],
    applyRound: 2,
    applyText: "Aryavart Motors beats estimates — but cuts its outlook. What do you do?",
    takeaways: ["Prices reflect expectations.", "Surprises are measured against estimates.", "Guidance about the future can outweigh past results."],
    next: "pe-ratio",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "pe-ratio",
    title: "Valuation & the P/E ratio",
    category: "valuation",
    difficulty: "Intermediate",
    minutes: 9,
    summary: "Price = EPS × P/E. Change either and see why expensive stocks are fragile.",
    preview: "gauge",
    intro: {
      hook: "A great company can be a poor investment if you pay too much for it.",
      paragraphs: [
        "Earnings per share (EPS) is a company's annual profit divided by its number of shares. The price-to-earnings (P/E) ratio is the share price divided by EPS — how many rupees investors pay for each rupee of yearly profit.",
        "A high P/E means investors expect strong growth for years. If that growth slows, the P/E can shrink — and the price falls even if profits don't.",
      ],
      keyTerms: [
        { term: "EPS", definition: "Net profit ÷ number of shares." },
        { term: "P/E ratio", definition: "Share price ÷ EPS." },
        { term: "Multiple compression", definition: "A fall in the P/E investors are willing to pay." },
      ],
    },
    visual: {
      kind: "bars",
      title: "P/E ratios in the MarketQuest universe",
      unit: "× earnings",
      bars: [
        { label: "Shakti Bank", value: 16, note: "Steady, mature lender" },
        { label: "Vyom Infotech", value: 24, note: "~10% growth" },
        { label: "Aryavart Motors", value: 27, note: "Cyclical demand" },
        { label: "Kriti Foods", value: 38, note: "Stable consumer brand" },
        { label: "DhanSetu Fintech", value: 80, note: "~40% growth expected" },
      ],
    },
    workedExample: {
      title: "DhanSetu's re-rating",
      setup: "DhanSetu earns ₹14.40 per share and trades at ₹1,116 — a P/E of 77.5. Growth expectations fall from 40% to 22%.",
      steps: [
        { label: "Current P/E", value: "₹1,116 ÷ ₹14.40 = 77.5×" },
        { label: "New P/E investors accept", value: "≈ 65× (illustrative)" },
        { label: "New price (EPS unchanged)", value: "65 × ₹14.40 ≈ ₹937" },
        { label: "Change", value: "≈ −16% with no change in profit" },
      ],
      takeaway: "High-multiple stocks are most sensitive to changes in the growth story.",
    },
    experiment: {
      id: "pe-valuation",
      title: "Valuation sliders",
      prompt: "Adjust EPS and the P/E multiple. Compare how each moves the price.",
      observe: ["A 20% cut in the multiple hurts as much as a 20% cut in earnings.", "At high P/Es, a small change in the multiple moves the price by many rupees."],
    },
    quiz: [
      {
        id: "pe-q1",
        question: "A stock trades at ₹600 with EPS of ₹30. What is its P/E?",
        options: ["20", "30", "18", "570"],
        correctIndex: 0,
        explanation: "P/E = ₹600 ÷ ₹30 = 20.",
      },
      {
        id: "pe-q2",
        question: "Why do high-P/E stocks often fall sharply when growth slows?",
        options: ["The multiple compresses as expected growth falls", "Their EPS becomes negative", "Exchanges cap their prices", "They pay higher taxes"],
        correctIndex: 0,
        explanation: "High multiples rest on high expected growth. When growth expectations fall, so does the multiple.",
      },
    ],
    applyRound: 4,
    applyText: "DhanSetu trades at 77× earnings — then its growth forecast is cut.",
    takeaways: ["Price = EPS × P/E.", "P/E reflects growth expectations.", "Lower price doesn't automatically mean cheap."],
    next: "interest-rates-rbi",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "interest-rates-rbi",
    title: "Interest rates & the RBI",
    category: "macro",
    difficulty: "Intermediate",
    minutes: 9,
    summary: "How the repo rate reaches your EMI, a company's costs and different sectors.",
    preview: "flow",
    intro: {
      hook: "One number set in Mumbai changes the EMI on millions of loans.",
      paragraphs: [
        "The Reserve Bank of India sets the repo rate — the rate at which it lends to banks. When it rises, banks usually raise their own lending rates, making loans costlier for households and companies.",
        "This chain is called monetary policy transmission. Sectors feel it differently: car makers whose buyers use loans, and companies with heavy debt, feel it most. Overseas-focused exporters feel it least.",
      ],
      keyTerms: [
        { term: "Repo rate", definition: "The RBI's policy rate for lending to banks." },
        { term: "Transmission", definition: "How policy-rate changes pass through to loan rates and the economy." },
        { term: "Net interest margin", definition: "A bank's loan rates minus its deposit rates." },
      ],
    },
    visual: {
      kind: "flow",
      title: "Monetary policy transmission",
      steps: [
        { label: "RBI hikes repo", detail: "6.50% → 7.00% to fight inflation." },
        { label: "Banks reprice loans", detail: "Home, car and business loan rates rise within weeks.", tone: "down" },
        { label: "EMIs rise", detail: "Households have less to spend on cars and discretionary goods.", tone: "down" },
        { label: "Company costs rise", detail: "Debt-heavy companies pay more interest.", tone: "down" },
        { label: "Sector impact", detail: "Autos and debt-heavy firms fall most; pharma and IT exporters least." },
      ],
    },
    workedExample: {
      title: "A car loan before and after",
      setup: "A ₹10 lakh car loan over 5 years. The lender's rate rises from 9.5% to 10.0%.",
      steps: [
        { label: "EMI at 9.5%", value: "≈ ₹21,002 per month" },
        { label: "EMI at 10.0%", value: "≈ ₹21,247 per month" },
        { label: "Extra interest over 5 years", value: "≈ ₹14,700" },
        { label: "Effect", value: "Some buyers delay purchases or choose cheaper models" },
      ],
      takeaway: "Small rate changes add up across millions of borrowers — that's how policy reaches company sales.",
    },
    experiment: {
      id: "rate-transmission",
      title: "Rate transmission lab",
      prompt: "Move the repo rate. Watch a loan EMI, a company's interest bill and each sector's sensitivity change.",
      observe: ["The EMI responds directly; company profits respond through demand and debt.", "Sectors with borrowing customers or heavy debt are most rate-sensitive."],
    },
    quiz: [
      {
        id: "rate-q1",
        question: "When the RBI raises the repo rate, what usually happens to loan EMIs?",
        options: ["They rise as banks raise lending rates", "They fall", "They stay fixed forever", "They depend only on the stock market"],
        correctIndex: 0,
        explanation: "Banks pass higher funding costs on to borrowers, raising floating-rate EMIs.",
      },
      {
        id: "rate-q2",
        question: "Which company is least affected by a domestic rate hike?",
        options: ["An IT exporter with mostly US clients and no debt", "A carmaker whose buyers use loans", "A debt-heavy power company", "A digital lender that borrows to lend"],
        correctIndex: 0,
        explanation: "Its revenue and costs barely depend on Indian interest rates.",
      },
    ],
    applyRound: 3,
    applyText: "The RBI surprises markets with a 0.50 point hike. How exposed is your portfolio?",
    takeaways: ["The repo rate feeds through to loan rates.", "Sectors differ in rate sensitivity.", "Banks can gain margins short-term but face slower growth."],
    next: "inflation-pricing-power",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "inflation-pricing-power",
    title: "Inflation & pricing power",
    category: "macro",
    difficulty: "Intermediate",
    minutes: 8,
    summary: "When costs rise, the companies that can raise prices protect their margins.",
    preview: "bars",
    intro: {
      hook: "Inflation doesn't hurt every company equally — it rewards those customers won't leave.",
      paragraphs: [
        "Inflation is the general rise in prices. It reduces purchasing power — the same ₹100 buys less. For companies, it often means higher raw material costs.",
        "Margin is the share of each sale kept as profit. If costs rise faster than a company can raise prices, margins shrink. Pricing power — loyal customers who accept higher prices — is the defence.",
      ],
      keyTerms: [
        { term: "Inflation", definition: "The rate at which general prices rise." },
        { term: "Operating margin", definition: "Operating profit ÷ revenue." },
        { term: "Pricing power", definition: "Ability to raise prices without losing many customers." },
      ],
    },
    visual: {
      kind: "compare",
      title: "Two food companies facing the same cost rise",
      left: { title: "Strong brand", tone: "up", points: ["Raises prices 5%", "Loses ~2% of volume", "Margin dips 18% → 16.5%"] },
      right: { title: "Unbranded rival", tone: "down", points: ["Can raise prices only 1%", "Customers switch easily", "Margin falls 12% → 7%"] },
    },
    workedExample: {
      title: "Kriti's margin under pressure",
      setup: "Kriti sells ₹100 of goods; costs are ₹82 (raw materials ₹45). Raw materials rise 20%. Kriti raises prices 5%.",
      steps: [
        { label: "New raw material cost", value: "₹45 × 1.20 = ₹54 (+₹9)" },
        { label: "New total cost", value: "₹82 + ₹9 = ₹91" },
        { label: "New price", value: "₹100 × 1.05 = ₹105" },
        { label: "New margin", value: "(₹105 − ₹91) ÷ ₹105 ≈ 13.3% (from 18%)" },
      ],
      takeaway: "Price increases soften the blow, but costs rising faster than prices still squeeze margins.",
    },
    experiment: {
      id: "pricing-power",
      title: "Margin squeeze lab",
      prompt: "Raise input costs, then decide how much of the increase the company passes on. Watch the margin.",
      observe: ["Passing on 100% of costs protects the margin only if customers keep buying.", "Weak pricing power means margins absorb the shock."],
    },
    quiz: [
      {
        id: "infl-q1",
        question: "What is pricing power?",
        options: ["The ability to raise prices without losing many customers", "The power to set the inflation rate", "A government price control", "A discount offered to customers"],
        correctIndex: 0,
        explanation: "Strong brands, few substitutes and essential products create pricing power.",
      },
      {
        id: "infl-q2",
        question: "Costs rise 10% and a company raises prices 10% with no loss of customers. What happens to its margin %?",
        options: ["It stays roughly the same", "It doubles", "It falls to zero", "It always falls by 10 points"],
        correctIndex: 0,
        explanation: "If both price and cost rise by the same percentage and volumes hold, the margin percentage is unchanged.",
      },
    ],
    applyRound: 5,
    applyText: "Inflation pushes up Kriti's raw material costs. Can its brands protect its margins?",
    takeaways: ["Inflation raises costs as well as prices.", "Margins shrink when costs outrun prices.", "Pricing power protects profitability."],
    next: "rumours-vs-facts",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "rumours-vs-facts",
    title: "Rumours vs verified information",
    category: "macro",
    difficulty: "Beginner",
    minutes: 6,
    summary: "Rank sources, spot red flags and see how rumour premiums unwind.",
    preview: "flow",
    intro: {
      hook: "The fastest-moving information is often the least reliable.",
      paragraphs: [
        "Prices can move on rumours before facts are known. If the rumour turns out exaggerated, the 'rumour premium' disappears — often quickly.",
        "Listed companies must disclose material events through stock-exchange filings. Those, along with regulator notices and official documents, are the standard to wait for.",
      ],
      keyTerms: [
        { term: "Exchange filing", definition: "An official disclosure by a listed company on the NSE/BSE." },
        { term: "Confirmation bias", definition: "Favouring information that supports what you already believe." },
        { term: "Rumour premium", definition: "The part of a price move driven by unverified claims." },
      ],
    },
    visual: {
      kind: "flow",
      title: "Life cycle of a rumour",
      steps: [
        { label: "Viral claim", detail: "'Sources say' Urja wins ₹5,000 crore contract." },
        { label: "Price jumps", detail: "Traders buy; the stock rises 9%.", tone: "up" },
        { label: "Check facts", detail: "Official tender is ₹6,000 crore, split among bidders." },
        { label: "Filing", detail: "Urja actually wins ₹900 crore." },
        { label: "Premium unwinds", detail: "Stock falls 7.5% — ending barely above where it started.", tone: "down" },
      ],
    },
    workedExample: {
      title: "Who lost on the rumour?",
      setup: "Urja is at ₹100 before the rumour. It rises 9% to ₹109, then falls 7.5% after the filing.",
      steps: [
        { label: "Rumour price", value: "₹100 × 1.09 = ₹109" },
        { label: "After filing", value: "₹109 × 0.925 ≈ ₹100.83" },
        { label: "Bought before rumour", value: "+0.8%" },
        { label: "Bought on rumour", value: "−7.5%" },
      ],
      takeaway: "Real good news can still lose you money if you paid for an exaggerated version of it.",
    },
    experiment: {
      id: "information-quality",
      title: "Source ranking",
      prompt: "Sort these sources from most to least reliable, then check your ranking.",
      observe: ["Official, accountable sources come first.", "Price moves and popularity are not evidence."],
    },
    quiz: [
      {
        id: "rum-q1",
        question: "Which is the strongest confirmation that a company won a contract?",
        options: ["A stock-exchange filing by the company", "A trending hashtag", "The stock rising 10%", "A forwarded message from a friend"],
        correctIndex: 0,
        explanation: "Exchange filings are official and legally accountable.",
      },
      {
        id: "rum-q2",
        question: "What is confirmation bias?",
        options: ["Favouring information that supports what you already believe", "Waiting for confirmation before acting", "A bank verifying your identity", "An exchange confirming your order"],
        correctIndex: 0,
        explanation: "It makes rumours you want to believe feel more credible than they are.",
      },
    ],
    applyRound: 8,
    applyText: "A viral post claims Urja has won a giant contract. Will you wait for the filing?",
    takeaways: ["Rank sources by accountability.", "Check claims against official facts.", "Rumour premiums can unwind fast."],
    next: "diversification",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "diversification",
    title: "Diversification",
    category: "portfolio",
    difficulty: "Beginner",
    minutes: 8,
    summary: "Spread across sectors and see how a single shock shrinks — but never disappears.",
    preview: "pie",
    intro: {
      hook: "Don't put all your eggs in one basket — and make sure the baskets aren't all in the same truck.",
      paragraphs: [
        "Diversification means spreading money across investments that don't all move together. If one company or sector has bad news, the rest of your portfolio cushions the blow.",
        "Stocks in the same sector are highly correlated — they share customers and drivers. Owning five IT companies is much less diversified than owning five companies in five sectors.",
      ],
      keyTerms: [
        { term: "Concentration risk", definition: "Too much of a portfolio exposed to one company or sector." },
        { term: "Correlation", definition: "How closely two investments move together." },
        { term: "Sector allocation", definition: "How your money is split across industries." },
      ],
    },
    visual: {
      kind: "compare",
      title: "An IT sector shock of −12%",
      left: { title: "80% in IT", tone: "down", points: ["IT holdings fall 12%", "Portfolio falls ≈ 9.6%", "One sector decides your result"] },
      right: { title: "20% in each of 5 sectors", tone: "up", points: ["IT holdings fall 12%", "Portfolio falls ≈ 2.4%", "Other sectors cushion the blow"] },
    },
    workedExample: {
      title: "Riya vs a diversified friend",
      setup: "Both have ₹1,00,000 invested. Riya has 80% in IT; her friend has 20% in each of five sectors. IT falls 12%; others are flat.",
      steps: [
        { label: "Riya's IT loss", value: "₹80,000 × 12% = ₹9,600" },
        { label: "Friend's IT loss", value: "₹20,000 × 12% = ₹2,400" },
        { label: "Riya's portfolio", value: "−9.6%" },
        { label: "Friend's portfolio", value: "−2.4%" },
      ],
      takeaway: "Diversification limits the damage from any one shock. It cannot stop the whole market falling together.",
    },
    experiment: {
      id: "diversification",
      title: "Concentration builder",
      prompt: "Allocate ₹1,00,000 across sectors, then trigger a sector shock. See how much your portfolio falls.",
      observe: ["The more sectors you hold, the smaller any single shock.", "A market-wide shock hits every sector — diversification helps far less."],
    },
    quiz: [
      {
        id: "div-q1",
        question: "Which portfolio is most diversified?",
        options: ["Five companies in five different sectors", "Five IT companies", "One very large company", "Two banks and three lenders"],
        correctIndex: 0,
        explanation: "Different sectors are less correlated, so shocks are less likely to hit everything at once.",
      },
      {
        id: "div-q2",
        question: "What can diversification NOT protect against?",
        options: ["A market-wide fall that hits most stocks", "One company's bad results", "One sector's bad news", "A single company's fraud"],
        correctIndex: 0,
        explanation: "When the whole market falls, correlations rise and most holdings fall together.",
      },
    ],
    applyRound: 6,
    applyText: "IT stocks are rallying and your friend is 80% in IT. How concentrated are you?",
    takeaways: ["Spread across sectors, not just companies.", "Correlation determines real diversification.", "It reduces, but doesn't eliminate, risk."],
    next: "volatility-drawdowns",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "volatility-drawdowns",
    title: "Volatility & drawdowns",
    category: "portfolio",
    difficulty: "Intermediate",
    minutes: 8,
    summary: "Why a 50% fall needs a 100% gain — and how biases shape crash decisions.",
    preview: "line",
    intro: {
      hook: "Losses and gains aren't symmetric: falling is faster than climbing back.",
      paragraphs: [
        "Volatility is how much prices swing. A drawdown is the fall from a peak to a low. Because a loss shrinks your base, recovering needs a bigger percentage gain than the loss.",
        "Crashes test risk tolerance — how much decline you can bear without abandoning your plan. Behavioural biases like panic, herd behaviour and loss aversion tend to peak at exactly these moments.",
      ],
      keyTerms: [
        { term: "Drawdown", definition: "The percentage fall from a peak value to a subsequent low." },
        { term: "Risk tolerance", definition: "How much loss you can bear financially and emotionally." },
        { term: "Loss aversion", definition: "Feeling losses about twice as strongly as equal gains." },
      ],
    },
    visual: {
      kind: "bars",
      title: "Gain needed to recover from a drawdown",
      unit: "% gain needed",
      bars: [
        { label: "−10% fall", value: 11.1, note: "Recoverable quickly" },
        { label: "−25% fall", value: 33.3, note: "A third more" },
        { label: "−50% fall", value: 100, note: "Must double" },
        { label: "−75% fall", value: 300, note: "Must quadruple" },
      ],
    },
    workedExample: {
      title: "The asymmetry of losses",
      setup: "Your ₹1,00,000 portfolio falls 30% in a crash.",
      steps: [
        { label: "Value after fall", value: "₹70,000" },
        { label: "Gain needed to recover", value: "₹30,000 ÷ ₹70,000 ≈ 42.9%" },
        { label: "If you sold at the low", value: "Loss of ₹30,000 is locked in" },
        { label: "If you held", value: "Recovery depends on prices — not guaranteed" },
      ],
      takeaway: "Sizing positions so you can survive a deep drawdown matters more than predicting the bottom.",
    },
    experiment: {
      id: "drawdown",
      title: "Drawdown calculator",
      prompt: "Drag the size of a fall and see the gain needed to recover, plus how long it might take at different growth rates.",
      observe: ["Recovery gain grows much faster than the loss.", "Small drawdowns are easy to recover; deep ones can take years."],
    },
    quiz: [
      {
        id: "dd-q1",
        question: "A portfolio falls 20%. What gain is needed to recover?",
        options: ["25%", "20%", "15%", "40%"],
        correctIndex: 0,
        explanation: "₹100 → ₹80. To get back to ₹100 you need ₹20 ÷ ₹80 = 25%.",
      },
      {
        id: "dd-q2",
        question: "Which statement about crashes is most accurate?",
        options: ["Some recover quickly, some take years — there's no guarantee", "Markets always recover within weeks", "Crashes never happen to diversified portfolios", "Selling everything always minimises losses"],
        correctIndex: 0,
        explanation: "Historical recoveries vary hugely. That uncertainty is why a plan matters.",
      },
    ],
    applyRound: 7,
    applyText: "A global sell-off hits every sector. Hold, reduce or buy?",
    takeaways: ["Drawdowns are asymmetric.", "Know your risk tolerance before a crash.", "Plans beat panic — in both directions."],
    next: "rebalancing",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "rebalancing",
    title: "Portfolio rebalancing",
    category: "portfolio",
    difficulty: "Intermediate",
    minutes: 7,
    summary: "Weights drift as prices move. Rebalancing brings risk back to your plan.",
    preview: "bars",
    intro: {
      hook: "Do nothing, and your portfolio will slowly change its own risk level.",
      paragraphs: [
        "Asset allocation is how you split money between investments, such as stocks and cash, or different sectors. As prices move, winners grow into a larger share and losers shrink — this is drift.",
        "Rebalancing trades back toward your targets: trim what has grown too large, add to what has become too small. It's a risk-control habit, not a prediction.",
      ],
      keyTerms: [
        { term: "Asset allocation", definition: "Your target mix of investments." },
        { term: "Drift", definition: "Change in portfolio weights caused by price moves." },
        { term: "Rebalancing", definition: "Trading back to target weights." },
      ],
    },
    visual: {
      kind: "compare",
      title: "Target vs drifted portfolio",
      left: { title: "Target: 60 / 40", tone: "neutral", points: ["60% stocks", "40% cash", "Risk you chose"] },
      right: { title: "After a rally: 72 / 28", tone: "down", points: ["72% stocks", "28% cash", "More risk than you chose"] },
    },
    workedExample: {
      title: "Rebalancing after a rally",
      setup: "You start with ₹60,000 in stocks and ₹40,000 cash (60/40). Stocks rise 50%.",
      steps: [
        { label: "Stocks now", value: "₹60,000 × 1.5 = ₹90,000" },
        { label: "Total portfolio", value: "₹90,000 + ₹40,000 = ₹1,30,000" },
        { label: "New stock weight", value: "₹90,000 ÷ ₹1,30,000 ≈ 69%" },
        { label: "To restore 60%", value: "Target stocks ₹78,000 → sell ₹12,000" },
      ],
      takeaway: "Rebalancing usually means selling some winners — uncomfortable, but it keeps risk where you planned.",
    },
    experiment: {
      id: "rebalancing",
      title: "Drift & rebalance",
      prompt: "Set returns for two holdings and watch the weights drift. Then rebalance and see the trades needed.",
      observe: ["Bigger return gaps cause bigger drift.", "Rebalancing trades are always 'sell the overweight, buy the underweight'."],
    },
    quiz: [
      {
        id: "reb-q1",
        question: "Why do investors rebalance?",
        options: ["To keep risk aligned with their chosen allocation", "To guarantee higher returns", "To avoid all charges", "To always own more of the best performer"],
        correctIndex: 0,
        explanation: "Rebalancing is about controlling risk, not predicting returns.",
      },
      {
        id: "reb-q2",
        question: "A target is 50% stocks. After a fall, stocks are 40%. Rebalancing means…",
        options: ["Buying some stocks with cash", "Selling more stocks", "Doing nothing until stocks recover", "Moving to 100% cash"],
        correctIndex: 0,
        explanation: "Stocks are now underweight, so you'd add to them to restore 50%.",
      },
    ],
    applyRound: 9,
    applyText: "After nine rounds, how far has your portfolio drifted from your plan?",
    takeaways: ["Prices change your weights.", "Rebalance against a target, not a feeling.", "Rebalancing controls risk, not returns."],
    next: "order-types",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "order-types",
    title: "Order types & the order book",
    category: "trading",
    difficulty: "Beginner",
    minutes: 8,
    summary: "Market, limit and stop-loss orders, matched against a simulated order book.",
    preview: "book",
    intro: {
      hook: "The price you see isn't always the price you get.",
      paragraphs: [
        "An exchange keeps an order book: a list of buyers (bids) and sellers (asks) at different prices. The gap between the best bid and best ask is the spread.",
        "A market order fills immediately at the best available prices. A limit order fills only at your price or better. A stop-loss order becomes a sell order once the price falls to a trigger level.",
      ],
      keyTerms: [
        { term: "Bid / ask", definition: "The highest price buyers will pay / the lowest price sellers will accept." },
        { term: "Limit order", definition: "Buy or sell only at a specified price or better." },
        { term: "Stop-loss", definition: "An order that triggers a sale if the price falls to a set level." },
      ],
    },
    visual: {
      kind: "compare",
      title: "Market vs limit order",
      left: { title: "Market order", tone: "neutral", points: ["Fills immediately", "Price not guaranteed", "Can 'walk' the book in large sizes"] },
      right: { title: "Limit order", tone: "neutral", points: ["Price guaranteed (or better)", "Fill not guaranteed", "Waits in the book until matched"] },
    },
    workedExample: {
      title: "Walking the book",
      setup: "Asks: 100 shares at ₹520.00, 150 at ₹520.50, 300 at ₹521.00. You place a market buy for 200 shares.",
      steps: [
        { label: "First 100 shares", value: "100 × ₹520.00 = ₹52,000" },
        { label: "Next 100 shares", value: "100 × ₹520.50 = ₹52,050" },
        { label: "Average fill price", value: "₹1,04,050 ÷ 200 = ₹520.25" },
        { label: "Limit buy at ₹520.00 instead", value: "Only 100 shares fill; 100 wait in the book" },
      ],
      takeaway: "Market orders trade certainty of execution for uncertainty of price; limit orders do the reverse.",
    },
    experiment: {
      id: "order-book",
      title: "Order book simulator",
      prompt: "Choose an order type and quantity. See exactly how it would fill against the book.",
      observe: ["Large market orders get worse average prices.", "Limit orders protect price but may not fill.", "Stop-losses can fill below the trigger in a fast fall."],
    },
    quiz: [
      {
        id: "ord-q1",
        question: "You want to buy only if the price is ₹500 or lower. Which order fits?",
        options: ["A limit buy at ₹500", "A market buy", "A stop-loss at ₹500", "Any order — they're all the same"],
        correctIndex: 0,
        explanation: "A limit order guarantees your price or better, but may not fill.",
      },
      {
        id: "ord-q2",
        question: "What does a stop-loss at ₹450 on a stock at ₹500 do?",
        options: ["Triggers a sell if the price falls to ₹450", "Buys more shares at ₹450", "Guarantees you sell at exactly ₹450", "Prevents the price from falling below ₹450"],
        correctIndex: 0,
        explanation: "It triggers a sale; in a fast fall the actual fill can be below ₹450.",
      },
    ],
    applyRound: 1,
    applyText: "MarketQuest fills your orders at the displayed price. In real markets, order type matters — keep that in mind from Round 1.",
    takeaways: ["The order book matches bids and asks.", "Market = certain fill, uncertain price.", "Limit = certain price, uncertain fill."],
    next: "what-is-a-stock",
  },
];

export const CONCEPTS: ConceptModule[] = AUTHORED_CONCEPTS.map((c) => ({ ...c, quiz: c.quiz.map(arrangeOptions) }));

export const CONCEPT_MAP: Record<string, ConceptModule> = Object.fromEntries(CONCEPTS.map((c) => [c.slug, c]));

export function getConcept(slug: string): ConceptModule | undefined {
  return CONCEPT_MAP[slug];
}

/** The order in which lessons are recommended (follows the simulation's round order). */
export const RECOMMENDED_ORDER = [
  "what-is-a-stock",
  "portfolio-value-pnl",
  "order-types",
  "earnings-expectations",
  "interest-rates-rbi",
  "pe-ratio",
  "inflation-pricing-power",
  "diversification",
  "volatility-drawdowns",
  "rumours-vs-facts",
  "rebalancing",
];
