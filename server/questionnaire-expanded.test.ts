import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Expanded Questionnaire Schema Tests
 * ────────────────────────────────────
 * Validates that the submitQuestionnaire Zod schema accepts all 5 website type
 * branches and the new inspiration/competitor analysis fields.
 */

// Mirror the Zod schema from routers.ts for isolated validation testing
const questionnaireSchema = z.object({
  websiteType: z.enum(["service_business", "restaurant", "contractor", "ecommerce", "other"]).optional(),
  brandColors: z.array(z.string()).optional(),
  brandTone: z.enum(["professional", "friendly", "bold", "elegant", "playful"]).optional(),
  targetAudience: z.string().optional(),
  contentPreference: z.enum(["we_write", "customer_provides", "mix"]).optional(),
  inspirationSites: z.array(z.object({
    url: z.string(),
    whatYouLike: z.string(),
    whatYouDislike: z.string(),
  })).optional(),
  competitorSites: z.array(z.object({
    url: z.string(),
    whatYouWantToBeat: z.string(),
    featuresYouWish: z.string(),
  })).optional(),
  serviceBusinessFields: z.object({
    serviceArea: z.string().optional(),
    hasBookingSystem: z.boolean().optional(),
    currentBookingMethod: z.string().optional(),
    servicesOffered: z.string().optional(),
    licensedOrCertified: z.boolean().optional(),
    licenseDetails: z.string().optional(),
  }).optional(),
  restaurantFields: z.object({
    cuisineType: z.string().optional(),
    hasPhysicalLocation: z.boolean().optional(),
    locationCount: z.number().optional(),
    needsOnlineMenu: z.boolean().optional(),
    needsOnlineOrdering: z.boolean().optional(),
    needsReservations: z.boolean().optional(),
    operatingHours: z.string().optional(),
    deliveryPartners: z.string().optional(),
  }).optional(),
  contractorFields: z.object({
    serviceArea: z.string().optional(),
    tradeType: z.string().optional(),
    licensedOrCertified: z.boolean().optional(),
    licenseNumber: z.string().optional(),
    needsQuoteForm: z.boolean().optional(),
    needsBeforeAfterGallery: z.boolean().optional(),
    insuranceInfo: z.string().optional(),
    emergencyService: z.boolean().optional(),
  }).optional(),
  ecommerceFields: z.object({
    productCount: z.string().optional(),
    productCategories: z.string().optional(),
    needsShipping: z.boolean().optional(),
    shippingRegions: z.string().optional(),
    existingPlatform: z.string().optional(),
    needsMigration: z.boolean().optional(),
    hasInventorySystem: z.boolean().optional(),
    paymentMethods: z.string().optional(),
    needsSubscriptions: z.boolean().optional(),
    taxHandling: z.string().optional(),
  }).optional(),
  otherFields: z.object({
    businessDescription: z.string().optional(),
    industryCategory: z.string().optional(),
    uniqueRequirements: z.string().optional(),
  }).optional(),
  mustHaveFeatures: z.array(z.string()).optional(),
  specialRequests: z.string().optional(),
  competitors: z.array(z.string()).optional(),
  inspirationUrls: z.array(z.string()).optional(),
});

