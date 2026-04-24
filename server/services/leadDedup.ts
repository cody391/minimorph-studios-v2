/**
 * Cross-Source Lead Dedup
 *
 * Before creating a new lead from any automated source, check for an existing
 * lead by: (1) normalized email, (2) normalized phone, (3) normalized
 * businessName.  If found, merge enrichment data without overwriting important
 * newer data and return the existing lead id.
 */
import { getDb } from "../db";
import { leads, type InsertLead } from "../../drizzle/schema";
import { eq, or, and, sql } from "drizzle-orm";

/* ── helpers ─────────────────────────────────────────── */

function normalizeEmail(e: string | null | undefined): string | null {
  if (!e) return null;
  return e.trim().toLowerCase();
}

function normalizePhone(p: string | null | undefined): string | null {
  if (!p) return null;
  const digits = p.replace(/\D/g, "");
  if (digits.length < 7) return null; // too short to be useful
  return digits;
}

function normalizeBusinessName(n: string | null | undefined): string | null {
  if (!n) return null;
  return n.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}

/* Temperature ranking for "keep the hotter one" logic */
const TEMP_RANK: Record<string, number> = { cold: 0, warm: 1, hot: 2 };

/* Stage ranking — higher = further along */
const STAGE_RANK: Record<string, number> = {
  new: 0, enriched: 1, warming: 2, warm: 3, assigned: 4,
  contacted: 5, proposal_sent: 6, negotiating: 7, closed_won: 8, closed_lost: 9,
};

/* ── main dedup function ─────────────────────────────── */

/**
 * Find an existing lead that matches the incoming data.
 * Returns the existing lead row or null.
 */
export async function findDuplicateLead(data: {
  email?: string | null;
  phone?: string | null;
  businessName?: string | null;
}): Promise<typeof leads.$inferSelect | null> {
  const db = (await getDb())!;

  const normEmail = normalizeEmail(data.email);
  const normPhone = normalizePhone(data.phone);
  const normBiz = normalizeBusinessName(data.businessName);

  // 1. Exact email match
  if (normEmail) {
    const [match] = await db.select().from(leads)
      .where(sql`LOWER(TRIM(${leads.email})) = ${normEmail}`)
      .limit(1);
    if (match) return match;
  }

  // 2. Exact phone match (digits only)
  if (normPhone) {
    const [match] = await db.select().from(leads)
      .where(sql`REPLACE(REPLACE(REPLACE(REPLACE(${leads.phone}, '-', ''), '(', ''), ')', ''), ' ', '') = ${normPhone}`)
      .limit(1);
    if (match) return match;
  }

  // 3. Business name match (no email/phone matched)
  if (normBiz) {
    const [match] = await db.select().from(leads)
      .where(sql`LOWER(TRIM(REGEXP_REPLACE(${leads.businessName}, '[^a-zA-Z0-9 ]', ''))) = ${normBiz}`)
      .limit(1);
    if (match) return match;
  }

  return null;
}

/**
 * Merge new data into an existing lead without overwriting important fields.
 * Returns the existing lead id.
 */
export async function mergeIntoExistingLead(
  existingLead: typeof leads.$inferSelect,
  newData: Partial<InsertLead>,
): Promise<number> {
  const db = (await getDb())!;

  const updates: Record<string, any> = {};

  // Merge enrichment data (append, don't overwrite)
  if (newData.enrichmentData) {
    const existing = (existingLead.enrichmentData || {}) as Record<string, any>;
    const incoming = newData.enrichmentData as Record<string, any>;
    updates.enrichmentData = { ...existing, ...incoming };
  }

  // Keep the hotter temperature
  if (newData.temperature) {
    const existRank = TEMP_RANK[existingLead.temperature] ?? 0;
    const newRank = TEMP_RANK[newData.temperature] ?? 0;
    if (newRank > existRank) {
      updates.temperature = newData.temperature;
    }
  }

  // Keep the higher qualification score
  if (newData.qualificationScore && newData.qualificationScore > existingLead.qualificationScore) {
    updates.qualificationScore = newData.qualificationScore;
  }

  // Fill in missing fields only
  if (!existingLead.phone && newData.phone) updates.phone = newData.phone;
  if (!existingLead.website && newData.website) updates.website = newData.website;
  if (!existingLead.industry && newData.industry) updates.industry = newData.industry;

  // Preserve assignedRepId — never overwrite
  // Preserve stage — never regress

  if (Object.keys(updates).length > 0) {
    await db.update(leads).set(updates).where(eq(leads.id, existingLead.id));
  }

  return existingLead.id;
}

/**
 * Convenience: check for dup, merge if found, return { isDuplicate, leadId }.
 * If not a duplicate, returns null so the caller can proceed with insert.
 */
export async function dedupOrNull(data: Partial<InsertLead>): Promise<{ isDuplicate: true; leadId: number } | null> {
  const existing = await findDuplicateLead({
    email: data.email,
    phone: data.phone,
    businessName: data.businessName,
  });
  if (!existing) return null;
  const leadId = await mergeIntoExistingLead(existing, data);
  return { isDuplicate: true, leadId };
}
