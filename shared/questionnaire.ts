/**
 * Expanded onboarding questionnaire schema
 * ─────────────────────────────────────────
 * Website type selector → universal brand questions → inspiration/competitor analysis
 * → industry-specific branch → must-have features + special requests
 *
 * Stored as a JSON blob in onboarding_projects.questionnaire
 */

// ── Website type enum ──────────────────────────────────────────────────────
export const WEBSITE_TYPES = [
  "service_business",
  "restaurant",
  "contractor",
  "ecommerce",
  "other",
] as const;
export type WebsiteType = (typeof WEBSITE_TYPES)[number];

export const WEBSITE_TYPE_LABELS: Record<WebsiteType, string> = {
  service_business: "Service Business",
  restaurant: "Restaurant / Food & Beverage",
  contractor: "Contractor / Home Services",
  ecommerce: "E-Commerce / Online Store",
  other: "Other",
};

export const WEBSITE_TYPE_DESCRIPTIONS: Record<WebsiteType, string> = {
  service_business: "Auto detailing, salons, fitness studios, cleaning services, etc.",
  restaurant: "Restaurants, cafes, bakeries, food trucks, catering, bars",
  contractor: "Plumbing, HVAC, roofing, landscaping, electrical, painting",
  ecommerce: "Online stores selling physical or digital products",
  other: "Anything else — we'll customize the questions for you",
};

export const WEBSITE_TYPE_ICONS: Record<WebsiteType, string> = {
  service_business: "Briefcase",
  restaurant: "UtensilsCrossed",
  contractor: "Hammer",
  ecommerce: "ShoppingCart",
  other: "Sparkles",
};

// ── Brand tone options ─────────────────────────────────────────────────────
export const BRAND_TONES = [
  "professional",
  "friendly",
  "bold",
  "elegant",
  "playful",
] as const;
export type BrandTone = (typeof BRAND_TONES)[number];

// ── Content preference options ─────────────────────────────────────────────
export const CONTENT_PREFERENCES = [
  "we_write",
  "customer_provides",
  "mix",
] as const;
export type ContentPreference = (typeof CONTENT_PREFERENCES)[number];

// ── Inspiration site entry ─────────────────────────────────────────────────
export interface InspirationSite {
  url: string;
  whatYouLike: string;
  whatYouDislike: string;
}

// ── Competitor site entry ──────────────────────────────────────────────────
export interface CompetitorSite {
  url: string;
  whatYouWantToBeat: string;
  featuresYouWish: string;
}

// ── Industry-specific: Service Business ────────────────────────────────────
export interface ServiceBusinessFields {
  serviceArea: string;           // e.g. "Greater Austin, TX"
  hasBookingSystem: boolean;     // Do they need online booking?
  currentBookingMethod: string;  // "phone", "walk-in", "third-party app", etc.
  servicesOffered: string;       // Comma-separated list
  licensedOrCertified: boolean;
  licenseDetails: string;        // Which licenses/certifications to display
}

// ── Industry-specific: Restaurant ──────────────────────────────────────────
export interface RestaurantFields {
  cuisineType: string;           // e.g. "Italian", "Mexican", "BBQ"
  hasPhysicalLocation: boolean;
  locationCount: number;         // How many locations
  needsOnlineMenu: boolean;
  needsOnlineOrdering: boolean;
  needsReservations: boolean;
  operatingHours: string;        // e.g. "Mon-Sat 11am-10pm"
  deliveryPartners: string;      // e.g. "DoorDash, UberEats"
}

// ── Industry-specific: Contractor ──────────────────────────────────────────
export interface ContractorFields {
  serviceArea: string;           // e.g. "Dallas-Fort Worth metro"
  tradeType: string;             // e.g. "Plumbing", "HVAC", "General Contractor"
  licensedOrCertified: boolean;
  licenseNumber: string;
  needsQuoteForm: boolean;
  needsBeforeAfterGallery: boolean;
  insuranceInfo: string;         // e.g. "Fully insured and bonded"
  emergencyService: boolean;     // 24/7 emergency service?
}

// ── Industry-specific: Ecommerce ───────────────────────────────────────────
export interface EcommerceFields {
  productCount: string;          // "1-10", "11-25", "26-50", "51-100", "100+"
  productCategories: string;     // Comma-separated
  needsShipping: boolean;
  shippingRegions: string;       // "US only", "North America", "Worldwide"
  existingPlatform: string;      // "None", "Shopify", "WooCommerce", "Etsy", etc.
  needsMigration: boolean;       // Migrating from existing platform?
  hasInventorySystem: boolean;
  paymentMethods: string;        // "Credit card, PayPal, Apple Pay"
  needsSubscriptions: boolean;   // Subscription/recurring products?
  taxHandling: string;           // "Manual", "Automated (e.g. TaxJar)", "Not sure"
}

// ── Industry-specific: Other ───────────────────────────────────────────────
export interface OtherFields {
  businessDescription: string;   // Freeform description
  industryCategory: string;      // What industry are they in?
  uniqueRequirements: string;    // What makes their business different?
}

// ── Full questionnaire shape ───────────────────────────────────────────────
export interface ExpandedQuestionnaire {
  // Step 1: Website type
  websiteType: WebsiteType;

  // Step 2: Universal brand questions
  brandTone: BrandTone;
  brandColors: string[];
  targetAudience: string;
  contentPreference: ContentPreference;

  // Step 3: Inspiration & competitor analysis
  inspirationSites: InspirationSite[];
  competitorSites: CompetitorSite[];

  // Step 4: Industry-specific (only one branch populated)
  serviceBusinessFields?: ServiceBusinessFields;
  restaurantFields?: RestaurantFields;
  contractorFields?: ContractorFields;
  ecommerceFields?: EcommerceFields;
  otherFields?: OtherFields;

  // Step 5: Features & special requests
  mustHaveFeatures: string[];
  specialRequests: string;

  // Legacy compat: old flat fields still accepted
  competitors?: string[];
  inspirationUrls?: string[];
}

// ── Questionnaire step labels ──────────────────────────────────────────────
export const QUESTIONNAIRE_STEPS = [
  { id: 1, label: "Website Type", description: "What kind of website do you need?" },
  { id: 2, label: "Brand & Audience", description: "Tell us about your brand identity" },
  { id: 3, label: "Inspiration & Competitors", description: "Websites you love and want to beat" },
  { id: 4, label: "Industry Details", description: "Questions specific to your business type" },
  { id: 5, label: "Features & Extras", description: "Must-haves and special requests" },
] as const;
