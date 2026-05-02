import { eq, desc, and, or, sql, gte, lte, inArray, ne, isNull, avg } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  reps,
  InsertRep,
  leads,
  InsertLead,
  customers,
  InsertCustomer,
  leadCosts,
  InsertLeadCost,
  contracts,
  InsertContract,
  commissions,
  InsertCommission,
  nurtureLogs,
  InsertNurtureLog,
  reports,
  InsertReport,
  upsellOpportunities,
  InsertUpsellOpportunity,
  contactSubmissions,
  InsertContactSubmission,
  orders,
  InsertOrder,
  onboardingProjects,
  InsertOnboardingProject,
  projectAssets,
  aiChatLogs,
  InsertAiChatLog,
  widgetCatalog,
  InsertWidgetCatalogItem,
  InsertProjectAsset,
  repTrainingModules,
  InsertRepTrainingModule,
  repTrainingProgress,
  InsertRepTrainingProgress,
  repQuizResults,
  InsertRepQuizResult,
  repActivityLogs,
  InsertRepActivityLog,
  repGamification,
  InsertRepGamification,
  repEmailTemplates,
  InsertRepEmailTemplate,
  repSentEmails,
  InsertRepSentEmail,
  repApplications,
  InsertRepApplication,
  repNotifications,
  InsertRepNotification,
  smsMessages,
  InsertSmsMessage,
  callLogs,
  InsertCallLog,
  aiCoachingFeedback,
  InsertAiCoachingFeedback,
  trainingInsights,
  InsertTrainingInsight,
  repSupportTickets,
  InsertRepSupportTicket,
  repNotificationPreferences,
  InsertRepNotificationPreference,
  pushSubscriptions,
  InsertPushSubscription,
  repTiers,
  supportTickets,
  InsertSupportTicket,
  supportTicketReplies,
  InsertSupportTicketReply,
  repMessages,
  InsertRepMessage,
  productCatalog,
  InsertProductCatalogItem,
  broadcasts,
  InsertBroadcast,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/* ═══════════════════════════════════════════════════════
   USERS
   ═══════════════════════════════════════════════════════ */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.passwordHash !== undefined) { values.passwordHash = user.passwordHash; updateSet.passwordHash = user.passwordHash; }
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId || (ENV.adminEmail && user.email === ENV.adminEmail)) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/* ═══════════════════════════════════════════════════════
   REPS
   ═══════════════════════════════════════════════════════ */
export async function createRep(data: InsertRep) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(reps).values(data);
  return { id: result[0].insertId };
}

export async function getRepById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reps).where(eq(reps.id, id)).limit(1);
  return result[0];
}

export async function getRepByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reps).where(eq(reps.userId, userId)).limit(1);
  return result[0];
}

export async function listReps(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter) {
    return db.select().from(reps).where(eq(reps.status, statusFilter as any)).orderBy(desc(reps.createdAt));
  }
  return db.select().from(reps).orderBy(desc(reps.createdAt));
}

export async function updateRep(id: number, data: Partial<InsertRep>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(reps).set(data).where(eq(reps.id, id));
}

/* ═══════════════════════════════════════════════════════
   LEADS
   ═══════════════════════════════════════════════════════ */
export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(leads).values(data);
  return { id: result[0].insertId };
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0];
}

export async function listLeads(filters?: { stage?: string; temperature?: string; assignedRepId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.stage) conditions.push(eq(leads.stage, filters.stage as any));
  if (filters?.temperature) conditions.push(eq(leads.temperature, filters.temperature as any));
  if (filters?.assignedRepId) conditions.push(eq(leads.assignedRepId, filters.assignedRepId));
  if (conditions.length > 0) {
    return db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.createdAt));
  }
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

/* ═══════════════════════════════════════════════════════
   CUSTOMERS
   ═══════════════════════════════════════════════════════ */
export async function createCustomer(data: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(customers).values(data);
  return { id: result[0].insertId };
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0];
}

export async function listCustomers(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter) {
    return db.select().from(customers).where(eq(customers.status, statusFilter as any)).orderBy(desc(customers.createdAt));
  }
  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(customers).set(data).where(eq(customers.id, id));
}

/* ═══════════════════════════════════════════════════════
   CONTRACTS
   ═══════════════════════════════════════════════════════ */
export async function createContract(data: InsertContract) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contracts).values(data);
  return { id: result[0].insertId };
}

export async function getContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result[0];
}

export async function listContractsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contracts).where(eq(contracts.customerId, customerId)).orderBy(desc(contracts.createdAt));
}

export async function listContractsByRep(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contracts).where(eq(contracts.repId, repId)).orderBy(desc(contracts.createdAt));
}

export async function listContracts(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter) {
    return db.select().from(contracts).where(eq(contracts.status, statusFilter as any)).orderBy(desc(contracts.createdAt));
  }
  return db.select().from(contracts).orderBy(desc(contracts.createdAt));
}

export async function updateContract(id: number, data: Partial<InsertContract>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contracts).set(data).where(eq(contracts.id, id));
}

/* ═══════════════════════════════════════════════════════
   COMMISSIONS
   ═══════════════════════════════════════════════════════ */
export async function createCommission(data: InsertCommission) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(commissions).values(data);
  return { id: result[0].insertId };
}

export async function listCommissionsByRep(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commissions).where(eq(commissions.repId, repId)).orderBy(desc(commissions.createdAt));
}

export async function listCommissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commissions).orderBy(desc(commissions.createdAt));
}

