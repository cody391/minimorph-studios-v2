/**
 * Custom Quote / Admin Review Trigger Engine
 * ───────────────────────────────────────────
 * Analyzes a questionnaire submission and returns:
 *   - needsCustomQuote: boolean
 *   - reviewFlags: string[] (human-readable reasons)
 *   - complexityScore: 0-100
 *
 * Rules are deterministic and run on both server (at submit time)
 * and can be previewed on the client.
 */

import type { ExpandedQuestionnaire } from "./questionnaire";

export interface QuoteAnalysis {
  needsCustomQuote: boolean;
  reviewFlags: string[];
  complexityScore: number;
}

/**
 * Analyze a questionnaire and compute quote/review triggers.
 */
export function analyzeQuestionnaire(q: Partial<ExpandedQuestionnaire>): QuoteAnalysis {
  const flags: string[] = [];
  let score = 10; // baseline

  // ── ECOMMERCE TRIGGERS ──────────────────────────────────────────────
  if (q.websiteType === "ecommerce") {
    score += 15; // ecommerce is inherently more complex
    flags.push("ecommerce_website");

    const ec = q.ecommerceFields;
    if (ec) {
      // Product count tiers
      if (ec.productCount === "26-50") {
        score += 10;
        flags.push("ecommerce_26_50_products");
      } else if (ec.productCount === "51-100") {
        score += 20;
        flags.push("ecommerce_51_100_products");
      } else if (ec.productCount === "100+") {
        score += 30;
        flags.push("ecommerce_100_plus_products");
      }

      // Migration from existing platform
      if (ec.needsMigration) {
        score += 15;
        flags.push("platform_migration_required");
      }

      // Subscriptions (recurring billing complexity)
      if (ec.needsSubscriptions) {
        score += 10;
        flags.push("subscription_products");
      }

      // Inventory system integration
      if (ec.hasInventorySystem) {
        score += 5;
        flags.push("inventory_system_integration");
      }

      // International shipping
      if (ec.shippingRegions === "Worldwide") {
        score += 5;
        flags.push("worldwide_shipping");
      }

      // Automated tax handling
      if (ec.taxHandling === "Automated") {
        score += 5;
        flags.push("automated_tax_handling");
      }
    }
  }

  // ── RESTAURANT TRIGGERS ─────────────────────────────────────────────
  if (q.websiteType === "restaurant") {
    const r = q.restaurantFields;
    if (r) {
      if (r.needsOnlineOrdering) {
        score += 15;
        flags.push("online_ordering_system");
      }
      if (r.needsReservations) {
        score += 5;
        flags.push("reservation_system");
      }
      if (r.locationCount && r.locationCount > 1) {
        score += 10;
        flags.push(`multi_location_${r.locationCount}`);
      }
    }
  }

  // ── CONTRACTOR TRIGGERS ─────────────────────────────────────────────
  if (q.websiteType === "contractor") {
    const c = q.contractorFields;
    if (c) {
      if (c.emergencyService) {
        score += 5;
        flags.push("emergency_service_feature");
      }
    }
  }

  // ── FEATURE-BASED TRIGGERS ──────────────────────────────────────────
  const features = (q.mustHaveFeatures || []).map((f) => f.toLowerCase());
  const featureCount = features.length;

  if (featureCount > 5) {
    score += 10;
    flags.push("high_feature_count");
  }

  // Specific high-complexity features
  const complexFeatures = [
    "membership",
    "portal",
    "dashboard",
    "crm",
    "multi-language",
    "multilingual",
    "api integration",
    "custom api",
    "payment",
    "marketplace",
    "auction",
    "real-time",
    "realtime",
    "live chat",
    "video",
    "streaming",
  ];
  for (const cf of complexFeatures) {
    if (features.some((f) => f.includes(cf))) {
      score += 8;
      flags.push(`complex_feature_${cf.replace(/\s+/g, "_")}`);
    }
  }

  // ── SPECIAL REQUESTS TRIGGERS ───────────────────────────────────────
  const sr = (q.specialRequests || "").toLowerCase();
  const customKeywords = [
    "multilingual",
    "multi-language",
    "translation",
    "custom integration",
    "api",
    "crm",
    "erp",
    "pos",
    "point of sale",
    "custom design",
    "from scratch",
    "complex",
    "enterprise",
    "white label",
    "white-label",
    "franchise",
    "multiple locations",
  ];
  for (const kw of customKeywords) {
    if (sr.includes(kw)) {
      score += 5;
      flags.push(`special_request_${kw.replace(/\s+/g, "_")}`);
    }
  }

  // ── COMPETITOR ANALYSIS COMPLEXITY ──────────────────────────────────
  const competitorCount = (q.competitorSites || []).filter((s) => s.url).length;
  if (competitorCount >= 3) {
    score += 3;
    // Not a flag, just adds to complexity
  }

  // ── CAP SCORE ───────────────────────────────────────────────────────
  score = Math.min(score, 100);

  // ── DETERMINE CUSTOM QUOTE THRESHOLD ────────────────────────────────
  // Custom quote if score >= 50 OR any critical flag
  const criticalFlags = [
    "ecommerce_100_plus_products",
    "platform_migration_required",
    "online_ordering_system",
    "subscription_products",
  ];
  const hasCriticalFlag = flags.some((f) => criticalFlags.includes(f));
  const needsCustomQuote = score >= 50 || hasCriticalFlag;

  return {
    needsCustomQuote,
    reviewFlags: flags,
    complexityScore: score,
  };
}

