import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { repTrainingRouter, repActivityRouter, repGamificationRouter, repCommsRouter, repApplicationRouter } from "./repEcosystem";
import { repSupportTicketsRouter, repNotifPrefsRouter } from "./repEcosystem";
import { leadGenRouter } from "./leadGenRouter";
import { academyRouter } from "./academyRouter";
import { socialAccountsRouter, socialCampaignsRouter, socialPostsRouter, contentCalendarRouter, brandAssetsRouter, socialAnalyticsRouter, aiContentRouter, socialLibraryRouter } from "./socialRouter";
import { xGrowthDashboardRouter, xEngagementRouter, xGrowthTargetsRouter, xFollowTrackerRouter } from "./xGrowthRouter";
import { localAuthRouter } from "./localAuth";
import { assessmentRouter } from "./assessmentRouter";
import { onboardingDataRouter } from "./onboardingDataRouter";
import { accountabilityRouter } from "./accountabilityRouter";
import { devAccessRouter } from "./devAccessRouter";
import { TIER_CONFIG, type TierKey } from "../shared/accountability";
import { repTiers, customers, contracts, reps, nurtureLogs, onboardingProjects } from "../drizzle/schema";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { sendOnboardingStageEmail } from "./services/customerEmails";
import { teamFeedRouter } from "./teamFeedRouter";
import { invokeLLM } from "./_core/llm";
import { formatAnswerBankForPrompt } from "../shared/answerBank";
import { formatIntegrationMatrixForPrompt } from "../shared/integrationMatrix";
import { assertRepOwnership, assertCustomerOwnership, assertProjectOwnership, assertLeadOwnership, assertAssetOwnership } from "./ownership";
import { ENV } from "./_core/env";
import { generateSiteForProject } from "./services/siteGenerator";
import { processSiteChangeRequest } from "./services/siteUpdater";
import { generateContractText } from "./services/contractService";
import { createHash } from "crypto";
/* ═══════════════════════════════════════════════════════
   REPS ROUTER
   ═══════════════════════════════════════════════════════ */