export async function updateCommission(id: number, data: Partial<InsertCommission>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(commissions).set(data).where(eq(commissions.id, id));
}

// Get active commissions by contract (for recurring payouts)
export async function getActiveCommissionsByContract(contractId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commissions)
    .where(and(eq(commissions.contractId, contractId), ne(commissions.status, "cancelled")))
    .orderBy(desc(commissions.createdAt));
}

// Cancel all pending/approved commissions for a contract (when customer stops paying)
export async function cancelCommissionsByContract(contractId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(commissions)
    .set({ status: "cancelled" })
    .where(and(
      eq(commissions.contractId, contractId),
      ne(commissions.status, "paid"),
      ne(commissions.status, "cancelled"),
    ));
}

/* ═══════════════════════════════════════════════════════
   NURTURE LOGS
   ═══════════════════════════════════════════════════════ */
export async function createNurtureLog(data: InsertNurtureLog) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(nurtureLogs).values(data);
  return { id: result[0].insertId };
}

export async function listNurtureLogsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(nurtureLogs).where(eq(nurtureLogs.customerId, customerId)).orderBy(desc(nurtureLogs.createdAt));
}

export async function listAllNurtureLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(nurtureLogs).orderBy(desc(nurtureLogs.createdAt)).limit(200);
}
export async function updateNurtureLog(id: number, data: Partial<InsertNurtureLog>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(nurtureLogs).set(data).where(eq(nurtureLogs.id, id));
}

/* ═══════════════════════════════════════════════════════
   REPORTS
   ═══════════════════════════════════════════════════════ */
export async function createReport(data: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(reports).values(data);
  return { id: result[0].insertId };
}

export async function listReportsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.customerId, customerId)).orderBy(desc(reports.createdAt));
}

export async function listAllReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).orderBy(desc(reports.createdAt)).limit(200);
}
export async function updateReport(id: number, data: Partial<InsertReport>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(reports).set(data).where(eq(reports.id, id));
}

/* ═══════════════════════════════════════════════════════
   UPSELL OPPORTUNITIES
   ═══════════════════════════════════════════════════════ */
export async function createUpsellOpportunity(data: InsertUpsellOpportunity) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(upsellOpportunities).values(data);
  return { id: result[0].insertId };
}

export async function listUpsellsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(upsellOpportunities).where(eq(upsellOpportunities.customerId, customerId)).orderBy(desc(upsellOpportunities.createdAt));
}

export async function listUpsells(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter) {
    return db.select().from(upsellOpportunities).where(eq(upsellOpportunities.status, statusFilter as any)).orderBy(desc(upsellOpportunities.createdAt));
  }
  return db.select().from(upsellOpportunities).orderBy(desc(upsellOpportunities.createdAt));
}

export async function updateUpsellOpportunity(id: number, data: Partial<InsertUpsellOpportunity>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(upsellOpportunities).set(data).where(eq(upsellOpportunities.id, id));
}

/* ═══════════════════════════════════════════════════════
   CONTACT SUBMISSIONS
   ═══════════════════════════════════════════════════════ */
export async function createContactSubmission(data: InsertContactSubmission) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contactSubmissions).values(data);
  return { id: result[0].insertId };
}

export async function listContactSubmissions(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (statusFilter) {
    return db.select().from(contactSubmissions).where(eq(contactSubmissions.status, statusFilter as any)).orderBy(desc(contactSubmissions.createdAt));
  }
  return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
}

