/**
 * Expanded onboarding questionnaire schema
 * ─────────────────────────────────────────
 * Website type selector → universal business & brand questions → inspiration/competitor analysis
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

// ── Universal business fields (collected in Step 2) ────────────────────────
export interface UniversalBusinessFields {
  businessDisplayName: string;       // Public-facing business name
  legalBusinessName: string;         // Legal entity name if different
  industry: string;                  // e.g. "Auto Detailing", "Italian Restaurant"
  locationOrServiceArea: string;     // e.g. "Muskegon, MI" or "Greater Grand Rapids area"
  primaryWebsiteGoal: string;        // "generate_leads" | "sell_products" | "inform_customers" | "build_brand" | "bookings"
  preferredContactMethod: string;    // "phone" | "email" | "form" | "text" | "chat"
  hasLogo: boolean;                  // Do they have a logo?
  logoNotes: string;                 // "Need one designed" or "Will upload"
  domainStatus: string;              // "have_domain" | "need_domain" | "not_sure"
  existingDomain: string;            // Current domain if any
  socialLinks: string;               // Comma-separated social URLs
  googleBusinessProfile: string;     // "have_claimed" | "have_unclaimed" | "none" | "not_sure"
  currentWebsiteUrl: string;         // Existing website URL if any
  pagesNeeded: string;               // e.g. "Home, About, Services, Contact, Gallery"
  integrationsRequested: string;     // Freeform: "Google Analytics, booking system, review widget"
  stylePreference: string;           // "modern_minimal" | "bold_colorful" | "classic_elegant" | "rustic_warm" | "dark_moody"
}

// ── Industry-specific: Service Business ────────────────────────────────────
export interface ServiceBusinessFields {
  serviceArea: string;               // e.g. "Greater Austin, TX"
  hasBookingSystem: boolean;         // Do they need online booking?
  currentBookingMethod: string;      // "phone", "walk-in", "third-party app", etc.
  servicesOffered: string;           // Comma-separated list
  licensedOrCertified: boolean;
  licenseDetails: string;            // Which licenses/certifications to display
  pricingDisplayPreference: string;  // "show_prices" | "request_quote" | "range" | "hidden"
  needsBeforeAfterGallery: boolean;  // Before/after project gallery
  hasReviewsOrTestimonials: boolean; // Do they have existing reviews to showcase?
  reviewSources: string;             // "google" | "yelp" | "facebook" | "none"
}

// ── Industry-specific: Restaurant ──────────────────────────────────────────
export interface RestaurantFields {
  cuisineType: string;               // e.g. "Italian", "Mexican", "BBQ"
  hasPhysicalLocation: boolean;
  locationCount: number;             // How many locations
  needsOnlineMenu: boolean;
  needsOnlineOrdering: boolean;
  needsReservations: boolean;
  operatingHours: string;            // e.g. "Mon-Sat 11am-10pm"
  deliveryPartners: string;          // e.g. "DoorDash, UberEats"
  externalOrderingLink: string;      // Toast, Square, ChowNow, etc. URL
  orderingPlatform: string;          // "toast" | "square" | "chownow" | "grubhub" | "none" | "other"
  needsCateringPage: boolean;        // Catering/event inquiry page
  allergenDisclaimerNeeded: boolean; // Allergen/dietary disclaimer
  hasMenuPhotos: boolean;            // Do they have food photography?
  menuFormat: string;                // "pdf_upload" | "typed_list" | "photo_only" | "we_design"
}

// ── Industry-specific: Contractor ──────────────────────────────────────────
export interface ContractorFields {
  serviceArea: string;               // e.g. "Dallas-Fort Worth metro"
  tradeType: string;                 // e.g. "Plumbing", "HVAC", "General Contractor"
  licensedOrCertified: boolean;
  licenseNumber: string;
  needsQuoteForm: boolean;
  needsBeforeAfterGallery: boolean;
  insuranceInfo: string;             // e.g. "Fully insured and bonded"
  emergencyService: boolean;         // 24/7 emergency service?
  needsServiceAreaPages: boolean;    // Individual pages per service area
  serviceAreaPageCount: number;      // How many service area pages
  financingInquiryInterest: boolean; // Offer financing inquiry on site?
  trustBadgesNeeded: boolean;        // BBB, HomeAdvisor, Angi, etc.
  reviewSourcesUsed: string;         // "google" | "homeadvisor" | "angi" | "bbb" | "yelp"
}

// ── Industry-specific: Ecommerce ───────────────────────────────────────────
export interface EcommerceFields {
  productCount: string;              // "1-10", "11-25", "26-50", "51-100", "100+"
  productCategories: string;         // Comma-separated
  needsShipping: boolean;
  shippingRegions: string;           // "US only", "North America", "Worldwide"
  existingPlatform: string;          // "None", "Shopify", "WooCommerce", "Etsy", etc.
  needsMigration: boolean;           // Migrating from existing platform?
  hasInventorySystem: boolean;
  paymentMethods: string;            // "Credit card, PayPal, Apple Pay"
  needsSubscriptions: boolean;       // Subscription/recurring products?
  taxHandling: string;               // "Manual", "Automated (e.g. TaxJar)", "Not sure"
  hasProductVariants: boolean;       // Size, color, material options?
  variantComplexity: string;         // "simple" (1-2 options) | "moderate" (3-5) | "complex" (6+)
  productPhotosStatus: string;       // "have_all" | "have_some" | "need_all"
  productDescriptionsStatus: string; // "have_all" | "have_some" | "need_written"
  returnRefundPolicy: string;        // "have_policy" | "need_help" | "no_returns"
  platformPreference: string;        // "shopify" | "woocommerce" | "square" | "stripe_links" | "custom_catalog" | "not_sure"
  orderSupportExpectation: string;   // "self_manage" | "need_help" | "not_sure"
  abandonedCartInterest: boolean;    // Abandoned cart / email marketing?
  productReviewsNeeded: boolean;     // Product review system?
}

// ── Industry-specific: Other ───────────────────────────────────────────────
export interface OtherFields {
  businessDescription: string;       // Freeform description
  industryCategory: string;          // What industry are they in?
  uniqueRequirements: string;        // What makes their business different?
  // Note: "other" type auto-flags for admin review in quoteEngine
}

// ── Full questionnaire shape ───────────────────────────────────────────────
export interface ExpandedQuestionnaire {
  // Step 1: Website type
  websiteType: WebsiteType;

  // Step 2: Universal business & brand questions
  universalFields?: UniversalBusinessFields;
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
  { id: 2, label: "Your Business", description: "Tell us about your business and brand" },
  { id: 3, label: "Inspiration & Competitors", description: "Websites you love and want to beat" },
  { id: 4, label: "Industry Details", description: "Questions specific to your business type" },
  { id: 5, label: "Features & Extras", description: "Must-haves and special requests" },
] as const;