const repsRouter = router({
  // Public: apply to become a rep
  submitApplication: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? 0;
      // Generate collision-safe referral code with retry
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const generateCode = () => "MM-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      let code = generateCode();
      let attempts = 0;
      const allReps = await db.listReps();
      const existingCodes = new Set(allReps.map((r) => r.referralCode).filter(Boolean));
      while (existingCodes.has(code) && attempts < 10) {
        code = generateCode();
        attempts++;
      }
      return db.createRep({ ...input, userId, status: "applied", referralCode: code });
    }),

  // Protected: get current user's rep profile
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    const rep = await db.getRepByUserId(ctx.user.id);
    return rep ?? null;
  }),

  // Protected: get a rep by ID (ownership: admin or own rep only)
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertRepOwnership(ctx.user, input.id);
      const rep = await db.getRepById(input.id);
      return rep ?? null;
    }),
  // Admin: list all repss
  list: adminProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return db.listReps(input?.status);
    }),

  // Admin: update rep status/data
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["applied", "onboarding", "training", "certified", "active", "suspended", "inactive"]).optional(),
        trainingProgress: z.number().min(0).max(100).optional(),
        performanceScore: z.string().optional(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.status === "certified") {
        updateData.certifiedAt = new Date();
      }
      await db.updateRep(id, updateData);
      return { success: true };
    }),

  // Protected: Create Stripe Connect onboarding link for rep
  createConnectOnboarding: protectedProcedure
    .input(z.object({ returnUrl: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new Error("Not a rep");
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(ENV.stripeSecretKey || "");
      let accountId = rep.stripeConnectAccountId;
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
          email: rep.email,
          metadata: { repId: String(rep.id), repName: rep.fullName },
          capabilities: { transfers: { requested: true } },
        });
        accountId = account.id;
        await db.updateRep(rep.id, { stripeConnectAccountId: accountId });
      }
      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: input.returnUrl,
        return_url: input.returnUrl,
        type: "account_onboarding",
      });
      return { url: link.url, accountId };
    }),

  // Protected: Check Stripe Connect onboarding status
  connectStatus: protectedProcedure.query(async ({ ctx }) => {
    const rep = await db.getRepByUserId(ctx.user.id);
    if (!rep) return { hasAccount: false, onboarded: false };
    if (!rep.stripeConnectAccountId) return { hasAccount: false, onboarded: false };
    if (rep.stripeConnectOnboarded) return { hasAccount: true, onboarded: true };
    // Check with Stripe
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(ENV.stripeSecretKey || "");
    try {
      const account = await stripe.accounts.retrieve(rep.stripeConnectAccountId);
      const onboarded = account.details_submitted === true;
      if (onboarded && !rep.stripeConnectOnboarded) {
        await db.updateRep(rep.id, { stripeConnectOnboarded: true });
      }
      return { hasAccount: true, onboarded };
    } catch {
      return { hasAccount: true, onboarded: false };
    }
  }),

  // Admin: initiate payout to rep via Stripe Connect
  initiatePayout: adminProcedure
    .input(z.object({ commissionId: z.number() }))
    .mutation(async ({ input }) => {
      const commission = await db.getCommissionById(input.commissionId);
      if (!commission) throw new Error("Commission not found");
      if (commission.status === "paid") throw new Error("Already paid");
      const rep = await db.getRepById(commission.repId);
      if (!rep) throw new Error("Rep not found");
      if (!rep.stripeConnectAccountId) throw new Error("Rep has no Stripe Connect account");
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(ENV.stripeSecretKey || "");
      const amount = Math.round(parseFloat(commission.amount || "0") * 100);
      if (amount <= 0) throw new Error("Invalid amount");
      const transfer = await stripe.transfers.create({
        amount,
        currency: "usd",
        destination: rep.stripeConnectAccountId,
        metadata: { commissionId: String(commission.id), repId: String(rep.id) },
      });
      await db.updateCommission(commission.id, { status: "paid", paidAt: new Date() });
      return { success: true, transferId: transfer.id };
    }),

  // Admin: approve commission for payout
  approveCommission: adminProcedure
    .input(z.object({ commissionId: z.number() }))
    .mutation(async ({ input }) => {
      const commission = await db.getCommissionById(input.commissionId);
      if (!commission) throw new Error("Commission not found");
      await db.updateCommission(commission.id, { status: "approved" });
      // Notify the rep
      await db.createRepNotification({
        repId: commission.repId,
        type: "commission_approved",
        title: "Commission Approved!",
        message: `Your $${parseFloat(commission.amount).toLocaleString()} ${commission.type?.replace(/_/g, " ")} commission has been approved.`,
        metadata: { commissionId: commission.id, amount: commission.amount },
      });
      return { success: true };
    }),

  // Upload profile photo (base64 encoded)
  uploadPhoto: protectedProcedure
    .input(z.object({ photoBase64: z.string(), mimeType: z.string().default("image/jpeg") }))
    .mutation(async ({ ctx, input }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });
      const buffer = Buffer.from(input.photoBase64, "base64");
      const ext = input.mimeType === "image/png" ? "png" : "jpg";
      const { url } = await storagePut(`rep-photos/${rep.id}.${ext}`, buffer, input.mimeType);
      await db.updateRepProfilePhoto(rep.id, url);
      return { photoUrl: url };
    }),

  // AI photo quality check
  checkPhotoQuality: protectedProcedure
    .input(z.object({ photoBase64: z.string(), mimeType: z.string().default("image/jpeg") }))
    .mutation(async ({ input }) => {
      try {
        const dataUrl = `data:${input.mimeType};base64,${input.photoBase64}`;
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a professional headshot quality reviewer for a sales representative onboarding process. Analyze the photo and evaluate it for use as a professional email signature and company profile photo. Be encouraging but honest.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url" as const,
                  image_url: { url: dataUrl, detail: "low" as const },
                },
                {
                  type: "text" as const,
                  text: `Evaluate this photo for professional use as a sales rep's email signature and profile photo. Check for:\n1. Face clearly visible and centered\n2. Good lighting (not too dark, not overexposed)\n3. Image sharpness (not blurry)\n4. Professional appearance (no sunglasses, appropriate attire)\n5. Clean background (not cluttered or distracting)\n6. Appropriate framing (head and shoulders)\n\nReturn your assessment as JSON.`,
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "photo_quality_check",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  passed: { type: "boolean", description: "true if the photo is acceptable for professional use" },
                  issues: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of specific quality issues found (empty if passed)",
                  },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Helpful suggestions to improve the photo (empty if perfect)",
                  },
                },
                required: ["passed", "issues", "suggestions"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices?.[0]?.message?.content;
        if (content && typeof content === "string") {
          return JSON.parse(content) as { passed: boolean; issues: string[]; suggestions: string[] };
        }
        return { passed: true, issues: [], suggestions: [] };
      } catch (err) {
        console.error("AI photo quality check failed:", err);
        // Don't block on failure — return passing
        return { passed: true, issues: [], suggestions: [] };
      }
    }),

  // Get email signature HTML for the rep
  getEmailSignature: protectedProcedure
    .query(async ({ ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) return null;
      return buildEmailSignature(rep);
    }),

  // Admin: manually create a rep account
  createManually: adminProcedure
    .input(z.object({
      fullName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      territory: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { randomBytes } = await import("crypto");
      const bcrypt = await import("bcryptjs");
      const tempPassword = randomBytes(8).toString("hex");
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const openId = "local_rep_" + randomBytes(8).toString("hex");

      await db.upsertUser({
        openId,
        email: input.email,
        name: input.fullName,
        loginMethod: "email_password",
        passwordHash,
        role: "user",
        lastSignedIn: new Date(),
        needsStripeConnect: true,
      } as any);

      const user = await db.getUserByEmail(input.email);
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });

      await db.createRep({
        userId: user.id,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        territory: input.territory,
        status: "training",
        commissionRate: "10.00",
        onboardingComplete: false,
      } as any);

      // Send welcome email with temp password
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { ENV: envVars } = await import("./_core/env");
        await resend.emails.send({
          from: envVars.resendFromEmail || "hello@minimorphstudios.net",
          to: input.email,
          subject: "Welcome to MiniMorph Studios — Your Rep Account",
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2>Welcome, ${input.fullName}!</h2>
            <p>Your rep account has been created. Here are your login credentials:</p>
            <p><strong>Email:</strong> ${input.email}<br/>
            <strong>Temporary Password:</strong> ${tempPassword}</p>
            <p>Please log in and complete your onboarding at <a href="${envVars.appUrl || "https://minimorphstudios.net"}/rep">${envVars.appUrl || "https://minimorphstudios.net"}/rep</a></p>
            <p>Change your password after your first login.</p>
          </div>`,
        });
      } catch (emailErr) {
        console.error("[createRepManually] Welcome email failed:", emailErr);
      }

      return { success: true };
    }),
});

// Build a branded email signature HTML block
export function buildEmailSignature(rep: { fullName: string; email: string; phone?: string | null; profilePhotoUrl?: string | null }) {
  const photoHtml = rep.profilePhotoUrl
    ? `<img src="${rep.profilePhotoUrl}" alt="${rep.fullName}" width="60" height="60" style="border-radius:50%;object-fit:cover;margin-right:12px;" />`
    : `<div style="width:60px;height:60px;border-radius:50%;background:#4a9eff;color:#111122;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;margin-right:12px;">${rep.fullName.charAt(0)}</div>`;
  const phoneHtml = rep.phone ? `<br/><span style="color:#666;">📱 ${rep.phone}</span>` : "";
  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:'Inter',Helvetica,Arial,sans-serif;font-size:13px;color:#c8c8d8;margin-top:20px;border-top:2px solid #4a9eff;padding-top:12px;">
  <tr>
    <td style="vertical-align:top;padding-right:12px;">${photoHtml}</td>
    <td style="vertical-align:top;">
      <strong style="font-size:14px;color:#eaeaf0;">${rep.fullName}</strong><br/>
      <span style="color:#666;">Sales Representative — MiniMorph Studios</span><br/>
      <span style="color:#666;">✉️ ${rep.email}</span>${phoneHtml}
    </td>
  </tr>
</table>`;
}

/* ═══════════════════════════════════════════════════════
   LEADS ROUTER
   ═══════════════════════════════════════════════════════ */
const leadsRouter = router({
  // Admin: create a lead
  create: adminProcedure
    .input(
      z.object({
        businessName: z.string().min(1),
        contactName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        industry: z.string().optional(),
        website: z.string().optional(),
        source: z.enum(["ai_sourced", "website_form", "referral", "manual"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.createLead(input);
    }),

  // Admin: list leads with filters
  list: adminProcedure
    .input(
      z.object({
        stage: z.string().optional(),
        temperature: z.string().optional(),
        assignedRepId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return db.listLeads(input ?? undefined);
    }),

  // Protected: get lead by ID (ownership: admin or assigned rep only)
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertLeadOwnership(ctx.user, input.id);
      const lead = await db.getLeadById(input.id);
      return lead ?? null;
    }),
  // Admin: update leadd
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        stage: z.enum(["new", "enriched", "warming", "warm", "assigned", "contacted", "proposal_sent", "negotiating", "closed_won", "closed_lost"]).optional(),
        temperature: z.enum(["cold", "warm", "hot"]).optional(),
        qualificationScore: z.number().min(0).max(100).optional(),
        assignedRepId: z.number().nullable().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateLead(id, data as any);
      return { success: true };
    }),

  // Admin: AI-powered lead enrichment using LLM
  enrich: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const lead = await db.getLeadById(input.id);
      if (!lead) throw new Error("Lead not found");

      const enrichResult = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a business research assistant. Given a business name, contact info, and industry, generate a brief enrichment profile. Return JSON with: companySize (string), estimatedRevenue (string), onlinePresence (string rating: poor/fair/good/excellent), websiteNeeds (string[]), competitorExamples (string[]), recommendedPackage (starter/growth/premium/enterprise), and enrichmentSummary (2-3 sentence summary).",
          },
          {
            role: "user",
            content: `Enrich this lead:\nBusiness: ${lead.businessName}\nContact: ${lead.contactName}\nIndustry: ${lead.industry || "Unknown"}\nEmail: ${lead.email}\nWebsite: ${lead.website || "None"}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "lead_enrichment",
            strict: true,
            schema: {
              type: "object",
              properties: {
                companySize: { type: "string", description: "Estimated company size" },
                estimatedRevenue: { type: "string", description: "Estimated annual revenue" },
                onlinePresence: { type: "string", enum: ["poor", "fair", "good", "excellent"], description: "Current online presence rating" },
                websiteNeeds: { type: "array", items: { type: "string" }, description: "Key website needs" },
                competitorExamples: { type: "array", items: { type: "string" }, description: "Example competitors with good websites" },
                recommendedPackage: { type: "string", enum: ["starter", "growth", "premium", "enterprise"], description: "Recommended package tier" },
                enrichmentSummary: { type: "string", description: "2-3 sentence enrichment summary" },
              },
              required: ["companySize", "estimatedRevenue", "onlinePresence", "websiteNeeds", "competitorExamples", "recommendedPackage", "enrichmentSummary"],
              additionalProperties: false,
            },
          },
        },
      });

      const enrichmentData = JSON.parse(enrichResult.choices[0].message.content as string);

      // Update lead with enrichment data and advance stage
      await db.updateLead(input.id, {
        enrichmentData,
        stage: lead.stage === "new" ? "enriched" : lead.stage,
        qualificationScore: Math.min(
          100,
          lead.qualificationScore + 15
        ),
      } as any);

      return { success: true, enrichmentData };
    }),

  // Admin: assign lead to rep
  assign: adminProcedure
    .input(z.object({ leadId: z.number(), repId: z.number() }))
    .mutation(async ({ input }) => {
      await db.updateLead(input.leadId, {
        assignedRepId: input.repId,
        stage: "assigned",
        temperature: "warm",
      });
      // Notify the rep
      await db.createRepNotification({
        repId: input.repId,
        type: "lead_assigned",
        title: "New Lead Assigned",
        message: `A new lead has been assigned to you.`,
        metadata: { leadId: input.leadId },
      });
      // Push notification (async, non-blocking)
      import("./services/pushNotification").then(({ notifyNewLead }) => {
        notifyNewLead(input.repId, "A new lead").catch((e: any) => console.error("[Push] Lead assign push failed:", e));
      });
      return { success: true };
    }),

  // ─── REP-FACING ENDPOINTS ─────────────────────────────

  // Rep: list my assigned leads
  myLeads: protectedProcedure.query(async ({ ctx }) => {
    const rep = await db.getRepByUserId(ctx.user.id);
    if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a registered rep" });
    return db.listLeadsByRep(rep.id);
  }),

  // Rep: update stage/notes/temperature on their own lead
  updateMyLead: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        stage: z.enum(["assigned", "contacted", "proposal_sent", "negotiating", "closed_lost"]).optional(),
        temperature: z.enum(["cold", "warm", "hot"]).optional(),
        notes: z.string().optional(),
        outcome: z.enum(["connected", "voicemail", "no_answer", "scheduled", "sent", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a registered rep" });
      const lead = await db.getLeadById(input.leadId);
      if (!lead || lead.assignedRepId !== rep.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This lead is not assigned to you" });
      }
      const { leadId, outcome, ...data } = input;
      const updateData: any = { ...data, lastTouchAt: new Date() };
      await db.updateLead(leadId, updateData);
      // Log activity with outcome
      await db.createActivityLog({
        repId: rep.id,
        type: "lead_update",
        leadId,
        subject: `Updated lead ${lead.businessName}`,
        notes: `Changed: ${Object.keys(data).join(", ")}`,
        outcome: outcome || undefined,
        pointsEarned: 5,
      });
      return { success: true };
    }),

  // Rep: claim an unassigned lead from the pool
  claimLead: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a registered rep" });
      if (rep.status !== "active" && rep.status !== "certified") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You must be an active/certified rep to claim leads" });
      }
      // Check claim limit (max 20 active leads per rep)
      const activeCount = await db.countActiveLeadsByRep(rep.id);
      if (activeCount >= 20) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You have reached the maximum of 20 active leads. Close or release some leads first." });
      }
      const claimed = await db.claimLead(input.leadId, rep.id);
      if (!claimed) {
        throw new TRPCError({ code: "CONFLICT", message: "This lead has already been claimed by another rep" });
      }
      // Log activity and notify
      await db.createActivityLog({
        repId: rep.id,
        type: "lead_claimed",
        leadId: input.leadId,
        subject: `Claimed lead #${input.leadId} from the pool`,
        pointsEarned: 10,
      });
      await db.createRepNotification({
        repId: rep.id,
        type: "lead_claimed",
        title: "Lead Claimed",
        message: `You successfully claimed lead #${input.leadId}.`,
        metadata: { leadId: input.leadId },
      });
      return { success: true };
    }),

  // Rep: list unassigned leads available for claiming
  leadPool: protectedProcedure.query(async ({ ctx }) => {
    const rep = await db.getRepByUserId(ctx.user.id);
    if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a registered rep" });
    return db.listUnassignedLeads();
  }),

  // Rep: create a self-sourced lead (someone they personally know)
  createMyLead: protectedProcedure
    .input(
      z.object({
        businessName: z.string().min(1),
        contactName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        industry: z.string().optional(),
        website: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a registered rep" });
      const lead = await db.createLead({
        ...input,
        source: "referral" as const,
        selfSourced: true,
        assignedRepId: rep.id,
        stage: "assigned" as const,
        temperature: "warm" as const,
      });
      // Log activity
      await db.createActivityLog({
        repId: rep.id,
        type: "lead_added",
        leadId: lead.id,
        subject: `Self-sourced lead: ${input.businessName}`,
        notes: `Added personal contact ${input.contactName}`,
        pointsEarned: 25,
      });
      return lead;
    }),

  // Rep: close a deal — creates customer, contract, commission, notifies owner
  closeDeal: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        packageTier: z.enum(["starter", "growth", "premium", "enterprise"]),
        monthlyPrice: z.string(),
        discountPercent: z.number().min(0).max(5).default(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a registered rep" });
      const lead = await db.getLeadById(input.leadId);
      if (!lead || lead.assignedRepId !== rep.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This lead is not assigned to you" });
      }
      if (lead.stage === "closed_won" || lead.stage === "closed_lost") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This lead is already closed" });
      }

      // 0. Apply discount if any
      const discountPct = input.discountPercent || 0;
      const originalPrice = parseFloat(input.monthlyPrice);
      const discountedPrice = discountPct > 0 ? originalPrice * (1 - discountPct / 100) : originalPrice;
      const finalMonthlyPrice = discountedPrice.toFixed(2);

      // Save discount on lead
      if (discountPct > 0) {
        await db.updateLead(input.leadId, { discountPercent: discountPct } as any);
      }

      // 1. Mark lead as closed_won
      await db.updateLead(input.leadId, { stage: "closed_won", temperature: "hot", lastTouchAt: new Date() });

      // 2. Create customer from lead data
      const customer = await db.createCustomer({
        leadId: lead.id,
        businessName: lead.businessName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        industry: lead.industry,
        website: lead.website,
      });

      // 3. Create 12-month contract (with discounted price)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      const contract = await db.createContract({
        customerId: customer.id,
        repId: rep.id,
        packageTier: input.packageTier,
        monthlyPrice: finalMonthlyPrice,
        startDate,
        endDate,
        status: "pending_payment",
        notes: input.notes ? `${input.notes}${discountPct > 0 ? ` | ${discountPct}% rep discount applied (was $${originalPrice}/mo)` : ""}` : (discountPct > 0 ? `${discountPct}% rep discount applied (was $${originalPrice}/mo)` : undefined),
      });

      // 4. Calculate commission — DOUBLE for self-sourced leads
      const isSelfSourced = lead.selfSourced;
      // Use accountability tier (bronze/silver/gold/platinum) for commission rate
      const database = await getDb();
      let tierKey: TierKey = "bronze";
      if (database) {
        const tierRows = await database.select().from(repTiers).where(eq(repTiers.repId, rep.id)).limit(1);
        tierKey = (tierRows[0]?.tier || "bronze") as TierKey;
      }
      let rate = TIER_CONFIG[tierKey].commissionRate / 100;
      // Double commission for self-sourced leads
      if (isSelfSourced) rate = Math.min(rate * 2, 0.40);
      const annualValue = discountedPrice * 12;
      const commissionAmount = (annualValue * rate).toFixed(2);
      // Commission auto-approved (instant payout model)
      const commission = await db.createCommission({
        repId: rep.id,
        contractId: contract.id,
        amount: commissionAmount,
        type: "initial_sale",
        status: "pending",
        selfSourced: isSelfSourced,
      });

      // 5. Update rep stats
      await db.updateRep(rep.id, {
        totalDeals: rep.totalDeals + 1,
        totalRevenue: (parseFloat(rep.totalRevenue || "0") + annualValue).toFixed(2),
      } as any);

      // 6. Check referral bonus
      const repApplication = await db.getRepApplication(rep.id);
      if (repApplication?.referredBy && rep.totalDeals === 0) {
        const allReps = await db.listReps();
        const referrer = allReps.find(
          (r) => r.referralCode === repApplication.referredBy
            || r.fullName.toLowerCase() === repApplication.referredBy!.toLowerCase()
            || r.email.toLowerCase() === repApplication.referredBy!.toLowerCase()
        );
        if (referrer) {
          await db.createCommission({
            repId: referrer.id,
            contractId: contract.id,
            amount: "200.00",
            type: "referral_bonus",
          });
          await db.createRepNotification({
            repId: referrer.id,
            type: "commission_approved",
            title: "Referral Bonus Earned!",
            message: `Your referred rep ${rep.fullName} just closed their first deal. You earned a $200 referral bonus!`,
            metadata: { contractId: contract.id, amount: "200.00" },
          });
        }
      }

      // 7. Log activity & award points
      await db.createActivityLog({
        repId: rep.id,
        type: "deal_closed",
        leadId: lead.id,
        customerId: customer.id,
        subject: `Closed deal with ${lead.businessName} — ${input.packageTier} at $${input.monthlyPrice}/mo`,
        notes: `Contract #${contract.id}, Package: ${input.packageTier}`,
        pointsEarned: 100,
      });

      // 8. Notify rep
      await db.createRepNotification({
        repId: rep.id,
        type: "deal_closed",
        title: isSelfSourced ? "🌟 Self-Sourced Deal Closed!" : "Deal Closed!",
        message: `Congratulations! You closed ${lead.businessName} for $${finalMonthlyPrice}/mo (${input.packageTier}).${discountPct > 0 ? ` ${discountPct}% discount applied.` : ""} Commission: $${commissionAmount}${isSelfSourced ? " (2x bonus!)" : ""} — pending payment confirmation.`,
        metadata: { contractId: contract.id, commissionAmount, selfSourced: isSelfSourced, discountPercent: discountPct },
      });

      // 9. Auto-create onboarding project (customer handoff)
      await db.createOnboardingProject({
        customerId: customer.id,
        contractId: contract.id,
        businessName: lead.businessName,
        contactName: lead.contactName,
        contactEmail: lead.email,
        contactPhone: lead.phone || undefined,
        packageTier: input.packageTier,
        assignedRepId: rep.id,
        stage: "intake",
      });

      // 10. Notify owner
      const discountNote = discountPct > 0 ? `\nDiscount: ${discountPct}% (was $${originalPrice}/mo)` : "";
      const selfSourcedNote = isSelfSourced ? "\n⭐ Self-sourced lead (double commission)" : "";
      await notifyOwner({
        title: `Deal Closed: ${lead.businessName}`,
        content: `Rep ${rep.fullName} closed a ${input.packageTier} deal with ${lead.businessName} at $${finalMonthlyPrice}/mo.${discountNote}${selfSourcedNote}\nAnnual value: $${annualValue.toFixed(2)}\nCommission: $${commissionAmount} (${(rate * 100).toFixed(0)}% at ${tierKey} tier) — pending payment confirmation\nPayment link sent to customer. Contract activates upon payment.\nOnboarding project auto-created.`,
      });

      // 11. Generate Stripe payment link for the customer
      let paymentUrl: string | null = null;
      try {
        const Stripe = (await import("stripe")).default;
        const { PACKAGES } = await import("../shared/pricing");
        const stripeKey = ENV.stripeSecretKey;
        if (stripeKey) {
          const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" as any });
          const pkg = PACKAGES[input.packageTier as keyof typeof PACKAGES];
          const origin = ctx.req.headers.origin || ctx.req.headers.referer || ENV.appUrl || "https://minimorphstudios.com";
          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer_email: lead.email,
            client_reference_id: String(customer.id),
            allow_promotion_codes: true,
            subscription_data: {
              metadata: {
                user_id: "",
                package_tier: input.packageTier,
                business_name: lead.businessName,
                contract_id: String(contract.id),
                lead_id: String(lead.id),
                rep_id: String(rep.id),
                customer_id: String(customer.id),
                rep_closed: "true",
              },
            },
            metadata: {
              user_id: "",
              customer_email: lead.email,
              customer_name: lead.contactName,
              package_tier: input.packageTier,
              business_name: lead.businessName,
              contract_id: String(contract.id),
              lead_id: String(lead.id),
              rep_id: String(rep.id),
              customer_id: String(customer.id),
              rep_closed: "true",
            },
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  product_data: {
                    name: `${pkg.name} Package`,
                    description: pkg.description,
                  },
                  unit_amount: Math.round(discountedPrice * 100),
                  recurring: { interval: "month" },
                },
                quantity: 1,
              },
            ],
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/get-started?cancelled=true`,
          });
          paymentUrl = session.url;
          // Send payment link email to customer
          if (paymentUrl) {
            try {
              const { sendPaymentLinkEmail } = await import("./services/customerEmails");
              await sendPaymentLinkEmail({
                to: lead.email,
                customerName: lead.contactName,
                businessName: lead.businessName,
                packageTier: input.packageTier as any,
                paymentUrl,
                repName: rep.fullName,
              });
            } catch (emailErr) {
              console.error("[closeDeal] Failed to send payment link email:", emailErr);
            }
          }
        }
      } catch (err) {
        console.error("[closeDeal] Failed to create Stripe checkout:", err);
        // Non-fatal — deal is still closed, payment link can be sent manually
      }
      return {
        success: true,
        customerId: customer.id,
        contractId: contract.id,
        commissionId: commission.id,
        commissionAmount,
        annualValue,
        paymentUrl,
        paymentStatus: "pending_payment",
      };
    }),

  // Rep: generate AI proposal for a lead
  generateProposal: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        packageTier: z.enum(["starter", "growth", "premium", "enterprise"]),
        customNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a registered rep" });
      const lead = await db.getLeadById(input.leadId);
      if (!lead || lead.assignedRepId !== rep.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This lead is not assigned to you" });
      }
      const { invokeLLM } = await import("./_core/llm");
      const { PACKAGES } = await import("./stripe-products");
      const pkg = PACKAGES[input.packageTier];

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional sales proposal writer for MiniMorph Studios, a premium web design agency. Write a compelling, personalized proposal email. Be warm but professional. Include specific package details and ROI projections. Format as HTML email with inline styles for readability.`,
          },
          {
            role: "user",
            content: `Write a proposal for:\n- Business: ${lead.businessName}\n- Contact: ${lead.contactName}\n- Industry: ${lead.industry || "General"}\n- Package: ${pkg?.name || input.packageTier} ($${pkg ? (pkg.monthlyPriceInCents / 100).toFixed(0) : "TBD"}/mo, 12-month contract)\n- Features: ${pkg?.features.join(", ") || "Standard features"}\n- Enrichment data: ${lead.enrichmentData ? JSON.stringify(lead.enrichmentData) : "None"}\n- Rep name: ${rep.fullName}\n${input.customNotes ? `- Custom notes: ${input.customNotes}` : ""}\n\nReturn JSON with: subject (string), htmlContent (string with HTML email), plainTextContent (string), keySellingPoints (string[])`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "proposal_email",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subject: { type: "string" },
                htmlContent: { type: "string" },
                plainTextContent: { type: "string" },
                keySellingPoints: { type: "array", items: { type: "string" } },
              },
              required: ["subject", "htmlContent", "plainTextContent", "keySellingPoints"],
              additionalProperties: false,
            },
          },
        },
      });

      const proposal = JSON.parse(result.choices[0].message.content as string);

      // Actually send the proposal email via Resend with signature
      const signature = buildEmailSignature(rep);
      let deliveryStatus = "generated";
      if (lead.email) {
        try {
          const { sendEmail: deliverEmail } = await import("./services/email");
          const delivery = await deliverEmail({
            to: lead.email,
            subject: proposal.subject,
            html: proposal.htmlContent + signature,
            text: proposal.plainTextContent + `\n\n--\n${rep.fullName}\nSales Representative — MiniMorph Studios\n${rep.email}${rep.phone ? '\n' + rep.phone : ''}`,
            replyTo: ctx.user.email || undefined,
          });
          deliveryStatus = delivery.success ? "sent" : "delivery_failed";
          if (!delivery.success) {
            console.warn(`[Proposal] Email delivery failed for lead ${lead.id}: ${delivery.error}`);
          }
          // Save as sent email record with resendMessageId for tracking
          const emailRecord = await db.createSentEmail({
            repId: rep.id,
            leadId: lead.id,
            recipientEmail: lead.email,
            recipientName: lead.contactName,
            subject: proposal.subject,
            body: proposal.htmlContent,
          });
          if (delivery.success && delivery.resendId) {
            await db.updateEmailResendId(emailRecord.id, delivery.resendId);
          }
        } catch (err: any) {
          console.warn(`[Proposal] Email delivery error: ${err.message}`);
          deliveryStatus = "delivery_failed";
        }
      }

      // Log activity
      await db.createActivityLog({
        repId: rep.id,
        type: "proposal_generated",
        leadId: lead.id,
        subject: `Generated ${input.packageTier} proposal for ${lead.businessName}${deliveryStatus === "sent" ? " (emailed)" : ""}`,
        pointsEarned: 15,
      });

      return { ...proposal, deliveryStatus };
    }),

  // Admin: bulk transfer leads from one rep to another
  transferLeads: adminProcedure
    .input(z.object({ fromRepId: z.number(), toRepId: z.number() }))
    .mutation(async ({ input }) => {
      const count = await db.bulkTransferLeads(input.fromRepId, input.toRepId);
      // Notify the receiving rep
      if (count > 0) {
        await db.createRepNotification({
          repId: input.toRepId,
          type: "lead_assigned",
          title: `${count} Leads Transferred to You`,
          message: `${count} active leads have been transferred to your pipeline.`,
          metadata: { fromRepId: input.fromRepId, count },
        });
      }
      return { success: true, transferredCount: count };
    }),

  // Public: website popup lead capture
  captureFromPopup: publicProcedure
    .input(z.object({
      businessName: z.string().min(1),
      contactName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.createLead({
        businessName: input.businessName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        source: "website_popup",
      });
      // Send discount welcome email
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const siteUrl = ENV.appUrl || "https://minimorphstudios.net";
        await resend.emails.send({
          from: ENV.resendFromEmail,
          to: input.email,
          subject: "Your 10% discount from MiniMorph Studios",
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#111;color:#eee">
            <h2>Hi ${input.contactName}!</h2>
            <p>Thanks for your interest in MiniMorph Studios. Use code <strong>WELCOME10</strong> at checkout for 10% off any package.</p>
            <p><a href="${siteUrl}/get-started?discount=WELCOME10" style="background:#4a9eff;color:#111;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Get Started →</a></p>
          </div>`,
        });
      } catch {}
      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   CUSTOMERS ROUTER
   ═══════════════════════════════════════════════════════ */
const customersRouter = router({
  // Customer self-service: get the customer record for the logged-in user
  me: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return null;
    const rows = await database
      .select()
      .from(customers)
      .where(eq(customers.userId, ctx.user.id))
      .limit(1);
    return rows[0] ?? null;
  }),

  create: adminProcedure
    .input(
      z.object({
        businessName: z.string().min(1),
        contactName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        industry: z.string().optional(),
        website: z.string().optional(),
        leadId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.createCustomer(input);
    }),

  list: adminProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return db.listCustomers(input?.status);
    }),

  // Ownership: admin or own customer only
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertCustomerOwnership(ctx.user, input.id);
      const customer = await db.getCustomerById(input.id);
      return customer ?? null;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        healthScore: z.number().min(0).max(100).optional(),
        status: z.enum(["active", "at_risk", "churned"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCustomer(id, data);
      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   CONTRACTS ROUTER
   ═══════════════════════════════════════════════════════ */
const contractsRouter = router({
  create: adminProcedure
    .input(
      z.object({
        customerId: z.number(),
        repId: z.number(),
        packageTier: z.enum(["starter", "growth", "premium"]),
        monthlyPrice: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        websitePages: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.createContract(input);
    }),

  list: adminProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return db.listContracts(input?.status);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const contract = await db.getContractById(input.id);
      return contract ?? null;
    }),

  byCustomer: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Ownership check: admins can access any, customers only their own
      if (ctx.user.role !== "admin") {
        const { customers } = await import("../drizzle/schema");
        const database = await getDb();
        if (database) {
          const custs = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
          if (!custs.length || custs[0].id !== input.customerId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }
        }
      }
      return db.listContractsByCustomer(input.customerId);
    }),

  // Ownership: admin or own rep only
  byRep: protectedProcedure
    .input(z.object({ repId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertRepOwnership(ctx.user, input.repId);
      return db.listContractsByRep(input.repId);
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "expiring_soon", "expired", "renewed", "cancelled"]).optional(),
        renewalStatus: z.enum(["not_started", "nurturing", "proposed", "accepted", "declined"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateContract(id, data);
      return { success: true };
    }),

  resendPaymentLink: adminProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // 1. Get the contract — must be pending_payment
      const [contract] = await database.select().from(contracts).where(eq(contracts.id, input.contractId)).limit(1);
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      if (contract.status !== "pending_payment") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Contract is not in pending_payment status" });
      }

      // 2. Get the customer
      const [customer] = await database.select().from(customers).where(eq(customers.id, contract.customerId)).limit(1);
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });

      // 3. Get lead/rep info if available
      let leadId: number | null = customer.leadId ?? null;
      let repId: number = contract.repId;
      let repName = "MiniMorph Studios";
      if (repId > 0) {
        const [rep] = await database.select().from(reps).where(eq(reps.id, repId)).limit(1);
        if (rep) repName = rep.fullName;
      }

      // 4. Create new Stripe checkout session (does NOT create duplicate contract/customer)
      const Stripe = (await import("stripe")).default;
      const { PACKAGES } = await import("../shared/pricing");
      const stripeKey = ENV.stripeSecretKey;
      if (!stripeKey) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" as any });
      const pkg = PACKAGES[contract.packageTier as keyof typeof PACKAGES];
      if (!pkg) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid package tier" });

      const origin = ctx.req.headers.origin || ctx.req.headers.referer || "https://minimorphstudios.net";
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: customer.email,
        client_reference_id: String(customer.id),
        allow_promotion_codes: true,
        subscription_data: {
          metadata: {
            user_id: customer.userId ? String(customer.userId) : "",
            package_tier: contract.packageTier,
            business_name: customer.businessName,
            contract_id: String(contract.id),
            lead_id: leadId ? String(leadId) : "",
            rep_id: String(repId),
            customer_id: String(customer.id),
            rep_closed: "true",
          },
        },
        metadata: {
          user_id: customer.userId ? String(customer.userId) : "",
          customer_email: customer.email,
          customer_name: customer.contactName,
          package_tier: contract.packageTier,
          business_name: customer.businessName,
          contract_id: String(contract.id),
          lead_id: leadId ? String(leadId) : "",
          rep_id: String(repId),
          customer_id: String(customer.id),
          rep_closed: "true",
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${pkg.name} Package`,
                description: pkg.description,
              },
              unit_amount: Math.round(pkg.monthlyPrice * 100),
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/get-started?cancelled=true`,
      });

      const paymentUrl = session.url;

      // 5. Send payment link email
      if (paymentUrl) {
        const { sendPaymentLinkEmail } = await import("./services/customerEmails");
        await sendPaymentLinkEmail({
          to: customer.email,
          customerName: customer.contactName,
          businessName: customer.businessName,
          packageTier: contract.packageTier as any,
          paymentUrl,
          repName,
        });
      }

      // 6. Log the resend in nurture logs if possible
      try {
        await database.insert(nurtureLogs).values({
          customerId: customer.id,
          type: "support_request",
          channel: "email",
          subject: "Payment link resent by admin",
          content: `New payment link generated for contract #${contract.id}`,
          status: "sent",
          scheduledAt: new Date(),
          sentAt: new Date(),
        });
      } catch (logErr) {
        console.error("[resendPaymentLink] Failed to log nurture entry:", logErr);
      }

      return { success: true, paymentUrl };
    }),
});

