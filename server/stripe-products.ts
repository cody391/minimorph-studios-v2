/**
 * MiniMorph Studios — Stripe Product Definitions
 * Re-exports from shared/pricing.ts (single source of truth).
 * This file exists for backward compatibility with dynamic imports in routers.ts.
 */
import { PACKAGES as SHARED_PACKAGES, type PackageKey } from "../shared/pricing";

export interface PackageDefinition {
  name: string;
  tier: "starter" | "growth" | "premium" | "enterprise";
  description: string;
  monthlyPriceInCents: number;
  monthlyPrice: number;
  setupFeeInCents: number;
  features: string[];
}

export const PACKAGES: Record<string, PackageDefinition> = {
  starter: {
    name: SHARED_PACKAGES.starter.name,
    tier: SHARED_PACKAGES.starter.tier,
    description: SHARED_PACKAGES.starter.description,
    monthlyPriceInCents: SHARED_PACKAGES.starter.monthlyPriceInCents,
    monthlyPrice: SHARED_PACKAGES.starter.monthlyPrice,
    setupFeeInCents: 0,
    features: [...SHARED_PACKAGES.starter.features],
  },
  growth: {
    name: SHARED_PACKAGES.growth.name,
    tier: SHARED_PACKAGES.growth.tier,
    description: SHARED_PACKAGES.growth.description,
    monthlyPriceInCents: SHARED_PACKAGES.growth.monthlyPriceInCents,
    monthlyPrice: SHARED_PACKAGES.growth.monthlyPrice,
    setupFeeInCents: 0,
    features: [...SHARED_PACKAGES.growth.features],
  },
  premium: {
    name: SHARED_PACKAGES.premium.name,
    tier: SHARED_PACKAGES.premium.tier,
    description: SHARED_PACKAGES.premium.description,
    monthlyPriceInCents: SHARED_PACKAGES.premium.monthlyPriceInCents,
    monthlyPrice: SHARED_PACKAGES.premium.monthlyPrice,
    setupFeeInCents: 0,
    features: [...SHARED_PACKAGES.premium.features],
  },
  enterprise: {
    name: SHARED_PACKAGES.enterprise.name,
    tier: SHARED_PACKAGES.enterprise.tier,
    description: SHARED_PACKAGES.enterprise.description,
    monthlyPriceInCents: SHARED_PACKAGES.enterprise.monthlyPriceInCents,
    monthlyPrice: SHARED_PACKAGES.enterprise.monthlyPrice,
    setupFeeInCents: 0,
    features: [...SHARED_PACKAGES.enterprise.features],
  },
};

export function getPackage(tier: string): PackageDefinition | undefined {
  return PACKAGES[tier];
}

export { PackageKey };
