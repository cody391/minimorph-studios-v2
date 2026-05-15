/**
 * B9 — Add-On Fulfillment Truth Gate
 *
 * Tests that:
 * 1. The canonical registry has all required fields for every add-on
 * 2. Elena cannot recommend blocked add-ons (canElenaRecommend === false for blocked)
 * 3. Checkout cannot accept blocked add-ons (canCheckoutPurchase === false for blocked)
 * 4. Generator only receives generatorSupported add-ons
 * 5. Blueprint addOnUpsellFit is fully populated with B9 classification buckets
 * 6. Pricing catalog and fulfillment registry are consistent on shared keys
 * 7. buildAddOnRecords() uses the canonical registry (not the old private map)
 * 8. buildAddOnUpsellFit() builds all 10 required fields
 * 9. lookupAddonFulfillment() returns correct records by ID and fuzzy name
 * 10. All internal_only add-ons have canElenaRecommend === false
 * 11. All blocked add-ons have canCheckoutPurchase === false
 * 12. All blocked add-ons have billingSupported === false or generatorSupported === false
 * 13. Every add-on has non-empty displayName, setupDescription, customerFacingDescription
 * 14. findNonPurchasableAddons() catches blocked items
 * 15. getElenaRecommendableAddons() returns only safe-to-pitch add-ons
 * 16. getGeneratorSupportedAddons() returns only addons generator can embed
 * 17. AddOnRecord built from registry carries all B9 fields
 */

import { describe, it, expect } from "vitest";
import {
  ADDON_FULFILLMENT_REGISTRY,
  lookupAddonFulfillment,
  getElenaRecommendableAddons,
  getCheckoutPurchasableAddons,
  getGeneratorSupportedAddons,
  getBlockedAddons,
  findNonPurchasableAddons,
  type AddonFulfillmentRecord,
} from "../shared/addonFulfillment";
import {
  buildAddOnRecords,
  buildAddOnUpsellFit,
} from "../shared/blueprintTypes";
import { ADDONS } from "../shared/pricing";

// ── Section A: Registry structure ────────────────────────────────────────────

describe("A — Registry structure", () => {
  const records = Object.values(ADDON_FULFILLMENT_REGISTRY);

  it("registry has at least 18 entries", () => {
    expect(records.length).toBeGreaterThanOrEqual(18);
  });

  it("every record has a non-empty id matching its key", () => {
    for (const [key, record] of Object.entries(ADDON_FULFILLMENT_REGISTRY)) {
      expect(record.id).toBe(key);
    }
  });

  it("every record has a non-empty displayName", () => {
    for (const record of records) {
      expect(record.displayName.trim().length).toBeGreaterThan(0);
    }
  });

  it("every record has a non-empty setupDescription", () => {
    for (const record of records) {
      expect(record.setupDescription.trim().length).toBeGreaterThan(0);
    }
  });

  it("every record has a non-empty customerFacingDescription", () => {
    for (const record of records) {
      expect(record.customerFacingDescription.trim().length).toBeGreaterThan(0);
    }
  });

  it("every record has a non-empty buildReportLabel", () => {
    for (const record of records) {
      expect(record.buildReportLabel.trim().length).toBeGreaterThan(0);
    }
  });

  it("every record has a non-empty portalStatusLabel", () => {
    for (const record of records) {
      expect(record.portalStatusLabel.trim().length).toBeGreaterThan(0);
    }
  });

  it("every record has all required boolean fields defined", () => {
    const boolFields: (keyof AddonFulfillmentRecord)[] = [
      "canElenaRecommend", "canCheckoutPurchase", "generatorSupported",
      "billingSupported", "adminSupported", "portalSupported",
      "supportWorkflowSupported", "requiresTeamSetup", "requiresCustomerAction",
      "requiresAdminReview", "requiresCustomQuote",
    ];
    for (const record of records) {
      for (const field of boolFields) {
        expect(typeof record[field]).toBe("boolean");
      }
    }
  });

  it("every record has a valid publicOfferStatus", () => {
    const validStatuses = ["offered", "team_setup", "internal_only", "blocked", "custom_review", "not_supported"];
    for (const record of records) {
      expect(validStatuses).toContain(record.publicOfferStatus);
    }
  });

  it("every record has a valid fulfillmentType", () => {
    const validTypes = ["instant", "team_setup", "customer_action", "admin_review_required", "blocked", "unknown"];
    for (const record of records) {
      expect(validTypes).toContain(record.fulfillmentType);
    }
  });

  it("every record has a valid supportTaskType", () => {
    const validTypes = ["configure_integration", "setup_third_party", "design_asset", "content_production", "review_and_approve", "none"];
    for (const record of records) {
      expect(validTypes).toContain(record.supportTaskType);
    }
  });
});

