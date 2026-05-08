/**
 * Dev Access Router — Admin-only utilities for testing all platform roles.
 * 
 * Provides:
 * 1. seedTestData — Creates rep + customer records linked to the admin user
 * 2. getDevStatus — Returns current admin's linked rep/customer records
 * 3. linkAsRep — Links admin user to an existing rep record for testing
 * 4. linkAsCustomer — Links admin user to an existing customer record for testing
 * 5. unlinkAll — Removes admin's rep/customer links (restores admin-only state)
 * 6. createTestProject — Creates an onboarding project for the admin's customer record
 */
import { z } from "zod";
import { router, adminProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { reps, customers, onboardingProjects, contracts } from "../drizzle/schema";

export const devAccessRouter = router({
  /** Get the admin's current dev access status */
  getDevStatus: adminProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const rep = await db.getRepByUserId(userId);
    const database = await getDb();
    let customer = null;
    if (database) {
      const rows = await database
        .select()
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);
      customer = rows[0] ?? null;
    }
    // Check for onboarding project linked to customer
    let project = null;
    if (customer && database) {
      const projects = await database
        .select()
        .from(onboardingProjects)
        .where(eq(onboardingProjects.customerId, customer.id))
        .limit(1);
      project = projects[0] ?? null;
    }
    return {
      userId,
      userName: ctx.user.name,
      userRole: ctx.user.role,
      linkedRep: rep ? { id: rep.id, fullName: rep.fullName, status: rep.status } : null,
      linkedCustomer: customer ? { id: customer.id, businessName: customer.businessName, status: customer.status } : null,
      linkedProject: project ? { id: project.id, stage: project.stage, businessName: project.businessName } : null,
    };
  }),

  /** Seed test data: create a rep + customer + contract + onboarding project all linked to the admin user */
  seedTestData: adminProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const userName = ctx.user.name || "Admin User";
    const userEmail = ctx.user.email || "admin@minimorph.com";
    const database = await getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // 1. Create or find rep linked to admin
    let rep = await db.getRepByUserId(userId);
    if (!rep) {
      await database.insert(reps).values({
        userId,
        fullName: userName,
        email: userEmail,
        phone: "(555) 000-0001",
        status: "active",
        trainingProgress: 100,
        performanceScore: "95.00",
        certifiedAt: new Date(),
        totalDeals: 12,
        totalRevenue: "14400.00",
        bio: "Admin test rep account for development testing.",
        referralCode: "ADMIN-TEST",
      });
      rep = await db.getRepByUserId(userId);
    }

    // 2. Create or find customer linked to admin
    const existingCustomers = await database
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);
    let customer = existingCustomers[0] ?? null;
    if (!customer) {
      await database.insert(customers).values({
        userId,
        businessName: "Dev Test Business",
        contactName: userName,
        email: userEmail,
        phone: "(555) 000-0002",
        industry: "Technology / SaaS",
        website: "https://devtest.example.com",
        healthScore: 92,
        status: "active",
      });
      const newCustomers = await database
        .select()
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);
      customer = newCustomers[0] ?? null;
    }

    // 3. Create a contract linking customer to rep
    if (customer && rep) {
      const existingContracts = await database
        .select()
        .from(contracts)
        .where(eq(contracts.customerId, customer.id))
        .limit(1);
      if (!existingContracts.length) {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const endDate = new Date(now.getFullYear() + 1, now.getMonth(), 1);
        await database.insert(contracts).values({
          customerId: customer.id,
          repId: rep.id,
          packageTier: "growth",
          monthlyPrice: "199.00",
          startDate,
          endDate,
          status: "active",
          websitePages: 8,
          renewalStatus: "not_started",
        });
      }
    }

    // 4. Create an onboarding project linked to customer
    let project = null;
    if (customer) {
      const existingProjects = await database
        .select()
        .from(onboardingProjects)
        .where(eq(onboardingProjects.customerId, customer.id))
        .limit(1);
      if (!existingProjects.length) {
        await database.insert(onboardingProjects).values({
          customerId: customer.id,
          stage: "questionnaire",
          businessName: customer.businessName,
          contactName: customer.contactName,
          contactEmail: customer.email,
          contactPhone: customer.phone,
          packageTier: "growth",
        });
        const newProjects = await database
          .select()
          .from(onboardingProjects)
          .where(eq(onboardingProjects.customerId, customer.id))
          .limit(1);
        project = newProjects[0] ?? null;
      } else {
        project = existingProjects[0];
      }
    }

    return {
      success: true,
      rep: rep ? { id: rep.id, fullName: rep.fullName, status: rep.status } : null,
      customer: customer ? { id: customer.id, businessName: customer.businessName } : null,
      project: project ? { id: project.id, stage: project.stage } : null,
    };
  }),

  /** Link admin user to an existing rep record (by repId) */
  linkAsRep: adminProcedure
    .input(z.object({ repId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await database
        .update(reps)
        .set({ userId: ctx.user.id })
        .where(eq(reps.id, input.repId));
      return { success: true };
    }),

  /** Link admin user to an existing customer record (by customerId) */
  linkAsCustomer: adminProcedure
    .input(z.object({ customerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await database
        .update(customers)
        .set({ userId: ctx.user.id })
        .where(eq(customers.id, input.customerId));
      return { success: true };
    }),

  /** Unlink admin from all rep/customer records (restore admin-only state) */
  unlinkAll: adminProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    // Set userId to 0 on any reps/customers linked to admin
    await database
      .update(reps)
      .set({ userId: 0 })
      .where(eq(reps.userId, ctx.user.id));
    await database
      .update(customers)
      .set({ userId: null })
      .where(eq(customers.userId, ctx.user.id));
    return { success: true };
  }),

  /** Delete a user and all their associated data by email — admin dev utility */
  purgeUserByEmail: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { users: usersTable, reps: repsTable, onboardingProjects: projectsTable, aiChatLogs: logsTable, customers: customersTable, contracts: contractsTable } = await import("../drizzle/schema");
      const { eq: eqFn } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [user] = await database.select().from(usersTable).where(eqFn(usersTable.email, input.email)).limit(1);
      if (!user) return { deleted: false, reason: "User not found" };

      const custRows = await database.select({ id: customersTable.id }).from(customersTable).where(eqFn(customersTable.userId, user.id));
      for (const c of custRows) {
        await database.delete(contractsTable).where(eqFn(contractsTable.customerId, c.id));
      }
      await database.delete(customersTable).where(eqFn(customersTable.userId, user.id));

      const projRows = await database.select({ id: projectsTable.id }).from(projectsTable).where(eqFn(projectsTable.userId, user.id));
      for (const p of projRows) {
        await database.delete(logsTable).where(eqFn(logsTable.projectId, p.id));
      }
      await database.delete(projectsTable).where(eqFn(projectsTable.userId, user.id));
      await database.delete(repsTable).where(eqFn(repsTable.userId, user.id));
      await database.delete(usersTable).where(eqFn(usersTable.id, user.id));

      return { deleted: true, email: input.email, userId: user.id };
    }),
});
