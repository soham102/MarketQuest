import type { RiskProfile, RiskProfileId, Sector, SectorId, Stock } from "@/lib/types";

/** Global simulation settings. All companies and figures are fictional. */
export const SIM_CONFIG = {
  initialCapital: 100_000_00, // ₹1,00,000 in paise
  totalRounds: 10,
  /** Simplified flat transaction charges (brokerage + taxes), as a fraction of order value. */
  chargeRate: 0.001,
  chargeLabel: "Simulated charges (0.10% of order value)",
  maxQuantityPerOrder: 100_000,
} as const;

export const SECTORS: Record<SectorId, Sector> = {
  consumer: {
    id: "consumer",
    name: "Consumer Goods",
    description: "Everyday products such as packaged food, soaps and beverages.",
  },
  banking: {
    id: "banking",
    name: "Banking",
    description: "Lenders that earn the gap between loan and deposit interest rates.",
  },
  it: {
    id: "it",
    name: "IT Services",
    description: "Software and technology services, largely sold to overseas clients.",
  },
  auto: {
    id: "auto",
    name: "Automobiles",
    description: "Vehicle makers whose sales depend heavily on loans and consumer confidence.",
  },
  pharma: {
    id: "pharma",
    name: "Pharma",
    description: "Medicine makers; demand is relatively steady across economic cycles.",
  },
  energy: {
    id: "energy",
    name: "Energy",
    description: "Power producers; capital-intensive and often funded with debt.",
  },
  fintech: {
    id: "fintech",
    name: "Fintech",
    description: "Young, fast-growing digital finance businesses valued on future growth.",
  },
};

/** Fixed categorical colour per sector (validated for CVD separation on the navy surface). */
export const SECTOR_COLORS: Record<SectorId | "cash", string> = {
  it: "#3987e5",
  consumer: "#d95926",
  banking: "#199e70",
  auto: "#c98500",
  pharma: "#d55181",
  energy: "#008300",
  fintech: "#9085e9",
  cash: "#5b6782",
};

export const SECTOR_ORDER: SectorId[] = ["it", "consumer", "banking", "auto", "pharma", "energy", "fintech"];

export const STOCKS: Stock[] = [
  {
    ticker: "KRTI",
    name: "Kriti Foods",
    sector: "consumer",
    description: "Packaged staples and snacks sold through 9 lakh neighbourhood stores.",
    startPrice: 520_00,
    preHistory: [0.8, -0.6, 1.1, 0.4, -0.3, 0.9, 0.2],
    facts: [
      { label: "Market cap", value: "₹18,200 cr" },
      { label: "P/E ratio", value: "38" },
      { label: "Debt", value: "Almost none" },
    ],
  },
  {
    ticker: "SHKT",
    name: "Shakti Bank",
    sector: "banking",
    description: "Mid-sized private bank with a large home-loan and small-business book.",
    startPrice: 840_00,
    preHistory: [-0.4, 0.7, 0.3, -1.0, 0.6, 0.5, -0.2],
    facts: [
      { label: "Market cap", value: "₹42,000 cr" },
      { label: "P/E ratio", value: "16" },
      { label: "Net interest margin", value: "3.6%" },
    ],
  },
  {
    ticker: "VYOM",
    name: "Vyom Infotech",
    sector: "it",
    description: "Large IT services exporter; 60% of revenue from North American clients.",
    startPrice: 1450_00,
    preHistory: [0.5, 0.3, -0.7, 1.2, 0.6, -0.4, 0.8],
    facts: [
      { label: "Market cap", value: "₹96,000 cr" },
      { label: "P/E ratio", value: "24" },
      { label: "Revenue growth", value: "~10% a year" },
    ],
  },
  {
    ticker: "TRNG",
    name: "Tarang Software",
    sector: "it",
    description: "Mid-sized IT firm specialising in software for US banks and insurers.",
    startPrice: 620_00,
    preHistory: [1.4, -0.8, 1.9, 0.7, -1.2, 1.5, 0.9],
    facts: [
      { label: "Market cap", value: "₹14,500 cr" },
      { label: "P/E ratio", value: "29" },
      { label: "Top-5 client share", value: "48% of revenue" },
    ],
  },
  {
    ticker: "ARYA",
    name: "Aryavart Motors",
    sector: "auto",
    description: "Maker of entry-level cars and two-wheelers; strong in smaller towns.",
    startPrice: 690_00,
    preHistory: [1.0, 0.6, -0.5, 1.4, 0.8, -0.3, 1.1],
    facts: [
      { label: "Market cap", value: "₹31,000 cr" },
      { label: "P/E ratio", value: "27" },
      { label: "Buyers using loans", value: "~75%" },
    ],
  },
  {
    ticker: "PRAN",
    name: "Pranali Pharma",
    sector: "pharma",
    description: "Generic medicines maker selling in India and regulated export markets.",
    startPrice: 980_00,
    preHistory: [0.2, -0.3, 0.4, 0.1, 0.3, -0.2, 0.4],
    facts: [
      { label: "Market cap", value: "₹27,500 cr" },
      { label: "P/E ratio", value: "28" },
      { label: "Export share", value: "45% of revenue" },
    ],
  },
  {
    ticker: "URJA",
    name: "Urja Renewables",
    sector: "energy",
    description: "Solar and wind power developer selling electricity under long-term contracts.",
    startPrice: 310_00,
    preHistory: [1.8, -1.5, 2.2, -0.9, 1.6, 0.8, -1.1],
    facts: [
      { label: "Market cap", value: "₹9,800 cr" },
      { label: "P/E ratio", value: "45" },
      { label: "Debt-to-equity", value: "2.1×" },
    ],
  },
  {
    ticker: "DHAN",
    name: "DhanSetu Fintech",
    sector: "fintech",
    description: "Fast-growing digital payments and lending app with 6 crore users.",
    startPrice: 1200_00,
    preHistory: [2.4, -1.8, 3.1, 1.2, -2.0, 2.6, 1.5],
    facts: [
      { label: "Market cap", value: "₹38,000 cr" },
      { label: "P/E ratio", value: "80" },
      { label: "Profit growth", value: "~40% a year (so far)" },
    ],
  },
];

export const STOCK_MAP: Record<string, Stock> = Object.fromEntries(STOCKS.map((s) => [s.ticker, s]));

export const RISK_PROFILES: Record<RiskProfileId, RiskProfile> = {
  cautious: {
    id: "cautious",
    name: "Cautious",
    summary: "Keep about half in cash and spread the rest widely.",
    targetInvestedPct: 50,
    maxSectorPct: 20,
    maxPositionPct: 15,
  },
  balanced: {
    id: "balanced",
    name: "Balanced",
    summary: "Invest about 70%, with no sector above a quarter of the portfolio.",
    targetInvestedPct: 70,
    maxSectorPct: 25,
    maxPositionPct: 20,
  },
  growth: {
    id: "growth",
    name: "Growth",
    summary: "Invest about 90%, accepting bigger swings, but still capping any one sector.",
    targetInvestedPct: 90,
    maxSectorPct: 35,
    maxPositionPct: 25,
  },
};