// ── Section B: Elena guardrail ────────────────────────────────────────────────

describe("B — Elena guardrail (canElenaRecommend)", () => {
  it("internal_only add-ons have canElenaRecommend === false", () => {
    const internalOnly = Object.values(ADDON_FULFILLMENT_REGISTRY)
      .filter(r => r.publicOfferStatus === "internal_only");
    expect(internalOnly.length).toBeGreaterThan(0);
    for (const r of internalOnly) {
      expect(r.canElenaRecommend).toBe(false);
    }
  });

  it("blocked add-ons have canElenaRecommend === false", () => {
    const blocked = Object.values(ADDON_FULFILLMENT_REGISTRY)
      .filter(r => r.publicOfferStatus === "blocked" || r.publicOfferStatus === "not_supported");
    expect(blocked.length).toBeGreaterThan(0);
    for (const r of blocked) {
      expect(r.canElenaRecommend).toBe(false);
    }
  });

  it("online_store is not Elena-recommendable", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.online_store.canElenaRecommend).toBe(false);
  });

  it("event_calendar is not Elena-recommendable", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.event_calendar.canElenaRecommend).toBe(false);
  });

  it("menu_price_list is not Elena-recommendable", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.menu_price_list.canElenaRecommend).toBe(false);
  });

  it("ga4_analytics is not Elena-recommendable (internal_only)", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.ga4_analytics.canElenaRecommend).toBe(false);
  });

  it("facebook_pixel is not Elena-recommendable (internal_only)", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.facebook_pixel.canElenaRecommend).toBe(false);
  });

  it("getElenaRecommendableAddons() contains no blocked or internal_only add-ons", () => {
    const recommendable = getElenaRecommendableAddons();
    expect(recommendable.length).toBeGreaterThan(0);
    for (const r of recommendable) {
      expect(r.publicOfferStatus).not.toBe("blocked");
      expect(r.publicOfferStatus).not.toBe("internal_only");
      expect(r.publicOfferStatus).not.toBe("not_supported");
    }
  });

  it("all Elena-recommendable add-ons have elenaSafePitch set", () => {
    const recommendable = getElenaRecommendableAddons();
    for (const r of recommendable) {
      expect(r.elenaSafePitch).not.toBeNull();
      expect((r.elenaSafePitch as string).trim().length).toBeGreaterThan(0);
    }
  });

  it("all Elena-recommendable add-ons have elenaDoNotSay set", () => {
    const recommendable = getElenaRecommendableAddons();
    for (const r of recommendable) {
      expect(r.elenaDoNotSay).not.toBeNull();
    }
  });

  it("all blocked add-ons have elenaDoNotSay set", () => {
    const blocked = getBlockedAddons();
    for (const r of blocked) {
      expect(r.elenaDoNotSay).not.toBeNull();
    }
  });
});

// ── Section C: Checkout guardrail ─────────────────────────────────────────────

