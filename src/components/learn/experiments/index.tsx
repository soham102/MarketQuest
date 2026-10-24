"use client";

import type { ComponentType } from "react";
import type { ExperimentId } from "@/lib/types";
import { OrderBookExperiment, OwnershipExperiment, PortfolioValueExperiment } from "./basics";
import {
  EarningsSurpriseExperiment,
  InformationQualityExperiment,
  PeValuationExperiment,
  PricingPowerExperiment,
  RateTransmissionExperiment,
} from "./valuation-macro";
import { DiversificationExperiment, DrawdownExperiment, RebalancingExperiment } from "./portfolio";

export const EXPERIMENTS: Record<ExperimentId, ComponentType> = {
  ownership: OwnershipExperiment,
  "portfolio-value": PortfolioValueExperiment,
  "order-book": OrderBookExperiment,
  "earnings-surprise": EarningsSurpriseExperiment,
  "pe-valuation": PeValuationExperiment,
  "rate-transmission": RateTransmissionExperiment,
  "pricing-power": PricingPowerExperiment,
  "information-quality": InformationQualityExperiment,
  diversification: DiversificationExperiment,
  drawdown: DrawdownExperiment,
  rebalancing: RebalancingExperiment,
};