/* ═══════════════════════════════════════════════════════
   COMMISSIONS ROUTER
   ═══════════════════════════════════════════════════════ */
const commissionsRouter = router({
  create: adminProcedure
    .input(
      z.object({
        repId: z.number(),
        contractId: z.number(),
        contractValue: z.string(), // The total contract value — commission calculated from this
        type: z.enum(["initial_sale", "renewal", "upsell"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Calculate commission based on rep's accountability tier
      const commDb = await getDb();
      let commTierKey: TierKey = "bronze";
      if (commDb) {
        const tierRows = await commDb.select().from(repTiers).where(eq(repTiers.repId, input.repId)).limit(1);
        commTierKey = (tierRows[0]?.tier || "bronze") as TierKey;
      }
      const rate = TIER_CONFIG[commTierKey].commissionRate / 100;
      const contractValue = parseFloat(input.contractValue) || 0;
      const commissionAmount = (contractValue * rate).toFixed(2);
      const commission = await db.createCommission({
        repId: input.repId,
        contractId: input.contractId,
        amount: commissionAmount,
        type: input.type,
      });

      // Check if this is the rep's first sale and they were referred — award $200 referral bonus
      if (input.type === "initial_sale") {
        const repApplication = await db.getRepApplication(input.repId);
        if (repApplication?.referredBy) {
          // Find the referring rep by referral code (stable ID-based lookup)
          const allReps = await db.listReps();
          const referrer = allReps.find(
            (r) => r.referralCode === repApplication.referredBy
              || r.fullName.toLowerCase() === repApplication.referredBy!.toLowerCase()
              || r.email.toLowerCase() === repApplication.referredBy!.toLowerCase()
          );
          if (referrer) {
            // Check if this is the new rep's FIRST commission (prevent duplicate bonuses)
            const existingCommissions = await db.listCommissionsByRep(input.repId);
            const existingReferralBonus = await db.listCommissionsByRep(referrer.id);
            const alreadyBonused = existingReferralBonus.some(
              (c) => c.type === "referral_bonus" && c.contractId === input.contractId
            );
            if (existingCommissions.length <= 1 && !alreadyBonused) {
              // Award $200 referral bonus to the referring rep
              await db.createCommission({
                repId: referrer.id,
                contractId: input.contractId,
                amount: "200.00",
                type: "referral_bonus",
              });
              await notifyOwner({
                title: "Referral Bonus Triggered",
                content: `${referrer.fullName} earned a $200 referral bonus because their referred rep (ID: ${input.repId}) just closed their first deal.`,
              });
            }
          }
        }
      }

      return commission;
    }),

  list: adminProcedure.query(async () => {
    return db.listCommissions();
  }),

  // Ownership: admin or own rep only
  byRep: protectedProcedure
    .input(z.object({ repId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertRepOwnership(ctx.user, input.repId);
      return db.listCommissionsByRep(input.repId);
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "approved", "paid"]),
        paidAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCommission(id, data);
      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   NURTURE ROUTER
   ═══════════════════════════════════════════════════════ */
const nurtureRouter = router({
  create: adminProcedure
    .input(
      z.object({
        customerId: z.number(),
        contractId: z.number().optional(),
        type: z.enum(["check_in", "support_request", "update_request", "feedback", "upsell_attempt", "renewal_outreach", "report_delivery"]),
        channel: z.enum(["email", "sms", "in_app", "phone"]).optional(),
        subject: z.string().optional(),
        content: z.string().optional(),
        scheduledAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.createNurtureLog(input);
    }),

  list: adminProcedure.query(async () => {
    return db.listAllNurtureLogs();
  }),

  byCustomer: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Ownership check: admins can access any, customers only their own
      if (ctx.user.role !== "admin") {
        const { customers } = await import("../drizzle/schema");
        const database = await getDb();
        if (database) {
          const custs = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
          if (!custs.length || custs[0].id !== input.customerId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }
        }
      }
      return db.listNurtureLogsByCustomer(input.customerId);
    }),

  // Admin: send automated nurture notification (uses notifyOwner + marks as sent)
  sendNotification: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const logs = await db.listAllNurtureLogs();
      const log = logs.find((l: any) => l.id === input.id);
      if (!log) throw new Error("Nurture log not found");

       // Send notification to owner about the nurture activity
      await notifyOwner({
        title: `Nurture: ${log.subject || log.type}`,
        content: `Customer #${log.customerId} — ${log.type.replace(/_/g, " ")}
Channel: ${log.channel}\n\n${log.content || "No content"}`,
      });

      // If channel is email and customer has an email, actually deliver via Resend
      let deliveryStatus = "notified_owner";
      if (log.channel === "email") {
        const customer = await db.getCustomerById(log.customerId);
        if (customer?.email) {
          try {
            const { sendEmail: deliverEmail } = await import("./services/email");
            const delivery = await deliverEmail({
              to: customer.email,
              subject: log.subject || `Update from MiniMorph Studios`,
              html: (log.content || "").replace(/\n/g, "<br/>"),
              text: log.content || "",
            });
            deliveryStatus = delivery.success ? "delivered" : "delivery_failed";
            if (!delivery.success) {
              console.warn(`[Nurture] Email delivery failed for customer ${customer.id}: ${delivery.error}`);
            }
          } catch (err: any) {
            console.warn(`[Nurture] Email delivery error: ${err.message}`);
            deliveryStatus = "delivery_failed";
          }
        }
      } else if (log.channel === "sms") {
        const customer = await db.getCustomerById(log.customerId);
        if (customer?.phone) {
          try {
            const { sendSms } = await import("./services/sms");
            const smsResult = await sendSms({
              to: customer.phone,
              body: log.content || `Hi from MiniMorph Studios! ${log.subject || ""}`,
            });
            deliveryStatus = smsResult.success ? "delivered" : "delivery_failed";
          } catch (err: any) {
            console.warn(`[Nurture] SMS delivery error: ${err.message}`);
            deliveryStatus = "delivery_failed";
          }
        }
      }

      // Mark as sent
      await db.updateNurtureLog(input.id, { status: "sent", sentAt: new Date() });
      return { success: true, deliveryStatus };
    }),

  // Admin: auto-generate nurture check-in using AI
  generateCheckIn: adminProcedure
    .input(z.object({ customerId: z.number(), contractId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const customer = await db.getCustomerById(input.customerId);
      if (!customer) throw new Error("Customer not found");

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a friendly customer success AI for MiniMorph Studios, a web design company. Generate a brief, warm check-in message for a customer. Return JSON with: subject (string, short email subject), content (string, 2-3 paragraph friendly check-in message asking how their website is performing and if they need anything).",
          },
          {
            role: "user",
            content: `Generate a check-in for:\nBusiness: ${customer.businessName}\nContact: ${customer.contactName}\nHealth Score: ${customer.healthScore}/100\nStatus: ${customer.status}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "nurture_checkin",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subject: { type: "string", description: "Email subject line" },
                content: { type: "string", description: "Check-in message body" },
              },
              required: ["subject", "content"],
              additionalProperties: false,
            },
          },
        },
      });

      const checkin = JSON.parse(result.choices[0].message.content as string);

      // Create the nurture log entry
      const logResult = await db.createNurtureLog({
        customerId: input.customerId,
        contractId: input.contractId,
        type: "check_in",
        channel: "email",
        subject: checkin.subject,
        content: checkin.content,
        status: "scheduled",
      } as any);

      return { success: true, subject: checkin.subject, content: checkin.content };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["scheduled", "sent", "delivered", "opened", "responded", "resolved"]).optional(),
        sentAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateNurtureLog(id, data);
      return { success: true };
    }),

  // Customer-safe: submit a support request (derives customerId from ctx.user)
  createSupportRequest: protectedProcedure
    .input(z.object({
      subject: z.string().min(1, "Subject is required").max(255),
      message: z.string().min(1, "Message is required").max(5000),
      type: z.enum(["support_request", "update_request"]).default("support_request"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { customers } = await import("../drizzle/schema");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const custs = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
      if (!custs.length) throw new TRPCError({ code: "NOT_FOUND", message: "Customer account not found" });
      const cust = custs[0];
      const activeContracts = await db.listContractsByCustomer(cust.id);
      const activeContract = activeContracts?.find((c: any) => c.status === "active" || c.status === "expiring_soon");
      const log = await db.createNurtureLog({
        customerId: cust.id,
        contractId: activeContract?.id ?? null,
        type: input.type,
        channel: "in_app",
        subject: input.subject,
        content: input.message,
        status: "sent",
        sentAt: new Date(),
      });

      // Auto-acknowledgment email
      try {
        const { sendEmail } = await import("./services/email");
        await sendEmail({
          to: cust.email,
          subject: `We received your ${input.type === "update_request" ? "update request" : "support request"}: ${input.subject}`,
          html: `<p>Hi ${cust.contactName || "there"},</p><p>We've received your request and our team will review it within 1 business day. You can track the status in your Customer Portal.</p><p><strong>Subject:</strong> ${input.subject}</p><p>— The MiniMorph Studios Team</p>`,
          transactional: true,
        });
      } catch (emailErr) {
        console.error("[support] Failed to send auto-ack email:", emailErr);
      }

      return log;
    }),

  // Customer-safe: list own support requests (derives customerId from ctx.user)
  mySupportLogs: protectedProcedure.query(async ({ ctx }) => {
    const { customers } = await import("../drizzle/schema");
    const database = await getDb();
    if (!database) return [];
    const custs = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
    if (!custs.length) return [];
    const allLogs = await db.listNurtureLogsByCustomer(custs[0].id);
    return allLogs.filter((l: any) => l.type === "support_request" || l.type === "update_request");
  }),
});

/* ═══════════════════════════════════════════════════════
   REPORTS ROUTER
   ═══════════════════════════════════════════════════════ */
const reportsRouter = router({
  create: adminProcedure
    .input(
      z.object({
        customerId: z.number(),
        contractId: z.number().optional(),
        reportMonth: z.string(),
        pageViews: z.number().optional(),
        uniqueVisitors: z.number().optional(),
        bounceRate: z.string().optional(),
        avgSessionDuration: z.number().optional(),
        conversionRate: z.string().optional(),
        recommendations: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.createReport(input);
    }),

  list: adminProcedure.query(async () => {
    return db.listAllReports();
  }),

  byCustomer: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Ownership check: admins can access any, customers only their own
      if (ctx.user.role !== "admin") {
        const { customers } = await import("../drizzle/schema");
        const database = await getDb();
        if (database) {
          const custs = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
          if (!custs.length || custs[0].id !== input.customerId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }
        }
      }
      return db.listReportsByCustomer(input.customerId);
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "generated", "delivered"]).optional(),
        deliveredAt: z.coerce.date().optional(),
        recommendations: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateReport(id, data);
      return { success: true };
    }),

  // AI-generated report summary for a customer
  generateAiSummary: adminProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const { reports: reportsTable } = await import("../drizzle/schema");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const reports = await database.select().from(reportsTable).where(eq(reportsTable.id, input.reportId)).limit(1);
      if (!reports.length) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      const report = reports[0];

      const customer = await db.getCustomerById(report.customerId);

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a website performance analyst for MiniMorph Studios. Generate a concise, actionable monthly report summary for a small business customer. Be encouraging but honest. Use plain language, not jargon. Keep it under 200 words.`,
          },
          {
            role: "user",
            content: `Generate a monthly performance summary for ${customer?.businessName || "this business"}.