describe("C — Checkout guardrail (canCheckoutPurchase)", () => {
  it("blocked add-ons have canCheckoutPurchase === false", () => {
    const blocked = getBlockedAddons();
    expect(blocked.length).toBeGreaterThan(0);
    for (const r of blocked) {
      expect(r.canCheckoutPurchase).toBe(false);
    }
  });

  it("internal_only add-ons have canCheckoutPurchase === false", () => {
    const internalOnly = Object.values(ADDON_FULFILLMENT_REGISTRY)
      .filter(r => r.publicOfferStatus === "internal_only");
    for (const r of internalOnly) {
      expect(r.canCheckoutPurchase).toBe(false);
    }
  });

  it("online_store is not checkout-purchasable", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.online_store.canCheckoutPurchase).toBe(false);
  });

  it("getCheckoutPurchasableAddons() returns no blocked add-ons", () => {
    const purchasable = getCheckoutPurchasableAddons();
    expect(purchasable.length).toBeGreaterThan(0);
    for (const r of purchasable) {
      expect(r.publicOfferStatus).not.toBe("blocked");
      expect(r.publicOfferStatus).not.toBe("internal_only");
    }
  });

  it("findNonPurchasableAddons() flags online_store", () => {
    const result = findNonPurchasableAddons(["online_store"]);
    expect(result.length).toBe(1);
    expect(result[0].product).toBe("online_store");
    expect(result[0].reason.length).toBeGreaterThan(0);
  });

  it("findNonPurchasableAddons() flags event_calendar", () => {
    const result = findNonPurchasableAddons(["event_calendar"]);
    expect(result.length).toBe(1);
  });

  it("findNonPurchasableAddons() flags menu_price_list", () => {
    const result = findNonPurchasableAddons(["menu_price_list"]);
    expect(result.length).toBe(1);
  });

  it("findNonPurchasableAddons() flags unknown add-ons", () => {
    const result = findNonPurchasableAddons(["mystery_addon_xyz"]);
    expect(result.length).toBe(1);
    expect(result[0].reason).toContain("Unknown");
  });

  it("findNonPurchasableAddons() passes valid add-ons through", () => {
    const result = findNonPurchasableAddons(["review_collector", "seo_autopilot", "booking_widget"]);
    expect(result.length).toBe(0);
  });

  it("findNonPurchasableAddons() catches mixed valid+blocked", () => {
    const result = findNonPurchasableAddons(["review_collector", "online_store"]);
    expect(result.length).toBe(1);
    expect(result[0].product).toBe("online_store");
  });
});

// ── Section D: Generator filter ──────────────────────────────────────────────

describe("D — Generator filter (generatorSupported)", () => {
  it("getGeneratorSupportedAddons() returns at least one add-on", () => {
    const gen = getGeneratorSupportedAddons();
    expect(gen.length).toBeGreaterThan(0);
  });

  it("ai_chatbot is generator-supported", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.ai_chatbot.generatorSupported).toBe(true);
  });

  it("booking_widget is generator-supported", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.booking_widget.generatorSupported).toBe(true);
  });

  it("social_feed_embed is generator-supported", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.social_feed_embed.generatorSupported).toBe(true);
  });

  it("online_store is NOT generator-supported", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.online_store.generatorSupported).toBe(false);
  });

  it("seo_autopilot is NOT generator-supported (team setup post-launch)", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.seo_autopilot.generatorSupported).toBe(false);
  });

  it("review_collector is NOT generator-supported (team setup post-launch)", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.review_collector.generatorSupported).toBe(false);
  });

  it("ga4_analytics IS generator-supported (auto-embedded)", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.ga4_analytics.generatorSupported).toBe(true);
  });

  it("facebook_pixel IS generator-supported (auto-embedded)", () => {
    expect(ADDON_FULFILLMENT_REGISTRY.facebook_pixel.generatorSupported).toBe(true);
  });
});

// ── Section E: Lookup helpers ─────────────────────────────────────────────────

describe("E — lookupAddonFulfillment()", () => {
  it("finds by exact ID", () => {
    expect(lookupAddonFulfillment("review_collector")).not.toBeNull();
    expect(lookupAddonFulfillment("review_collector")?.id).toBe("review_collector");
  });

  it("finds by fuzzy display name", () => {
    const r = lookupAddonFulfillment("Review Collector");
    expect(r).not.toBeNull();
    expect(r?.id).toBe("review_collector");
  });

  it("finds seo_autopilot by name variant", () => {
    const r = lookupAddonFulfillment("SEO Autopilot");
    expect(r).not.toBeNull();
    expect(r?.id).toBe("seo_autopilot");
  });

  it("finds booking_widget by display name", () => {
    const r = lookupAddonFulfillment("Booking Widget");
    expect(r).not.toBeNull();
    expect(r?.id).toBe("booking_widget");
  });

  it("returns null for unknown add-on", () => {
    expect(lookupAddonFulfillment("mystery_thing_xyz_999")).toBeNull();
  });

  it("finds online_store (blocked)", () => {
    const r = lookupAddonFulfillment("online_store");
    expect(r).not.toBeNull();
    expect(r?.canElenaRecommend).toBe(false);
    expect(r?.canCheckoutPurchase).toBe(false);
  });
});

