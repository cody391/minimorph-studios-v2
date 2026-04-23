import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
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
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
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
  stripeConnectAccountId: varchar("stripeConnectAccountId", { length: 128 }),
  stripeConnectOnboarded: boolean("stripeConnectOnboarded").default(false),
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
  source: mysqlEnum("source", ["ai_sourced", "website_form", "referral", "manual"])
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
  packageTier: mysqlEnum("packageTier", ["starter", "growth", "premium"]).notNull(),
  monthlyPrice: decimal("monthlyPrice", { precision: 8, scale: 2 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["active", "expiring_soon", "expired", "renewed", "cancelled"])
    .default("active")
    .notNull(),
  renewalStatus: mysqlEnum("renewalStatus", ["not_started", "nurturing", "proposed", "accepted", "declined"])
    .default("not_started")
    .notNull(),
  websitePages: int("websitePages").default(5).notNull(),
  features: json("features"),
  notes: text("notes"),
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
  type: mysqlEnum("type", ["initial_sale", "renewal", "upsell", "referral_bonus"]).default("initial_sale").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "paid"]).default("pending").notNull(),
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
  packageTier: mysqlEnum("packageTier", ["starter", "growth", "premium"]).notNull(),
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
  packageTier: mysqlEnum("packageTier", ["starter", "growth", "premium"]).notNull(),

  // Domain handling
  domainOption: mysqlEnum("domainOption", ["existing", "new", "undecided"]).default("undecided"),
  existingDomain: varchar("existingDomain", { length: 512 }),
  domainRegistrar: varchar("domainRegistrar", { length: 255 }),
  domainNotes: text("domainNotes"),

  // Questionnaire responses (stored as JSON)
  questionnaire: json("questionnaire"),
  // Example structure:
  // {
  //   brandColors: string[],
  //   brandTone: "professional" | "friendly" | "bold" | "elegant" | "playful",
  //   targetAudience: string,
  //   competitors: string[],
  //   contentPreference: "we_write" | "customer_provides" | "mix",
  //   mustHaveFeatures: string[],
  //   inspirationUrls: string[],
  //   specialRequests: string
  // }

  // Design review
  designMockupUrl: varchar("designMockupUrl", { length: 512 }),
  feedbackNotes: text("feedbackNotes"),
  revisionsCount: int("revisionsCount").default(0).notNull(),
  maxRevisions: int("maxRevisions").default(3).notNull(),

  // Launch
  launchedAt: timestamp("launchedAt"),
  liveUrl: varchar("liveUrl", { length: 512 }),

  assignedRepId: int("assignedRepId"),
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
  type: mysqlEnum("type", ["call", "email", "meeting", "proposal", "follow_up", "note", "deal_closed"]).notNull(),
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
  reviewNotes: text("reviewNotes"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RepApplication = typeof repApplications.$inferSelect;
export type InsertRepApplication = typeof repApplications.$inferInsert;