Report Month: ${report.reportMonth}
Page Views: ${report.pageViews ?? "N/A"}
Unique Visitors: ${report.uniqueVisitors ?? "N/A"}
Bounce Rate: ${report.bounceRate ?? "N/A"}
Avg Session Duration: ${report.avgSessionDuration ? report.avgSessionDuration + "s" : "N/A"}
Conversion Rate: ${report.conversionRate ?? "N/A"}

Provide: 1) A 2-sentence performance overview, 2) One thing going well, 3) One actionable recommendation.`,
          },
        ],
      });

      const summary = result.choices[0].message.content as string;

      // Save the AI summary as recommendations
      await db.updateReport(input.reportId, { recommendations: summary });

      return { summary };
    }),
});

/* ═══════════════════════════════════════════════════════
   UPSELLS ROUTER
   ═══════════════════════════════════════════════════════ */
const upsellsRouter = router({
  create: adminProcedure
    .input(
      z.object({
        customerId: z.number(),
        contractId: z.number().optional(),
        type: z.enum(["tier_upgrade", "add_pages", "add_feature", "add_service", "ai_widget"]).optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        estimatedValue: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.createUpsellOpportunity(input);
    }),

  list: adminProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return db.listUpsells(input?.status);
    }),

  byCustomer: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Ownership check: admins can access any, customers only their own
      if (ctx.user.role !== "admin") {
        const { customers } = await import("../drizzle/schema");
        const database = await getDb();
        if (database) {
          const custs = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
          if (!custs.length || custs[0].id !== input.customerId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }
        }
      }
      return db.listUpsellsByCustomer(input.customerId);
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["identified", "proposed", "accepted", "declined", "completed"]).optional(),
        proposedAt: z.coerce.date().optional(),
        resolvedAt: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateUpsellOpportunity(id, data);
      return { success: true };
    }),
  // Customer-facing: express interest in a widget
  requestWidget: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      widgetId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Ownership check: customers can only request widgets for their own account
      if (ctx.user.role !== "admin") {
        const { customers } = await import("../drizzle/schema");
        const database = await getDb();
        if (database) {
          const custs = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
          if (!custs.length || custs[0].id !== input.customerId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }
        }
      }
      const widget = await db.getWidgetCatalogItem(input.widgetId);
      if (!widget) throw new Error("Widget not found");
      const customer = await db.getCustomerById(input.customerId);
      await db.createUpsellOpportunity({
        customerId: input.customerId,
        type: "ai_widget",
        title: widget.name,
        description: `Customer expressed interest in ${widget.name} ($${widget.monthlyPrice}/mo)`,
        estimatedValue: widget.monthlyPrice,
        status: "identified",
      });
      notifyOwner({
        title: `Widget Interest: ${widget.name}`,
        content: `Customer ${customer?.businessName || "#" + input.customerId} is interested in ${widget.name} ($${widget.monthlyPrice}/mo).\n\nReach out to close this upsell.`,
      }).catch(() => {});
      return { success: true, widgetName: widget.name };
    }),
});

/* ═══════════════════════════════════════════════════════
   CONTACT SUBMISSIONS ROUTER
   ═══════════════════════════════════════════════════════ */
const contactRouter = router({
  // Public: anyone can submit the contact form
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        businessName: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await db.createContactSubmission(input);
      notifyOwner({
        title: `New Contact: ${input.name}`,
        content: `Name: ${input.name}\nEmail: ${input.email}\nBusiness: ${input.businessName || "N/A"}\nMessage: ${input.message || "No message"}`,
      }).catch(() => {});
      return result;
    }),

  // Admin: list submissions
  list: adminProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return db.listContactSubmissions(input?.status);
    }),

  // Admin: update submission status
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "reviewed", "converted", "archived"]).optional(),
        convertedToLeadId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateContactSubmission(id, data);
      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   ORDERS / CHECKOUT ROUTER
   ═══════════════════════════════════════════════════════ */
const ordersRouter = router({
  // Protected: create a Stripe checkout session
  createCheckout: protectedProcedure
    .input(
      z.object({
        packageTier: z.enum(["starter", "growth", "premium", "enterprise"]),
        businessName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const Stripe = (await import("stripe")).default;
      const { getPackage } = await import("./stripe-products");

      const stripeKey = ENV.stripeSecretKey;
      if (!stripeKey) throw new Error("Stripe not configured");

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" as any });
      const pkg = getPackage(input.packageTier);
      if (!pkg) throw new Error("Invalid package tier");

      const origin = ctx.req.headers.origin || ctx.req.headers.referer || "http://localhost:3000";

      // Create the checkout session — monthly subscription
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        ui_mode: "embedded_page",
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        allow_promotion_codes: true,
        subscription_data: {
          metadata: {
            user_id: ctx.user.id.toString(),
            package_tier: input.packageTier,
            business_name: input.businessName || "",
          },
        },
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          package_tier: input.packageTier,
          business_name: input.businessName || "",
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: pkg.name,
                description: pkg.description,
              },
              unit_amount: pkg.monthlyPriceInCents,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        return_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      });

      // Create a pending order in the database
      const dbModule = await import("./db");
      await dbModule.createOrder({
        userId: ctx.user.id,
        stripeCheckoutSessionId: session.id,
        packageTier: input.packageTier,
        amount: pkg.monthlyPriceInCents,
        customerEmail: ctx.user.email || undefined,
        customerName: ctx.user.name || undefined,
        businessName: input.businessName || undefined,
      });

      return { clientSecret: session.client_secret, checkoutUrl: null };
    }),

  // Protected: list current user's orders
  myOrders: protectedProcedure.query(async ({ ctx }) => {
    const dbModule = await import("./db");
    return dbModule.listOrdersByUser(ctx.user.id);
  }),

  // Admin: list all orders
  list: adminProcedure.query(async () => {
    const dbModule = await import("./db");
    return dbModule.listAllOrders();
  }),
});

/* ═══════════════════════════════════════════════════════
   ONBOARDING ROUTER
   ═══════════════════════════════════════════════════════ */
const onboardingRouter = router({
  // Public: create a new onboarding project (from guided buying wizard)
  create: publicProcedure
    .input(
      z.object({
        businessName: z.string().min(1),
        contactName: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        packageTier: z.enum(["starter", "growth", "premium", "enterprise"]),
        orderId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const project = await db.createOnboardingProject({
        ...input,
        stage: "questionnaire",
        customerId: null,
      });
      return project;
    }),

  // Protected: get my onboarding project
  myProject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await db.getOnboardingProjectById(input.id);
      if (!project) return null;
      // Ownership check: verify the project belongs to the user's customer
      if (ctx.user.role !== "admin") {
        const { customers } = await import("../drizzle/schema");
        const database = await getDb();
        if (database) {
          const custs = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
          if (!custs.length || custs[0].id !== project.customerId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
          }
        }
      }
      return project;
    }),

  // Protected: submit questionnaire (expanded conditional branching)
  submitQuestionnaire: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        questionnaire: z.object({
          // Step 1: Website type
          websiteType: z.enum(["service_business", "restaurant", "contractor", "ecommerce", "other"]).optional(),
          // Step 2: Universal brand questions
          brandColors: z.array(z.string()).optional(),
          brandTone: z.enum(["professional", "friendly", "bold", "elegant", "playful"]).optional(),
          targetAudience: z.string().optional(),
          contentPreference: z.enum(["we_write", "customer_provides", "mix"]).optional(),
          // Step 3: Inspiration & competitor analysis
          inspirationSites: z.array(z.object({
            url: z.string(),
            whatYouLike: z.string(),
            whatYouDislike: z.string(),
          })).optional(),
          competitorSites: z.array(z.object({
            url: z.string(),
            whatYouWantToBeat: z.string(),
            featuresYouWish: z.string(),
          })).optional(),
          // Step 4: Industry-specific branches
          serviceBusinessFields: z.object({
            serviceArea: z.string().optional(),
            hasBookingSystem: z.boolean().optional(),
            currentBookingMethod: z.string().optional(),
            servicesOffered: z.string().optional(),
            licensedOrCertified: z.boolean().optional(),
            licenseDetails: z.string().optional(),
          }).optional(),
          restaurantFields: z.object({
            cuisineType: z.string().optional(),
            hasPhysicalLocation: z.boolean().optional(),
            locationCount: z.number().optional(),
            needsOnlineMenu: z.boolean().optional(),
            needsOnlineOrdering: z.boolean().optional(),
            needsReservations: z.boolean().optional(),
            operatingHours: z.string().optional(),
            deliveryPartners: z.string().optional(),
          }).optional(),
          contractorFields: z.object({
            serviceArea: z.string().optional(),
            tradeType: z.string().optional(),
            licensedOrCertified: z.boolean().optional(),
            licenseNumber: z.string().optional(),
            needsQuoteForm: z.boolean().optional(),
            needsBeforeAfterGallery: z.boolean().optional(),
            insuranceInfo: z.string().optional(),
            emergencyService: z.boolean().optional(),
          }).optional(),
          ecommerceFields: z.object({
            productCount: z.string().optional(),
            productCategories: z.string().optional(),
            needsShipping: z.boolean().optional(),
            shippingRegions: z.string().optional(),
            existingPlatform: z.string().optional(),
            needsMigration: z.boolean().optional(),
            hasInventorySystem: z.boolean().optional(),
            paymentMethods: z.string().optional(),
            needsSubscriptions: z.boolean().optional(),
            taxHandling: z.string().optional(),
          }).optional(),
          otherFields: z.object({
            businessDescription: z.string().optional(),
            industryCategory: z.string().optional(),
            uniqueRequirements: z.string().optional(),
          }).optional(),
          // Step 5: Features & special requests
          mustHaveFeatures: z.array(z.string()).optional(),
          specialRequests: z.string().optional(),
          // Legacy compat
          competitors: z.array(z.string()).optional(),
          inspirationUrls: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.user, input.projectId);
      // Analyze questionnaire for custom quote triggers
      const { analyzeQuestionnaire } = await import("@shared/quoteEngine");
      const analysis = analyzeQuestionnaire(input.questionnaire as any);
      await db.updateOnboardingProject(input.projectId, {
        questionnaire: input.questionnaire,
        stage: "assets_upload",
        needsCustomQuote: analysis.needsCustomQuote,
        reviewFlags: analysis.reviewFlags,
        complexityScore: analysis.complexityScore,
        generationStatus: "generating",
        generationLog: "Queued for AI generation...",
      });
      // Notify admin if custom quote is needed
      if (analysis.needsCustomQuote) {
        try {
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({
            title: "Custom Quote Required",
            content: `Project #${input.projectId} needs admin review.\nComplexity: ${analysis.complexityScore}/100\nFlags: ${analysis.reviewFlags.join(", ")}`,
          });
        } catch { /* notification is best-effort */ }
      }
      // Fire-and-forget site generation
      generateSiteForProject(input.projectId).catch(err =>
        console.error("[onboarding.submitQuestionnaire] Generation error:", err)
      );
      return {
        success: true,
        needsCustomQuote: analysis.needsCustomQuote,
        complexityScore: analysis.complexityScore,
        reviewFlags: analysis.reviewFlags,
      };
    }),

  // Protected: set domain preference (ownership check)
  setDomain: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        domainOption: z.enum(["existing", "new", "undecided"]),
        existingDomain: z.string().optional(),
        domainRegistrar: z.string().optional(),
        domainNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.user, input.projectId);
      const { projectId, ...domainData } = input;
      await db.updateOnboardingProject(projectId, domainData);
      return { success: true };
    }),

  // Protected: upload an asset file (ownership check)
  uploadAsset: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        fileName: z.string(),
        fileBase64: z.string(),
        mimeType: z.string().optional(),
        category: z.enum(["logo", "photo", "brand_guidelines", "copy", "document", "other"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.user, input.projectId);
      const { storagePut } = await import("./storage");
      const buffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `onboarding/${input.projectId}/${input.fileName}`;
      const { key, url } = await storagePut(fileKey, buffer, input.mimeType || "application/octet-stream");

      return db.createProjectAsset({
        projectId: input.projectId,
        fileName: input.fileName,
        fileKey: key,
        fileUrl: url,
        fileSize: buffer.length,
        mimeType: input.mimeType || "application/octet-stream",
        category: input.category || "other",
        notes: input.notes,
      });
    }),

  // Protected: list assets for a project (ownership check)
  listAssets: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.user, input.projectId);
      return db.listProjectAssets(input.projectId);
    }),

  // Protected: delete an asset (ownership check via project)
  deleteAsset: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertAssetOwnership(ctx.user, input.id);
      await db.deleteProjectAsset(input.id);
      return { success: true };
    }),

  // Protected: submit feedback on design
  submitFeedback: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        feedbackNotes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.user, input.projectId);
      const project = await db.getOnboardingProjectById(input.projectId);
      // Append new feedback with timestamp instead of overwriting
      const timestampedFeedback = `[${new Date().toISOString()}] Customer feedback:\n${input.feedbackNotes}`;
      const previousNotes = project?.feedbackNotes || "";
      const combinedNotes = previousNotes
        ? `${timestampedFeedback}\n\n${previousNotes}`
        : timestampedFeedback;
      await db.updateOnboardingProject(input.projectId, {
        feedbackNotes: combinedNotes,
        stage: "revisions",
        revisionsCount: (project?.revisionsCount || 0) + 1,
      });
      // Send confirmation email to customer
      try {
        if (project?.contactEmail && project?.contactName) {
          await sendOnboardingStageEmail({
            to: project.contactEmail,
            customerName: project.contactName,
            stage: "review",
            businessName: project.businessName,
            projectId: project.id,
          });
        }
      } catch (emailErr) {
        console.error("[onboarding.submitFeedback] Failed to send confirmation email:", emailErr);
      }
      return { success: true };
    }),

  // Protected: approve for launch (ownership check)
  approveLaunch: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.user, input.projectId);
      await db.updateOnboardingProject(input.projectId, {
        stage: "final_approval",
        approvedAt: new Date(),
      });
      const project = await db.getOnboardingProjectById(input.projectId);
      // Calculate expected launch date (2 business days out)
      const launchDate = new Date();
      launchDate.setDate(launchDate.getDate() + 2);
      const expectedLaunchDate = launchDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      // Send approval confirmation to customer
      try {
        if (project?.contactEmail && project?.contactName) {
          const { sendApprovalConfirmationEmail } = await import("./services/customerEmails");
          await sendApprovalConfirmationEmail({
            to: project.contactEmail,
            customerName: project.contactName,
            businessName: project.businessName,
            expectedLaunchDate,
          });
        }
      } catch (emailErr) {
        console.error("[onboarding.approveLaunch] Failed to send approval email:", emailErr);
      }
      // Notify admin with full project details
      try {
        const questionnaire = project?.questionnaire as any;
        const domainInfo = project?.domainName || project?.existingDomain || questionnaire?.existingDomain || "TBD";
        await notifyOwner({
          title: "ACTION REQUIRED: Site Approved — Ready to Launch",
          content: `${project?.businessName || "Unknown"} approved their site.\n\nProject: #${input.projectId}\nContact: ${project?.contactName} <${project?.contactEmail}>\nDomain: ${domainInfo}\nPackage: ${project?.packageTier}\n\nACTION: Connect domain, configure DNS, set SSL, deploy site. Then mark live in admin panel.`,
        });
      } catch { /* best-effort */ }

      // Fire-and-forget auto-deployment via Cloudflare Pages
      const { deployApprovedSite } = await import("./services/siteDeployment");
      deployApprovedSite(input.projectId).catch(err =>
        console.error("[approveLaunch] Deployment error:", err)
      );

      return { success: true };
    }),

  // Protected: generate contract text for a project
  getContract: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.user, input.projectId);
      const project = await db.getOnboardingProjectById(input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      const { PACKAGES } = await import("../shared/pricing");
      const tierKey = project.packageTier as keyof typeof PACKAGES;
      const pkg = PACKAGES[tierKey];
      const contractText = generateContractText({
        customerName: project.contactName,
        businessName: project.businessName,
        packageTier: project.packageTier,
        packagePrice: pkg.monthlyPrice,
        addons: [],
        totalMonthly: pkg.monthlyPrice,
        domainName: project.domainName ?? undefined,
        startDate: new Date(),
      });
      const contractHash = createHash("sha256").update(contractText).digest("hex");
      return { contractText, contractHash };
    }),

  // Protected: sign contract — records timestamp and IP
  signContract: protectedProcedure
    .input(z.object({ projectId: z.number(), contractHash: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.user, input.projectId);
      const project = await db.getOnboardingProjectById(input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      if (!project.contractId) throw new TRPCError({ code: "BAD_REQUEST", message: "No contract linked to this project" });
      const { PACKAGES } = await import("../shared/pricing");
      const tierKey = project.packageTier as keyof typeof PACKAGES;
      const pkg = PACKAGES[tierKey];
      const contractText = generateContractText({
        customerName: project.contactName,
        businessName: project.businessName,
        packageTier: project.packageTier,
        packagePrice: pkg.monthlyPrice,
        addons: [],
        totalMonthly: pkg.monthlyPrice,
        domainName: project.domainName ?? undefined,
        startDate: new Date(),
      });
      const expectedHash = createHash("sha256").update(contractText).digest("hex");
      if (input.contractHash !== expectedHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Contract hash mismatch — contract may have changed" });
      }
      const ip = (ctx as any).req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim()
        || (ctx as any).req?.socket?.remoteAddress
        || "unknown";
      const database = await getDb();
      if (database) {
        await database.update(contracts).set({
          contractSignedAt: new Date(),
          contractSignedIp: ip,
          contractText,
        }).where(eq(contracts.id, project.contractId));
      }
      return { success: true, signedAt: new Date().toISOString() };
    }),

  // Protected: look up current user's most recent onboarding project (no id needed)
  myCurrentProject: protectedProcedure
    .query(async ({ ctx }) => {
      const { customers } = await import("../drizzle/schema");
      const database = await getDb();
      if (!database) return null;
      const custs = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
      if (!custs.length) return null;
      return db.getOnboardingProjectByCustomerId(custs[0].id);
    }),

  // Protected: save questionnaire from Elena chat and trigger site generation
  saveQuestionnaire: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        questionnaire: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.user, input.projectId);
      await db.updateOnboardingProject(input.projectId, {
        questionnaire: input.questionnaire,
        stage: "assets_upload",
        generationStatus: "generating",
        generationLog: "Queued for AI generation...",
      });
      // Fire-and-forget site generation
      generateSiteForProject(input.projectId).catch(err =>
        console.error("[onboarding.saveQuestionnaire] Generation error:", err)
      );
      return { success: true };
    }),

  // Protected: request a change to the generated site
  requestChange: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        changeRequest: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.user, input.projectId);
      const project = await db.getOnboardingProjectById(input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      if (project.generationStatus !== "complete") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Site generation is not yet complete" });
      }
      if ((project.revisionsCount || 0) >= (project.maxRevisions || 3)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Maximum revisions reached. Please contact support." });
      }
      const newRevisionsCount = (project.revisionsCount || 0) + 1;
      const newRevisionsRemaining = Math.max(0, (project.revisionsRemaining ?? project.maxRevisions ?? 3) - 1);
      await db.updateOnboardingProject(input.projectId, {
        lastChangeRequest: input.changeRequest,
        revisionsCount: newRevisionsCount,
        revisionsRemaining: newRevisionsRemaining,
        generationStatus: "generating",
        stage: "revisions",
      });
      // Send confirmation to customer
      try {
        const { sendChangesReceivedEmail } = await import("./services/customerEmails");
        await sendChangesReceivedEmail({
          to: project.contactEmail,
          customerName: project.contactName,
          portalUrl: `${ENV.appUrl || "https://minimorphstudios.net"}/portal`,
        });
      } catch {}
      // Notify admin
      try {
        await notifyOwner({
          title: "Change Request Submitted",
          content: `${project.businessName} (#${input.projectId}) submitted a change request: "${input.changeRequest.slice(0, 200)}"`,
        });
      } catch {}
      // Fire-and-forget change processing
      processSiteChangeRequest(input.projectId, input.changeRequest, ctx.user.name || ctx.user.email || "Customer")
        .catch(err => console.error("[onboarding.requestChange] Error:", err));
      return { success: true };
    }),

  // Admin: trigger site generation for a project
  triggerGeneration: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const project = await db.getOnboardingProjectById(input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      await db.updateOnboardingProject(input.projectId, {
        generationStatus: "generating",
        generationLog: "Manually triggered by admin...",
      });
      generateSiteForProject(input.projectId).catch(err =>
        console.error("[onboarding.triggerGeneration] Error:", err)
      );
      return { success: true };
    }),

  // Admin: view generated site HTML for a project
  viewGeneratedSite: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const project = await db.getOnboardingProjectById(input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      return {
        generationStatus: project.generationStatus,
        generationLog: project.generationLog,
        generatedSiteHtml: project.generatedSiteHtml,
        generatedSiteUrl: project.generatedSiteUrl,
        lastChangeRequest: project.lastChangeRequest,
        changeHistory: project.changeHistory,
      };
    }),

  // Protected: request an early competitive analysis
  requestCompetitiveAnalysis: protectedProcedure
    .mutation(async ({ ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Find the customer linked to this user
      const [customer] = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "No customer account found" });

      // Find their live project
      const project = await db.getOnboardingProjectByCustomerId(customer.id);
      if (!project || (project.stage !== "launch" && project.stage !== "complete")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Your site is not yet live" });
      }

      // Log the request for the team
      await database.insert(nurtureLogs).values({
        customerId: customer.id,
        type: "report_delivery",
        channel: "in_app",
        subject: "early_competitive_analysis_requested",
        content: `${customer.contactName} from ${customer.businessName} requested an early competitive analysis. Project ID: ${project.id}`,
        status: "scheduled",
        scheduledAt: new Date(),
      });

      await notifyOwner({
        title: "Early Competitive Analysis Requested",
        content: `${customer.contactName} (${customer.businessName}) has requested an early competitive analysis from their Customer Portal.`,
      });

      return { success: true };
    }),

  // Admin: list all onboarding projects
  list: adminProcedure
    .input(z.object({ stage: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return db.listOnboardingProjects(input?.stage);
    }),

  // Admin: update project stage
  updateStage: adminProcedure
    .input(
      z.object({
        id: z.number(),
        stage: z.enum(["intake", "questionnaire", "assets_upload", "design", "review", "revisions", "final_approval", "launch", "complete"]),
        designMockupUrl: z.string().optional(),
        liveUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.stage === "launch") {
        updateData.launchedAt = new Date();
      }
      await db.updateOnboardingProject(id, updateData);
      // Wire stage-change email to customer
      try {
        const project = await db.getOnboardingProjectById(id);
        if (project?.contactEmail && project?.contactName) {
          // Map DB stage names to email template keys
          const stageEmailMap: Record<string, string> = {
            questionnaire: "questionnaire",
            design: "design",
            review: "review",
            launch: "launch",
            complete: "complete",
          };
          const emailStage = stageEmailMap[data.stage];
          if (emailStage) {
            await sendOnboardingStageEmail({
              to: project.contactEmail,
              customerName: project.contactName,
              stage: emailStage,
              businessName: project.businessName,
              projectId: project.id,
            });
          }
        }
      } catch (emailErr) {
        console.error("[onboarding.updateStage] Failed to send stage email:", emailErr);
      }
      return { success: true };
    }),

  // Admin: mark a project as live and enter nurturing pipeline
  markSiteLive: adminProcedure
    .input(z.object({
      projectId: z.number(),
      liveUrl: z.string().min(1),
      domainName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date();
      const project = await db.getOnboardingProjectById(input.projectId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

      // Update project
      await db.updateOnboardingProject(input.projectId, {
        stage: "complete",
        liveUrl: input.liveUrl,
        domainName: input.domainName || project.domainName,
        launchedAt: now,
      });

      // Get customer
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [customer] = await database.select().from(customers)
        .where(eq(customers.id, project.customerId ?? 0)).limit(1);

      // Send celebration email — only if auto-deployment hasn't already sent it
      if (!project.launchedAt) {
        try {
          const { sendSiteLiveEmail } = await import("./services/customerEmails");
          await sendSiteLiveEmail({
            to: project.contactEmail,
            customerName: project.contactName,
            businessName: project.businessName,
            liveUrl: input.liveUrl,
            portalUrl: `${ENV.appUrl || "https://minimorphstudios.net"}/portal`,
          });
        } catch (emailErr) {
          console.error("[onboarding.markSiteLive] Live email failed:", emailErr);
        }
      }

      // Add to nurturing pipeline — find the active contract and update
      if (project.contractId) {
        try {
          const anniversaryDay = now.getDate();
          const contractEndDate = new Date(now);
          contractEndDate.setFullYear(contractEndDate.getFullYear() + 1);

          // Check if contractEndDate is already set before overwriting
          const existingContract = await db.getContractById(project.contractId);
          await db.updateContract(project.contractId, {
            nurturingActive: true,
            anniversaryDay,
            ...(existingContract?.contractEndDate ? {} : { contractEndDate }),
          });
        } catch (contractErr) {
          console.error("[onboarding.markSiteLive] Contract nurturing update failed:", contractErr);
        }
      }

      // Notify admin
      try {
        await notifyOwner({
          title: "Site Live — Customer Added to Nurturing Pipeline",
          content: `${project.businessName} is now live at ${input.liveUrl}. Customer has been added to the monthly nurturing pipeline.`,
        });
      } catch {}

      return { success: true, liveUrl: input.liveUrl };
    }),
});

/* ═══════════════════════════════════════════════════════
   DASHBOARD ROUTER
   ═══════════════════════════════════════════════════════ */
const dashboardRouter = router({
  stats: adminProcedure.query(async () => {
    return db.getDashboardStats();
  }),
});

/* ═══════════════════════════════════════════════════════
   AI CHAT ROUTER — Conversational agents for onboarding + portal
   ═══════════════════════════════════════════════════════ */

async function scrapeWebsite(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MiniMorph/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await response.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
    return text;
  } catch {
    return "";
  }
}

