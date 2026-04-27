/**
 * MiniMorph Studios — Stripe Product Definitions
 * Re-exports from shared/pricing.ts (single source of truth).
 * This file exists for backward compatibility with dynamic imports in routers.ts.
 */
import { PACKAGES as SHARED_PACKAGES, type PackageKey } from "../shared/pricing";

export interface PackageDefinition {
  name: string;
  tier: "starter" | "growth" | "premium";
  description: string;
  monthlyPriceInCents: number;
  setupFeeInCents: number;
  features: string[];
}

export const PACKAGES: Record<string, PackageDefinition> = {
  starter: {
    name: SHARED_PACKAGES.starter.name,
    tier: SHARED_PACKAGES.starter.tier,
    description: SHARED_PACKAGES.starter.description,
    monthlyPriceInCents: SHARED_PACKAGES.starter.monthlyPriceInCents,
    setupFeeInCents: SHARED_PACKAGES.starter.setupFeeInCents,
    features: [...SHARED_PACKAGES.starter.features],
  },
  growth: {
    name: SHARED_PACKAGES.growth.name,
    tier: SHARED_PACKAGES.growth.tier,
    description: SHARED_PACKAGES.growth.description,
    monthlyPriceInCents: SHARED_PACKAGES.growth.monthlyPriceInCents,
    setupFeeInCents: SHARED_PACKAGES.growth.setupFeeInCents,
    features: [...SHARED_PACKAGES.growth.features],
  },
  premium: {
    name: SHARED_PACKAGES.premium.name,
    tier: SHARED_PACKAGES.premium.tier,
    description: SHARED_PACKAGES.premium.description,
    monthlyPriceInCents: SHARED_PACKAGES.premium.monthlyPriceInCents,
    setupFeeInCents: SHARED_PACKAGES.premium.setupFeeInCents,
    features: [...SHARED_PACKAGES.premium.features],
  },
};

export function getPackage(tier: string): PackageDefinition | undefined {
  return PACKAGES[tier];
}

export { PackageKey };
