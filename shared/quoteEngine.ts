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

  // ── "OTHER" TYPE AUTO-FLAG ──────────────────────────────────────────
  if (q.websiteType === "other") {
    score += 15;
    flags.push("other_business_type");
  }

  // ── UNIVERSAL FIELDS TRIGGERS ───────────────────────────────────────
  const uf = q.universalFields;
  if (uf) {
    // High page count
    const pages = (uf.pagesNeeded || "").split(",").map((p) => p.trim()).filter(Boolean);
    if (pages.length > 15) {
      score += 15;
      flags.push("high_page_count");
    } else if (pages.length > 10) {
      score += 8;
      flags.push("moderate_page_count");
    }

    // Complex integrations requested
    const integrations = (uf.integrationsRequested || "").toLowerCase();
    const complexIntegrations = [
      "zapier", "webhook", "crm", "hubspot", "salesforce",
      "custom api", "erp", "pos", "point of sale",
    ];
    for (const ci of complexIntegrations) {
      if (integrations.includes(ci)) {
        score += 8;
        flags.push(`integration_${ci.replace(/\s+/g, "_")}`);
      }
    }
  }

  // ── ECOMMERCE TRIGGERS ──────────────────────────────────────────────
  if (q.websiteType === "ecommerce") {
    score += 15;
    flags.push("ecommerce_website");

    const ec = q.ecommerceFields;
    if (ec) {
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
      if (ec.needsMigration) {
        score += 15;
        flags.push("platform_migration_required");
      }
      if (ec.needsSubscriptions) {
        score += 10;
        flags.push("subscription_products");
      }
      if (ec.hasInventorySystem) {
        score += 5;
        flags.push("inventory_system_integration");
      }
      if (ec.shippingRegions === "Worldwide") {
        score += 5;
        flags.push("worldwide_shipping");
      }
      if (ec.taxHandling === "Automated") {
        score += 5;
        flags.push("automated_tax_handling");
      }
      if (ec.hasProductVariants && ec.variantComplexity === "complex") {
        score += 10;
        flags.push("complex_product_variants");
      }
      if (ec.productPhotosStatus === "need_all") {
        score += 5;
        flags.push("product_photography_needed");
      }
      if (ec.productDescriptionsStatus === "need_written") {
        score += 5;
        flags.push("product_copywriting_needed");
      }
      if (ec.abandonedCartInterest) {
        score += 5;
        flags.push("abandoned_cart_email_marketing");
      }
      if (ec.platformPreference === "shopify" || ec.platformPreference === "woocommerce") {
        score += 10;
        flags.push("third_party_ecommerce_platform");
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
      if (r.orderingPlatform && r.orderingPlatform !== "none") {
        score += 5;
        flags.push("external_ordering_platform");
      }
      if (r.needsCateringPage) {
        score += 3;
        flags.push("catering_page_needed");
      }
      if (r.allergenDisclaimerNeeded) {
        score += 3;
        flags.push("allergen_compliance");
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
      if (c.needsServiceAreaPages) {
        score += 8;
        flags.push("service_area_pages");
        if (c.serviceAreaPageCount && c.serviceAreaPageCount > 10) {
          score += 10;
          flags.push("high_service_area_page_count");
        }
      }
      if (c.financingInquiryInterest) {
        score += 5;
        flags.push("financing_inquiry_feature");
      }
    }
  }

  // ── SERVICE BUSINESS TRIGGERS ───────────────────────────────────────
  if (q.websiteType === "service_business") {
    const sb = q.serviceBusinessFields;
    if (sb) {
      if (sb.hasBookingSystem && sb.currentBookingMethod === "none") {
        score += 8;
        flags.push("booking_system_needed");
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

  const complexFeatures = [
    "membership", "portal", "dashboard", "crm",
    "multi-language", "multilingual", "api integration", "custom api",
    "payment", "marketplace", "auction", "real-time", "realtime",
    "live chat", "video", "streaming", "custom app", "mobile app", "native app",
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
    "multilingual", "multi-language", "translation",
    "custom integration", "api", "crm", "erp", "pos", "point of sale",
    "custom design", "from scratch", "complex", "enterprise",
    "white label", "white-label", "franchise", "multiple locations",
    "guaranteed seo", "guaranteed ranking", "first page google",
    "page 1 google", "number one on google",
    "hipaa", "compliance", "legal disclaimer",
    "ada compliant", "accessibility", "wcag",
    "custom app", "mobile app", "native app",
    "blockchain", "nft", "crypto",
  ];
  for (const kw of customKeywords) {
    if (sr.includes(kw)) {
      score += 5;
      flags.push(`special_request_${kw.replace(/[\s\-]+/g, "_")}`);
    }
  }

  // SEO guarantee detection (always flag — we never guarantee rankings)
  const seoGuaranteePatterns = ["guarantee", "guaranteed", "promise", "ensure"];
  const seoKeywords = ["seo", "ranking", "google", "search engine"];
  const hasSeoGuarantee = seoGuaranteePatterns.some((p) => sr.includes(p)) &&
    seoKeywords.some((k) => sr.includes(k));
  if (hasSeoGuarantee && !flags.includes("seo_guarantee_requested")) {
    score += 10;
    flags.push("seo_guarantee_requested");
  }

  // Legal/compliance-sensitive claims
  const legalKeywords = ["hipaa", "pci", "gdpr", "ferpa", "sox"];
  if (legalKeywords.some((k) => sr.includes(k)) && !flags.includes("legal_compliance_requirement")) {
    score += 15;
    flags.push("legal_compliance_requirement");
  }

  // ── COMPETITOR ANALYSIS COMPLEXITY ──────────────────────────────────
  const competitorCount = (q.competitorSites || []).filter((s) => s.url).length;
  if (competitorCount >= 3) {
    score += 3;
  }

  // ── CAP SCORE ───────────────────────────────────────────────────────
  score = Math.min(score, 100);

  // ── DETERMINE CUSTOM QUOTE THRESHOLD ────────────────────────────────
  const criticalFlags = [
    "ecommerce_100_plus_products",
    "platform_migration_required",
    "online_ordering_system",
    "subscription_products",
    "other_business_type",
    "legal_compliance_requirement",
    "seo_guarantee_requested",
    "third_party_ecommerce_platform",
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
  other_business_type: "Non-standard business type (requires admin scoping)",
  high_page_count: "15+ pages requested (large site scope)",
  moderate_page_count: "10-15 pages requested (moderate scope)",
  integration_zapier: "Zapier integration requested",
  integration_webhook: "Webhook integration requested",
  integration_crm: "CRM integration requested",
  integration_hubspot: "HubSpot integration requested",
  integration_salesforce: "Salesforce integration requested",
  integration_custom_api: "Custom API integration requested",
  integration_erp: "ERP integration requested",
  integration_pos: "POS integration requested",
  integration_point_of_sale: "Point of sale integration requested",
  ecommerce_website: "Ecommerce website (requires specialized package)",
  ecommerce_26_50_products: "26-50 products (moderate catalog)",
  ecommerce_51_100_products: "51-100 products (large catalog, needs custom quote)",
  ecommerce_100_plus_products: "100+ products (enterprise catalog, requires custom quote)",
  platform_migration_required: "Platform migration needed (data transfer complexity)",
  subscription_products: "Subscription/recurring products (billing complexity)",
  inventory_system_integration: "Inventory system integration needed",
  worldwide_shipping: "Worldwide shipping (multi-region logistics)",
  automated_tax_handling: "Automated tax calculation integration",
  complex_product_variants: "Complex product variants (6+ options per product)",
  product_photography_needed: "All product photography needed (content creation scope)",
  product_copywriting_needed: "All product descriptions need writing",
  abandoned_cart_email_marketing: "Abandoned cart / email marketing system",
  third_party_ecommerce_platform: "Third-party ecommerce platform (Shopify/WooCommerce)",
  online_ordering_system: "Online ordering system (restaurant)",
  reservation_system: "Reservation system needed",
  external_ordering_platform: "External ordering platform integration",
  catering_page_needed: "Catering/event inquiry page",
  allergen_compliance: "Allergen/dietary disclaimer (compliance)",
  emergency_service_feature: "24/7 emergency service feature",
  service_area_pages: "Service area landing pages (SEO)",
  high_service_area_page_count: "10+ service area pages (large SEO scope)",
  financing_inquiry_feature: "Financing inquiry feature",
  booking_system_needed: "Online booking system needs to be built",
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
  complex_feature_custom_app: "Custom application",
  complex_feature_mobile_app: "Mobile app request",
  complex_feature_native_app: "Native app request",
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
  special_request_guaranteed_seo: "SEO guarantee requested",
  special_request_guaranteed_ranking: "Ranking guarantee requested",
  special_request_first_page_google: "First page Google guarantee",
  special_request_page_1_google: "Page 1 Google guarantee",
  special_request_number_one_on_google: "Number one on Google guarantee",
  special_request_hipaa: "HIPAA compliance mentioned",
  special_request_compliance: "Compliance requirement",
  special_request_legal_disclaimer: "Legal disclaimer requirement",
  special_request_ada_compliant: "ADA compliance mentioned",
  special_request_accessibility: "Accessibility requirement",
  special_request_wcag: "WCAG compliance mentioned",
  special_request_custom_app: "Custom app request",
  special_request_mobile_app: "Mobile app request",
  special_request_native_app: "Native app request",
  special_request_blockchain: "Blockchain/Web3 request",
  special_request_nft: "NFT functionality request",
  special_request_crypto: "Cryptocurrency integration",
  seo_guarantee_requested: "SEO/ranking guarantee requested (we never guarantee rankings)",
  legal_compliance_requirement: "Legal/regulatory compliance requirement (HIPAA, PCI, GDPR, etc.)",
};