/**
 * Human-readable description for a review flag.
 */
export const FLAG_DESCRIPTIONS: Record<string, string> = {
  ecommerce_website: "Ecommerce website (requires specialized package)",
  ecommerce_26_50_products: "26-50 products (moderate catalog)",
  ecommerce_51_100_products: "51-100 products (large catalog, needs custom quote)",
  ecommerce_100_plus_products: "100+ products (enterprise catalog, requires custom quote)",
  platform_migration_required: "Platform migration needed (data transfer complexity)",
  subscription_products: "Subscription/recurring products (billing complexity)",
  inventory_system_integration: "Inventory system integration needed",
  worldwide_shipping: "Worldwide shipping (multi-region logistics)",
  automated_tax_handling: "Automated tax calculation integration",
  online_ordering_system: "Online ordering system (restaurant)",
  reservation_system: "Reservation system needed",
  emergency_service_feature: "24/7 emergency service feature",
  high_feature_count: "High number of requested features (6+)",
  complex_feature_membership: "Membership/portal system",
  complex_feature_portal: "Custom portal/dashboard",
  complex_feature_dashboard: "Custom dashboard",
  complex_feature_crm: "CRM integration",
  complex_feature_multi_language: "Multi-language support",
  complex_feature_multilingual: "Multilingual website",
  complex_feature_api_integration: "Custom API integration",
  complex_feature_custom_api: "Custom API development",
  complex_feature_payment: "Custom payment processing",
  complex_feature_marketplace: "Marketplace functionality",
  complex_feature_auction: "Auction system",
  complex_feature_real_time: "Real-time features",
  complex_feature_realtime: "Real-time features",
  complex_feature_live_chat: "Live chat system",
  complex_feature_video: "Video features",
  complex_feature_streaming: "Streaming functionality",
  special_request_multilingual: "Multilingual requirement in special requests",
  special_request_custom_integration: "Custom integration mentioned",
  special_request_api: "API requirement mentioned",
  special_request_crm: "CRM integration mentioned",
  special_request_erp: "ERP integration mentioned",
  special_request_pos: "POS integration mentioned",
  special_request_point_of_sale: "Point of sale integration",
  special_request_custom_design: "Custom design from scratch",
  special_request_from_scratch: "Built from scratch request",
  special_request_complex: "Complex project mentioned",
  special_request_enterprise: "Enterprise-level project",
  special_request_white_label: "White-label requirement",
  special_request_white_label_: "White-label requirement",
  special_request_franchise: "Franchise website",
  special_request_multiple_locations: "Multiple locations",
};
