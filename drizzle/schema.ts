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
  type: mysqlEnum("type", ["initial_sale", "renewal", "upsell"]).default("initial_sale").notNull(),
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
  type: mysqlEnum("type", ["tier_upgrade", "add_pages", "add_feature", "add_service"])
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
