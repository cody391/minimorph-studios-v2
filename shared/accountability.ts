/**
 * Shared accountability constants used by both server and client.
 * Single source of truth for tier config, score weights, decay rates, etc.
 */

export const SCORE_WEIGHTS = {
  activity: 0.30,
  closeRate: 0.30,
  clientSatisfaction: 0.20,
  valuesCompliance: 0.20,
} as const;

export const TIER_CONFIG = {
  bronze: {
    name: "Bronze",
    minMonths: 0,
    minMonthlyRevenue: 0,
    commissionRate: 10.00,
    leadPriority: 1,
    residualDecayMultiplier: 1.0,
    color: "amber",
    icon: "shield",
  },
  silver: {
    name: "Silver",
    minMonths: 3,
    minMonthlyRevenue: 3000,
    commissionRate: 12.00,
    leadPriority: 2,
    residualDecayMultiplier: 1.0,
    color: "slate",
    icon: "medal",
  },
  gold: {
    name: "Gold",
    minMonths: 6,
    minMonthlyRevenue: 7000,
    commissionRate: 14.00,
    leadPriority: 3,
    residualDecayMultiplier: 0.5,
    color: "yellow",
    icon: "crown",
  },
  platinum: {
    name: "Platinum",
    minMonths: 12,
    minMonthlyRevenue: 12000,
    commissionRate: 15.00,
    leadPriority: 4,
    residualDecayMultiplier: 0.0,
    color: "violet",
    icon: "gem",
  },
} as const;

export type TierKey = keyof typeof TIER_CONFIG;

export const TIER_ORDER: TierKey[] = ["bronze", "silver", "gold", "platinum"];

export const RESIDUAL_DECAY = {
  activeThresholdDays: 0,
  tier1Days: 30,
  tier1Rate: 0.75,
  tier2Days: 60,
  tier2Rate: 0.50,
  tier3Days: 90,
  tier3Rate: 0.25,
  reassignDays: 120,
  reassignRate: 0.0,
} as const;

export const LEAD_ALLOCATION = {
  timeoutHours: 4,
  freezeThreshold: 40,
  maxActiveLeads: 20,
} as const;

export const STRIKE_RULES = {
  maxStrikesBeforeDeactivation: 3,
  strikePeriodMonths: 6,
  instantDeactivationCategories: ["fraud", "confidentiality_breach", "client_harm"],
} as const;

/** Residual health status based on decay rate */
export function getResidualHealthStatus(decayRate: number): {
  status: "active" | "at_risk" | "decaying" | "critical" | "frozen";
  label: string;
  color: string;
} {
  if (decayRate >= 1.0) return { status: "active", label: "Active", color: "green" };
  if (decayRate >= 0.75) return { status: "at_risk", label: "At Risk", color: "yellow" };
  if (decayRate >= 0.50) return { status: "decaying", label: "Decaying", color: "orange" };
  if (decayRate > 0) return { status: "critical", label: "Critical", color: "red" };
  return { status: "frozen", label: "Frozen", color: "gray" };
}

/** Get score rating label */
export function getScoreRating(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) return { label: "Excellent", color: "green" };
  if (score >= 60) return { label: "Good", color: "blue" };
  if (score >= 40) return { label: "Needs Improvement", color: "yellow" };
  if (score >= 20) return { label: "At Risk", color: "orange" };
  return { label: "Critical", color: "red" };
}