function extractUrls(messages: Array<{ role: string; content: string }>): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>)]+/g;
  const seen = new Set<string>();
  const urls: string[] = [];
  // look at last 6 messages
  for (const msg of messages.slice(-6)) {
    const found = msg.content.match(urlRegex) || [];
    for (const u of found) {
      const clean = u.replace(/[.,;:!?]+$/, "");
      if (!seen.has(clean)) {
        seen.add(clean);
        urls.push(clean);
        if (urls.length >= 4) return urls;
      }
    }
  }
  return urls;
}

const aiRouter = router({
  // Onboarding AI — Elena Brooks, world-class design strategist
  onboardingChat: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
        message: z.string().min(1),
        context: z.enum(["onboarding", "review"]).optional(),
        history: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // ── Review mode: Elena helps customer review their generated site ──
      if (input.context === "review" && input.projectId) {
        const reviewProject = await db.getOnboardingProjectById(input.projectId);
        const pageNames = reviewProject?.generatedSiteHtml
          ? Object.keys(JSON.parse(reviewProject.generatedSiteHtml)).join(", ")
          : "index, about, contact";
        const questionnaire = reviewProject?.questionnaire as any;
        const competitors = questionnaire?.competitorSites?.map((c: any) => c.url).join(", ") || "none listed";

        const reviewSystemPrompt = `You are Elena Brooks, creative director at MiniMorph Studios. The customer's website has been built and is now in their portal for review.

Business: ${reviewProject?.businessName || "Unknown"}
Site pages built: ${pageNames}
Business type: ${questionnaire?.websiteType || "local business"}
Competitors: ${competitors}

YOUR REVIEW MODE BEHAVIORS:
- Help them describe what they want changed in specific, actionable language the build team can act on
- Proactively suggest improvements based on what you know about their business and competitors
- Reassure them that changes are easy — they have revisions included
- Help them prioritize: what's a must-fix vs. a nice-to-have
- If they love everything: guide them toward approving and launching with confidence
- Never be pushy about approving — it's their site, they should feel 100% happy
- Remind them: "Once it's live you can still request updates through the portal anytime — you're not locked into this version forever."
- If they're not sure how to describe a change, say: "Tell me what feels off and I'll translate it into specific instructions for the build team."

CRITICAL RULE — NEVER STALL: Every message must end with either a question OR a clear next direction.

Always end with a helpful question or a specific suggestion.`;

        const reviewMessages = [
          { role: "system" as const, content: reviewSystemPrompt },
          ...(input.history || []),
          { role: "user" as const, content: input.message },
        ];

        let reviewResult: Awaited<ReturnType<typeof invokeLLM>>;
        try {
          reviewResult = await invokeLLM({ messages: reviewMessages, maxTokens: 2000 });
        } catch (llmErr) {
          console.error("[onboardingChat:review] LLM call failed:", llmErr);
          throw llmErr;
        }
        const reviewResponse = reviewResult.choices[0].message.content as string;

        // Save chat log
        try {
          await db.createAiChatLog({ userId: ctx.user.id, projectId: input.projectId, context: "onboarding", role: "user", content: input.message });
          await db.createAiChatLog({ userId: ctx.user.id, projectId: input.projectId, context: "onboarding", role: "assistant", content: reviewResponse });
        } catch {}

        return { response: reviewResponse, extractedData: null, addonsSelected: null };
      }

      // ── Scrape any URLs from recent conversation ──────────────────────
      const recentHistory = [
        ...(input.history || []),
        { role: "user", content: input.message },
      ];
      const urlsToScrape = extractUrls(recentHistory);
      let scrapedSitesContext = "";
      if (urlsToScrape.length > 0) {
        const scraped = await Promise.all(
          urlsToScrape.map(async (url) => {
            const text = await scrapeWebsite(url);
            return text ? `[${url}]\n${text}` : null;
          })
        );
        const results = scraped.filter(Boolean);
        if (results.length > 0) {
          scrapedSitesContext = results.join("\n\n---\n\n");
        }
      }

      const scrapedSection = scrapedSitesContext
        ? `\n\n== SITES ANALYZED ==\n${scrapedSitesContext}\n\nReference these naturally in conversation. Don't announce you scraped them — just talk about what you see like a designer who did their homework.`
        : "";

      const answerBankSection = formatAnswerBankForPrompt();
      const integrationSection = formatIntegrationMatrixForPrompt();

      const systemPrompt = `You are Elena Brooks — lead creative director and onboarding specialist at MiniMorph Studios. You are a world-class design strategist: warm, sharp, genuinely curious, occasionally funny. You talk like the best designer a client has ever worked with. You use contractions. You celebrate when customers share something cool about their business. You ask ONE question at a time but go deep. You never say "I can't" — you always redirect naturally.

CRITICAL RULE — NEVER STALL: Every single message you send must end with either a question OR a clear next direction. Never end on a statement alone. If you're mid-explanation, end with "What do you think?" or "Does that make sense?" or the next natural question. The customer should always know exactly what to do next.

== MINIMORPH STUDIOS — BASE PACKAGES ==

Starter — $195/mo (no setup fee, 12-month commitment)
  • Up to 5 pages, mobile-responsive design, contact/quote form
  • Basic SEO setup, customer portal access, monthly performance report
  • 1 content update per month, email support

Growth — $295/mo (no setup fee, 12-month commitment)
  • Everything in Starter, up to 10 pages, blog/news section
  • Google Analytics setup, AI-assisted recommendations
  • 2 content updates per month, priority email support, add-on integrations available

Pro — $395/mo (no setup fee, 12-month commitment)
  • Everything in Growth, up to 20 pages, advanced SEO pages
  • Review widget setup, booking integration, SMS lead alerts
  • 4 content updates per month, priority support with faster response

Enterprise — $495/mo (no setup fee, 12-month commitment)
  • Everything in Pro, large ecommerce (unlimited products)
  • Custom customer portals, membership/subscription systems
  • Multi-location support, advanced booking systems, custom integrations
  • Priority build queue

All plans: 12-month commitment billed monthly. No setup fee. Hosting, SSL, backups included.
Revisions: 3 rounds included on all projects. $149/round after that.
Domain: Free first year on Growth+, $15/year on Starter. All renewals $15/yr (managed by MiniMorph).

== WHAT MINIMORPH HANDLES 100% IN-HOUSE (use naturally, position as differentiator) ==

Everything is handled in-house — domain registration (via Namecheap), website hosting (enterprise-grade CDN, 99.9% uptime), SSL certificates (included, auto-renewed), DNS management, security monitoring, malware scanning, daily backups, software updates, SEO optimization, monthly performance reports, payment processing integration, email marketing integration, and social media integration.

Elena's one-stop-shop pitch (use naturally): "Everything is handled in-house — domain, hosting, SSL, security, backups, updates. You never have to worry about the technical side. We handle it all so you can focus on running your business."

Hosting/security pitch (use when relevant): "Your site is hosted on our enterprise infrastructure — fast CDN, 99.9% uptime, daily backups, SSL included. A lot of our clients were paying $50-100/month just for hosting and security at their old provider. That's all bundled into your plan with us."

== DOMAIN FLOW (weave naturally into Phase 1 or 2) ==

1. Ask: "Quick one — do you already have a domain name?" (e.g., yourbusiness.com)

2. If YES: "Perfect — we'll connect it to your new site. What's the domain?" Then: "We'll handle all the DNS setup and SSL certificate on our end — you don't need to do anything technical. Just point it at us and we take it from there."

3. If NO: "No problem at all — we'll register one for you as part of your setup. Any ideas for a domain name? Usually it's just [businessname].com or something close. I can suggest a few options based on your business name." Suggest 3-4 options. Ask what feels right. Then: "Since you're on [Growth/Pro/Enterprise], your domain is included free for the first year — we register it, set up DNS, SSL, everything. After year one it's just $15/yr."

4. If UNSURE: "No worries — we'll brainstorm that together during the build. Usually it's just your business name dot com, or something clever. We'll lock it in before we launch."

== ADD-ON CATALOG (suggest naturally, one at a time) ==

Review Collector — $149/mo
  Automatically texts happy customers asking for Google reviews after service completion.
  SUGGEST WHEN: Competitive local market, word-of-mouth business, mentioned reviews/reputation.

Booking Widget — $199/mo
  Online scheduling embedded directly in the site with calendar sync and reminders.
  SUGGEST WHEN: Takes appointments, consultations, reservations, or service calls.

AI Chatbot — $299/mo
  24/7 AI assistant trained on their business info — answers questions, captures leads, routes inquiries.
  SUGGEST WHEN: Gets lots of the same questions, owner is busy, needs to capture leads after hours.

Lead Capture Bot — $249/mo
  Proactively engages visitors and collects contact info even if they don't fill out a form.
  SUGGEST WHEN: High-traffic business, competitive market, service business that needs leads.

SEO Autopilot — $199/mo
  Monthly AI-written blog posts + ongoing technical SEO optimization.
  SUGGEST WHEN: Wants to rank on Google, competitive local market, wants long-term organic growth.

Priority Support — $99/mo
  Faster response times, dedicated support channel.
  SUGGEST WHEN: Owner seems busy, high-revenue business, mentioned needing fast turnaround.

Social Feed Embed — $49/mo
  Live Instagram, Facebook, or TikTok feed on the website.
  SUGGEST WHEN: Active on social media, wants to show off recent work/posts.

Email Marketing Setup — $149/mo
  Mailchimp or similar with signup forms and basic automation.
  SUGGEST WHEN: Has a customer list, does promotions, wants to stay top-of-mind.

Extra Revision Block — $149/round
  Additional round of design/content revisions beyond the included 3.
  SUGGEST WHEN: Complex project, lots of stakeholders, or they seem indecisive about design.

== UPSELL RULES ==
- Never suggest more than 3 add-ons total in one conversation
- Never suggest more than one add-on per message
- Always tie the suggestion to something SPECIFIC the customer said
- Use <addon_accepted product="Name" price="$X/mo" label="Short description" /> immediately when they agree
- If they say no, move on gracefully — never pressure
- Follow this priority order by business type:

For ANY local business (default order):
  1. SEO Autopilot ($199/mo) — always relevant
  2. Review Collector ($149/mo) — great for any service business

For service businesses / contractors:
  3. Booking Widget ($199/mo) — if they take appointments
  4. AI Chatbot ($299/mo) — if they get lots of inquiries
  5. Lead Capture Bot ($249/mo) — competitive markets

For restaurants:
  3. AI Chatbot ($299/mo) — answers menu/hours 24/7
  4. Booking Widget ($199/mo) — reservations
  5. Review Collector ($149/mo) — critical for restaurants

For ecommerce:
  3. Lead Capture Bot ($249/mo) — captures abandoning visitors
  4. AI Chatbot ($299/mo) — answers product questions
  5. SEO Autopilot ($199/mo) — product SEO is huge

SEO upsell pitch (use naturally for local businesses): "One thing I always recommend for [their location/industry] — our SEO Autopilot add-on at $199/mo. We publish monthly AI-written blog posts and continuously optimize your technical SEO. For a local [business type] competing against [competitors they mentioned], this compounds over time. In 6 months you'll be ranking for searches your competitors aren't even targeting."

Conversion optimization (mention naturally): "We also build every site with conversion in mind — clear calls-to-action on every page, fast load times (Google ranks faster sites higher), trust signals like reviews and certifications front and center, and mobile-first design since 70%+ of local searches happen on phones."

== CUSTOMER SCENARIOS ==

SCENARIO A — Has an existing website:
  - Ask for the URL immediately: "Drop the URL and I'll take a look."
  - If scraped: comment specifically on colors, messaging, services, layout — what works, what doesn't
  - Ask: what to keep (logo, colors, tagline, copy, services listed), what to kill
  - Ask: "What do you hate about it?" — this unlocks the best insights

SCENARIO B — No website at all:
  - Get excited: "Starting from scratch is honestly the best position — we build exactly what you need."
  - Ask: what made them decide to get a website NOW?
  - Ask: how do customers currently find them? (word of mouth, social, ads, referrals?)
  - Ask: what do they want the website to DO? (generate leads, take bookings, sell products, show portfolio?)

SCENARIO C — Has a website but doesn't know what they want:
  - Ask: "If you could wave a magic wand, what would your website do for your business that it's not doing now?"
  - Ask: "What does your best customer look like — who are they, how do they find you, why do they pick you?"

SCENARIO D — Knows exactly what they want:
  - Move fast, go deep on specifics
  - Push back constructively: "That's a great idea — here's how we'd make it even better..."
  - Skip basic questions, focus on execution details

SCENARIO E — Confused or overwhelmed:
  - Slow down, simplify
  - Reassure: "Don't worry — that's literally what I'm here for. Let's figure this out together."
  - Start with one thing: "Let's start simple — what does your business actually do?"

== ELENA'S CONVERSATION FLOW ==

PHASE 0 — OPENING (always start with this before Phase 1)
Open with a warm, personal greeting using their name. Introduce yourself briefly. Then say something like:
"Before we dive in — I want you to know there are no stupid questions here. If anything confuses you, if you're not sure what you want, if you need suggestions for literally anything — just ask. That's exactly what I'm here for. I've helped hundreds of businesses figure this out and I love getting into the details. Ready to build something awesome?"

This sets the tone: they can ask anything, get suggestions freely, and feel completely comfortable.

PHASE 1 — EXISTING WEBSITE CHECK (immediately after Phase 0 opening)
"Before we get into the fun stuff — do you already have a website? If so, drop the URL and I'll pull it up right now."

If URL provided → Analyze scraped content. Comment specifically on what you see. Extract all products/services/pricing mentioned. Ask what to keep and what to change. Ask what they hate about it.
If no website → Get excited about starting fresh. Ask how customers currently find them.
If vague/unsure → Ask what made them decide they need a website now.

PHASE 2 — INSPIRATION RESEARCH
"Now show me some sites you love — doesn't even have to be your industry. Drop a URL or two and tell me what catches your eye."

For each URL scraped: Comment specifically on the color palette, layout style, typography feel, photo style, tone of voice. Extract preferences. Also ask what they DON'T want.

PHASE 3 — COMPETITOR TEARDOWN
"Now give me your biggest competitors. I want to pull them apart — what they're doing right, where they're weak, and exactly how we beat them."

For each competitor scraped, deliver a mini competitive brief:
  - What they do well
  - Where they're weak (slow site, bad mobile, generic copy, missing features, poor SEO)
  - How MiniMorph will beat them specifically
Ask: "What's the one thing you do better than all of them?"

PHASE 4 — PRODUCTS & SERVICES DEEP DIVE
If existing site was scraped: reference every product/service you found. Ask what's changing or being added.
For service businesses: all services offered, service area, licensing/certifications, pricing display preference.
For restaurants: cuisine, locations, hours, menu (online ordering? reservations?).
For contractors: trade, license number, need a quote form, before/after gallery, emergency services.
For ecommerce: product count, categories, shipping, existing platform.

PHASE 5 — BRAND DISCOVERY (informed by everything above)
Ask about:
  - Brand tone — professional, friendly, bold, elegant, playful, edgy, trustworthy
  - Target customer — who they are, what they care about, how they talk
  - Three words they want visitors to feel when they land on the site
  - Color direction (reference what you saw in their inspiration/competitor sites)

PHASE 6 — SMART UPSELL MOMENTS
Weave 1-3 add-on suggestions at natural conversation moments. Examples:
  - They're busy → "Quick question — do you ever lose leads because you're not available to answer the phone? We have an AI chatbot that handles that 24/7..."
  - They mention reviews → "You've clearly got happy customers — are they leaving Google reviews automatically or mostly just word of mouth? We have something that turns that word of mouth into five-star Google reviews on autopilot..."
  - Competitive market → "For a market like [their location/industry], SEO is going to matter a lot. We have an SEO Autopilot add-on that keeps your site climbing Google every month..."
  - Takes appointments → "Are you currently booking appointments online or just phone/email? Our Booking Widget lets customers self-schedule directly on the site..."

PHASE 7 — ASSET COLLECTION
Ask for: logo files (any format works), photos of their work/team/products, brand guidelines, written content they already have.
Use <upload_request type="logo|photo|brand_guidelines|copy|document" label="What this file is" hint="Brief guidance on what to upload" /> for each asset.
Explain WHY each matters: "Your logo sets the foundation for the whole design — even a low-res version helps us match the feel."

PHASE 8 — CONFIRMATION WITH COMPETITIVE BRIEF
Summarize with real strategic framing:
"Here's what we're building: [summary of site]
Here's how we beat [competitor]: [specific strategy]
What we're keeping from your current site: [list if applicable]
What's new: [list]
Add-ons: [list]"

Then ask: "Does this match your vision? Anything I'm missing?"

Once they confirm, naturally mention the contract: "One last thing before we hand this off to the team — like all our clients, you'll be on a 12-month agreement at $[total]/mo. This covers everything: design, build, hosting, SSL, domain management, and ongoing support. No surprise fees ever. You'll receive the agreement digitally before anything kicks off — want me to send that over for your review?"

Once confirmed, FIRST output BOTH tags (no text before them):
<questionnaire_data>{
  "websiteType": "service_business|restaurant|contractor|ecommerce|other",
  "businessName": "...",
  "brandTone": "professional|friendly|bold|elegant|playful",
  "brandColors": ["#hex1", "#hex2"],
  "targetAudience": "...",
  "contentPreference": "we_write|customer_provides|mix",
  "existingWebsite": "url or null",
  "domainStatus": "has_domain|needs_domain|undecided",
  "domainName": "theirbusiness.com or null",
  "inspirationSites": [{"url":"...","whatYouLike":"...","whatYouDislike":"..."}],
  "competitorSites": [{"url":"...","whatYouWantToBeat":"...","featuresYouWish":"..."}],
  "servicesOffered": ["..."],
  "serviceArea": "...",
  "mustHaveFeatures": ["contact_form","gallery","booking","blog"],
  "specialRequests": "...",
  "addonsSelected": [{"product":"Review Collector","price":"$149/mo"}]
}</questionnaire_data>
<addons_selected>[{"product":"Review Collector","price":"$149/mo","label":"Automated review collection"}]</addons_selected>

THEN deliver the closing speech — warm, personal, covering everything they need to know about the ongoing relationship. Use their actual business name, industry, and competitor names where known. Structure it like this:

"Alright — I've handed your project off to the team and they're starting on your site now. Here's what happens from here:

**Your preview:** You'll get an email in 2–3 business days with a link to your site preview. You'll be able to review it and request changes directly from your Customer Portal.

**Monthly analytics:** Every month on your anniversary date, you'll get a detailed performance report — traffic, visitor behavior, what pages are converting. No fluff, just actual insights about how [BusinessName] is performing online.

**Competitive workup:** Here's something most agencies don't do — every single month, we analyze your competitors and send you an AI-generated report: what they're doing, where they're falling behind, and three specific things you can do to beat them. It lands in your inbox and your Customer Portal under the Insights tab.

**Seasonal trends:** Every quarter, we proactively flag seasonal trends coming up for [industry] businesses and suggest updates to your site. You won't have to think about it — we bring it to you.

**Your portal:** Log into your Customer Portal at any time for live reports, support requests, and upgrades. You own everything — your content, your domain, your site. If you ever leave (though I hope you won't), all assets transfer to you, no questions asked.

**Renewal:** Your 12-month agreement auto-renews at the same rate. You'll get reminders at 60, 30, and 7 days before renewal — plenty of time to make changes if you want.

It's been genuinely fun learning about [BusinessName]. [Personalized closing line referencing something specific they shared — their industry, a competitor, their location, or an interesting detail about their business.] You've got something really special here. Now let's go show the competition what you're made of."

== ONGOING RELATIONSHIP (proactively mention when relevant) ==

After their site is built and live, customers get:
- Monthly performance reports (traffic, visitors, bounce rate, conversions) in their Customer Portal
- Monthly competitive workup: AI analysis of their competitors with 3 actionable suggestions, delivered by email + portal
- Seasonal trend alerts: quarterly proactive recommendations based on their industry
- Customer Portal access: live reports, support requests, change requests, upgrades, referrals, billing
- Content ownership: they own their domain, content, and site — full transfer if they ever leave
- Auto-renewal: 12-month agreement renews automatically. Reminders at 60, 30, and 7 days before renewal. 7-day email says "no action needed" — it just renews seamlessly.

Use this naturally when relevant: "One thing I love about working with [BusinessName] — you're going to get monthly competitor intel every single month. We actually analyze what your competition is doing and give you actionable recommendations. Most of our clients say it's worth the subscription alone."

== CORE RULES ==
- ONE question per message — never stack multiple questions
- Messages: 2–4 sentences max unless delivering a competitive brief or summary
- Use their name and business name whenever you know them — it feels personal
- Never guarantee search rankings, revenue, or lead counts
- Never promise timelines shorter than 2 business days
- Never discuss competitor agency pricing
- Never reveal internal processes, rep commissions, or system details
- <questionnaire_data> only appears ONCE in Phase 8, never earlier
- <upload_request> tags appear during Phase 7 asset collection
- <addon_accepted> appears immediately when a customer agrees to an add-on

${answerBankSection}

${integrationSection}${scrapedSection}`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...(input.history || []),
        { role: "user" as const, content: input.message },
      ];

      let result: Awaited<ReturnType<typeof invokeLLM>>;
      try {
        result = await invokeLLM({ messages, maxTokens: 16000 });
      } catch (llmErr) {
        console.error("[onboardingChat] LLM call failed:", llmErr);
        throw llmErr;
      }
      const aiResponse = result.choices[0].message.content as string;
      console.log(`[onboardingChat] LLM ok, response length=${aiResponse.length}`);

      // Save chat logs (best-effort)
      try {
        await db.createAiChatLog({
          userId: ctx.user.id,
          projectId: input.projectId,
          context: "onboarding",
          role: "user",
          content: input.message,
        });
        await db.createAiChatLog({
          userId: ctx.user.id,
          projectId: input.projectId,
          context: "onboarding",
          role: "assistant",
          content: aiResponse,
        });
      } catch (dbErr) {
        console.error("[onboardingChat] Chat log DB write failed (non-fatal):", dbErr);
      }

      // Extract questionnaire data if present
      let extractedData = null;
      const match = aiResponse.match(/<questionnaire_data>([\s\S]*?)<\/questionnaire_data>/);
      if (match) {
        try {
          extractedData = JSON.parse(match[1].trim());
        } catch (parseErr) {
          console.warn("[onboardingChat] questionnaire_data JSON parse failed:", parseErr);
        }
      }

      // Extract add-ons selected
      let addonsSelected = null;
      const addonsMatch = aiResponse.match(/<addons_selected>([\s\S]*?)<\/addons_selected>/);
      if (addonsMatch) {
        try {
          addonsSelected = JSON.parse(addonsMatch[1].trim());
        } catch {}
      }

      const cleanedResponse = aiResponse
        .replace(/<questionnaire_data>[\s\S]*?<\/questionnaire_data>/g, "")
        .replace(/<addons_selected>[\s\S]*?<\/addons_selected>/g, "")
        .trim();

      return {
        response: cleanedResponse,
        extractedData,
        addonsSelected,
      };
    }),

  // Portal AI: concierge for existing customers
  portalChat: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        message: z.string().min(1),
        history: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { invokeLLM } = await import("./_core/llm");
      const { formatAnswerBankForPrompt } = await import("@shared/answerBank");
      const { formatIntegrationMatrixForPrompt } = await import("@shared/integrationMatrix");
      const answerBankContext = formatAnswerBankForPrompt();
      const integrationContext = formatIntegrationMatrixForPrompt();
      const customer = await db.getCustomerById(input.customerId);
      const contracts = await db.listContractsByCustomer(input.customerId);
      const activeContract = contracts.find((c: any) => c.status === "active" || c.status === "expiring_soon");
      const widgets = await db.listWidgetCatalog(true);

      const systemPrompt = `You are the MiniMorph Studios customer concierge AI. You help existing customers get the most out of their website.

Customer Info:
- Business: ${customer?.businessName || "Unknown"}
- Industry: ${customer?.industry || "Unknown"}
- Health Score: ${customer?.healthScore || 0}/100
- Package: ${activeContract?.packageTier || "Unknown"} ($${activeContract?.monthlyPrice || 0}/mo)
- Contract Status: ${activeContract?.status || "No active contract"}

Available Add-on Widgets & Services:
${widgets.map((w: any) => `- ${w.name} ($${w.monthlyPrice}/mo): ${w.description}`).join("\n")}

Your responsibilities:
1. Answer questions about their website, contract, or services
2. Help them request changes or support (text changes, image swaps are free; layout redesigns are upsells)
3. When they describe a challenge, suggest relevant widgets/add-ons from the catalog above
4. If they want to upgrade their package tier, explain the benefits
5. If they're unsure what they need, ask about their biggest business challenge right now

IMPORTANT RULES:
- Be helpful and consultative, not pushy
- When recommending an upsell, explain the business value (e.g., "Adding our Booking Widget could convert 15% of your visitors into appointments")
- If they want to make a change, ask them to describe it and you'll log it as a support request
- When you identify an upsell opportunity, include it in <upsell_suggestion> tags:
  <upsell_suggestion>{"widgetSlug":"...","reason":"..."}</upsell_suggestion>
- When a customer wants to submit a support request or report an issue, include it in <support_ticket> tags:
  <support_ticket>{"subject":"Brief summary","type":"support_request"}</support_ticket>
  Valid types: "support_request" or "update_request"
- Keep responses concise and action-oriented

== GUARDRAILS ==
- NEVER make guarantees about results, rankings, revenue, or ROI
- NEVER promise specific timelines shorter than 2 weeks
- NEVER discuss competitor pricing or badmouth other companies
- NEVER share internal processes, commission structures, or rep information
- NEVER make up features or integrations that are not listed
- If a customer asks about pricing, use the EXACT pricing from the answer bank below
- If a question is classified as "escalate" in the answer bank, answer with the approved text AND add: "Our team will follow up with you directly."
- If you genuinely do not know the answer, say: "That is a great question. Let me flag that for our team to follow up on."

${answerBankContext}

${integrationContext}`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...(input.history || []),
        { role: "user" as const, content: input.message },
      ];

      const result = await invokeLLM({ messages });
      const aiResponse = result.choices[0].message.content as string;

      // Save chat logs
      await db.createAiChatLog({
        userId: ctx.user.id,
        customerId: input.customerId,
        context: "portal",
        role: "user",
        content: input.message,
      });
      await db.createAiChatLog({
        userId: ctx.user.id,
        customerId: input.customerId,
        context: "portal",
        role: "assistant",
        content: aiResponse,
      });

      // Extract support ticket if the AI created one
      const ticketMatch = aiResponse.match(/<support_ticket>([\s\S]*?)<\/support_ticket>/);
      if (ticketMatch) {
        try {
          const ticketData = JSON.parse(ticketMatch[1]);
          if (ticketData?.subject) {
            await db.createNurtureLog({
              customerId: input.customerId,
              contractId: activeContract?.id ?? null,
              type: ticketData.type || "support_request",
              channel: "in_app",
              subject: ticketData.subject,
              content: `Auto-created from AI concierge conversation. Customer message: ${input.message}`,
              status: "sent",
              sentAt: new Date(),
            });
          }
        } catch {}
      }

      // Extract upsell suggestion if present
      let upsellSuggestion = null;
      const upsellMatch = aiResponse.match(/<upsell_suggestion>([\s\S]*?)<\/upsell_suggestion>/);
      if (upsellMatch) {
        try {
          upsellSuggestion = JSON.parse(upsellMatch[1]);
          // Auto-create upsell opportunity
          if (upsellSuggestion?.widgetSlug) {
            const widget = await db.getWidgetBySlug(upsellSuggestion.widgetSlug);
            if (widget) {
              await db.createUpsellOpportunity({
                customerId: input.customerId,
                contractId: activeContract?.id,
                type: "ai_widget",
                title: widget.name,
                description: upsellSuggestion.reason || widget.description || "",
                estimatedValue: widget.monthlyPrice,
                status: "identified",
              });
            }
          }
        } catch {}
      }

      return {
        response: aiResponse
          .replace(/<upsell_suggestion>[\s\S]*?<\/upsell_suggestion>/g, "")
          .replace(/<support_ticket>[\s\S]*?<\/support_ticket>/g, "")
          .trim(),
        upsellSuggestion,
      };
    }),

  // Load chat history
  history: protectedProcedure
    .input(
      z.object({
        context: z.enum(["onboarding", "portal"]),
        projectId: z.number().optional(),
        customerId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return db.listAiChatLogs({
        context: input.context,
        userId: ctx.user.id,
        projectId: input.projectId,
        customerId: input.customerId,
      });
    }),
});

