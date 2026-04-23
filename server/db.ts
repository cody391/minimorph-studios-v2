import { eq, desc, and, sql, gte, lte, inArray } from "drizzle-orm";
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
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
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
  const [activeRepCount] = await db.select({ count: sql<number>`count(*)` }).from(reps).where(eq(reps.status, "active"));
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
  packageTier: "starter" | "growth" | "premium";
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
    level: repGamification.level,
    currentStreak: repGamification.currentStreak,
    monthlyDeals: repGamification.monthlyDeals,
    repName: reps.fullName,
  }).from(repGamification)
    .leftJoin(reps, eq(repGamification.repId, reps.id))
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