describe("Expanded Questionnaire Schema", () => {
  it("accepts legacy flat questionnaire (backward compat)", () => {
    const legacy = {
      brandTone: "professional" as const,
      brandColors: ["#2D5A3D"],
      targetAudience: "Small business owners",
      competitors: ["Acme Corp"],
      contentPreference: "we_write" as const,
      mustHaveFeatures: ["Contact form"],
      inspirationUrls: ["https://example.com"],
      specialRequests: "None",
    };
    const result = questionnaireSchema.safeParse(legacy);
    expect(result.success).toBe(true);
  });

  it("accepts service_business branch with all fields", () => {
    const payload = {
      websiteType: "service_business" as const,
      brandTone: "friendly" as const,
      brandColors: ["#FF6600"],
      targetAudience: "Car owners in Houston",
      contentPreference: "mix" as const,
      inspirationSites: [
        { url: "https://detailing.com", whatYouLike: "Clean layout", whatYouDislike: "Slow loading" },
      ],
      competitorSites: [
        { url: "https://competitor.com", whatYouWantToBeat: "Better photos", featuresYouWish: "Online booking" },
      ],
      serviceBusinessFields: {
        serviceArea: "Greater Houston, TX",
        hasBookingSystem: true,
        currentBookingMethod: "phone",
        servicesOffered: "Interior detailing, Exterior wash, Ceramic coating",
        licensedOrCertified: true,
        licenseDetails: "IDA Certified",
      },
      mustHaveFeatures: ["Contact form", "Photo gallery", "Online booking"],
      specialRequests: "Need before/after gallery",
    };
    const result = questionnaireSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("accepts restaurant branch with all fields", () => {
    const payload = {
      websiteType: "restaurant" as const,
      brandTone: "elegant" as const,
      restaurantFields: {
        cuisineType: "Italian",
        hasPhysicalLocation: true,
        locationCount: 2,
        needsOnlineMenu: true,
        needsOnlineOrdering: true,
        needsReservations: true,
        operatingHours: "Mon-Sat 11am-10pm",
        deliveryPartners: "DoorDash, UberEats",
      },
      mustHaveFeatures: ["Online menu", "Reservations"],
    };
    const result = questionnaireSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("accepts contractor branch with all fields", () => {
    const payload = {
      websiteType: "contractor" as const,
      brandTone: "professional" as const,
      contractorFields: {
        serviceArea: "Dallas-Fort Worth",
        tradeType: "Plumbing",
        licensedOrCertified: true,
        licenseNumber: "TACLA12345C",
        needsQuoteForm: true,
        needsBeforeAfterGallery: true,
        insuranceInfo: "Fully insured and bonded",
        emergencyService: true,
      },
      mustHaveFeatures: ["Quote form", "Before/after gallery"],
    };
    const result = questionnaireSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("accepts ecommerce branch with all fields", () => {
    const payload = {
      websiteType: "ecommerce" as const,
      brandTone: "bold" as const,
      ecommerceFields: {
        productCount: "51-100",
        productCategories: "Jewelry, Accessories",
        needsShipping: true,
        shippingRegions: "Worldwide",
        existingPlatform: "Shopify",
        needsMigration: true,
        hasInventorySystem: true,
        paymentMethods: "Credit card, PayPal, Apple Pay",
        needsSubscriptions: false,
        taxHandling: "Automated",
      },
      mustHaveFeatures: ["Product search", "Wishlist", "Reviews"],
    };
    const result = questionnaireSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("accepts other branch with all fields", () => {
    const payload = {
      websiteType: "other" as const,
      brandTone: "playful" as const,
      otherFields: {
        businessDescription: "We run a nonprofit animal shelter",
        industryCategory: "Nonprofit",
        uniqueRequirements: "Need donation integration and pet adoption listings",
      },
      mustHaveFeatures: ["Donation form", "Pet listings"],
    };
    const result = questionnaireSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("accepts 3 inspiration sites with like/dislike analysis", () => {
    const payload = {
      websiteType: "service_business" as const,
      inspirationSites: [
        { url: "https://site1.com", whatYouLike: "Modern design", whatYouDislike: "Too many popups" },
        { url: "https://site2.com", whatYouLike: "Great photos", whatYouDislike: "Hard to navigate" },
        { url: "https://site3.com", whatYouLike: "Fast loading", whatYouDislike: "Boring colors" },
      ],
    };
    const result = questionnaireSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.inspirationSites).toHaveLength(3);
    }
  });

  it("accepts 3 competitor sites with beat/wish analysis", () => {
    const payload = {
      websiteType: "contractor" as const,
      competitorSites: [
        { url: "https://comp1.com", whatYouWantToBeat: "Better SEO", featuresYouWish: "Live chat" },
        { url: "https://comp2.com", whatYouWantToBeat: "More reviews", featuresYouWish: "Online scheduling" },
        { url: "https://comp3.com", whatYouWantToBeat: "Faster site", featuresYouWish: "Customer portal" },
      ],
    };
    const result = questionnaireSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.competitorSites).toHaveLength(3);
    }
  });

  it("rejects invalid websiteType", () => {
    const payload = {
      websiteType: "invalid_type",
    };
    const result = questionnaireSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects invalid brandTone", () => {
    const payload = {
      brandTone: "aggressive",
    };
    const result = questionnaireSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