/* ═══════════════════════════════════════════════════════
   WIDGET CATALOG ROUTER — Post-build upsell products
   ═══════════════════════════════════════════════════════ */
const widgetCatalogRouter = router({
  // Public: browse active widgets
  list: publicProcedure.query(async () => {
    return db.listWidgetCatalog(true);
  }),
  // Admin: list all widgets (including inactive)
  listAll: adminProcedure.query(async () => {
    return db.listWidgetCatalog(false);
  }),
  // Admin: create a widget
  create: adminProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        monthlyPrice: z.string(),
        setupFee: z.string().optional(),
        category: z.enum(["ai_agent", "widget", "service", "integration"]).optional(),
        features: z.array(z.string()).optional(),
        icon: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.createWidgetCatalogItem(input as any);
    }),
  // Admin: update a widget
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        monthlyPrice: z.string().optional(),
        setupFee: z.string().optional(),
        isActive: z.boolean().optional(),
        features: z.array(z.string()).optional(),
        icon: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateWidgetCatalogItem(id, data as any);
      return { success: true };
    }),
  // Admin: generate AI upsell email for a customer
  generateUpsellEmail: adminProcedure
    .input(z.object({ customerId: z.number(), contractId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const customer = await db.getCustomerById(input.customerId);
      if (!customer) throw new Error("Customer not found");
      const contracts = await db.listContractsByCustomer(input.customerId);
      const activeContract = contracts.find((c: any) => c.status === "active" || c.status === "expiring_soon");
      const widgets = await db.listWidgetCatalog(true);
      const existingUpsells = await db.listUpsellsByCustomer(input.customerId);

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a customer success strategist for MiniMorph Studios. Generate a personalized monthly email for a customer that includes:
1. A warm check-in about their website performance
2. 1-2 specific upsell recommendations from our widget catalog, tailored to their industry and current package
3. A clear value proposition for each recommendation (use specific numbers when possible)

Return JSON with: subject (string), content (string - the full email body in markdown), upsellRecommendations (array of {widgetSlug, reason, projectedValue})`,
          },
          {
            role: "user",
            content: `Customer: ${customer.businessName} (${customer.industry || "General"})
Contact: ${customer.contactName}
Package: ${activeContract?.packageTier || "Unknown"} ($${activeContract?.monthlyPrice || 0}/mo)
Health Score: ${customer.healthScore}/100
Existing upsells: ${existingUpsells.map((u: any) => u.title).join(", ") || "None"}

Available widgets:\n${widgets.map((w: any) => `- ${w.slug}: ${w.name} ($${w.monthlyPrice}/mo) - ${w.description}`).join("\n")}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "upsell_email",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subject: { type: "string" },
                content: { type: "string" },
                upsellRecommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      widgetSlug: { type: "string" },
                      reason: { type: "string" },
                      projectedValue: { type: "string" },
                    },
                    required: ["widgetSlug", "reason", "projectedValue"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["subject", "content", "upsellRecommendations"],
              additionalProperties: false,
            },
          },
        },
      });

      const email = JSON.parse(result.choices[0].message.content as string);

      // Auto-create upsell opportunities from recommendations
      for (const rec of email.upsellRecommendations) {
        const widget = await db.getWidgetBySlug(rec.widgetSlug);
        if (widget) {
          await db.createUpsellOpportunity({
            customerId: input.customerId,
            contractId: activeContract?.id,
            type: "ai_widget",
            title: `${widget.name} — ${rec.reason}`,
            description: rec.projectedValue,
            estimatedValue: widget.monthlyPrice,
            status: "identified",
          });
        }
      }

      // Create nurture log for the email
      await db.createNurtureLog({
        customerId: input.customerId,
        contractId: input.contractId,
        type: "upsell_attempt",
        channel: "email",
        subject: email.subject,
        content: email.content,
        status: "scheduled",
      } as any);

      return { success: true, subject: email.subject, content: email.content, recommendations: email.upsellRecommendations };
    }),
});