// ── Section F: buildAddOnRecords() ───────────────────────────────────────────

describe("F — buildAddOnRecords() uses canonical registry", () => {
  it("returns AddOnRecord with B9 fields populated", () => {
    const records = buildAddOnRecords([{ product: "review_collector", price: "$149/mo" }], "accepted");
    expect(records.length).toBe(1);
    const r = records[0];
    expect(r.canElenaRecommend).toBe(true);
    expect(r.canCheckoutPurchase).toBe(true);
    expect(r.publicOfferStatus).toBe("team_setup");
    expect(r.buildReportLabel).toBeTruthy();
    expect(r.portalStatusLabel).toBeTruthy();
    expect(r.blockedReason).toBeNull();
  });

  it("blocked add-on gets correct B9 fields", () => {
    const records = buildAddOnRecords([{ product: "online_store" }], "accepted");
    expect(records.length).toBe(1);
    const r = records[0];
    expect(r.canElenaRecommend).toBe(false);
    expect(r.canCheckoutPurchase).toBe(false);
    expect(r.publicOfferStatus).toBe("blocked");
    expect(r.blockedReason).not.toBeNull();
  });

  it("unknown add-on falls back gracefully (canElenaRecommend false)", () => {
    const records = buildAddOnRecords([{ product: "mystery_widget" }], "accepted");
    expect(records.length).toBe(1);
    expect(records[0].canElenaRecommend).toBe(false);
    expect(records[0].canCheckoutPurchase).toBe(false);
    expect(records[0].publicOfferStatus).toBe("not_supported");
  });

  it("booking_widget gets customer_action fulfillmentType", () => {
    const records = buildAddOnRecords([{ product: "booking_widget" }], "accepted");
    expect(records[0].fulfillmentType).toBe("customer_action");
    expect(records[0].generatorSupported).toBe(true);
    expect(records[0].canAppearOnGeneratedSite).toBe(true);
  });

  it("seo_autopilot gets team_setup fulfillmentType", () => {
    const records = buildAddOnRecords([{ product: "seo_autopilot" }], "accepted");
    expect(records[0].fulfillmentType).toBe("team_setup");
    expect(records[0].generatorSupported).toBe(false);
  });
});

// ── Section G: buildAddOnUpsellFit() ─────────────────────────────────────────

describe("G — buildAddOnUpsellFit() builds all B9 fields", () => {
  const accepted = buildAddOnRecords([
    { product: "review_collector" },
    { product: "booking_widget" },
    { product: "seo_autopilot" },
    { product: "online_store" },
  ], "accepted");

  const fit = buildAddOnUpsellFit(accepted, [], [], ["elena_onboarding"]);

  it("has all 14 required top-level keys", () => {
    expect(fit).toHaveProperty("recommendedAddOns");
    expect(fit).toHaveProperty("acceptedAddOns");
    expect(fit).toHaveProperty("declinedAddOns");
    expect(fit).toHaveProperty("addOnsRequiringReview");
    expect(fit).toHaveProperty("sourceNotes");
    expect(fit).toHaveProperty("addOnsTeamSetup");
    expect(fit).toHaveProperty("addOnsCustomerAction");
    expect(fit).toHaveProperty("addOnsBlocked");
    expect(fit).toHaveProperty("addOnsNotSupported");
    expect(fit).toHaveProperty("fulfillmentSummary");
    expect(fit).toHaveProperty("billingSummary");
    expect(fit).toHaveProperty("generatorSummary");
    expect(fit).toHaveProperty("portalSummary");
    expect(fit).toHaveProperty("supportTasksNeeded");
  });

  it("correctly classifies team_setup add-ons", () => {
    expect(fit.addOnsTeamSetup.length).toBeGreaterThanOrEqual(2);
    const ids = fit.addOnsTeamSetup.map(r => r.product);
    expect(ids).toContain("review_collector");
    expect(ids).toContain("seo_autopilot");
  });

  it("correctly classifies customer_action add-ons", () => {
    expect(fit.addOnsCustomerAction.length).toBeGreaterThanOrEqual(1);
    expect(fit.addOnsCustomerAction.map(r => r.product)).toContain("booking_widget");
  });

  it("correctly classifies blocked add-ons", () => {
    expect(fit.addOnsBlocked.length).toBeGreaterThanOrEqual(1);
    expect(fit.addOnsBlocked.map(r => r.product)).toContain("online_store");
  });

  it("fulfillmentSummary.total matches accepted count", () => {
    expect(fit.fulfillmentSummary.total).toBe(4);
  });

  it("billingSummary.billingSupported counts correctly", () => {
    // review_collector, booking_widget, seo_autopilot → billing supported
    // online_store → billing NOT supported (blocked)
    expect(fit.billingSummary.billingSupported).toBeGreaterThanOrEqual(3);
  });

  it("generatorSummary.generatorSupported counts correctly", () => {
    // booking_widget → generator supported
    // review_collector, seo_autopilot, online_store → not generator supported
    expect(fit.generatorSummary.generatorSupported).toBeGreaterThanOrEqual(1);
  });

  it("supportTasksNeeded is populated for team_setup add-ons", () => {
    expect(fit.supportTasksNeeded.length).toBeGreaterThan(0);
  });

  it("sourceNotes is preserved", () => {
    expect(fit.sourceNotes).toContain("elena_onboarding");
  });
});

