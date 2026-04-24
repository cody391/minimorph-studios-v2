/**
 * MiniMorph Studios — Stripe Product Definitions
 * Centralized pricing and package configuration for checkout sessions.
 */

export interface PackageDefinition {
  name: string;
  tier: "starter" | "growth" | "premium";
  description: string;
  monthlyPriceInCents: number; // monthly recurring price
  setupFeeInCents: number; // one-time setup fee
  features: string[];
}

export const PACKAGES: Record<string, PackageDefinition> = {
  starter: {
    name: "Starter Package",
    tier: "starter",
    description: "For businesses that need a clean, professional website with ongoing support",
    monthlyPriceInCents: 15000, // $150/month
    setupFeeInCents: 50000, // $500 setup
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
    name: "Growth Package",
    tier: "growth",
    description: "For businesses ready to grow with more pages, features, and monthly support",
    monthlyPriceInCents: 25000, // $250/month
    setupFeeInCents: 75000, // $750 setup
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
  },
  premium: {
    name: "Pro Package",
    tier: "premium",
    description: "For businesses that need advanced features, more pages, and hands-on support",
    monthlyPriceInCents: 40000, // $400/month
    setupFeeInCents: 100000, // $1,000 setup
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
};

export function getPackage(tier: string): PackageDefinition | undefined {
  return PACKAGES[tier];
}