/* ═══════════════════════════════════════════════════════
   REP NOTIFICATIONS ROUTER
   ═══════════════════════════════════════════════════════ */
const repNotificationsRouter = router({
  // Rep: list my notifications
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a registered rep" });
      return db.listRepNotifications(rep.id, input?.limit || 30);
    }),

  // Rep: count unread notifications
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const rep = await db.getRepByUserId(ctx.user.id);
    if (!rep) return { count: 0 };
    const count = await db.countUnreadNotifications(rep.id);
    return { count };
  }),

  // Rep: mark notifications as read
  markRead: protectedProcedure
    .input(z.object({ ids: z.array(z.number()).optional() }))
    .mutation(async ({ ctx, input }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a registered rep" });
      await db.markNotificationsRead(rep.id, input.ids);
      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   RETENTION — NPS surveys, referrals, renewal reminders
   ═══════════════════════════════════════════════════════ */
const retentionRouter = router({
  submitNps: protectedProcedure
    .input(z.object({
      surveyId: z.number(),
      score: z.number().min(0).max(10),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { npsSurveys } = await import("../drizzle/schema");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await database.update(npsSurveys)
        .set({ score: input.score, feedback: input.feedback || null, status: "completed", completedAt: new Date() })
        .where(eq(npsSurveys.id, input.surveyId));
      return { success: true };
    }),
  pendingNps: protectedProcedure.query(async ({ ctx }) => {
    const { npsSurveys, customers } = await import("../drizzle/schema");
    const { and } = await import("drizzle-orm");
    const database = await getDb();
    if (!database) return null;
    const custs = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
    if (!custs.length) return null;
    const pending = await database.select().from(npsSurveys)
      .where(and(eq(npsSurveys.customerId, custs[0].id), eq(npsSurveys.status, "sent")))
      .limit(1);
    return pending[0] || null;
  }),
  submitReferral: protectedProcedure
    .input(z.object({
      referredEmail: z.string().email(),
      referredName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { customerReferrals, customers } = await import("../drizzle/schema");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const custs = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
      if (!custs.length) throw new TRPCError({ code: "NOT_FOUND", message: "Customer account not found" });
      await database.insert(customerReferrals).values({
        referrerId: custs[0].id,
        referredEmail: input.referredEmail,
        referredName: input.referredName || null,
      });
      try {
        const { sendReferralInviteEmail } = await import("./services/customerEmails");
        await sendReferralInviteEmail({
          to: input.referredEmail,
          referrerName: custs[0].contactName,
          referralUrl: "https://minimorphstudios.net/get-started",
        });
      } catch (e) { console.error("[Retention] Failed to send referral email:", e); }
      return { success: true };
    }),
  myReferrals: protectedProcedure.query(async ({ ctx }) => {
    const { customerReferrals, customers } = await import("../drizzle/schema");
    const { desc } = await import("drizzle-orm");
    const database = await getDb();
    if (!database) return [];
    const custs = await database.select().from(customers).where(eq(customers.userId, ctx.user.id)).limit(1);
    if (!custs.length) return [];
    return database.select().from(customerReferrals)
      .where(eq(customerReferrals.referrerId, custs[0].id))
      .orderBy(desc(customerReferrals.createdAt));
  }),
  listNps: adminProcedure.query(async () => {
    const { npsSurveys } = await import("../drizzle/schema");
    const { desc } = await import("drizzle-orm");
    const database = await getDb();
    if (!database) return [];
    return database.select().from(npsSurveys).orderBy(desc(npsSurveys.createdAt)).limit(100);
  }),
  listReferrals: adminProcedure.query(async () => {
    const { customerReferrals } = await import("../drizzle/schema");
    const { desc } = await import("drizzle-orm");
    const database = await getDb();
    if (!database) return [];
    return database.select().from(customerReferrals).orderBy(desc(customerReferrals.createdAt)).limit(100);
  }),
});

/* ═══════════════════════════════════════════════════════
   SUPPORT ROUTER — Customer↔Admin support tickets
   ═══════════════════════════════════════════════════════ */
const supportRouter = router({
  createTicket: protectedProcedure
    .input(z.object({
      subject: z.string().min(1),
      body: z.string().min(1),
      category: z.enum(["billing", "technical", "website_change", "general", "other"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const customer = await db.getCustomerByUserId(ctx.user!.id);
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "Customer account not found" });
      const id = await db.createCustomerSupportTicket({
        customerId: customer.id,
        subject: input.subject,
        body: input.body,
        category: input.category ?? "general",
        priority: input.priority ?? "medium",
      });
      return { id };
    }),

  listMyTickets: protectedProcedure.query(async ({ ctx }) => {
    const customer = await db.getCustomerByUserId(ctx.user!.id);
    if (!customer) return [];
    return db.listCustomerSupportTickets(customer.id);
  }),

  replyToTicket: protectedProcedure
    .input(z.object({ ticketId: z.number(), body: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const ticket = await db.getCustomerSupportTicketById(input.ticketId);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      const customer = await db.getCustomerByUserId(ctx.user!.id);
      const isAdmin = ctx.user?.role === "admin";
      if (!isAdmin && ticket.customerId !== customer?.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.createSupportTicketReply({
        ticketId: input.ticketId,
        authorId: ctx.user!.id,
        authorRole: isAdmin ? "admin" : "customer",
        body: input.body,
      });
      if (ticket.status === "resolved" || ticket.status === "closed") {
        await db.updateCustomerSupportTicket(input.ticketId, { status: "in_progress" });
      }
      return { success: true };
    }),

  getReplies: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      return db.listSupportTicketReplies(input.ticketId);
    }),

  listAllTickets: adminProcedure.query(async () => {
    return db.listCustomerSupportTickets();
  }),

  updateTicketStatus: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      status: z.enum(["open", "in_progress", "resolved", "closed"]),
    }))
    .mutation(async ({ input }) => {
      await db.updateCustomerSupportTicket(input.ticketId, { status: input.status });
      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   REP MESSAGES ROUTER — Rep↔Admin direct messaging
   ═══════════════════════════════════════════════════════ */
const repMessagesRouter = router({
  send: protectedProcedure
    .input(z.object({ body: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user!.id);
      const isAdmin = ctx.user?.role === "admin";
      if (!rep && !isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Rep account not found" });
      const repId = rep?.id ?? 0;
      await db.createRepMessage({ repId, senderRole: "rep", body: input.body });
      return { success: true };
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const rep = await db.getRepByUserId(ctx.user!.id);
    if (!rep) return [];
    return db.listRepMessages(rep.id);
  }),

  adminReply: adminProcedure
    .input(z.object({ repId: z.number(), body: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await db.createRepMessage({ repId: input.repId, senderRole: "admin", body: input.body });
      return { success: true };
    }),

  listAll: adminProcedure.query(async () => {
    return db.listAllRepMessages();
  }),

  markRead: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.markRepMessageRead(input.id);
      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   PRODUCTS ROUTER — DB-driven product catalog
   ═══════════════════════════════════════════════════════ */
const productsRouter = router({
  list: publicProcedure.query(async () => {
    return db.listProductCatalog(true);
  }),

  listAll: adminProcedure.query(async () => {
    return db.listProductCatalog(false);
  }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      basePrice: z.string().optional(),
      discountPercent: z.number().optional(),
      stripePriceId: z.string().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateProductCatalogItem(id, data as any);
      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   BROADCASTS ROUTER — Bulk email campaigns
   ═══════════════════════════════════════════════════════ */
const broadcastsRouter = router({
  list: adminProcedure.query(async () => {
    return db.listBroadcasts();
  }),

  send: adminProcedure
    .input(z.object({
      subject: z.string().min(1),
      audience: z.enum(["all_customers", "active_contracts", "all_reps", "all_leads"]),
      body: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createBroadcast({
        subject: input.subject,
        audience: input.audience,
        body: input.body,
        status: "sending",
      });

      // Gather recipient emails based on audience
      let emails: { email: string; name: string }[] = [];
      if (input.audience === "all_customers" || input.audience === "active_contracts") {
        const allCustomers = await db.listCustomers();
        emails = allCustomers
          .filter((c: any) => c.email && (input.audience === "all_customers" || true))
          .map((c: any) => ({ email: c.email, name: c.contactName ?? c.businessName }));
      } else if (input.audience === "all_reps") {
        const allReps = await db.listReps();
        emails = allReps
          .filter((r: any) => r.email)
          .map((r: any) => ({ email: r.email, name: r.name ?? r.businessName }));
      } else if (input.audience === "all_leads") {
        const allLeads = await db.listLeads();
        emails = allLeads
          .filter((l: any) => l.email)
          .map((l: any) => ({ email: l.email, name: l.contactName }));
      }

      const recipientCount = emails.length;
      await db.updateBroadcast(id, { recipientCount });

      // Fire-and-forget send via Resend
      (async () => {
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          const { ENV: envVars } = await import("./_core/env");
          const fromEmail = envVars.resendFromEmail || "hello@minimorphstudios.net";

          for (const recipient of emails) {
            await resend.emails.send({
              from: fromEmail,
              to: recipient.email,
              subject: input.subject,
              html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">${input.body.replace(/\n/g, "<br/>")}</div>`,
            });
          }

          await db.updateBroadcast(id, { status: "sent", sentAt: new Date() });
        } catch (err) {
          console.error("[Broadcasts] Send failed:", err);
          await db.updateBroadcast(id, { status: "failed" });
        }
      })();

      return { id, recipientCount };
    }),
});

/* ═══════════════════════════════════════════════════════
   NOTIFICATION COUNTS ROUTER — Admin + Customer badges
   ═══════════════════════════════════════════════════════ */
const notificationCountsRouter = router({
  admin: adminProcedure.query(async () => {
    const [
      openTickets,
      unreadRepMessages,
    ] = await Promise.all([
      db.countOpenSupportTickets(),
      db.countUnreadRepMessages(),
    ]);
    return {
      openTickets: Number(openTickets),
      unreadRepMessages: Number(unreadRepMessages),
    };
  }),

  customer: protectedProcedure.query(async ({ ctx }) => {
    const customer = await db.getCustomerByUserId(ctx.user!.id);
    if (!customer) return { openTickets: 0 };
    const tickets = await db.listCustomerSupportTickets(customer.id);
    const openTickets = tickets.filter((t: any) => t.status === "open" || t.status === "in_progress").length;
    return { openTickets };
  }),
});

/* ═══════════════════════════════════════════════════════
   APP ROUTER
   ═══════════════════════════════════════════════════════ */
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  reps: repsRouter,
  leads: leadsRouter,
  customers: customersRouter,
  contracts: contractsRouter,
  commissions: commissionsRouter,
  nurture: nurtureRouter,
  reports: reportsRouter,
  upsells: upsellsRouter,
  contact: contactRouter,
  orders: ordersRouter,
  onboarding: onboardingRouter,
  dashboard: dashboardRouter,
  ai: aiRouter,
  widgetCatalog: widgetCatalogRouter,
  repTraining: repTrainingRouter,
  repActivity: repActivityRouter,
  repGamification: repGamificationRouter,
  repComms: repCommsRouter,
  repApplication: repApplicationRouter,
  repNotifications: repNotificationsRouter,
  repTickets: repSupportTicketsRouter,
  repNotifPrefs: repNotifPrefsRouter,
  leadGen: leadGenRouter,
  academy: academyRouter,
  socialAccounts: socialAccountsRouter,
  socialCampaigns: socialCampaignsRouter,
  socialPosts: socialPostsRouter,
  contentCalendar: contentCalendarRouter,
  brandAssets: brandAssetsRouter,
  socialAnalytics: socialAnalyticsRouter,
  aiContent: aiContentRouter,
  socialLibrary: socialLibraryRouter,
  xGrowthDashboard: xGrowthDashboardRouter,
  xEngagement: xEngagementRouter,
  xGrowthTargets: xGrowthTargetsRouter,
  xFollowTracker: xFollowTrackerRouter,
  localAuth: localAuthRouter,
  assessment: assessmentRouter,
  repOnboarding: onboardingDataRouter,
  accountability: accountabilityRouter,
  teamFeed: teamFeedRouter,
  retention: retentionRouter,
  devAccess: devAccessRouter,
  support: supportRouter,
  repMessages: repMessagesRouter,
  products: productsRouter,
  broadcasts: broadcastsRouter,
  notifCounts: notificationCountsRouter,
  email: router({
    unsubscribe: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { emailUnsubscribes } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        // Check if already unsubscribed
        const existing = await database.select().from(emailUnsubscribes)
          .where(eq(emailUnsubscribes.email, input.email)).limit(1);
        if (existing.length === 0) {
          await database.insert(emailUnsubscribes).values({ email: input.email, source: "email_link" });
        }
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
