import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  longtext,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

/* ═══════════════════════════════════════════════════════
   USERS — Core auth table (extended with rep fields)
   ═══════════════════════════════════════════════════════ */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  needsStripeConnect: boolean("needsStripeConnect").default(false).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REPS — Sales representatives
   ═══════════════════════════════════════════════════════ */
export const reps = mysqlTable("reps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  status: mysqlEnum("status", ["applied", "onboarding", "training", "certified", "active", "suspended", "inactive"])
    .default("applied")
    .notNull(),
  trainingProgress: int("trainingProgress").default(0).notNull(), // 0-100
  certifiedAt: timestamp("certifiedAt"),
  performanceScore: decimal("performanceScore", { precision: 5, scale: 2 }).default("0.00"),
  totalDeals: int("totalDeals").default(0).notNull(),
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0.00"),
  bio: text("bio"),
  referralCode: varchar("referralCode", { length: 32 }),
  profilePhotoUrl: varchar("profilePhotoUrl", { length: 512 }),
  stripeConnectAccountId: varchar("stripeConnectAccountId", { length: 128 }),
  stripeConnectOnboarded: boolean("stripeConnectOnboarded").default(false),
  paperworkCompletedAt: timestamp("paperworkCompletedAt"),
  assignedPhoneNumber: varchar("assignedPhoneNumber", { length: 32 }),
  voicemailMessage: text("voicemailMessage"),
  lastTrainingCompletedAt: timestamp("lastTrainingCompletedAt"),
  trainingRequiredToday: boolean("trainingRequiredToday").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Rep = typeof reps.$inferSelect;
export type InsertRep = typeof reps.$inferInsert;

/* ═══════════════════════════════════════════════════════
   LEADS — Prospective customers
   ═══════════════════════════════════════════════════════ */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  industry: varchar("industry", { length: 128 }),
  website: varchar("website", { length: 512 }),
  source: mysqlEnum("source", ["ai_sourced", "website_form", "referral", "manual", "website_popup"])
    .default("ai_sourced")
    .notNull(),
  temperature: mysqlEnum("temperature", ["cold", "warm", "hot"])
    .default("cold")
    .notNull(),
  qualificationScore: int("qualificationScore").default(0).notNull(), // 0-100
  stage: mysqlEnum("stage", [
    "new",
    "enriched",
    "warming",
    "warm",
    "assigned",
    "contacted",
    "proposal_sent",
    "negotiating",
    "closed_won",
    "closed_lost",
  ])
    .default("new")
    .notNull(),
  assignedRepId: int("assignedRepId"),
  notes: text("notes"),
  enrichmentData: json("enrichmentData"),
  lastTouchAt: timestamp("lastTouchAt"),
  selfSourced: boolean("selfSourced").default(false).notNull(),
  discountPercent: int("discountPercent").default(0).notNull(), // 0-5% rep discount
  smsOptIn: boolean("smsOptIn").default(false).notNull(),
  smsOptInAt: timestamp("smsOptInAt"),
  smsOptInMethod: mysqlEnum("smsOptInMethod", ["verbal_consent", "form_submission", "reply_start", "manual"]),
  smsOptedOut: boolean("smsOptedOut").default(false).notNull(),
  smsOptOutAt: timestamp("smsOptOutAt"),
  smsFirstMessageSent: boolean("smsFirstMessageSent").default(false).notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  intelligenceCard: json("intelligenceCard"),
  checkoutSentAt: timestamp("checkoutSentAt"),
  checkoutUrl: varchar("checkoutUrl", { length: 512 }),
  selfClosed: boolean("selfClosed").default(false).notNull(),
  excludedReason: varchar("excludedReason", { length: 100 }),
  totalCostCents: int("totalCostCents").default(0).notNull(),
  totalRevenueCents: int("totalRevenueCents").default(0).notNull(),
  lastCostUpdate: timestamp("lastCostUpdate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/* ═══════════════════════════════════════════════════════
   CUSTOMERS — Converted leads with active accounts
   ═══════════════════════════════════════════════════════ */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  leadId: int("leadId"),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  industry: varchar("industry", { length: 128 }),
  website: varchar("website", { length: 512 }),
  healthScore: int("healthScore").default(100).notNull(), // 0-100
  status: mysqlEnum("status", ["active", "at_risk", "churned"])
    .default("active")
    .notNull(),
  totalLifetimeCostCents: int("totalLifetimeCostCents").default(0).notNull(),
  totalLifetimeRevenueCents: int("totalLifetimeRevenueCents").default(0).notNull(),
  lastEconomicsUpdate: timestamp("lastEconomicsUpdate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/* ═══════════════════════════════════════════════════════
   CONTRACTS — 12-month service agreements
   ═══════════════════════════════════════════════════════ */
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  repId: int("repId").notNull(),
  packageTier: mysqlEnum("packageTier", ["starter", "growth", "premium", "enterprise"]).notNull(),
  monthlyPrice: decimal("monthlyPrice", { precision: 8, scale: 2 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["pending_payment", "active", "expiring_soon", "expired", "renewed", "cancelled"])
    .default("active")
    .notNull(),
  renewalStatus: mysqlEnum("renewalStatus", ["not_started", "nurturing", "proposed", "accepted", "declined"])
    .default("not_started")
    .notNull(),
  websitePages: int("websitePages").default(5).notNull(),
  features: json("features"),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  notes: text("notes"),
  contractText: longtext("contractText"),
  contractSignedAt: timestamp("contractSignedAt"),
  contractSignedIp: varchar("contractSignedIp", { length: 64 }),
  contractSignedUserAgent: varchar("contractSignedUserAgent", { length: 500 }),
  pdfUrl: varchar("pdfUrl", { length: 512 }),
  nurturingActive: boolean("nurturingActive").default(false).notNull(),
  anniversaryDay: int("anniversaryDay"),
  contractEndDate: timestamp("contractEndDate"),
  autoRenew: boolean("autoRenew").default(true).notNull(),
  originalPriceCents: int("originalPriceCents"),
  effectivePriceCents: int("effectivePriceCents"),
  contractDiscountPercent: decimal("contractDiscountPercent", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/* ═══════════════════════════════════════════════════════
   COMMISSIONS — Rep payouts per deal
   ═══════════════════════════════════════════════════════ */
export const commissions = mysqlTable("commissions", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  contractId: int("contractId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["initial_sale", "renewal", "upsell", "referral_bonus", "recurring_monthly"]).default("initial_sale").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid", "cancelled"]).default("pending").notNull(),
  selfSourced: boolean("selfSourced").default(false).notNull(),
  rateApplied: decimal("rateApplied", { precision: 5, scale: 2 }),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;

/* ═══════════════════════════════════════════════════════
   NURTURE_LOGS — AI check-ins and customer interactions
   ═══════════════════════════════════════════════════════ */
export const nurtureLogs = mysqlTable("nurture_logs", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  contractId: int("contractId"),
  type: mysqlEnum("type", [
    "check_in",
    "support_request",
    "update_request",
    "feedback",
    "upsell_attempt",
    "renewal_outreach",
    "report_delivery",
  ]).notNull(),
  channel: mysqlEnum("channel", ["email", "sms", "in_app", "phone"]).default("email").notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  status: mysqlEnum("status", ["scheduled", "sent", "delivered", "opened", "responded", "resolved"])
    .default("scheduled")
    .notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NurtureLog = typeof nurtureLogs.$inferSelect;
export type InsertNurtureLog = typeof nurtureLogs.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REPORTS — Monthly analytics reports
   ═══════════════════════════════════════════════════════ */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  contractId: int("contractId"),
  reportMonth: varchar("reportMonth", { length: 7 }).notNull(), // "2026-04"
  pageViews: int("pageViews").default(0),
  uniqueVisitors: int("uniqueVisitors").default(0),
  bounceRate: decimal("bounceRate", { precision: 5, scale: 2 }),
  avgSessionDuration: int("avgSessionDuration").default(0), // seconds
  topPages: json("topPages"),
  conversionRate: decimal("conversionRate", { precision: 5, scale: 2 }),
  recommendations: text("recommendations"),
  status: mysqlEnum("status", ["draft", "generated", "delivered"]).default("draft").notNull(),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/* ═══════════════════════════════════════════════════════
   MONTHLY_REPORTS — One-per-month anniversary email dedup + history
   ═══════════════════════════════════════════════════════ */
export const monthlyReports = mysqlTable("monthly_reports", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  contractId: int("contractId"),
  reportMonth: varchar("reportMonth", { length: 7 }).notNull(), // "2026-05"
  competitiveReport: text("competitiveReport"),
  isRenewalMonth: boolean("isRenewalMonth").default(false).notNull(),
  emailSentAt: timestamp("emailSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type InsertMonthlyReport = typeof monthlyReports.$inferInsert;

/* ═══════════════════════════════════════════════════════
   UPSELL_OPPORTUNITIES — Upgrade recommendations
   ═══════════════════════════════════════════════════════ */
export const upsellOpportunities = mysqlTable("upsell_opportunities", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  contractId: int("contractId"),
  type: mysqlEnum("type", ["tier_upgrade", "add_pages", "add_feature", "add_service", "ai_widget"])
    .default("tier_upgrade")
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  estimatedValue: decimal("estimatedValue", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["identified", "proposed", "accepted", "declined", "completed"])
    .default("identified")
    .notNull(),
  proposedAt: timestamp("proposedAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UpsellOpportunity = typeof upsellOpportunities.$inferSelect;
export type InsertUpsellOpportunity = typeof upsellOpportunities.$inferInsert;

/* ═══════════════════════════════════════════════════════
   CONTACT_SUBMISSIONS — Website contact form entries
   ═══════════════════════════════════════════════════════ */
export const contactSubmissions = mysqlTable("contact_submissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  businessName: varchar("businessName", { length: 255 }),
  message: text("message"),
  convertedToLeadId: int("convertedToLeadId"),
  status: mysqlEnum("status", ["new", "reviewed", "converted", "archived"])
    .default("new")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

/* ═══════════════════════════════════════════════════════
   ORDERS — Stripe payment records
   ═══════════════════════════════════════════════════════ */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  packageTier: mysqlEnum("packageTier", ["starter", "growth", "premium", "enterprise"]).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  amount: int("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerName: varchar("customerName", { length: 255 }),
  businessName: varchar("businessName", { length: 255 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/* ═══════════════════════════════════════════════════════
   ONBOARDING_PROJECTS — Tracks customer website projects from intake to launch
   ═══════════════════════════════════════════════════════ */
export const onboardingProjects = mysqlTable("onboarding_projects", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId"),
  orderId: int("orderId"),
  contractId: int("contractId"),

  // Project status
  stage: mysqlEnum("stage", [
    "intake",
    "questionnaire",
    "assets_upload",
    "design",
    "review",
    "revisions",
    "final_approval",
    "launch",
    "complete",
  ])
    .default("intake")
    .notNull(),

  // Business info
  businessName: varchar("businessName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 32 }),
  packageTier: mysqlEnum("packageTier", ["starter", "growth", "premium", "enterprise"]).notNull(),

  // Domain handling
  domainOption: mysqlEnum("domainOption", ["existing", "new", "undecided"]).default("undecided"),
  existingDomain: varchar("existingDomain", { length: 512 }),
  domainRegistrar: varchar("domainRegistrar", { length: 255 }),
  domainNotes: text("domainNotes"),
  domainName: varchar("domainName", { length: 255 }),
  domainRegistered: boolean("domainRegistered").default(false),
  hostingSetup: boolean("hostingSetup").default(false),
  sslSetup: boolean("sslSetup").default(false),

  // Questionnaire responses (stored as JSON) — see shared/questionnaire.ts for ExpandedQuestionnaire type
  questionnaire: json("questionnaire"),
  // Expanded structure: websiteType, brandTone, brandColors, targetAudience, contentPreference,
  // inspirationSites[], competitorSites[], industry-specific branch fields
  // (serviceBusinessFields | restaurantFields | contractorFields | ecommerceFields | otherFields),
  // mustHaveFeatures[], specialRequests. Backward-compatible with legacy flat fields.

  // Custom quote / admin review triggers (auto-computed from questionnaire)
  needsCustomQuote: boolean("needsCustomQuote").default(false).notNull(),
  reviewFlags: json("reviewFlags"), // string[] of trigger reasons
  complexityScore: int("complexityScore").default(0).notNull(), // 0-100
  adminReviewedAt: timestamp("adminReviewedAt"),
  adminReviewNotes: text("adminReviewNotes"),

  // Design review
  designMockupUrl: varchar("designMockupUrl", { length: 512 }),
  feedbackNotes: text("feedbackNotes"),
  revisionsCount: int("revisionsCount").default(0).notNull(),
  maxRevisions: int("maxRevisions").default(3).notNull(),

  // Launch
  launchedAt: timestamp("launchedAt"),
  liveUrl: varchar("liveUrl", { length: 512 }),

  assignedRepId: int("assignedRepId"),

  // AI Site Generation
  generationStatus: mysqlEnum("generationStatus", ["idle", "generating", "complete", "failed"]).default("idle"),
  generationLog: text("generationLog"),
  generatedSiteHtml: longtext("generatedSiteHtml"), // JSON: { "index": "<html>...", "about": "<html>...", ... }
  generatedSiteUrl: varchar("generatedSiteUrl", { length: 512 }),
  cloudflareProjectName: varchar("cloudflareProjectName", { length: 200 }),
  lastChangeRequest: text("lastChangeRequest"),
  changeHistory: json("changeHistory"), // { request: string, respondedAt: string }[]

  // Competitive intelligence
  lastCompetitiveReport: text("lastCompetitiveReport"),
  lastCompetitiveReportDate: timestamp("lastCompetitiveReportDate"),

  previewReadyAt: timestamp("previewReadyAt"),
  approvedAt: timestamp("approvedAt"),
  revisionsRemaining: int("revisionsRemaining").default(3),

  // Elena onboarding progress — persisted after every message exchange
  elenaConversationHistory: json("elenaConversationHistory"), // {role, content}[]
  lastSavedAt: timestamp("lastSavedAt"),
  currentStep: int("currentStep").default(1).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingProject = typeof onboardingProjects.$inferSelect;
export type InsertOnboardingProject = typeof onboardingProjects.$inferInsert;

/* ═══════════════════════════════════════════════════════
   PROJECT_ASSETS — Files uploaded by customers (logos, photos, docs)
   ═══════════════════════════════════════════════════════ */
export const projectAssets = mysqlTable("project_assets", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  customerId: int("customerId"),

  // File info
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // S3 key
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(), // /manus-storage/... URL
  fileSize: int("fileSize"), // bytes
  mimeType: varchar("mimeType", { length: 128 }),
  category: mysqlEnum("category", [
    "logo",
    "photo",
    "brand_guidelines",
    "copy",
    "document",
    "other",
  ])
    .default("other")
    .notNull(),

  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectAsset = typeof projectAssets.$inferSelect;
export type InsertProjectAsset = typeof projectAssets.$inferInsert;

/* ═══════════════════════════════════════════════════════
   AI_CHAT_LOGS — Conversation history for onboarding + portal AI agents
   ═══════════════════════════════════════════════════════ */
export const aiChatLogs = mysqlTable("ai_chat_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  customerId: int("customerId"),
  projectId: int("projectId"),
  context: mysqlEnum("context", ["onboarding", "portal"]).notNull(),
  role: mysqlEnum("role", ["system", "user", "assistant"]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"), // extracted form fields, suggested actions, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiChatLog = typeof aiChatLogs.$inferSelect;
export type InsertAiChatLog = typeof aiChatLogs.$inferInsert;

/* ═══════════════════════════════════════════════════════
   WIDGET_CATALOG — Post-build AI widget/agent upsell products
   ═══════════════════════════════════════════════════════ */
export const widgetCatalog = mysqlTable("widget_catalog", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  monthlyPrice: decimal("monthlyPrice", { precision: 8, scale: 2 }).notNull(),
  setupFee: decimal("setupFee", { precision: 8, scale: 2 }).default("0.00"),
  category: mysqlEnum("category", ["ai_agent", "widget", "service", "integration"]).default("widget").notNull(),
  features: json("features"), // string[]
  icon: varchar("icon", { length: 64 }), // lucide icon name
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WidgetCatalogItem = typeof widgetCatalog.$inferSelect;
export type InsertWidgetCatalogItem = typeof widgetCatalog.$inferInsert;
/* ═══════════════════════════════════════════════════════
   REP_TRAINING_MODULES — Training content for reps
   ═══════════════════════════════════════════════════════ */
export const repTrainingModules = mysqlTable("rep_training_modules", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(), // markdown training content
  sortOrder: int("sortOrder").default(0).notNull(),
  estimatedMinutes: int("estimatedMinutes").default(15).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RepTrainingModule = typeof repTrainingModules.$inferSelect;
export type InsertRepTrainingModule = typeof repTrainingModules.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP_TRAINING_PROGRESS — Tracks which modules each rep completed
   ═══════════════════════════════════════════════════════ */
export const repTrainingProgress = mysqlTable("rep_training_progress", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  moduleId: int("moduleId").notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RepTrainingProgressRow = typeof repTrainingProgress.$inferSelect;
export type InsertRepTrainingProgress = typeof repTrainingProgress.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP_QUIZ_RESULTS — Certification quiz attempts
   ═══════════════════════════════════════════════════════ */
export const repQuizResults = mysqlTable("rep_quiz_results", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  score: int("score").notNull(), // 0-100
  passed: boolean("passed").default(false).notNull(),
  answers: json("answers"), // { questionId: selectedAnswer }
  attemptNumber: int("attemptNumber").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RepQuizResult = typeof repQuizResults.$inferSelect;
export type InsertRepQuizResult = typeof repQuizResults.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP_ACTIVITY_LOGS — Daily activity tracking
   ═══════════════════════════════════════════════════════ */
export const repActivityLogs = mysqlTable("rep_activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  type: mysqlEnum("type", ["call", "email", "meeting", "proposal", "follow_up", "note", "deal_closed", "lead_update", "lead_claimed", "proposal_generated", "lead_added"]).notNull(),
  leadId: int("leadId"),
  customerId: int("customerId"),
  subject: varchar("subject", { length: 255 }),
  notes: text("notes"),
  outcome: mysqlEnum("outcome", ["connected", "voicemail", "no_answer", "scheduled", "sent", "completed", "cancelled"]),
  followUpAt: timestamp("followUpAt"),
  pointsEarned: int("pointsEarned").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RepActivityLog = typeof repActivityLogs.$inferSelect;
export type InsertRepActivityLog = typeof repActivityLogs.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP_GAMIFICATION — Points, levels, badges, streaks
   ═══════════════════════════════════════════════════════ */
export const repGamification = mysqlTable("rep_gamification", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull().unique(),
  totalPoints: int("totalPoints").default(0).notNull(),
  level: mysqlEnum("level", ["rookie", "closer", "ace", "elite", "legend"]).default("rookie").notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActiveDate: varchar("lastActiveDate", { length: 10 }),
  badges: json("badges"), // string[]
  monthlyDeals: int("monthlyDeals").default(0).notNull(),
  monthlyResetAt: timestamp("monthlyResetAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RepGamificationRow = typeof repGamification.$inferSelect;
export type InsertRepGamification = typeof repGamification.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP_EMAIL_TEMPLATES — Pre-built email templates for reps
   ═══════════════════════════════════════════════════════ */
export const repEmailTemplates = mysqlTable("rep_email_templates", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["intro", "follow_up", "proposal", "close", "check_in", "referral"]).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(), // markdown with {{variable}} placeholders
  variables: json("variables"), // string[]
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RepEmailTemplate = typeof repEmailTemplates.$inferSelect;
export type InsertRepEmailTemplate = typeof repEmailTemplates.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP_SENT_EMAILS — Emails sent by reps to leads/customers
   ═══════════════════════════════════════════════════════ */
export const repSentEmails = mysqlTable("rep_sent_emails", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  templateId: int("templateId"),
  leadId: int("leadId"),
  customerId: int("customerId"),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["sent", "delivered", "opened", "clicked", "bounced"]).default("sent").notNull(),
  resendMessageId: varchar("resendMessageId", { length: 255 }),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  deliveredAt: timestamp("deliveredAt"),
  bouncedAt: timestamp("bouncedAt"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});
export type RepSentEmail = typeof repSentEmails.$inferSelect;
export type InsertRepSentEmail = typeof repSentEmails.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP_APPLICATIONS — Extended application data for rep recruitment
   ═══════════════════════════════════════════════════════ */
export const repApplications = mysqlTable("rep_applications", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  photoUrl: varchar("photoUrl", { length: 1024 }),
  availability: mysqlEnum("availability", ["full_time", "part_time"]).default("full_time").notNull(),
  hoursPerWeek: int("hoursPerWeek").default(40).notNull(),
  salesExperience: mysqlEnum("salesExperience", ["none", "1_2_years", "3_5_years", "5_plus_years"]).default("none").notNull(),
  previousIndustries: json("previousIndustries"), // string[]
  motivation: text("motivation"), // why MiniMorph essay
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  referredBy: varchar("referredBy", { length: 255 }),
  agreedToTerms: boolean("agreedToTerms").default(false).notNull(),
  agreedToTaxInfo: boolean("agreedToTaxInfo").default(false).notNull(),
  stripeConnectAccountId: varchar("stripeConnectAccountId", { length: 128 }),
  stripeConnectOnboarded: boolean("stripeConnectOnboarded").default(false).notNull(),
  // AI motivation review
  aiMotivationScore: int("aiMotivationScore"), // 1-10 scale
  aiMotivationAnalysis: json("aiMotivationAnalysis"), // { sincerity, specificity, effort, flags, summary }
  aiReviewedAt: timestamp("aiReviewedAt"),
  reviewNotes: text("reviewNotes"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RepApplication = typeof repApplications.$inferSelect;
export type InsertRepApplication = typeof repApplications.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP_NOTIFICATIONS — In-app notifications for reps
   ═══════════════════════════════════════════════════════ */
export const repNotifications = mysqlTable("rep_notifications", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  type: mysqlEnum("type", [
    "lead_assigned",
    "lead_claimed",
    "commission_approved",
    "commission_paid",
    "training_reminder",
    "deal_closed",
    "badge_earned",
    "level_up",
    "general",
  ]).default("general").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RepNotification = typeof repNotifications.$inferSelect;
export type InsertRepNotification = typeof repNotifications.$inferInsert;

/* ═══════════════════════════════════════════════════════
   SMS_MESSAGES — Twilio SMS conversation threads
   ═══════════════════════════════════════════════════════ */
export const smsMessages = mysqlTable("sms_messages", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  leadId: int("leadId"),
  customerId: int("customerId"),
  direction: mysqlEnum("direction", ["outbound", "inbound"]).notNull(),
  fromNumber: varchar("fromNumber", { length: 20 }).notNull(),
  toNumber: varchar("toNumber", { length: 20 }).notNull(),
  body: text("body").notNull(),
  twilioSid: varchar("twilioSid", { length: 64 }),
  status: mysqlEnum("status", ["queued", "sent", "delivered", "failed", "received"]).default("queued").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SmsMessage = typeof smsMessages.$inferSelect;
export type InsertSmsMessage = typeof smsMessages.$inferInsert;

/* ═══════════════════════════════════════════════════════
   CALL_LOGS — Twilio Voice call records with recording
   ═══════════════════════════════════════════════════════ */
export const callLogs = mysqlTable("call_logs", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  leadId: int("leadId"),
  customerId: int("customerId"),
  direction: mysqlEnum("direction", ["outbound", "inbound"]).notNull(),
  fromNumber: varchar("fromNumber", { length: 20 }).notNull(),
  toNumber: varchar("toNumber", { length: 20 }).notNull(),
  twilioCallSid: varchar("twilioCallSid", { length: 64 }),
  status: mysqlEnum("status", ["initiated", "ringing", "in_progress", "completed", "busy", "no_answer", "failed", "canceled"]).default("initiated").notNull(),
  duration: int("duration"), // seconds
  recordingUrl: text("recordingUrl"),
  recordingSid: varchar("recordingSid", { length: 64 }),
  transcription: text("transcription"),
  startedAt: timestamp("startedAt"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = typeof callLogs.$inferInsert;

/* ═══════════════════════════════════════════════════════
   AI_COACHING_FEEDBACK — AI review of each communication
   ═══════════════════════════════════════════════════════ */
export const aiCoachingFeedback = mysqlTable("ai_coaching_feedback", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  communicationType: mysqlEnum("communicationType", ["email", "sms", "call"]).notNull(),
  referenceId: int("referenceId").notNull(), // ID from rep_sent_emails, sms_messages, or call_logs
  overallScore: int("overallScore"), // 1-100
  strengths: json("strengths"), // string[]
  improvements: json("improvements"), // string[]
  detailedFeedback: text("detailedFeedback"), // markdown
  toneAnalysis: mysqlEnum("toneAnalysis", ["professional", "friendly", "aggressive", "passive", "confident", "uncertain"]),
  sentimentScore: int("sentimentScore"), // -100 to 100
  keyTakeaways: json("keyTakeaways"), // string[]
  suggestedFollowUp: text("suggestedFollowUp"),
  promotableToAcademy: boolean("promotableToAcademy").default(false).notNull(),
  promotionReason: text("promotionReason"),
  promotedToAcademy: boolean("promotedToAcademy").default(false).notNull(),
  promotedAt: timestamp("promotedAt"),
  promotedBy: int("promotedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AiCoachingFeedback = typeof aiCoachingFeedback.$inferSelect;
export type InsertAiCoachingFeedback = typeof aiCoachingFeedback.$inferInsert;

/* ═══════════════════════════════════════════════════════
   TRAINING_INSIGHTS — Aggregated patterns from AI coaching
   ═══════════════════════════════════════════════════════ */
export const trainingInsights = mysqlTable("training_insights", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["best_practice", "common_mistake", "technique", "objection_handling", "closing_strategy"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(), // markdown
  frequency: int("frequency").default(1).notNull(), // how many times this pattern was observed
  exampleSnippets: json("exampleSnippets"), // { repId, communicationType, snippet, score }[]
  communicationType: mysqlEnum("insightCommType", ["email", "sms", "call", "all"]).default("all").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TrainingInsight = typeof trainingInsights.$inferSelect;
export type InsertTrainingInsight = typeof trainingInsights.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP SUPPORT TICKETS — Internal ticket system with AI triage
   ═══════════════════════════════════════════════════════ */
export const repSupportTickets = mysqlTable("rep_support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("ticketCategory", ["technical", "billing", "lead_issue", "training", "feature_request", "other"])
    .default("other")
    .notNull(),
  priority: mysqlEnum("ticketPriority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("ticketStatus", ["open", "ai_reviewed", "pending_approval", "approved", "rejected", "resolved", "closed"])
    .default("open")
    .notNull(),
  aiAnalysis: text("aiAnalysis"), // AI's analysis of the issue
  aiSolution: text("aiSolution"), // AI's proposed solution
  aiConfidence: decimal("aiConfidence", { precision: 3, scale: 2 }), // 0.00 - 1.00
  ownerApproval: mysqlEnum("ownerApproval", ["pending", "approved", "rejected"]),
  ownerNotes: text("ownerNotes"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RepSupportTicket = typeof repSupportTickets.$inferSelect;
export type InsertRepSupportTicket = typeof repSupportTickets.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP NOTIFICATION PREFERENCES — Per-category toggle
   ═══════════════════════════════════════════════════════ */
export const repNotificationPreferences = mysqlTable("rep_notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  category: varchar("notifCategory", { length: 64 }).notNull(), // e.g. "new_lead", "coaching", "ticket_update", "commission", "training"
  enabled: boolean("enabled").default(true).notNull(),
  pushEnabled: boolean("pushEnabled").default(true).notNull(),
  inAppEnabled: boolean("inAppEnabled").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RepNotificationPreference = typeof repNotificationPreferences.$inferSelect;
export type InsertRepNotificationPreference = typeof repNotificationPreferences.$inferInsert;

/* ═══════════════════════════════════════════════════════
   PUSH SUBSCRIPTIONS — Web push notification endpoints
   ═══════════════════════════════════════════════════════ */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(), // public key
  auth: text("auth").notNull(), // auth secret
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/* ═══════════════════════════════════════════════════════
   LEAD GEN ENGINE — Scrape Jobs
   ═══════════════════════════════════════════════════════ */
export const scrapeJobs = mysqlTable("scrape_jobs", {
  id: int("id").autoincrement().primaryKey(),
  targetArea: varchar("targetArea", { length: 255 }).notNull(), // e.g. "Austin, TX"
  targetLat: decimal("targetLat", { precision: 10, scale: 7 }),
  targetLng: decimal("targetLng", { precision: 10, scale: 7 }),
  radiusKm: int("radiusKm").default(25).notNull(),
  businessTypes: json("businessTypes").$type<string[]>(), // e.g. ["restaurant", "salon", "contractor"]
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"])
    .default("pending")
    .notNull(),
  totalFound: int("totalFound").default(0).notNull(),
  totalQualified: int("totalQualified").default(0).notNull(),
  forRepId: int("forRepId"), // null = general pool, set = targeted for specific rep
  errorMessage: text("errorMessage"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ═══════════════════════════════════════════════════════
   LEAD GEN ENGINE — Scraped Businesses (raw, before becoming leads)
   ═══════════════════════════════════════════════════════ */
export const scrapedBusinesses = mysqlTable("scraped_businesses", {
  id: int("id").autoincrement().primaryKey(),
  scrapeJobId: int("scrapeJobId").notNull(),
  googlePlaceId: varchar("googlePlaceId", { length: 255 }).notNull(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  address: varchar("address", { length: 512 }),
  phone: varchar("phone", { length: 32 }),
  website: varchar("website", { length: 512 }),
  rating: decimal("rating", { precision: 3, scale: 1 }),
  reviewCount: int("reviewCount").default(0),
  businessTypes: json("businessTypes").$type<string[]>(),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  hasWebsite: boolean("hasWebsite").default(false).notNull(),
  websiteScore: int("websiteScore"), // 0-100, null = not scored yet
  websiteIssues: json("websiteIssues").$type<string[]>(), // ["slow", "not_mobile_friendly", "no_ssl"]
  qualified: boolean("qualified").default(false).notNull(), // passed our filter
  convertedToLeadId: int("convertedToLeadId"), // null = not yet converted
  status: mysqlEnum("status", ["scraped", "scoring", "scored", "enriching", "enriched", "qualified", "disqualified", "converted"])
    .default("scraped")
    .notNull(),
  enrichmentData: json("enrichmentData"), // owner info, social profiles, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ═══════════════════════════════════════════════════════
   LEAD GEN ENGINE — Outreach Sequences
   ═══════════════════════════════════════════════════════ */
export const outreachSequences = mysqlTable("outreach_sequences", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  sequenceType: mysqlEnum("sequenceType", ["cold_email", "cold_sms", "warm_email", "warm_sms", "follow_up", "call_reminder"])
    .default("cold_email")
    .notNull(),
  stepNumber: int("stepNumber").default(1).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  sentAt: timestamp("sentAt"),
  status: mysqlEnum("status", ["scheduled", "sent", "delivered", "opened", "replied", "bounced", "cancelled"])
    .default("scheduled")
    .notNull(),
  subject: varchar("subject", { length: 255 }),
  body: text("body"),
  channel: mysqlEnum("channel", ["email", "sms", "rep_call_reminder"]).default("email").notNull(),
  aiGenerated: boolean("aiGenerated").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ═══════════════════════════════════════════════════════
   LEAD GEN ENGINE — AI Conversations (autonomous reply handling)
   ═══════════════════════════════════════════════════════ */
export const aiConversations = mysqlTable("ai_conversations", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  channel: mysqlEnum("channel", ["email", "sms"]).default("email").notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).default("inbound").notNull(),
  content: text("content").notNull(),
  aiDecision: mysqlEnum("aiDecision", [
    "answer_question",
    "send_info",
    "push_for_close",
    "handle_objection",
    "schedule_call",
    "assign_to_rep",
    "assign_to_owner",
    "mark_not_interested",
    "continue_nurture",
  ]),
  aiConfidence: decimal("aiConfidence", { precision: 5, scale: 2 }), // 0-100
  aiReasoning: text("aiReasoning"),
  handedOffToRepId: int("handedOffToRepId"),
  handedOffToOwner: boolean("handedOffToOwner").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ═══════════════════════════════════════════════════════
   LEAD GEN ENGINE — Rep Service Areas (where reps operate)
   ═══════════════════════════════════════════════════════ */
export const repServiceAreas = mysqlTable("rep_service_areas", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  areaName: varchar("areaName", { length: 255 }).notNull(), // e.g. "Austin, TX"
  lat: decimal("lat", { precision: 10, scale: 7 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 7 }).notNull(),
  radiusKm: int("radiusKm").default(25).notNull(),
  isPrimary: boolean("isPrimary").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/* ═══════════════════════════════════════════════════════
   LEAD GEN ENGINE — Engine Config (admin settings)
   ═══════════════════════════════════════════════════════ */
export const leadGenConfig = mysqlTable("lead_gen_config", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 128 }).notNull().unique(),
  configValue: text("configValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ═══════════════════════════════════════════════════════
   LEAD GEN ENGINE — Enterprise Prospects (owner's big-ticket pipeline)
   ═══════════════════════════════════════════════════════ */
export const enterpriseProspects = mysqlTable("enterprise_prospects", {
  id: int("id").autoincrement().primaryKey(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  website: varchar("website", { length: 512 }),
  industry: varchar("industry", { length: 128 }),
  estimatedEmployees: int("estimatedEmployees"),
  estimatedRevenue: varchar("estimatedRevenue", { length: 64 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  googlePlaceId: varchar("googlePlaceId", { length: 255 }),
  automationOpportunities: json("automationOpportunities").$type<string[]>(),
  aiAnalysisReport: text("aiAnalysisReport"), // full AI-generated report for owner
  estimatedSavings: varchar("estimatedSavings", { length: 64 }),
  status: mysqlEnum("status", ["identified", "analyzed", "report_sent", "onboarding", "in_progress", "closed_won", "closed_lost"])
    .default("identified")
    .notNull(),
  ownerNotes: text("ownerNotes"),
  onboardingResponses: json("onboardingResponses"), // questionnaire answers
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/* ═══════════════════════════════════════════════════════
   EMAIL UNSUBSCRIBES (CAN-SPAM Compliance)
   ═══════════════════════════════════════════════════════ */
export const emailUnsubscribes = mysqlTable("email_unsubscribes", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull(),
  unsubscribedAt: timestamp("unsubscribed_at").defaultNow(),
  source: varchar("source", { length: 50 }).default("email_link"), // email_link, manual, complaint
});
export type EmailUnsubscribe = typeof emailUnsubscribes.$inferSelect;

/* ═══════════════════════════════════════════════════════
   ACADEMY — Training module progress & certifications
   ═══════════════════════════════════════════════════════ */

export const academyProgress = mysqlTable("academy_progress", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("rep_id").notNull(),
  moduleId: varchar("module_id", { length: 64 }).notNull(),
  lessonIndex: int("lesson_index").notNull().default(0),
  lessonsCompleted: int("lessons_completed").notNull().default(0),
  totalLessons: int("total_lessons").notNull(),
  quizScore: int("quiz_score"), // percentage 0-100, null if not attempted
  quizAttempts: int("quiz_attempts").notNull().default(0),
  quizPassed: boolean("quiz_passed").notNull().default(false),
  timeSpentMinutes: int("time_spent_minutes").notNull().default(0),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
});

export const academyQuizAttempts = mysqlTable("academy_quiz_attempts", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("rep_id").notNull(),
  moduleId: varchar("module_id", { length: 64 }).notNull(),
  answers: json("answers").notNull(), // { questionId: selectedAnswer }
  score: int("score").notNull(), // percentage 0-100
  passed: boolean("passed").notNull(),
  timeSpentSeconds: int("time_spent_seconds").notNull().default(0),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
});

export const academyCertifications = mysqlTable("academy_certifications", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("rep_id").notNull(),
  certificationType: mysqlEnum("certification_type", ["module", "full"]).notNull(),
  moduleId: varchar("module_id", { length: 64 }), // null for full certification
  certifiedAt: timestamp("certified_at").defaultNow().notNull(),
  score: int("score").notNull(), // average score across all quizzes
});


/* ═══════════════════════════════════════════════════════
   COACHING REVIEWS — AI-generated micro-lessons from conversation analysis
   ═══════════════════════════════════════════════════════ */
export const coachingReviews = mysqlTable("coaching_reviews", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("rep_id").notNull(),
  feedbackId: int("feedback_id").notNull(), // references ai_coaching_feedback.id
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(), // markdown micro-lesson
  category: mysqlEnum("review_category", [
    "objection_handling", "closing", "rapport", "discovery", "product_knowledge",
    "tone", "follow_up", "listening", "urgency", "personalization"
  ]).notNull(),
  relatedModuleId: varchar("related_module_id", { length: 64 }), // links to academy module
  priority: mysqlEnum("review_priority", ["critical", "important", "suggested"]).notNull().default("important"),
  status: mysqlEnum("review_status", ["pending", "completed", "skipped"]).notNull().default("pending"),
  quizQuestion: json("quiz_question"), // { question, options, correctAnswer, explanation }
  quizAnswer: int("quiz_answer"), // rep's answer
  quizPassed: boolean("quiz_passed"),
  completedAt: timestamp("review_completed_at"),
  expiresAt: timestamp("expires_at"), // senior reps can let reviews expire
  createdAt: timestamp("review_created_at").defaultNow().notNull(),
});
export type CoachingReview = typeof coachingReviews.$inferSelect;
export type InsertCoachingReview = typeof coachingReviews.$inferInsert;

/* ═══════════════════════════════════════════════════════
   DAILY CHECK-INS — Rep must complete required training before accessing leads
   ═══════════════════════════════════════════════════════ */
export const dailyCheckIns = mysqlTable("daily_check_ins", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("rep_id").notNull(),
  checkInDate: varchar("check_in_date", { length: 10 }).notNull(), // YYYY-MM-DD
  reviewsRequired: int("reviews_required").notNull().default(0),
  reviewsCompleted: int("reviews_completed").notNull().default(0),
  quizzesRequired: int("quizzes_required").notNull().default(0),
  quizzesCompleted: int("quizzes_completed").notNull().default(0),
  isCleared: boolean("is_cleared").notNull().default(false), // true = rep can access leads/comms
  clearedAt: timestamp("cleared_at"),
  createdAt: timestamp("checkin_created_at").defaultNow().notNull(),
});
export type DailyCheckIn = typeof dailyCheckIns.$inferSelect;
export type InsertDailyCheckIn = typeof dailyCheckIns.$inferInsert;

/* ═══════════════════════════════════════════════════════
   ROLE-PLAY SESSIONS — AI-powered sales practice conversations
   ═══════════════════════════════════════════════════════ */
export const rolePlaySessions = mysqlTable("role_play_sessions", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("rp_rep_id").notNull(),
  scenarioType: mysqlEnum("scenario_type", [
    "cold_call", "discovery_call", "objection_handling", "closing",
    "follow_up", "upsell", "angry_customer", "price_negotiation"
  ]).notNull(),
  prospectPersona: text("prospect_persona").notNull(), // JSON: name, company, pain points, personality
  messages: json("rp_messages"), // Array of { role, content, timestamp }
  status: mysqlEnum("rp_status", ["active", "completed", "scored"]).default("active").notNull(),
  score: int("rp_score"), // 0-100
  feedback: text("rp_feedback"), // AI-generated markdown feedback
  strengths: json("rp_strengths"), // string[]
  improvements: json("rp_improvements"), // string[]
  relatedModuleId: varchar("rp_related_module_id", { length: 64 }),
  messageCount: int("message_count").default(0),
  durationSeconds: int("duration_seconds"),
  createdAt: timestamp("rp_created_at").defaultNow().notNull(),
  completedAt: timestamp("rp_completed_at"),
});
export type RolePlaySession = typeof rolePlaySessions.$inferSelect;
export type InsertRolePlaySession = typeof rolePlaySessions.$inferInsert;

/* ═══════════════════════════════════════════════════════
   SOCIAL ACCOUNTS — Connected social media platforms
   ═══════════════════════════════════════════════════════ */
export const socialAccounts = mysqlTable("social_accounts", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", [
    "instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "pinterest", "threads"
  ]).notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountId: varchar("account_id", { length: 255 }), // platform-specific ID
  accessToken: text("access_token"), // encrypted, null until connected
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  profileUrl: varchar("profile_url", { length: 512 }),
  profileImageUrl: varchar("profile_image_url", { length: 512 }),
  followerCount: int("follower_count").default(0),
  status: mysqlEnum("account_status", ["connected", "disconnected", "expired", "pending"])
    .default("pending")
    .notNull(),
  connectedAt: timestamp("connected_at"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("sa_created_at").defaultNow().notNull(),
  updatedAt: timestamp("sa_updated_at").defaultNow().onUpdateNow().notNull(),
});
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = typeof socialAccounts.$inferInsert;

/* ═══════════════════════════════════════════════════════
   SOCIAL CAMPAIGNS — Marketing campaigns across platforms
   ═══════════════════════════════════════════════════════ */
export const socialCampaigns = mysqlTable("social_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("campaign_name", { length: 255 }).notNull(),
  description: text("campaign_description"),
  goal: mysqlEnum("campaign_goal", [
    "brand_awareness", "lead_generation", "engagement", "traffic",
    "recruitment", "product_launch", "event_promotion", "customer_retention"
  ]).default("brand_awareness").notNull(),
  platforms: json("campaign_platforms"), // ["instagram", "facebook", "linkedin"]
  startDate: timestamp("campaign_start_date"),
  endDate: timestamp("campaign_end_date"),
  budget: decimal("campaign_budget", { precision: 10, scale: 2 }),
  status: mysqlEnum("campaign_status", ["draft", "active", "paused", "completed", "archived"])
    .default("draft")
    .notNull(),
  targetAudience: text("target_audience"),
  totalPosts: int("total_posts").default(0),
  totalEngagement: int("total_engagement").default(0),
  createdAt: timestamp("sc_created_at").defaultNow().notNull(),
  updatedAt: timestamp("sc_updated_at").defaultNow().onUpdateNow().notNull(),
});
export type SocialCampaign = typeof socialCampaigns.$inferSelect;
export type InsertSocialCampaign = typeof socialCampaigns.$inferInsert;

/* ═══════════════════════════════════════════════════════
   SOCIAL POSTS — Individual social media posts
   ═══════════════════════════════════════════════════════ */
export const socialPosts = mysqlTable("social_posts", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("sp_campaign_id"), // optional campaign association
  platform: mysqlEnum("sp_platform", [
    "instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "pinterest", "threads"
  ]).notNull(),
  accountId: int("sp_account_id"), // references social_accounts.id
  content: text("post_content").notNull(),
  mediaUrls: json("media_urls"), // ["url1", "url2"] — images/videos
  mediaType: mysqlEnum("media_type", ["none", "image", "video", "carousel", "story", "reel"]).default("none"),
  hashtags: json("post_hashtags"), // ["#webdesign", "#smallbusiness"]
  scheduledAt: timestamp("sp_scheduled_at"),
  publishedAt: timestamp("sp_published_at"),
  postUrl: varchar("post_url", { length: 512 }), // URL of published post
  status: mysqlEnum("post_status", ["draft", "scheduled", "publishing", "published", "failed", "archived"])
    .default("draft")
    .notNull(),
  failureReason: text("failure_reason"),
  // Engagement metrics (updated via API sync)
  likes: int("post_likes").default(0),
  comments: int("post_comments").default(0),
  shares: int("post_shares").default(0),
  impressions: int("post_impressions").default(0),
  reach: int("post_reach").default(0),
  clicks: int("post_clicks").default(0),
  saves: int("post_saves").default(0),
  // AI generation metadata
  aiGenerated: boolean("ai_generated").default(false),
  aiPrompt: text("ai_prompt"), // the prompt used to generate this post
  createdBy: int("sp_created_by"), // user who created it
  createdAt: timestamp("sp_created_at").defaultNow().notNull(),
  updatedAt: timestamp("sp_updated_at").defaultNow().onUpdateNow().notNull(),
});
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = typeof socialPosts.$inferInsert;

/* ═══════════════════════════════════════════════════════
   CONTENT CALENDAR — Planned content slots
   ═══════════════════════════════════════════════════════ */
export const contentCalendar = mysqlTable("content_calendar", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("cal_title", { length: 255 }).notNull(),
  description: text("cal_description"),
  postId: int("cal_post_id"), // linked social post (once created)
  campaignId: int("cal_campaign_id"),
  platforms: json("cal_platforms"), // ["instagram", "facebook"]
  scheduledDate: varchar("scheduled_date", { length: 10 }).notNull(), // YYYY-MM-DD
  scheduledTime: varchar("scheduled_time", { length: 5 }), // HH:MM
  contentType: mysqlEnum("content_type", [
    "post", "story", "reel", "video", "carousel", "article", "poll", "event"
  ]).default("post").notNull(),
  status: mysqlEnum("cal_status", ["idea", "planned", "in_progress", "ready", "published", "skipped"])
    .default("planned")
    .notNull(),
  notes: text("cal_notes"),
  color: varchar("cal_color", { length: 7 }), // hex color for calendar display
  createdBy: int("cal_created_by"),
  createdAt: timestamp("cal_created_at").defaultNow().notNull(),
  updatedAt: timestamp("cal_updated_at").defaultNow().onUpdateNow().notNull(),
});
export type ContentCalendarEntry = typeof contentCalendar.$inferSelect;
export type InsertContentCalendarEntry = typeof contentCalendar.$inferInsert;

/* ═══════════════════════════════════════════════════════
   BRAND ASSETS — Brand kit (colors, fonts, logos, voice)
   ═══════════════════════════════════════════════════════ */
export const brandAssets = mysqlTable("brand_assets", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("asset_category", [
    "color", "font", "logo", "voice", "template", "image", "guideline"
  ]).notNull(),
  name: varchar("asset_name", { length: 255 }).notNull(),
  value: text("asset_value"), // hex for color, font name, URL for logo, text for voice
  description: text("asset_description"),
  url: varchar("asset_url", { length: 512 }), // S3 URL for uploaded assets
  sortOrder: int("sort_order").default(0),
  isActive: boolean("asset_is_active").default(true),
  createdAt: timestamp("ba_created_at").defaultNow().notNull(),
  updatedAt: timestamp("ba_updated_at").defaultNow().onUpdateNow().notNull(),
});
export type BrandAsset = typeof brandAssets.$inferSelect;
export type InsertBrandAsset = typeof brandAssets.$inferInsert;

/* ═══════════════════════════════════════════════════════
   SOCIAL ANALYTICS — Daily platform metrics snapshots
   ═══════════════════════════════════════════════════════ */
export const socialAnalytics = mysqlTable("social_analytics", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("analytics_account_id").notNull(), // references social_accounts.id
  platform: mysqlEnum("analytics_platform", [
    "instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "pinterest", "threads"
  ]).notNull(),
  date: varchar("analytics_date", { length: 10 }).notNull(), // YYYY-MM-DD
  followers: int("analytics_followers").default(0),
  followersGained: int("followers_gained").default(0),
  impressions: int("analytics_impressions").default(0),
  reach: int("analytics_reach").default(0),
  engagement: int("analytics_engagement").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  clicks: int("analytics_clicks").default(0),
  shares: int("analytics_shares").default(0),
  profileViews: int("profile_views").default(0),
  websiteClicks: int("website_clicks").default(0),
  createdAt: timestamp("san_created_at").defaultNow().notNull(),
});
export type SocialAnalyticsEntry = typeof socialAnalytics.$inferSelect;
export type InsertSocialAnalyticsEntry = typeof socialAnalytics.$inferInsert;

/* ═══════════════════════════════════════════════════════
   SOCIAL CONTENT LIBRARY — Pre-approved posts for reps
   ═══════════════════════════════════════════════════════ */
export const socialContentLibrary = mysqlTable("social_content_library", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("lib_title", { length: 255 }).notNull(),
  content: text("lib_content").notNull(),
  platform: mysqlEnum("lib_platform", [
    "instagram", "facebook", "linkedin", "tiktok", "x", "all"
  ]).default("all").notNull(),
  category: mysqlEnum("lib_category", [
    "brand_awareness", "testimonial", "service_highlight", "industry_tip",
    "behind_the_scenes", "recruitment", "promotion", "educational"
  ]).default("brand_awareness").notNull(),
  mediaUrls: json("lib_media_urls"),
  hashtags: json("lib_hashtags"),
  isApproved: boolean("lib_is_approved").default(false),
  timesShared: int("times_shared").default(0),
  createdAt: timestamp("scl_created_at").defaultNow().notNull(),
  updatedAt: timestamp("scl_updated_at").defaultNow().onUpdateNow().notNull(),
});
export type SocialContentLibraryEntry = typeof socialContentLibrary.$inferSelect;
export type InsertSocialContentLibraryEntry = typeof socialContentLibrary.$inferInsert;

/* ═══════════════════════════════════════════════════════
   X GROWTH ENGINE — Engagement Activity Log
   ═══════════════════════════════════════════════════════ */
export const xEngagementLog = mysqlTable("x_engagement_log", {
  id: int("id").autoincrement().primaryKey(),
  actionType: mysqlEnum("action_type", ["follow", "unfollow", "like", "reply", "retweet"]).notNull(),
  targetUserId: varchar("target_user_id", { length: 64 }),
  targetUsername: varchar("target_username", { length: 128 }),
  targetTweetId: varchar("target_tweet_id", { length: 64 }),
  targetTweetText: text("target_tweet_text"),
  replyText: text("reply_text"),
  status: mysqlEnum("engagement_status", ["pending_approval", "approved", "executed", "failed", "rejected"]).default("executed").notNull(),
  failureReason: text("engagement_failure_reason"),
  category: mysqlEnum("engagement_category", ["rep_recruitment", "lead_gen", "brand_awareness", "authority", "general"]).default("general").notNull(),
  createdAt: timestamp("xel_created_at").defaultNow().notNull(),
});
export type XEngagementLogEntry = typeof xEngagementLog.$inferSelect;
export type InsertXEngagementLogEntry = typeof xEngagementLog.$inferInsert;

/* ═══════════════════════════════════════════════════════
   X GROWTH ENGINE — Follow Tracker
   ═══════════════════════════════════════════════════════ */
export const xFollowTracker = mysqlTable("x_follow_tracker", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("x_user_id", { length: 64 }).notNull(),
  username: varchar("x_username", { length: 128 }).notNull(),
  name: varchar("x_name", { length: 255 }),
  description: text("x_description"),
  followersCount: int("x_followers_count"),
  followedAt: timestamp("followed_at").defaultNow().notNull(),
  followedBack: boolean("followed_back").default(false),
  unfollowedAt: timestamp("unfollowed_at"),
  category: mysqlEnum("follow_category", ["rep_recruitment", "lead_gen", "brand_awareness", "authority", "general"]).default("general").notNull(),
});
export type XFollowTrackerEntry = typeof xFollowTracker.$inferSelect;
export type InsertXFollowTrackerEntry = typeof xFollowTracker.$inferInsert;

/* ═══════════════════════════════════════════════════════
   X GROWTH ENGINE — Target Configuration
   ═══════════════════════════════════════════════════════ */
export const xGrowthTargets = mysqlTable("x_growth_targets", {
  id: int("id").autoincrement().primaryKey(),
  targetType: mysqlEnum("target_type", ["keyword", "hashtag", "account", "community"]).notNull(),
  value: varchar("target_value", { length: 255 }).notNull(),
  category: mysqlEnum("gt_category", ["rep_recruitment", "lead_gen", "brand_awareness", "authority"]).notNull(),
  priority: int("target_priority").default(5),
  isActive: boolean("target_is_active").default(true),
  createdAt: timestamp("xgt_created_at").defaultNow().notNull(),
});
export type XGrowthTarget = typeof xGrowthTargets.$inferSelect;
export type InsertXGrowthTarget = typeof xGrowthTargets.$inferInsert;

/* ═══════════════════════════════════════════════════════
   X GROWTH ENGINE — Configuration Key-Value Store
   ═══════════════════════════════════════════════════════ */
export const xGrowthConfig = mysqlTable("x_growth_config", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("config_key", { length: 128 }).notNull().unique(),
  configValue: text("config_value").notNull(),
  updatedAt: timestamp("xgc_updated_at").defaultNow().onUpdateNow().notNull(),
});
export type XGrowthConfigEntry = typeof xGrowthConfig.$inferSelect;

/* ═══════════════════════════════════════════════════════
   REP ASSESSMENTS — Gate system for rep qualification
   ═══════════════════════════════════════════════════════ */
export const repAssessments = mysqlTable("rep_assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  gate1Score: decimal("gate1_score", { precision: 5, scale: 2 }).notNull(), // percentage 0-100
  gate2Score: decimal("gate2_score", { precision: 5, scale: 2 }).notNull(), // percentage 0-100
  totalScore: decimal("total_score", { precision: 5, scale: 2 }).notNull(), // weighted percentage
  status: mysqlEnum("assessment_status", ["passed", "borderline", "failed"]).notNull(),
  answers: json("answers").notNull(), // { questionId: selectedOptionId | freeText }
  freeTextAnswer: text("free_text_answer"), // sa6 free-text pitch
  startedAt: timestamp("started_at"), // when the timer started
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  timeLimitSeconds: int("time_limit_seconds").default(1200), // 20 minutes = 1200 seconds
  attemptNumber: int("attempt_number").default(1).notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: int("reviewed_by"),
  reviewNotes: text("review_notes"),
  adminOverride: mysqlEnum("admin_override", ["approved", "rejected"]),
});
export type RepAssessment = typeof repAssessments.$inferSelect;
export type InsertRepAssessment = typeof repAssessments.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP ONBOARDING DATA — Trust verification + auto-populate paperwork
   ═══════════════════════════════════════════════════════ */
export const repOnboardingData = mysqlTable("rep_onboarding_data", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  repId: int("rep_id"),
  // Legal identity
  legalFirstName: varchar("legal_first_name", { length: 128 }),
  legalLastName: varchar("legal_last_name", { length: 128 }),
  dateOfBirth: varchar("date_of_birth", { length: 10 }), // YYYY-MM-DD
  ssnLast4: varchar("ssn_last4", { length: 4 }), // encrypted at rest by DB
  idType: varchar("id_type", { length: 64 }), // drivers_license, passport, state_id
  idLast4: varchar("id_last4", { length: 4 }),
  // Address
  streetAddress: varchar("street_address", { length: 255 }),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 64 }),
  zipCode: varchar("zip_code", { length: 16 }),
  country: varchar("country", { length: 64 }).default("US"),
  // NDA / Trust gate
  ndaSignedAt: timestamp("nda_signed_at"),
  ndaIpAddress: varchar("nda_ip_address", { length: 64 }),
  ndaVersion: varchar("nda_version", { length: 16 }).default("1.0"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type RepOnboardingData = typeof repOnboardingData.$inferSelect;
export type InsertRepOnboardingData = typeof repOnboardingData.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP PERFORMANCE SCORES — Daily snapshots of rep performance
   ═══════════════════════════════════════════════════════ */
export const repPerformanceScores = mysqlTable("rep_performance_scores", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("rep_id").notNull(),
  // Overall score (0-100)
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  // Component scores (0-100 each)
  activityScore: decimal("activity_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  closeRateScore: decimal("close_rate_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  clientSatisfactionScore: decimal("client_satisfaction_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  valuesComplianceScore: decimal("values_compliance_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  // Raw metrics for the period
  callsMade: int("calls_made").default(0).notNull(),
  followUpsSent: int("follow_ups_sent").default(0).notNull(),
  meetingsBooked: int("meetings_booked").default(0).notNull(),
  dealsClosed: int("deals_closed").default(0).notNull(),
  leadsAssigned: int("leads_assigned").default(0).notNull(),
  leadsConverted: int("leads_converted").default(0).notNull(),
  // Period
  periodDate: timestamp("period_date").notNull(), // The date this score covers
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type RepPerformanceScore = typeof repPerformanceScores.$inferSelect;
export type InsertRepPerformanceScore = typeof repPerformanceScores.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP ACTIVITY LOG — Timestamped record of all rep actions
   ═══════════════════════════════════════════════════════ */
export const repActivityLog = mysqlTable("rep_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("rep_id").notNull(),
  activityType: mysqlEnum("activity_type", [
    "call_made", "call_received", "email_sent", "email_received",
    "meeting_booked", "meeting_completed", "follow_up_sent",
    "proposal_sent", "deal_closed", "deal_lost",
    "lead_accepted", "lead_rejected", "lead_timeout",
    "login", "training_completed", "quiz_passed"
  ]).notNull(),
  // Optional references
  leadId: int("lead_id"),
  customerId: int("customer_id"),
  contractId: int("contract_id"),
  // Details
  notes: text("notes"),
  durationSeconds: int("duration_seconds"), // For calls/meetings
  outcome: varchar("outcome", { length: 128 }), // e.g., "interested", "not_interested", "voicemail"
  metadata: json("metadata"), // Flexible extra data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type RepActivityLogEntry = typeof repActivityLog.$inferSelect;
export type InsertRepActivityLogEntry = typeof repActivityLog.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP STRIKES — Violations, warnings, and disciplinary actions
   ═══════════════════════════════════════════════════════ */
export const repStrikes = mysqlTable("rep_strikes", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("rep_id").notNull(),
  severity: mysqlEnum("severity", ["warning", "strike", "instant_deactivation"]).notNull(),
  category: mysqlEnum("category", [
    "values_violation", "performance", "professionalism",
    "fraud", "confidentiality_breach", "client_harm",
    "misrepresentation", "inactivity"
  ]).notNull(),
  description: text("description").notNull(),
  evidence: text("evidence"), // AI-generated evidence summary
  source: mysqlEnum("source", ["ai_monitor", "client_feedback", "admin_manual", "system_auto"]).default("system_auto").notNull(),
  status: mysqlEnum("status", ["pending_review", "confirmed", "dismissed", "appealed"]).default("pending_review").notNull(),
  // Resolution
  resolvedBy: int("resolved_by"), // Admin user ID who reviewed
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"), // Admin notes on resolution
  // Required action
  requiredAction: varchar("required_action", { length: 255 }), // e.g., "retrain:values-ethics", "probation:30d"
  actionCompletedAt: timestamp("action_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type RepStrike = typeof repStrikes.$inferSelect;
export type InsertRepStrike = typeof repStrikes.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP TIERS — Current tier and tier history
   ═══════════════════════════════════════════════════════ */
export const repTiers = mysqlTable("rep_tiers", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("rep_id").notNull(),
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum"]).default("bronze").notNull(),
  commissionRate: decimal("commission_rate", { precision: 4, scale: 2 }).default("10.00").notNull(), // Base 10%
  // Tier qualification metrics (rolling 30-day)
  monthlyRevenue: decimal("monthly_revenue", { precision: 12, scale: 2 }).default("0.00").notNull(),
  monthsActive: int("months_active").default(0).notNull(),
  // Residual decay rate (1.0 = no decay, 0.0 = fully decayed)
  residualDecayRate: decimal("residual_decay_rate", { precision: 3, scale: 2 }).default("1.00").notNull(),
  lastActiveAt: timestamp("last_active_at"), // Last meaningful activity
  // History
  promotedAt: timestamp("promoted_at"), // When they reached this tier
  previousTier: mysqlEnum("previous_tier", ["bronze", "silver", "gold", "platinum"]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type RepTier = typeof repTiers.$inferSelect;
export type InsertRepTier = typeof repTiers.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP LEAD ALLOCATIONS — Lead assignment history
   ═══════════════════════════════════════════════════════ */
export const repLeadAllocations = mysqlTable("rep_lead_allocations", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("rep_id").notNull(),
  leadId: int("lead_id").notNull(),
  // Score at time of assignment
  scoreAtAssignment: decimal("score_at_assignment", { precision: 5, scale: 2 }).notNull(),
  tierAtAssignment: mysqlEnum("tier_at_assignment", ["bronze", "silver", "gold", "platinum"]).notNull(),
  // Assignment lifecycle
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
  timeoutAt: timestamp("timeout_at"), // When this assignment expires if not accepted
  status: mysqlEnum("status", ["assigned", "accepted", "timeout", "rejected", "completed", "lost"]).default("assigned").notNull(),
  // Outcome
  outcome: varchar("outcome", { length: 128 }), // e.g., "closed_won", "closed_lost", "reassigned"
  reassignedTo: int("reassigned_to"), // If timed out, who got it next
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type RepLeadAllocation = typeof repLeadAllocations.$inferSelect;
export type InsertRepLeadAllocation = typeof repLeadAllocations.$inferInsert;

/* ═══════════════════════════════════════════════════════
   TEAM FEED — Announcements, wins, and community posts
   ═══════════════════════════════════════════════════════ */
export const teamFeed = mysqlTable("team_feed", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("rep_id"), // null = system/admin post
  type: mysqlEnum("type", [
    "announcement",   // Admin announcements
    "deal_closed",    // Auto-posted when a rep closes a deal
    "certification",  // Auto-posted when a rep completes Academy
    "tier_promotion", // Auto-posted when a rep advances a tier
    "milestone",      // Auto-posted for streaks, badges, etc.
    "tip",            // Rep shares a tip or insight
    "shoutout",       // Rep gives a shoutout to another rep
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  // Optional metadata
  metadata: json("metadata"), // e.g., { dealValue: 5000, tier: "silver", mentionedRepId: 5 }
  isPinned: boolean("is_pinned").default(false).notNull(),
  // Engagement
  likes: int("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type TeamFeedEntry = typeof teamFeed.$inferSelect;
export type InsertTeamFeedEntry = typeof teamFeed.$inferInsert;

/* ═══════════════════════════════════════════════════════
   NPS_SURVEYS — Net Promoter Score feedback from customers
   ═══════════════════════════════════════════════════════ */
export const npsSurveys = mysqlTable("nps_surveys", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  contractId: int("contractId"),
  score: int("score"), // 0-10, null until completed
  feedback: text("feedback"),
  milestone: mysqlEnum("milestone", ["30_day", "6_month", "annual"]).notNull(),
  status: mysqlEnum("status", ["sent", "completed", "expired"]).default("sent").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type NpsSurvey = typeof npsSurveys.$inferSelect;
export type InsertNpsSurvey = typeof npsSurveys.$inferInsert;

/* ═══════════════════════════════════════════════════════
   CUSTOMER_REFERRALS — Track customer-to-customer referrals
   ═══════════════════════════════════════════════════════ */
export const customerReferrals = mysqlTable("customer_referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(), // customer who referred
  referredEmail: varchar("referredEmail", { length: 320 }).notNull(),
  referredName: varchar("referredName", { length: 255 }),
  status: mysqlEnum("status", ["invited", "signed_up", "converted"]).default("invited").notNull(),
  rewardGiven: boolean("rewardGiven").default(false).notNull(),
  convertedCustomerId: int("convertedCustomerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CustomerReferral = typeof customerReferrals.$inferSelect;
export type InsertCustomerReferral = typeof customerReferrals.$inferInsert;

/* ═══════════════════════════════════════════════════════
   SUPPORT_TICKETS — Customer→Admin support requests
   ═══════════════════════════════════════════════════════ */
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  category: mysqlEnum("category", ["billing", "technical", "website_change", "general", "other"]).default("general").notNull(),
  customerRating: int("customerRating"),
  ratingToken: varchar("ratingToken", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/* ═══════════════════════════════════════════════════════
   SUPPORT_TICKET_REPLIES — Thread replies on tickets
   ═══════════════════════════════════════════════════════ */
export const supportTicketReplies = mysqlTable("support_ticket_replies", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  authorId: int("authorId").notNull(),
  authorRole: mysqlEnum("authorRole", ["customer", "admin"]).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SupportTicketReply = typeof supportTicketReplies.$inferSelect;
export type InsertSupportTicketReply = typeof supportTicketReplies.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP_MESSAGES — Rep↔Admin direct messaging
   ═══════════════════════════════════════════════════════ */
export const repMessages = mysqlTable("rep_messages", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  senderRole: mysqlEnum("senderRole", ["rep", "admin"]).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RepMessage = typeof repMessages.$inferSelect;
export type InsertRepMessage = typeof repMessages.$inferInsert;

/* ═══════════════════════════════════════════════════════
   PRODUCT_CATALOG — DB-driven pricing source
   ═══════════════════════════════════════════════════════ */
export const productCatalog = mysqlTable("product_catalog", {
  id: int("id").autoincrement().primaryKey(),
  productKey: varchar("productKey", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["package", "addon", "one_time"]).default("package").notNull(),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  discountPercent: int("discountPercent").default(0).notNull(),
  discountDuration: mysqlEnum("discountDuration", ["once", "repeating", "forever"]).default("once").notNull(),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  stripeProductId: varchar("stripeProductId", { length: 100 }),
  stripeDiscountPriceId: varchar("stripeDiscountPriceId", { length: 100 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProductCatalogItem = typeof productCatalog.$inferSelect;
export type InsertProductCatalogItem = typeof productCatalog.$inferInsert;

/* ═══════════════════════════════════════════════════════
   BROADCASTS — Bulk email campaigns to audiences
   ═══════════════════════════════════════════════════════ */
export const broadcasts = mysqlTable("broadcasts", {
  id: int("id").autoincrement().primaryKey(),
  subject: varchar("subject", { length: 255 }).notNull(),
  audience: mysqlEnum("audience", ["all_customers", "active_contracts", "all_reps", "all_leads"]).notNull(),
  body: text("body").notNull(),
  recipientCount: int("recipientCount").default(0).notNull(),
  status: mysqlEnum("status", ["draft", "sending", "sent", "failed"]).default("draft").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Broadcast = typeof broadcasts.$inferSelect;
export type InsertBroadcast = typeof broadcasts.$inferInsert;

/* ═══════════════════════════════════════════════════════
   SCORING MODEL — ML weight persistence for lead scoring
   ═══════════════════════════════════════════════════════ */
export const scoringModel = mysqlTable("scoring_model", {
  id: int("id").autoincrement().primaryKey(),
  modelVersion: varchar("modelVersion", { length: 64 }).notNull(),
  weights: json("weights").notNull(),
  trainingSize: int("trainingSize").default(0).notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ScoringModel = typeof scoringModel.$inferSelect;

/* ═══════════════════════════════════════════════════════
   COACHING INSIGHTS — Admin-curated lessons from real coaching feedback
   ═══════════════════════════════════════════════════════ */
export const coachingInsights = mysqlTable("coaching_insights", {
  id: int("id").autoincrement().primaryKey(),
  feedbackId: int("feedbackId").notNull(), // references ai_coaching_feedback.id
  repId: int("repId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  lessonContent: text("lessonContent").notNull(), // markdown
  category: mysqlEnum("ci_category", [
    "objection_handling", "closing", "rapport", "discovery",
    "product_knowledge", "tone", "follow_up", "listening", "urgency", "personalization"
  ]).notNull(),
  status: mysqlEnum("ci_status", ["pending_review", "published", "rejected"]).default("pending_review").notNull(),
  publishedAt: timestamp("publishedAt"),
  publishedBy: int("publishedBy"),
  createdAt: timestamp("ci_createdAt").defaultNow().notNull(),
});
export type CoachingInsight = typeof coachingInsights.$inferSelect;
export type InsertCoachingInsight = typeof coachingInsights.$inferInsert;

/* ═══════════════════════════════════════════════════════
   REP AVAILABILITY — Weekly schedule for lead routing
   ═══════════════════════════════════════════════════════ */
export const repAvailability = mysqlTable("rep_availability", {
  id: int("id").autoincrement().primaryKey(),
  repId: int("repId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0=Sunday, 6=Saturday
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM (24h)
  endTime: varchar("endTime", { length: 5 }).notNull(),   // HH:MM (24h)
  isAvailable: boolean("isAvailable").default(true).notNull(),
  timezone: varchar("timezone", { length: 64 }).default("America/Chicago").notNull(),
  createdAt: timestamp("ra_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("ra_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RepAvailability = typeof repAvailability.$inferSelect;
export type InsertRepAvailability = typeof repAvailability.$inferInsert;

/* ═══════════════════════════════════════════════════════
   SYSTEM SETTINGS — Global admin-controlled feature flags
   ═══════════════════════════════════════════════════════ */
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 128 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  description: text("description"),
  updatedAt: timestamp("ss_updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type InsertScoringModel = typeof scoringModel.$inferInsert;

/* ═══════════════════════════════════════════════════════
   LEAD_COSTS — Per-lead cost tracking for every API call and action
   ═══════════════════════════════════════════════════════ */
export const leadCosts = mysqlTable("lead_costs", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId"),
  scrapedBusinessId: int("scrapedBusinessId"),
  customerId: int("customerId"),
  costType: mysqlEnum("costType", [
    "scraping",
    "enrichment",
    "outreach_email",
    "outreach_sms",
    "outreach_call",
    "ai_generation",
    "ai_conversation",
    "ai_coaching",
    "ai_monthly",
    "domain",
    "hosting",
    "commission",
    "commission_recurring",
    "phone_number",
  ]).notNull(),
  amountCents: int("amountCents").notNull(),
  description: varchar("description", { length: 255 }),
  tokensUsed: int("tokensUsed"),
  durationSeconds: int("durationSeconds"),
  repId: int("repId"),
  month: varchar("month", { length: 7 }),
  createdAt: timestamp("lc_createdAt").defaultNow().notNull(),
});
export type LeadCost = typeof leadCosts.$inferSelect;
export type InsertLeadCost = typeof leadCosts.$inferInsert;
