/**
 * ═══════════════════════════════════════════════════════
 * ONBOARDING DATA ROUTER — Trust Gate + Smart Auto-Populate
 * Handles NDA signing, identity verification, and data reuse
 * for downstream HR/tax/payroll paperwork
 * ═══════════════════════════════════════════════════════
 */
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { repOnboardingData, reps, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/* ─── NDA Content ─── */

const NDA_VERSION = "1.1";

const NDA_TEXT = `MINIMORPH STUDIOS — CONFIDENTIALITY & NON-DISCLOSURE AGREEMENT

By signing below, you ("Recipient") agree to the following terms with MiniMorph Studios ("Company"):

1. COMPANY VALUES & CODE OF CONDUCT
You acknowledge that MiniMorph Studios operates on a foundation of six core values: Integrity First, Client Obsession, Radical Transparency, Ethical Selling, Trustworthy Representation, and Brand Stewardship. You have read, understood, and agree to abide by the MiniMorph Code of Conduct, which is incorporated into this agreement by reference. Violation of the Code of Conduct constitutes a breach of this agreement.

2. CONFIDENTIAL INFORMATION
You acknowledge that during your onboarding and engagement as a MiniMorph Sales Representative, you will have access to proprietary information including but not limited to: sales methodologies, pricing strategies, client lists, AI technology details, training materials, business processes, and marketing strategies ("Confidential Information").

3. NON-DISCLOSURE OBLIGATION
You agree not to disclose, share, copy, or use any Confidential Information for any purpose other than your duties as a MiniMorph representative. This obligation survives termination of your engagement.

4. INTELLECTUAL PROPERTY
All materials, tools, scripts, templates, and training content provided by MiniMorph remain the exclusive property of MiniMorph Studios. You may not reproduce, distribute, or create derivative works without written permission.

5. ETHICAL CONDUCT
You agree to conduct all sales and client interactions in accordance with MiniMorph's ethical selling standards. This includes: never misrepresenting products or services, never using high-pressure or deceptive tactics, always acting in the client's best interest, and maintaining professional representation of the brand at all times.

6. NON-COMPETE (DURING ENGAGEMENT)
While actively engaged as a MiniMorph representative, you agree not to represent or sell directly competing AI website building services.

7. RETURN OF MATERIALS
Upon termination of your engagement, you agree to return or destroy all Confidential Information and Company materials in your possession.

8. REMEDIES
You acknowledge that breach of this agreement — including violations of the Code of Conduct or ethical standards — may cause irreparable harm and that MiniMorph is entitled to seek injunctive relief in addition to any other remedies.

9. DURATION
This agreement remains in effect for 2 years following the termination of your engagement with MiniMorph Studios.

This agreement is governed by the laws of the State of Delaware.`;

export { NDA_TEXT, NDA_VERSION };

/* ─── Router ─── */

export const onboardingDataRouter = router({
  /**
   * Get the NDA text for display
   */
  getNda: protectedProcedure.query(() => {
    return {
      text: NDA_TEXT,
      version: NDA_VERSION,
    };
  }),

  /**
   * Submit trust gate: sign NDA + provide identity info
   * This is the gate that must be completed before the assessment
   */
  submitTrustGate: protectedProcedure
    .input(
      z.object({
        // Legal identity
        legalFirstName: z.string().min(1, "Legal first name is required"),
        legalLastName: z.string().min(1, "Legal last name is required"),
        dateOfBirth: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD"),
        ssnLast4: z
          .string()
          .regex(/^\d{4}$/, "SSN last 4 must be exactly 4 digits"),
        idType: z.enum(["drivers_license", "passport", "state_id"]),
        idLast4: z
          .string()
          .regex(/^\d{4}$/, "ID last 4 must be exactly 4 digits"),
        // Address
        streetAddress: z.string().min(1, "Street address is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        zipCode: z
          .string()
          .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
        // NDA acceptance
        ndaAccepted: z.literal(true, {
          message: "You must accept the NDA to proceed",
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      // Check if already submitted
      const existing = await db
        .select()
        .from(repOnboardingData)
        .where(eq(repOnboardingData.userId, ctx.user.id))
        .limit(1);

      // Get the rep record if it exists
      const repRecords = await db
        .select({ id: reps.id })
        .from(reps)
        .where(eq(reps.userId, ctx.user.id))
        .limit(1);
      const repId = repRecords[0]?.id || null;

      // Get client IP from request
      const ip =
        ctx.req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
        ctx.req.socket?.remoteAddress ||
        "unknown";

      const now = new Date();

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(repOnboardingData)
          .set({
            legalFirstName: input.legalFirstName,
            legalLastName: input.legalLastName,
            dateOfBirth: input.dateOfBirth,
            ssnLast4: input.ssnLast4,
            idType: input.idType,
            idLast4: input.idLast4,
            streetAddress: input.streetAddress,
            city: input.city,
            state: input.state,
            zipCode: input.zipCode,
            ndaSignedAt: now,
            ndaIpAddress: ip,
            ndaVersion: NDA_VERSION,
            repId,
          })
          .where(eq(repOnboardingData.userId, ctx.user.id));
      } else {
        // Insert new record
        await db.insert(repOnboardingData).values({
          userId: ctx.user.id,
          repId,
          legalFirstName: input.legalFirstName,
          legalLastName: input.legalLastName,
          dateOfBirth: input.dateOfBirth,
          ssnLast4: input.ssnLast4,
          idType: input.idType,
          idLast4: input.idLast4,
          streetAddress: input.streetAddress,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
          ndaSignedAt: now,
          ndaIpAddress: ip,
          ndaVersion: NDA_VERSION,
        });
      }

      return { success: true, ndaSignedAt: now.toISOString() };
    }),

  /**
   * Get the current user's onboarding data (for auto-population)
   */
  getMyData: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });

    const result = await db
      .select()
      .from(repOnboardingData)
      .where(eq(repOnboardingData.userId, ctx.user.id))
      .limit(1);

    if (result.length === 0) return null;

    const data = result[0];

    // Also get user info for additional auto-population
    const userResult = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    const repResult = await db
      .select({
        fullName: reps.fullName,
        email: reps.email,
        phone: reps.phone,
      })
      .from(reps)
      .where(eq(reps.userId, ctx.user.id))
      .limit(1);

    return {
      // Trust gate data
      legalFirstName: data.legalFirstName,
      legalLastName: data.legalLastName,
      legalFullName: `${data.legalFirstName || ""} ${data.legalLastName || ""}`.trim(),
      dateOfBirth: data.dateOfBirth,
      ssnLast4: data.ssnLast4,
      idType: data.idType,
      idLast4: data.idLast4,
      streetAddress: data.streetAddress,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country,
      ndaSignedAt: data.ndaSignedAt,
      ndaVersion: data.ndaVersion,
      // User data
      email: repResult[0]?.email || userResult[0]?.email || null,
      phone: repResult[0]?.phone || null,
      displayName: repResult[0]?.fullName || userResult[0]?.name || null,
    };
  }),

  /**
   * Get auto-populated form data for specific paperwork type
   * Returns pre-filled fields based on data already collected
   */
  getAutoPopulated: protectedProcedure
    .input(
      z.object({
        formType: z.enum(["w9_tax", "hr_employment", "payroll_setup", "rep_agreement"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const onboardingResult = await db
        .select()
        .from(repOnboardingData)
        .where(eq(repOnboardingData.userId, ctx.user.id))
        .limit(1);

      const repResult = await db
        .select()
        .from(reps)
        .where(eq(reps.userId, ctx.user.id))
        .limit(1);

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const data = onboardingResult[0] || null;
      const rep = repResult[0] || null;
      const user = userResult[0] || null;

      const legalName = data
        ? `${data.legalFirstName || ""} ${data.legalLastName || ""}`.trim()
        : rep?.fullName || user?.name || "";

      switch (input.formType) {
        case "w9_tax":
          return {
            formType: "w9_tax",
            formTitle: "W-9 Tax Information",
            autoPopulatedFields: {
              name: legalName,
              businessName: "", // They fill this if applicable
              taxClassification: "individual", // Default for independent contractor
              address: data?.streetAddress || "",
              city: data?.city || "",
              state: data?.state || "",
              zipCode: data?.zipCode || "",
              ssnLast4: data?.ssnLast4 || "",
              // These are pre-filled from what we already know
            },
            fieldsSource: {
              name: data ? "trust_verification" : "account_creation",
              address: data ? "trust_verification" : null,
              ssnLast4: data ? "trust_verification" : null,
            },
          };

        case "hr_employment":
          return {
            formType: "hr_employment",
            formTitle: "HR / Employment Information",
            autoPopulatedFields: {
              legalFirstName: data?.legalFirstName || "",
              legalLastName: data?.legalLastName || "",
              dateOfBirth: data?.dateOfBirth || "",
              email: rep?.email || user?.email || "",
              phone: rep?.phone || "",
              address: data?.streetAddress || "",
              city: data?.city || "",
              state: data?.state || "",
              zipCode: data?.zipCode || "",
              idType: data?.idType || "",
              idLast4: data?.idLast4 || "",
              emergencyContactName: "", // They fill this
              emergencyContactPhone: "", // They fill this
            },
            fieldsSource: {
              legalFirstName: data ? "trust_verification" : null,
              legalLastName: data ? "trust_verification" : null,
              dateOfBirth: data ? "trust_verification" : null,
              email: rep ? "account_creation" : null,
              phone: rep ? "account_creation" : null,
              address: data ? "trust_verification" : null,
            },
          };

        case "payroll_setup":
          return {
            formType: "payroll_setup",
            formTitle: "Payroll Setup",
            autoPopulatedFields: {
              legalName: legalName,
              email: rep?.email || user?.email || "",
              address: data?.streetAddress || "",
              city: data?.city || "",
              state: data?.state || "",
              zipCode: data?.zipCode || "",
              // Bank info comes from Stripe Connect, not stored locally
              stripeConnectStatus: rep?.stripeConnectOnboarded
                ? "connected"
                : "not_connected",
            },
            fieldsSource: {
              legalName: data ? "trust_verification" : "account_creation",
              email: rep ? "account_creation" : null,
              address: data ? "trust_verification" : null,
            },
          };

        case "rep_agreement":
          return {
            formType: "rep_agreement",
            formTitle: "Rep Agreement",
            autoPopulatedFields: {
              legalName: legalName,
              address: data
                ? `${data.streetAddress || ""}, ${data.city || ""}, ${data.state || ""} ${data.zipCode || ""}`
                : "",
              email: rep?.email || user?.email || "",
              phone: rep?.phone || "",
              date: new Date().toISOString().split("T")[0],
              ndaAlreadySigned: !!data?.ndaSignedAt,
              ndaSignedDate: data?.ndaSignedAt
                ? new Date(data.ndaSignedAt).toISOString().split("T")[0]
                : null,
            },
            fieldsSource: {
              legalName: data ? "trust_verification" : "account_creation",
              address: data ? "trust_verification" : null,
              email: rep ? "account_creation" : null,
            },
          };
      }
    }),

  /**
   * Check if trust gate is completed
   */
  checkTrustGate: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });

    const result = await db
      .select({
        ndaSignedAt: repOnboardingData.ndaSignedAt,
        legalFirstName: repOnboardingData.legalFirstName,
        legalLastName: repOnboardingData.legalLastName,
      })
      .from(repOnboardingData)
      .where(eq(repOnboardingData.userId, ctx.user.id))
      .limit(1);

    if (result.length === 0 || !result[0].ndaSignedAt) {
      return { completed: false };
    }

    return {
      completed: true,
      ndaSignedAt: result[0].ndaSignedAt,
      legalName: `${result[0].legalFirstName || ""} ${result[0].legalLastName || ""}`.trim(),
    };
  }),

  /**
   * Admin: view onboarding data for a specific user
   */
    adminGetUserData: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const result = await db
        .select()
        .from(repOnboardingData)
        .where(eq(repOnboardingData.userId, input.userId))
        .limit(1);
      return result[0] || null;
    }),

  /**
   * Mark paperwork as completed for the current rep
   */
  completePaperwork: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    const rep = await db
      .select()
      .from(reps)
      .where(eq(reps.userId, ctx.user.id))
      .limit(1);
    if (!rep[0])
      throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });
    await db
      .update(reps)
      .set({ paperworkCompletedAt: new Date() })
      .where(eq(reps.id, rep[0].id));
    return { success: true };
  }),
});
