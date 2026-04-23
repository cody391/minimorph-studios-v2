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
