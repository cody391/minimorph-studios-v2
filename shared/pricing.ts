/**
 * ═══════════════════════════════════════════════════════
 * PRICING — Single source of truth for all package pricing
 * ═══════════════════════════════════════════════════════
 *
 * RULE: Every price displayed anywhere in the app (Home page, GetStarted,
 * Academy curriculum, PipelineTab, proposals, Stripe checkout) MUST
 * reference these constants. Never hardcode dollar amounts.
 *
 * Intended pricing (confirmed):
 *   Starter:    $195/mo (no setup fee)
 *   Growth:     $295/mo (no setup fee)
 *   Pro:        $395/mo (no setup fee)
 *   Enterprise: $495/mo (no setup fee)
 */

export const PACKAGES = {
  starter: {
    name: "Starter",
    tier: "starter" as const,
    monthlyPrice: 195,
    monthlyPriceInCents: 19500,
    setupFee: 0,
    setupFeeInCents: 0,
    annualTotal: 2340,
    contractMonths: 12,
    description: "For businesses that need a clean, professional website with ongoing support",
    features: [
      "Up to 5 pages",
      "Mobile-responsive design",
      "Contact/quote form",
      "Basic SEO setup",
      "Customer portal access",
      "Monthly performance report",
      "1 content update per month",
      "Email support",
    ],
  },
  growth: {
    name: "Growth",
    tier: "growth" as const,
    monthlyPrice: 295,
    monthlyPriceInCents: 29500,
    setupFee: 0,
    setupFeeInCents: 0,
    annualTotal: 3540,
    contractMonths: 12,
    description: "For businesses ready to grow with more pages, features, and monthly support",
    features: [
      "Up to 10 pages",
      "Everything in Starter",
      "Blog or news section",
      "Google Analytics setup",
      "2 content updates per month",
      "AI-assisted recommendations",
      "Priority email support",
      "Add-on integrations available",
    ],
    popular: true,
  },
  premium: {
    name: "Pro",
    tier: "premium" as const,
    monthlyPrice: 395,
    monthlyPriceInCents: 39500,
    setupFee: 0,
    setupFeeInCents: 0,
    annualTotal: 4740,
    contractMonths: 12,
    description: "For businesses that need advanced features, more pages, and hands-on support",
    features: [
      "Up to 20 pages",
      "Everything in Growth",
      "Advanced SEO pages",
      "4 content updates per month",
      "Review widget setup",
      "Booking integration",
      "SMS lead alerts",
      "Priority support with faster response",
    ],
  },
  enterprise: {
    name: "Enterprise",
    tier: "enterprise" as const,
    monthlyPrice: 495,
    monthlyPriceInCents: 49500,
    setupFee: 0,
    setupFeeInCents: 0,
    annualTotal: 5940,
    contractMonths: 12,
    description: "For large, complex builds — ecommerce stores, custom portals, membership systems, and multi-location businesses",
    features: [
      "Everything in Pro",
      "Large ecommerce (unlimited products)",
      "Custom customer portals",
      "Membership/subscription systems",
      "Multi-location support",
      "Advanced booking systems",
      "Custom integrations",
      "Priority build queue",
    ],
  },
} as const;

export type PackageKey = keyof typeof PACKAGES;
export const PACKAGE_KEYS: PackageKey[] = ["starter", "growth", "premium", "enterprise"];

/** Helper to format price as "$195/mo" */
export function formatMonthlyPrice(key: PackageKey): string {
  return `$${PACKAGES[key].monthlyPrice}/mo`;
}

/** Helper to format annual total as "$2,340" */
export function formatAnnualTotal(key: PackageKey): string {
  return `$${PACKAGES[key].annualTotal.toLocaleString()}`;
}

/** Helper to format setup fee — now always $0 (kept for backward compat) */
export function formatSetupFee(key: PackageKey): string {
  return `$${PACKAGES[key].setupFee.toLocaleString()}`;
}

/** All four monthly prices as a string: "$195/$295/$395/$495" */
export const PRICE_RANGE_SHORT = `$${PACKAGES.starter.monthlyPrice}/$${PACKAGES.growth.monthlyPrice}/$${PACKAGES.premium.monthlyPrice}/$${PACKAGES.enterprise.monthlyPrice}`;

/** Academy-friendly pricing reference */
export const ACADEMY_PRICING = {
  starterMonthly: `$${PACKAGES.starter.monthlyPrice}/month`,
  growthMonthly: `$${PACKAGES.growth.monthlyPrice}/month`,
  premiumMonthly: `$${PACKAGES.premium.monthlyPrice}/month`,
  enterpriseMonthly: `$${PACKAGES.enterprise.monthlyPrice}/month`,
  starterAnnual: `$${PACKAGES.starter.annualTotal.toLocaleString()}/year`,
  growthAnnual: `$${PACKAGES.growth.annualTotal.toLocaleString()}/year`,
  premiumAnnual: `$${PACKAGES.premium.annualTotal.toLocaleString()}/year`,
  enterpriseAnnual: `$${PACKAGES.enterprise.annualTotal.toLocaleString()}/year`,
} as const;