export async function updateContactSubmission(id: number, data: Partial<InsertContactSubmission>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contactSubmissions).set(data).where(eq(contactSubmissions.id, id));
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD STATS (aggregated queries)
   ═══════════════════════════════════════════════════════ */
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [repCount] = await db.select({ count: sql<number>`count(*)` }).from(reps);
  const [activeRepCount] = await db.select({ count: sql<number>`count(*)` }).from(reps).where(inArray(reps.status, ["active", "certified"]));
  const [leadCount] = await db.select({ count: sql<number>`count(*)` }).from(leads);
  const [hotLeadCount] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.temperature, "hot"));
  const [customerCount] = await db.select({ count: sql<number>`count(*)` }).from(customers);
  const [activeContractCount] = await db.select({ count: sql<number>`count(*)` }).from(contracts).where(eq(contracts.status, "active"));
  const [totalRevenue] = await db.select({ total: sql<string>`COALESCE(SUM(monthlyPrice), 0)` }).from(contracts).where(eq(contracts.status, "active"));
  const [pendingCommissions] = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` }).from(commissions).where(eq(commissions.status, "pending"));

  return {
    totalReps: repCount.count,
    activeReps: activeRepCount.count,
    totalLeads: leadCount.count,
    hotLeads: hotLeadCount.count,
    totalCustomers: customerCount.count,
    activeContracts: activeContractCount.count,
    monthlyRevenue: totalRevenue.total,
    pendingCommissions: pendingCommissions.total,
  };
}

/* ═══════════════════════════════════════════════════════
   ORDERS — Stripe payment tracking
   ═══════════════════════════════════════════════════════ */
export async function createOrder(data: {
  userId: number;
  stripeCheckoutSessionId?: string;
  packageTier: "starter" | "growth" | "premium" | "enterprise";
  amount: number;
  customerEmail?: string;
  customerName?: string;
  businessName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values({
    userId: data.userId,
    stripeCheckoutSessionId: data.stripeCheckoutSessionId || null,
    packageTier: data.packageTier,
    amount: data.amount,
    status: "pending",
    currency: "usd",
    customerEmail: data.customerEmail || null,
    customerName: data.customerName || null,
    businessName: data.businessName || null,
  });
  return { id: result[0].insertId };
}

export async function listOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function listAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.stripeCheckoutSessionId, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateOrderBySessionId(sessionId: string, data: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set(data as any).where(eq(orders.stripeCheckoutSessionId, sessionId));
}

/* ═══════════════════════════════════════════════════════
   ONBOARDING PROJECTS
   ═══════════════════════════════════════════════════════ */
export async function createOnboardingProject(data: InsertOnboardingProject) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(onboardingProjects).values(data);
  return { id: result[0].insertId };
}

export async function getOnboardingProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(onboardingProjects).where(eq(onboardingProjects.id, id)).limit(1);
  return result[0];
}

export async function getOnboardingProjectByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(onboardingProjects).where(eq(onboardingProjects.customerId, customerId)).orderBy(desc(onboardingProjects.createdAt)).limit(1);
  return result[0];
}

export async function listOnboardingProjects(stageFilter?: string) {
  const db = await getDb();
  if (!db) return [];
  if (stageFilter) {
    return db.select().from(onboardingProjects).where(eq(onboardingProjects.stage, stageFilter as any)).orderBy(desc(onboardingProjects.createdAt));
  }
  return db.select().from(onboardingProjects).orderBy(desc(onboardingProjects.createdAt));
}

export async function updateOnboardingProject(id: number, data: Partial<InsertOnboardingProject>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(onboardingProjects).set(data).where(eq(onboardingProjects.id, id));
}

/* ═══════════════════════════════════════════════════════
   PROJECT ASSETS
   ═══════════════════════════════════════════════════════ */
export async function createProjectAsset(data: InsertProjectAsset) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(projectAssets).values(data);
  return { id: result[0].insertId };
}

export async function listProjectAssets(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectAssets).where(eq(projectAssets.projectId, projectId)).orderBy(desc(projectAssets.createdAt));
}

export async function deleteProjectAsset(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(projectAssets).where(eq(projectAssets.id, id));
}

/* ═══════════════════════════════════════════════════════
   AI CHAT LOGS
   ═══════════════════════════════════════════════════════ */
export async function createAiChatLog(data: InsertAiChatLog) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(aiChatLogs).values(data);
  return { id: result[0].insertId };
}
export async function listAiChatLogs(opts: { context: "onboarding" | "portal"; userId?: number; projectId?: number; customerId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(aiChatLogs.context, opts.context)];
  if (opts.userId) conditions.push(eq(aiChatLogs.userId, opts.userId));
  if (opts.projectId) conditions.push(eq(aiChatLogs.projectId, opts.projectId));
  if (opts.customerId) conditions.push(eq(aiChatLogs.customerId, opts.customerId));
  return db.select().from(aiChatLogs).where(and(...conditions)).orderBy(aiChatLogs.createdAt);
}

/* ═══════════════════════════════════════════════════════
   WIDGET CATALOG
   ═══════════════════════════════════════════════════════ */
export async function createWidgetCatalogItem(data: InsertWidgetCatalogItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(widgetCatalog).values(data);
  return { id: result[0].insertId };
}
export async function listWidgetCatalog(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(widgetCatalog).where(eq(widgetCatalog.isActive, true)).orderBy(widgetCatalog.sortOrder);
  }
  return db.select().from(widgetCatalog).orderBy(widgetCatalog.sortOrder);
}
export async function getWidgetBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(widgetCatalog).where(eq(widgetCatalog.slug, slug)).limit(1);
  return result[0];
}
export async function updateWidgetCatalogItem(id: number, data: Partial<InsertWidgetCatalogItem>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(widgetCatalog).set(data).where(eq(widgetCatalog.id, id));
}
export async function getCustomerByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  return result[0];
}

export async function getCustomerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.userId, userId as any)).limit(1);
  return result[0];
}

/* ═══════════════════════════════════════════════════════
   REP TRAINING MODULES
   ═══════════════════════════════════════════════════════ */
export async function listTrainingModules(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(repTrainingModules).where(eq(repTrainingModules.isActive, true)).orderBy(repTrainingModules.sortOrder);
  }
  return db.select().from(repTrainingModules).orderBy(repTrainingModules.sortOrder);
}
export async function getTrainingModule(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(repTrainingModules).where(eq(repTrainingModules.id, id)).limit(1);
  return result[0];
}
export async function createTrainingModule(data: InsertRepTrainingModule) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repTrainingModules).values(data);
  return { id: result[0].insertId };
}
export async function updateTrainingModule(id: number, data: Partial<InsertRepTrainingModule>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(repTrainingModules).set(data).where(eq(repTrainingModules.id, id));
}
/* ═══════════════════════════════════════════════════════
   REP TRAINING PROGRESS
   ═══════════════════════════════════════════════════════ */
export async function getRepTrainingProgress(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repTrainingProgress).where(eq(repTrainingProgress.repId, repId));
}
export async function upsertTrainingProgress(repId: number, moduleId: number, status: "not_started" | "in_progress" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(repTrainingProgress)
    .where(and(eq(repTrainingProgress.repId, repId), eq(repTrainingProgress.moduleId, moduleId))).limit(1);
  if (existing.length > 0) {
    await db.update(repTrainingProgress)
      .set({ status, completedAt: status === "completed" ? new Date() : null })
      .where(eq(repTrainingProgress.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(repTrainingProgress).values({
      repId, moduleId, status, completedAt: status === "completed" ? new Date() : undefined,
    });
    return result[0].insertId;
  }
}
/* ═══════════════════════════════════════════════════════
   REP QUIZ RESULTS
   ═══════════════════════════════════════════════════════ */
export async function createQuizResult(data: InsertRepQuizResult) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repQuizResults).values(data);
  return { id: result[0].insertId };
}
export async function getRepQuizResults(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repQuizResults).where(eq(repQuizResults.repId, repId)).orderBy(desc(repQuizResults.createdAt));
}
/* ═══════════════════════════════════════════════════════
   REP ACTIVITY LOGS
   ═══════════════════════════════════════════════════════ */
export async function createActivityLog(data: InsertRepActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repActivityLogs).values(data);
  return { id: result[0].insertId };
}
export async function listRepActivities(repId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repActivityLogs).where(eq(repActivityLogs.repId, repId)).orderBy(desc(repActivityLogs.createdAt)).limit(limit);
}
export async function getRepActivityStats(repId: number) {
  const db = await getDb();
  if (!db) return { totalActivities: 0, todayActivities: 0, totalPoints: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [total] = await db.select({ count: sql<number>`count(*)`, points: sql<number>`COALESCE(sum(pointsEarned), 0)` })
    .from(repActivityLogs).where(eq(repActivityLogs.repId, repId));
  const [todayCount] = await db.select({ count: sql<number>`count(*)` })
    .from(repActivityLogs).where(and(eq(repActivityLogs.repId, repId), gte(repActivityLogs.createdAt, today)));
  return { totalActivities: total?.count || 0, todayActivities: todayCount?.count || 0, totalPoints: total?.points || 0 };
}
export async function getRepFollowUps(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repActivityLogs)
    .where(and(eq(repActivityLogs.repId, repId), sql`followUpAt IS NOT NULL AND followUpAt >= NOW()`))
    .orderBy(repActivityLogs.followUpAt).limit(20);
}
/* ═══════════════════════════════════════════════════════
   REP GAMIFICATION
   ═══════════════════════════════════════════════════════ */
export async function getRepGamification(repId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(repGamification).where(eq(repGamification.repId, repId)).limit(1);
  return result[0];
}
export async function upsertRepGamification(repId: number, data: Partial<InsertRepGamification>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(repGamification).where(eq(repGamification.repId, repId)).limit(1);
  if (existing.length > 0) {
    await db.update(repGamification).set(data).where(eq(repGamification.repId, repId));
    return existing[0].id;
  } else {
    const result = await db.insert(repGamification).values({ repId, ...data } as any);
    return result[0].insertId;
  }
}
export async function getLeaderboard(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    repId: repGamification.repId,
    totalPoints: repGamification.totalPoints,
    level: repTiers.tier, // accountability tier (bronze/silver/gold/platinum)
    currentStreak: repGamification.currentStreak,
    monthlyDeals: repGamification.monthlyDeals,
    repName: reps.fullName,
    profilePhotoUrl: reps.profilePhotoUrl,
    totalDeals: reps.totalDeals,
    totalRevenue: reps.totalRevenue,
  }).from(repGamification)
    .leftJoin(reps, eq(repGamification.repId, reps.id))
    .leftJoin(repTiers, eq(repGamification.repId, repTiers.repId))
    .orderBy(desc(repGamification.totalPoints))
    .limit(limit);
}
/* ═══════════════════════════════════════════════════════
   REP EMAIL TEMPLATES
   ═══════════════════════════════════════════════════════ */
export async function listEmailTemplates(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(repEmailTemplates).where(eq(repEmailTemplates.isActive, true)).orderBy(repEmailTemplates.sortOrder);
  }
  return db.select().from(repEmailTemplates).orderBy(repEmailTemplates.sortOrder);
}
export async function getEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(repEmailTemplates).where(eq(repEmailTemplates.id, id)).limit(1);
  return result[0];
}
export async function createEmailTemplate(data: InsertRepEmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repEmailTemplates).values(data);
  return { id: result[0].insertId };
}
export async function updateEmailTemplate(id: number, data: Partial<InsertRepEmailTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(repEmailTemplates).set(data).where(eq(repEmailTemplates.id, id));
}
/* ═══════════════════════════════════════════════════════
   REP SENT EMAILS
   ═══════════════════════════════════════════════════════ */
export async function createSentEmail(data: InsertRepSentEmail) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repSentEmails).values(data);
  return { id: result[0].insertId };
}
export async function listRepSentEmails(repId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repSentEmails).where(eq(repSentEmails.repId, repId)).orderBy(desc(repSentEmails.sentAt)).limit(limit);
}
export async function updateEmailResendId(emailId: number, resendMessageId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(repSentEmails).set({ resendMessageId }).where(eq(repSentEmails.id, emailId));
}
export async function updateEmailTrackingStatus(resendMessageId: string, status: string, timestamp: Date) {
  const db = await getDb();
  if (!db) return;
  const updates: Record<string, any> = { status };
  if (status === "delivered") updates.deliveredAt = timestamp;
  if (status === "opened") updates.openedAt = timestamp;
  if (status === "clicked") updates.clickedAt = timestamp;
  if (status === "bounced") updates.bouncedAt = timestamp;
  await db.update(repSentEmails).set(updates).where(eq(repSentEmails.resendMessageId, resendMessageId));
}
export async function getEmailByResendId(resendMessageId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(repSentEmails).where(eq(repSentEmails.resendMessageId, resendMessageId)).limit(1);
  return result[0] ?? null;
}
/* ═══════════════════════════════════════════════════════
   REP APPLICATIONS
   ═══════════════════════════════════════════════════════ */
export async function createRepApplication(data: InsertRepApplication) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repApplications).values(data);
  return { id: result[0].insertId };
}
export async function getRepApplication(repId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(repApplications).where(eq(repApplications.repId, repId)).limit(1);
  return result[0];
}
export async function updateRepApplication(repId: number, data: Partial<InsertRepApplication>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(repApplications).set(data).where(eq(repApplications.repId, repId));
}


/* ═══════════════════════════════════════════════════════
   REP NOTIFICATIONS
   ═══════════════════════════════════════════════════════ */
export async function createRepNotification(data: InsertRepNotification) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(repNotifications).values(data);
  return { id: result[0].insertId };
}
export async function listRepNotifications(repId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repNotifications).where(eq(repNotifications.repId, repId)).orderBy(desc(repNotifications.createdAt)).limit(limit);
}
export async function countUnreadNotifications(repId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(repNotifications)
    .where(and(eq(repNotifications.repId, repId), eq(repNotifications.isRead, false)));
  return result?.count || 0;
}
export async function markNotificationsRead(repId: number, ids?: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (ids && ids.length > 0) {
    await db.update(repNotifications).set({ isRead: true }).where(and(eq(repNotifications.repId, repId), inArray(repNotifications.id, ids)));
  } else {
    await db.update(repNotifications).set({ isRead: true }).where(eq(repNotifications.repId, repId));
  }
}

/* ═══════════════════════════════════════════════════════
   LEADS — Rep-facing helpers
   ═══════════════════════════════════════════════════════ */
export async function listLeadsByRep(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).where(eq(leads.assignedRepId, repId)).orderBy(desc(leads.updatedAt));
}
export async function listUnassignedLeads(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  // Leads that have no rep assigned and are in claimable stages
  const { isNull } = await import("drizzle-orm");
  return db.select().from(leads)
    .where(and(
      isNull(leads.assignedRepId),
      inArray(leads.stage, ["new", "enriched", "warming", "warm"])
    ))
    .orderBy(desc(leads.qualificationScore))
    .limit(limit);
}
export async function claimLead(leadId: number, repId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Atomic claim: only succeeds if lead is currently unassigned
  const result = await db.update(leads)
    .set({ assignedRepId: repId, stage: "assigned", temperature: "warm" })
    .where(and(
      eq(leads.id, leadId),
      sql`assignedRepId IS NULL`
    ));
  return (result[0] as any).affectedRows > 0;
}
export async function countActiveLeadsByRep(repId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(leads)
    .where(and(
      eq(leads.assignedRepId, repId),
      inArray(leads.stage, ["assigned", "contacted", "proposal_sent", "negotiating"])
    ));
  return result?.count || 0;
}
export async function bulkTransferLeads(fromRepId: number, toRepId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.update(leads)
    .set({ assignedRepId: toRepId })
    .where(and(
      eq(leads.assignedRepId, fromRepId),
      inArray(leads.stage, ["assigned", "contacted", "proposal_sent", "negotiating"])
    ));
  return (result[0] as any).affectedRows || 0;
}

// Get a single commission by ID
export async function getCommissionById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [row] = await db.select().from(commissions).where(eq(commissions.id, id));
  return row || null;
}

// Get a single widget catalog item by ID
export async function getWidgetCatalogItem(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(widgetCatalog).where(eq(widgetCatalog.id, id)).limit(1);
  return result[0];
}


/* ═══════════════════════════════════════════════════════
   SMS MESSAGES
   ═══════════════════════════════════════════════════════ */
export async function createSmsMessage(data: InsertSmsMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(smsMessages).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateSmsMessage(id: number, data: Partial<InsertSmsMessage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(smsMessages).set(data).where(eq(smsMessages.id, id));
}

export async function listSmsThread(repId: number, phoneNumber: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(smsMessages)
    .where(and(
      eq(smsMessages.repId, repId),
      or(eq(smsMessages.toNumber, phoneNumber), eq(smsMessages.fromNumber, phoneNumber))
    ))
    .orderBy(desc(smsMessages.createdAt))
    .limit(limit);
}

export async function listRepSmsConversations(repId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get all SMS for this rep, ordered by most recent first
  return db.select().from(smsMessages)
    .where(eq(smsMessages.repId, repId))
    .orderBy(desc(smsMessages.createdAt));
}

/* ═══════════════════════════════════════════════════════
   CALL LOGS
   ═══════════════════════════════════════════════════════ */
export async function createCallLog(data: InsertCallLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(callLogs).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateCallLog(id: number, data: Partial<InsertCallLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(callLogs).set(data).where(eq(callLogs.id, id));
}

export async function updateCallLogByCallSid(callSid: string, data: Partial<InsertCallLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(callLogs).set(data).where(eq(callLogs.twilioCallSid, callSid));
}

export async function getCallLogByCallSid(callSid: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(callLogs).where(eq(callLogs.twilioCallSid, callSid)).limit(1);
  return result[0] ?? null;
}

export async function listRepCallLogs(repId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(callLogs)
    .where(eq(callLogs.repId, repId))
    .orderBy(desc(callLogs.createdAt))
    .limit(limit);
}

/* ═══════════════════════════════════════════════════════
   AI COACHING FEEDBACK
   ═══════════════════════════════════════════════════════ */
export async function createCoachingFeedback(data: InsertAiCoachingFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiCoachingFeedback).values(data);
  return { id: result[0].insertId, ...data };
}

export async function getCoachingFeedback(communicationType: string, referenceId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(aiCoachingFeedback)
    .where(and(
      eq(aiCoachingFeedback.communicationType, communicationType as any),
      eq(aiCoachingFeedback.referenceId, referenceId)
    ))
    .limit(1);
  return result[0] ?? null;
}

export async function listRepCoachingFeedback(repId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiCoachingFeedback)
    .where(eq(aiCoachingFeedback.repId, repId))
    .orderBy(desc(aiCoachingFeedback.createdAt))
    .limit(limit);
}

/* ═══════════════════════════════════════════════════════
   TRAINING INSIGHTS
   ═══════════════════════════════════════════════════════ */
export async function createTrainingInsight(data: InsertTrainingInsight) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(trainingInsights).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateTrainingInsight(id: number, data: Partial<InsertTrainingInsight>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(trainingInsights).set(data).where(eq(trainingInsights.id, id));
}

export async function listTrainingInsights(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(trainingInsights)
      .where(eq(trainingInsights.isActive, true))
      .orderBy(desc(trainingInsights.frequency));
  }
  return db.select().from(trainingInsights).orderBy(desc(trainingInsights.frequency));
}

export async function getTrainingInsightByTitle(title: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(trainingInsights)
    .where(eq(trainingInsights.title, title))
    .limit(1);
  return result[0] ?? null;
}

// Update existing email to track Resend message ID
export async function updateSentEmail(id: number, data: Partial<InsertRepSentEmail>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(repSentEmails).set(data).where(eq(repSentEmails.id, id));
}

export async function getSentEmailById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(repSentEmails).where(eq(repSentEmails.id, id)).limit(1);
  return result[0] ?? null;
}


// ═══════════════════════════════════════════════════════
// REP PROFILE PHOTO
// ═══════════════════════════════════════════════════════
export async function updateRepProfilePhoto(repId: number, photoUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reps).set({ profilePhotoUrl: photoUrl }).where(eq(reps.id, repId));
}

// ═══════════════════════════════════════════════════════
// SMS OPT-OUT
// ═══════════════════════════════════════════════════════
export async function markLeadSmsOptedOut(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ smsOptedOut: true, smsOptOutAt: new Date() }).where(eq(leads.id, leadId));
}

export async function markLeadFirstSmsSent(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ smsFirstMessageSent: true }).where(eq(leads.id, leadId));
}

export async function getLeadByPhone(phone: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leads).where(eq(leads.phone, phone)).limit(1);
  return result[0] ?? null;
}

// ═══════════════════════════════════════════════════════
// SUPPORT TICKETS
// ═══════════════════════════════════════════════════════
export async function createSupportTicket(data: InsertRepSupportTicket) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(repSupportTickets).values(data);
  return result[0].insertId;
}

export async function getSupportTicketById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(repSupportTickets).where(eq(repSupportTickets.id, id)).limit(1);
  return result[0] ?? null;
}

export async function listRepSupportTickets(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repSupportTickets)
    .where(eq(repSupportTickets.repId, repId))
    .orderBy(desc(repSupportTickets.createdAt));
}

export async function listAllSupportTickets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repSupportTickets)
    .orderBy(desc(repSupportTickets.createdAt));
}

export async function updateSupportTicket(id: number, data: Partial<InsertRepSupportTicket>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(repSupportTickets).set(data).where(eq(repSupportTickets.id, id));
}

// ═══════════════════════════════════════════════════════
// NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════
const DEFAULT_NOTIFICATION_CATEGORIES = [
  "new_lead", "coaching_feedback", "ticket_update", "commission", "training", "system"
];

export async function getRepNotificationPreferences(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repNotificationPreferences)
    .where(eq(repNotificationPreferences.repId, repId));
}

export async function upsertNotificationPreference(repId: number, category: string, enabled: boolean, pushEnabled: boolean, inAppEnabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if preference exists
  const existing = await db.select().from(repNotificationPreferences)
    .where(and(eq(repNotificationPreferences.repId, repId), eq(repNotificationPreferences.category, category)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(repNotificationPreferences)
      .set({ enabled, pushEnabled, inAppEnabled })
      .where(eq(repNotificationPreferences.id, existing[0].id));
  } else {
    await db.insert(repNotificationPreferences).values({ repId, category, enabled, pushEnabled, inAppEnabled });
  }
}

export async function initDefaultNotificationPreferences(repId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(repNotificationPreferences)
    .where(eq(repNotificationPreferences.repId, repId));
  if (existing.length === 0) {
    const values = DEFAULT_NOTIFICATION_CATEGORIES.map(cat => ({
      repId,
      category: cat,
      enabled: true,
      pushEnabled: true,
      inAppEnabled: true,
    }));
    await db.insert(repNotificationPreferences).values(values);
  }
}

// ═══════════════════════════════════════════════════════
// PUSH SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════
export async function savePushSubscription(data: InsertPushSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Remove existing subscription for same endpoint
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, data.endpoint as string));
  const result = await db.insert(pushSubscriptions).values(data);
  return result[0].insertId;
}

export async function getRepPushSubscriptions(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.repId, repId));
}

export async function deletePushSubscription(endpoint: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

// ═══════════════════════════════════════════════════════
// OWNER LOOKUP
// ═══════════════════════════════════════════════════════
export async function getOwnerUser() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, ENV.ownerOpenId)).limit(1);
  return result[0] ?? null;
}

// Get the most recent pending_approval ticket (for owner SMS reply matching)
export async function getMostRecentPendingTicket() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(repSupportTickets)
    .where(eq(repSupportTickets.status, "pending_approval"))
    .orderBy(desc(repSupportTickets.createdAt))
    .limit(1);
  return result[0] ?? null;
}

// ═══════════════════════════════════════════════════════
// ADMIN BOOTSTRAP
// Creates the admin user from ADMIN_EMAIL / ADMIN_PASSWORD env vars on first run.
// Safe to call on every startup — no-ops if the account already exists.
// ═══════════════════════════════════════════════════════
export async function bootstrapAdminUser(): Promise<void> {
  if (!ENV.adminEmail || !ENV.adminPassword) return;

  const db = await getDb();
  if (!db) {
    console.warn("[AdminBootstrap] Database not available — skipping admin bootstrap");
    return;
  }

  try {
    const existing = await getUserByEmail(ENV.adminEmail);

    if (existing) {
      // Ensure role is admin (in case it was demoted somehow)
      if (existing.role !== "admin") {
        await upsertUser({ openId: existing.openId, role: "admin" });
        console.log("[AdminBootstrap] Updated existing user to admin role:", ENV.adminEmail);
      }
      return;
    }

    // Create the admin account
    const { randomBytes } = await import("crypto");
    const openId = "local_admin_" + randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(ENV.adminPassword, 12);

    await upsertUser({
      openId,
      email: ENV.adminEmail,
      name: ENV.adminName,
      loginMethod: "email_password",
      passwordHash,
      role: "admin",
      lastSignedIn: new Date(),
    });

    console.log("[AdminBootstrap] Admin account created:", ENV.adminEmail);
  } catch (err) {
    console.error("[AdminBootstrap] Failed to bootstrap admin user:", err);
  }
}

/* ═══════════════════════════════════════════════════════
   SUPPORT TICKETS
   ═══════════════════════════════════════════════════════ */
export async function createCustomerSupportTicket(data: InsertSupportTicket) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(supportTickets).values(data);
  return result.insertId as number;
}

export async function listCustomerSupportTickets(customerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (customerId !== undefined) {
    return db.select().from(supportTickets).where(eq(supportTickets.customerId, customerId)).orderBy(desc(supportTickets.createdAt));
  }
  return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
}

export async function getCustomerSupportTicketById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateCustomerSupportTicket(id: number, data: Partial<typeof supportTickets.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(supportTickets).set(data).where(eq(supportTickets.id, id));
}

export async function createSupportTicketReply(data: InsertSupportTicketReply) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(supportTicketReplies).values(data);
  return result.insertId as number;
}

export async function listSupportTicketReplies(ticketId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTicketReplies).where(eq(supportTicketReplies.ticketId, ticketId)).orderBy(supportTicketReplies.createdAt);
}

export async function countOpenSupportTickets() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(supportTickets).where(eq(supportTickets.status, "open"));
  return rows[0]?.count ?? 0;
}

/* ═══════════════════════════════════════════════════════
   REP MESSAGES
   ═══════════════════════════════════════════════════════ */
export async function createRepMessage(data: InsertRepMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(repMessages).values(data);
  return result.insertId as number;
}

export async function listRepMessages(repId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repMessages).where(eq(repMessages.repId, repId)).orderBy(repMessages.createdAt);
}

export async function listAllRepMessages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repMessages).orderBy(desc(repMessages.createdAt));
}

export async function markRepMessageRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(repMessages).set({ readAt: new Date() }).where(eq(repMessages.id, id));
}

export async function countUnreadRepMessages() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(repMessages).where(
    and(eq(repMessages.senderRole, "rep"), sql`readAt IS NULL`)
  );
  return rows[0]?.count ?? 0;
}

export async function markAllAdminMessagesReadForRep(repId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(repMessages).set({ readAt: new Date() }).where(
    and(eq(repMessages.repId, repId), eq(repMessages.senderRole, "admin"), isNull(repMessages.readAt))
  );
}

export async function countUnreadAdminMessagesForRep(repId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(repMessages).where(
    and(eq(repMessages.repId, repId), eq(repMessages.senderRole, "admin"), isNull(repMessages.readAt))
  );
  return Number(rows[0]?.count ?? 0);
}

/* ═══════════════════════════════════════════════════════
   CUSTOMER SUPPORT TICKET RATINGS
   ═══════════════════════════════════════════════════════ */
export async function updateSupportTicketRating(id: number, rating: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(supportTickets).set({ customerRating: rating, ratingToken: null }).where(eq(supportTickets.id, id));
}

export async function getSupportTicketByRatingToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(supportTickets).where(eq(supportTickets.ratingToken, token)).limit(1);
  return rows[0] ?? null;
}

export async function getAvgRatingForRep(repId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ avgRating: avg(supportTickets.customerRating), total: sql<number>`count(*)` })
    .from(supportTickets)
    .innerJoin(contracts, eq(contracts.customerId, supportTickets.customerId))
    .where(and(eq(contracts.repId, repId), sql`${supportTickets.customerRating} IS NOT NULL`));
  const row = rows[0];
  const total = Number(row?.total ?? 0);
  if (total === 0) return null;
  return { avg: Number(row.avgRating ?? 0), total };
}

/* ═══════════════════════════════════════════════════════
   PRODUCT CATALOG
   ═══════════════════════════════════════════════════════ */
export async function listProductCatalog(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(productCatalog).where(eq(productCatalog.active, true)).orderBy(productCatalog.category, productCatalog.basePrice);
  }
  return db.select().from(productCatalog).orderBy(productCatalog.category, productCatalog.basePrice);
}

export const getProductCatalog = () => listProductCatalog(true);

export async function upsertProductCatalogItem(data: InsertProductCatalogItem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const updateSet = { ...data };
  delete (updateSet as any).productKey;
  await db.insert(productCatalog).values(data).onDuplicateKeyUpdate({ set: updateSet });
}

export async function updateProductCatalogItem(id: number, data: Partial<typeof productCatalog.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(productCatalog).set(data).where(eq(productCatalog.id, id));
}

/* ═══════════════════════════════════════════════════════
   BROADCASTS
   ═══════════════════════════════════════════════════════ */
export async function createBroadcast(data: InsertBroadcast) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(broadcasts).values(data);
  return result.insertId as number;
}

export async function listBroadcasts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(broadcasts).orderBy(desc(broadcasts.createdAt));
}

export async function updateBroadcast(id: number, data: Partial<typeof broadcasts.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(broadcasts).set(data).where(eq(broadcasts.id, id));
}

/* ═══════════════════════════════════════════════════════
   LEAD COSTS — Lifetime economics tracking
   ═══════════════════════════════════════════════════════ */
export async function insertLeadCost(data: InsertLeadCost) {
  const db = await getDb();
  if (!db) return;
  await db.insert(leadCosts).values(data);
}

export async function getLeadCostBreakdown(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadCosts).where(eq(leadCosts.leadId, leadId)).orderBy(desc(leadCosts.createdAt));
}

export async function getCustomerCostBreakdown(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadCosts).where(eq(leadCosts.customerId, customerId)).orderBy(desc(leadCosts.createdAt));
}

export async function getMonthlyEconomicsSummary(month: string) {
  const db = await getDb();
  if (!db) return null;

  const costRows = await db.select({
    costType: leadCosts.costType,
    total: sql<number>`COALESCE(SUM(amountCents), 0)`,
  })
    .from(leadCosts)
    .where(eq(leadCosts.month, month))
    .groupBy(leadCosts.costType);

  const [revRow] = await db.select({ total: sql<number>`COALESCE(SUM(totalLifetimeRevenueCents), 0)` })
    .from(customers);

  const totalCosts = costRows.reduce((s, r) => s + Number(r.total), 0);
  const byType: Record<string, number> = {};
  for (const r of costRows) byType[r.costType] = Number(r.total);

  return { totalCostCents: totalCosts, byType, totalRevenueCents: Number(revRow?.total ?? 0) };
}

export async function getTopExpensiveLeads(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: leads.id,
    businessName: leads.businessName,
    stage: leads.stage,
    totalCostCents: leads.totalCostCents,
    totalRevenueCents: leads.totalRevenueCents,
  })
    .from(leads)
    .where(sql`totalCostCents > 0 AND stage NOT IN ('closed_won', 'closed_lost')`)
    .orderBy(desc(leads.totalCostCents))
    .limit(limit);
}

export async function getTopRoiCustomers(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: customers.id,
    businessName: customers.businessName,
    totalLifetimeCostCents: customers.totalLifetimeCostCents,
    totalLifetimeRevenueCents: customers.totalLifetimeRevenueCents,
  })
    .from(customers)
    .where(sql`totalLifetimeRevenueCents > 0`)
    .orderBy(sql`(totalLifetimeRevenueCents - totalLifetimeCostCents) DESC`)
    .limit(limit);
}

/* ═══════════════════════════════════════════════════════
   PRODUCT CATALOG SEEDING
   ═══════════════════════════════════════════════════════ */
export async function seedProductCatalog() {
  const db = await getDb();
  if (!db) return;

  const seed = [
    { productKey: "starter", name: "Starter Website", description: "5-page professional website, mobile-responsive, SEO optimized", category: "package" as const, basePrice: "195.00", discountPercent: 0, active: true },
    { productKey: "growth", name: "Growth Website", description: "10-page website with blog, lead capture forms, analytics dashboard", category: "package" as const, basePrice: "295.00", discountPercent: 0, active: true },
    { productKey: "premium", name: "Premium Website", description: "15-page website with e-commerce, CRM integration, priority support", category: "package" as const, basePrice: "395.00", discountPercent: 0, active: true },
    { productKey: "enterprise", name: "Enterprise Website", description: "Unlimited pages, custom integrations, dedicated account manager", category: "package" as const, basePrice: "495.00", discountPercent: 0, active: true },
    { productKey: "seo_addon", name: "SEO Optimization Package", description: "Monthly keyword tracking, backlink building, competitor analysis", category: "addon" as const, basePrice: "99.00", discountPercent: 0, active: true },
    { productKey: "content_addon", name: "Content Writing (4 posts/mo)", description: "Professional blog posts written by our AI + human team", category: "addon" as const, basePrice: "79.00", discountPercent: 0, active: true },
    { productKey: "setup_fee", name: "One-Time Setup Fee", description: "Domain setup, hosting configuration, launch checklist", category: "one_time" as const, basePrice: "149.00", discountPercent: 0, active: true },
  ];

  for (const item of seed) {
    await upsertProductCatalogItem(item);
  }
  console.log("[ProductCatalog] Seeded", seed.length, "products");
}
