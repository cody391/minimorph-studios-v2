/**
 * ═══════════════════════════════════════════════════════
 * PRICING — Single source of truth for all package pricing
 * ═══════════════════════════════════════════════════════
 *
 * RULE: Every price displayed anywhere in the app (Home page, GetStarted,
 * Academy curriculum, PipelineTab, proposals, Stripe checkout) MUST
 * reference these constants. Never hardcode dollar amounts.
 */

export const PACKAGES = {
  starter: {
    name: "Starter",
    monthlyPrice: 149,
    annualTotal: 1788, // 149 * 12
    contractMonths: 12,
    description: "Perfect for small businesses ready to establish a professional online presence.",
    features: [
      "Custom 5-page website",
      "Mobile-responsive design",
      "Basic SEO setup",
      "Contact form integration",
      "Monthly maintenance",
      "Email support",
    ],
  },
  growth: {
    name: "Growth",
    monthlyPrice: 299,
    annualTotal: 3588, // 299 * 12
    contractMonths: 12,
    description: "For growing businesses that need advanced features and ongoing optimization.",
    features: [
      "Everything in Starter",
      "Up to 15 pages",
      "Advanced SEO & analytics",
      "Blog / CMS integration",
      "Social media integration",
      "Priority support",
      "Quarterly strategy calls",
    ],
    popular: true,
  },
  premium: {
    name: "Premium",
    monthlyPrice: 499,
    annualTotal: 5988, // 499 * 12
    contractMonths: 12,
    description: "Full-service digital presence for established businesses demanding the best.",
    features: [
      "Everything in Growth",
      "Unlimited pages",
      "E-commerce integration",
      "Custom animations & interactions",
      "A/B testing",
      "Dedicated account manager",
      "Monthly strategy sessions",
      "24/7 priority support",
    ],
  },
} as const;

export type PackageKey = keyof typeof PACKAGES;
export const PACKAGE_KEYS: PackageKey[] = ["starter", "growth", "premium"];

/** Helper to format price as "$149/mo" */
export function formatMonthlyPrice(key: PackageKey): string {
  return `$${PACKAGES[key].monthlyPrice}/mo`;
}

/** Helper to format annual total as "$1,788" */
export function formatAnnualTotal(key: PackageKey): string {
  return `$${PACKAGES[key].annualTotal.toLocaleString()}`;
}

/** All three monthly prices as a string: "$149/$299/$499" */
export const PRICE_RANGE_SHORT = `$${PACKAGES.starter.monthlyPrice}/$${PACKAGES.growth.monthlyPrice}/$${PACKAGES.premium.monthlyPrice}`;

/** Academy-friendly pricing reference */
export const ACADEMY_PRICING = {
  starterMonthly: `$${PACKAGES.starter.monthlyPrice}/month`,
  growthMonthly: `$${PACKAGES.growth.monthlyPrice}/month`,
  premiumMonthly: `$${PACKAGES.premium.monthlyPrice}/month`,
  starterAnnual: `$${PACKAGES.starter.annualTotal.toLocaleString()}/year`,
  growthAnnual: `$${PACKAGES.growth.annualTotal.toLocaleString()}/year`,
  premiumAnnual: `$${PACKAGES.premium.annualTotal.toLocaleString()}/year`,
} as const;