// ── Section H: Pricing catalog consistency ────────────────────────────────────

describe("H — Pricing catalog / registry consistency", () => {
  const pricingKeys = Object.keys(ADDONS);
  const registryKeys = Object.keys(ADDON_FULFILLMENT_REGISTRY);

  it("every pricing catalog key has a matching registry entry", () => {
    for (const key of pricingKeys) {
      expect(registryKeys).toContain(key);
    }
  });

  it("every pricing-catalog add-on has billingSupported === true in registry", () => {
    for (const key of pricingKeys) {
      const rec = ADDON_FULFILLMENT_REGISTRY[key];
      if (rec) {
        expect(rec.billingSupported).toBe(true);
      }
    }
  });
});

// ── Section I: Blocked add-on data integrity ──────────────────────────────────

describe("I — Blocked add-on data integrity", () => {
  it("all blocked add-ons have a non-empty blockedReason", () => {
    const blocked = getBlockedAddons();
    for (const r of blocked) {
      expect(r.blockedReason).not.toBeNull();
      expect((r.blockedReason as string).trim().length).toBeGreaterThan(0);
    }
  });

  it("event_calendar is fully blocked", () => {
    const r = ADDON_FULFILLMENT_REGISTRY.event_calendar;
    expect(r.canElenaRecommend).toBe(false);
    expect(r.canCheckoutPurchase).toBe(false);
    expect(r.generatorSupported).toBe(false);
    expect(r.billingSupported).toBe(false);
    expect(r.publicOfferStatus).toBe("blocked");
    expect(r.fulfillmentType).toBe("blocked");
  });

  it("menu_price_list is fully blocked", () => {
    const r = ADDON_FULFILLMENT_REGISTRY.menu_price_list;
    expect(r.canElenaRecommend).toBe(false);
    expect(r.canCheckoutPurchase).toBe(false);
    expect(r.billingSupported).toBe(false);
    expect(r.publicOfferStatus).toBe("blocked");
  });

  it("online_store is blocked for Elena and checkout (B2 open)", () => {
    const r = ADDON_FULFILLMENT_REGISTRY.online_store;
    expect(r.canElenaRecommend).toBe(false);
    expect(r.canCheckoutPurchase).toBe(false);
    expect(r.blockedReason).toContain("B2");
  });

  it("priority_support is not_supported (not a purchasable add-on)", () => {
    const r = ADDON_FULFILLMENT_REGISTRY.priority_support;
    expect(r.publicOfferStatus).toBe("not_supported");
    expect(r.canCheckoutPurchase).toBe(false);
    expect(r.canElenaRecommend).toBe(false);
  });
});

// ── Section J: Internal-only add-ons ─────────────────────────────────────────

