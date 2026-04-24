/**
 * Reusable ownership assertion helpers for tRPC procedures.
 *
 * Pattern: admin users bypass all checks; non-admin users must own the
 * resource (rep profile, customer record, or onboarding project).
 * Throws TRPCError FORBIDDEN on violation.
 */
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { reps, customers, onboardingProjects, projectAssets } from "../drizzle/schema";
import type { User } from "../drizzle/schema";

// ─── Rep ownership ──────────────────────────────────────
/**
 * Verify that `user` owns the rep record identified by `repId`,
 * or is an admin. Throws FORBIDDEN otherwise.
 */
export async function assertRepOwnership(user: User, repId: number): Promise<void> {
  if (user.role === "admin") return;
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await database.select({ userId: reps.userId }).from(reps).where(eq(reps.id, repId)).limit(1);
  if (!rows.length || rows[0].userId !== user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
}

// ─── Customer ownership ─────────────────────────────────
/**
 * Verify that `user` owns the customer record identified by `customerId`,
 * or is an admin. Throws FORBIDDEN otherwise.
 */
export async function assertCustomerOwnership(user: User, customerId: number): Promise<void> {
  if (user.role === "admin") return;
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await database.select({ userId: customers.userId }).from(customers).where(eq(customers.id, customerId)).limit(1);
  if (!rows.length || rows[0].userId !== user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
}

// ─── Onboarding project ownership ───────────────────────
/**
 * Verify that `user` owns the onboarding project (via customer link),
 * or is an admin. Throws FORBIDDEN otherwise.
 */
export async function assertProjectOwnership(user: User, projectId: number): Promise<void> {
  if (user.role === "admin") return;
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  // Get the project's customerId
  const projects = await database
    .select({ customerId: onboardingProjects.customerId })
    .from(onboardingProjects)
    .where(eq(onboardingProjects.id, projectId))
    .limit(1);
  if (!projects.length || !projects[0].customerId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }

  // Verify the customer belongs to this user
  const custs = await database
    .select({ userId: customers.userId })
    .from(customers)
    .where(eq(customers.id, projects[0].customerId))
    .limit(1);
  if (!custs.length || custs[0].userId !== user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
}

// ─── Lead ownership (assigned rep) ──────────────────────
/**
 * Verify that `user` is the rep assigned to the lead, or is an admin.
 * Throws FORBIDDEN otherwise.
 */
export async function assertLeadOwnership(user: User, leadId: number): Promise<void> {
  if (user.role === "admin") return;
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  // First, find the user's rep profile
  const repRows = await database.select({ id: reps.id }).from(reps).where(eq(reps.userId, user.id)).limit(1);
  if (!repRows.length) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }

  // Then verify the lead is assigned to this rep
  const { leads } = await import("../drizzle/schema");
  const leadRows = await database
    .select({ assignedRepId: leads.assignedRepId })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  if (!leadRows.length || leadRows[0].assignedRepId !== repRows[0].id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
}

// ─── Project asset ownership (via project) ──────────────
/**
 * Verify that `user` owns the project asset (via its parent project),
 * or is an admin. Throws FORBIDDEN otherwise.
 */
export async function assertAssetOwnership(user: User, assetId: number): Promise<void> {
  if (user.role === "admin") return;
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  const assets = await database
    .select({ projectId: projectAssets.projectId })
    .from(projectAssets)
    .where(eq(projectAssets.id, assetId))
    .limit(1);
  if (!assets.length) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }

  // Delegate to project ownership check
  await assertProjectOwnership(user, assets[0].projectId);
}