describe("J — Internal-only add-ons", () => {
  it("ga4_analytics is internal_only and not billable", () => {
    const r = ADDON_FULFILLMENT_REGISTRY.ga4_analytics;
    expect(r.publicOfferStatus).toBe("internal_only");
    expect(r.billingSupported).toBe(false);
    expect(r.canCheckoutPurchase).toBe(false);
    expect(r.generatorSupported).toBe(true);
    expect(r.fulfillmentType).toBe("instant");
  });

  it("facebook_pixel is internal_only and not billable", () => {
    const r = ADDON_FULFILLMENT_REGISTRY.facebook_pixel;
    expect(r.publicOfferStatus).toBe("internal_only");
    expect(r.billingSupported).toBe(false);
    expect(r.canCheckoutPurchase).toBe(false);
    expect(r.generatorSupported).toBe(true);
    expect(r.fulfillmentType).toBe("instant");
  });
});

// ── Section K: Team-setup add-ons ────────────────────────────────────────────

describe("K — Team-setup add-ons", () => {
  const teamSetupIds = ["review_collector", "seo_autopilot", "competitor_monitoring",
    "lead_capture_bot", "sms_alerts", "email_marketing_setup",
    "logo_design", "brand_style_guide", "professional_copywriting",
    "ai_chatbot", "ai_photography", "video_background"];

  for (const id of teamSetupIds) {
    it(`${id} has requiresTeamSetup === true`, () => {
      expect(ADDON_FULFILLMENT_REGISTRY[id].requiresTeamSetup).toBe(true);
    });

    it(`${id} has supportWorkflowSupported === true`, () => {
      expect(ADDON_FULFILLMENT_REGISTRY[id].supportWorkflowSupported).toBe(true);
    });
  }
});

// ── Section L: Customer-action add-ons ───────────────────────────────────────

describe("L — Customer-action add-ons", () => {
  const customerActionIds = ["booking_widget", "social_feed_embed"];

  for (const id of customerActionIds) {
    it(`${id} has requiresCustomerAction === true`, () => {
      expect(ADDON_FULFILLMENT_REGISTRY[id].requiresCustomerAction).toBe(true);
    });

    it(`${id} has generatorSupported === true (embeds a placeholder)`, () => {
      expect(ADDON_FULFILLMENT_REGISTRY[id].generatorSupported).toBe(true);
    });

    it(`${id} has canCheckoutPurchase === true`, () => {
      expect(ADDON_FULFILLMENT_REGISTRY[id].canCheckoutPurchase).toBe(true);
    });
  }
});

// ── Section M: Logical consistency invariants ─────────────────────────────────

describe("M — Logical consistency invariants", () => {
  it("canElenaRecommend true → canCheckoutPurchase true", () => {
    const records = Object.values(ADDON_FULFILLMENT_REGISTRY);
    for (const r of records) {
      if (r.canElenaRecommend) {
        expect(r.canCheckoutPurchase).toBe(true);
      }
    }
  });

  it("canCheckoutPurchase true → billingSupported true", () => {
    const records = Object.values(ADDON_FULFILLMENT_REGISTRY);
    for (const r of records) {
      if (r.canCheckoutPurchase) {
        expect(r.billingSupported).toBe(true);
      }
    }
  });

  it("fulfillmentType blocked → publicOfferStatus blocked or not_supported", () => {
    const records = Object.values(ADDON_FULFILLMENT_REGISTRY);
    for (const r of records) {
      if (r.fulfillmentType === "blocked") {
        expect(["blocked", "not_supported"]).toContain(r.publicOfferStatus);
      }
    }
  });

  it("requiresTeamSetup true → fulfillmentType is team_setup", () => {
    const records = Object.values(ADDON_FULFILLMENT_REGISTRY);
    for (const r of records) {
      if (r.requiresTeamSetup) {
        expect(r.fulfillmentType).toBe("team_setup");
      }
    }
  });

  it("requiresCustomerAction true → fulfillmentType is customer_action", () => {
    const records = Object.values(ADDON_FULFILLMENT_REGISTRY);
    for (const r of records) {
      if (r.requiresCustomerAction) {
        expect(r.fulfillmentType).toBe("customer_action");
      }
    }
  });
});
