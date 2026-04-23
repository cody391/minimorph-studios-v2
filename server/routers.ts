import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { repTrainingRouter, repActivityRouter, repGamificationRouter, repCommsRouter, repApplicationRouter, repSupportTicketsRouter, repNotifPrefsRouter } from "./repEcosystem";

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

  // Protected: get a rep by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
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
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
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
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
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

  // Get email signature HTML for the rep
  getEmailSignature: protectedProcedure
    .query(async ({ ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) return null;
      return buildEmailSignature(rep);
    }),
});

// Build a branded email signature HTML block
export function buildEmailSignature(rep: { fullName: string; email: string; phone?: string | null; profilePhotoUrl?: string | null }) {
  const photoHtml = rep.profilePhotoUrl
    ? `<img src="${rep.profilePhotoUrl}" alt="${rep.fullName}" width="60" height="60" style="border-radius:50%;object-fit:cover;margin-right:12px;" />`
    : `<div style="width:60px;height:60px;border-radius:50%;background:#2d5a3d;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;margin-right:12px;">${rep.fullName.charAt(0)}</div>`;
  const phoneHtml = rep.phone ? `<br/><span style="color:#666;">📱 ${rep.phone}</span>` : "";
  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:13px;color:#333;margin-top:20px;border-top:2px solid #2d5a3d;padding-top:12px;">
  <tr>
    <td style="vertical-align:top;padding-right:12px;">${photoHtml}</td>
    <td style="vertical-align:top;">
      <strong style="font-size:14px;color:#2d5a3d;">${rep.fullName}</strong><br/>
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

  // Protected: get lead by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
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
            content: "You are a business research assistant. Given a business name, contact info, and industry, generate a brief enrichment profile. Return JSON with: companySize (string), estimatedRevenue (string), onlinePresence (string rating: poor/fair/good/excellent), websiteNeeds (string[]), competitorExamples (string[]), recommendedPackage (starter/growth/premium), and enrichmentSummary (2-3 sentence summary).",
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
                recommendedPackage: { type: "string", enum: ["starter", "growth", "premium"], description: "Recommended package tier" },
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
        packageTier: z.enum(["starter", "growth", "premium"]),
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
        notes: input.notes ? `${input.notes}${discountPct > 0 ? ` | ${discountPct}% rep discount applied (was $${originalPrice}/mo)` : ""}` : (discountPct > 0 ? `${discountPct}% rep discount applied (was $${originalPrice}/mo)` : undefined),
      });

      // 4. Calculate commission — DOUBLE for self-sourced leads
      const isSelfSourced = lead.selfSourced;
      const gamification = await db.getRepGamification(rep.id);
      const level = gamification?.level || "rookie";
      const tierRates: Record<string, number> = {
        rookie: 0.10, closer: 0.12, ace: 0.14, elite: 0.16, legend: 0.20,
      };
      let rate = tierRates[level] || 0.10;
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
        status: "approved",
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
        message: `Congratulations! You closed ${lead.businessName} for $${finalMonthlyPrice}/mo (${input.packageTier}).${discountPct > 0 ? ` ${discountPct}% discount applied.` : ""} Commission: $${commissionAmount}${isSelfSourced ? " (2x bonus!)" : ""} — approved for instant payout!`,
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
        content: `Rep ${rep.fullName} closed a ${input.packageTier} deal with ${lead.businessName} at $${finalMonthlyPrice}/mo.${discountNote}${selfSourcedNote}\nAnnual value: $${annualValue.toFixed(2)}\nCommission: $${commissionAmount} (${(rate * 100).toFixed(0)}% at ${level} level) — auto-approved for instant payout\nOnboarding project auto-created.`,
      });

      return {
        success: true,
        customerId: customer.id,
        contractId: contract.id,
        commissionId: commission.id,
        commissionAmount,
        annualValue,
      };
    }),

  // Rep: generate AI proposal for a lead
  generateProposal: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        packageTier: z.enum(["starter", "growth", "premium"]),
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
            content: `Write a proposal for:\n- Business: ${lead.businessName}\n- Contact: ${lead.contactName}\n- Industry: ${lead.industry || "General"}\n- Package: ${pkg?.name || input.packageTier} ($${pkg ? (pkg.monthlyPriceInCents / 100).toFixed(0) : "TBD"}/mo + $${pkg ? (pkg.priceInCents / 100).toFixed(0) : "TBD"} setup)\n- Features: ${pkg?.features.join(", ") || "Standard features"}\n- Enrichment data: ${lead.enrichmentData ? JSON.stringify(lead.enrichmentData) : "None"}\n- Rep name: ${rep.fullName}\n${input.customNotes ? `- Custom notes: ${input.customNotes}` : ""}\n\nReturn JSON with: subject (string), htmlContent (string with HTML email), plainTextContent (string), keySellingPoints (string[])`,
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
});

/* ═══════════════════════════════════════════════════════
   CUSTOMERS ROUTER
   ═══════════════════════════════════════════════════════ */
const customersRouter = router({
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

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
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
    .query(async ({ input }) => {
      return db.listContractsByCustomer(input.customerId);
    }),

  byRep: protectedProcedure
    .input(z.object({ repId: z.number() }))
    .query(async ({ input }) => {
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
      // Calculate commission based on rep's gamification level (tier-based rates)
      const gamification = await db.getRepGamification(input.repId);
      const level = gamification?.level || "rookie";
      const tierRates: Record<string, number> = {
        rookie: 0.10,
        closer: 0.12,
        ace: 0.14,
        elite: 0.16,
        legend: 0.20,
      };
      const rate = tierRates[level] || 0.10;
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

  byRep: protectedProcedure
    .input(z.object({ repId: z.number() }))
    .query(async ({ input }) => {
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
    .query(async ({ input }) => {
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
    .query(async ({ input }) => {
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
    .query(async ({ input }) => {
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
    .mutation(async ({ input }) => {
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
        content: `Customer ${customer?.businessName || "#" + input.customerId} is interested in ${widget.name} ($${widget.monthlyPrice}/mo).\nSetup fee: $${widget.setupFee || 0}\n\nReach out to close this upsell.`,
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
        packageTier: z.enum(["starter", "growth", "premium"]),
        businessName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const Stripe = (await import("stripe")).default;
      const { getPackage } = await import("./stripe-products");

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) throw new Error("Stripe not configured");

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" as any });
      const pkg = getPackage(input.packageTier);
      if (!pkg) throw new Error("Invalid package tier");

      const origin = ctx.req.headers.origin || ctx.req.headers.referer || "http://localhost:3000";

      // Create the checkout session
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        allow_promotion_codes: true,
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
              unit_amount: pkg.priceInCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/get-started?cancelled=true`,
      });

      // Create a pending order in the database
      const dbModule = await import("./db");
      await dbModule.createOrder({
        userId: ctx.user.id,
        stripeCheckoutSessionId: session.id,
        packageTier: input.packageTier,
        amount: pkg.priceInCents,
        customerEmail: ctx.user.email || undefined,
        customerName: ctx.user.name || undefined,
        businessName: input.businessName || undefined,
      });

      return { checkoutUrl: session.url };
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
        packageTier: z.enum(["starter", "growth", "premium"]),
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
    .query(async ({ input }) => {
      const project = await db.getOnboardingProjectById(input.id);
      return project ?? null;
    }),

  // Protected: submit questionnaire
  submitQuestionnaire: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        questionnaire: z.object({
          brandColors: z.array(z.string()).optional(),
          brandTone: z.enum(["professional", "friendly", "bold", "elegant", "playful"]).optional(),
          targetAudience: z.string().optional(),
          competitors: z.array(z.string()).optional(),
          contentPreference: z.enum(["we_write", "customer_provides", "mix"]).optional(),
          mustHaveFeatures: z.array(z.string()).optional(),
          inspirationUrls: z.array(z.string()).optional(),
          specialRequests: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateOnboardingProject(input.projectId, {
        questionnaire: input.questionnaire,
        stage: "assets_upload",
      });
      return { success: true };
    }),

  // Protected: set domain preference
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
    .mutation(async ({ input }) => {
      const { projectId, ...domainData } = input;
      await db.updateOnboardingProject(projectId, domainData);
      return { success: true };
    }),

  // Protected: upload an asset file
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
    .mutation(async ({ input }) => {
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

  // Protected: list assets for a project
  listAssets: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return db.listProjectAssets(input.projectId);
    }),

  // Protected: delete an asset
  deleteAsset: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
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
    .mutation(async ({ input }) => {
      const project = await db.getOnboardingProjectById(input.projectId);
      await db.updateOnboardingProject(input.projectId, {
        feedbackNotes: input.feedbackNotes,
        stage: "revisions",
        revisionsCount: (project?.revisionsCount || 0) + 1,
      });
      return { success: true };
    }),

  // Protected: approve for launch
  approveLaunch: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      await db.updateOnboardingProject(input.projectId, {
        stage: "final_approval",
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
      return { success: true };
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
const aiRouter = router({
  // Onboarding AI: helps customers fill out questionnaire conversationally
  onboardingChat: protectedProcedure
    .input(
      z.object({
        projectId: z.number().optional(),
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
      const systemPrompt = `You are the MiniMorph Studios onboarding assistant. Your job is to help new customers describe their website vision through friendly conversation.

You need to gather the following information naturally through conversation:
1. Brand tone (professional, friendly, bold, elegant, or playful)
2. Brand colors (or let them describe the feeling and you suggest colors)
3. Target audience (who are their customers?)
4. Competitors or businesses they admire
5. Content preference (we write it, they provide it, or a mix)
6. Must-have features (contact form, gallery, booking, menu, etc.)
7. Inspiration websites they like
8. Any special requests

IMPORTANT RULES:
- Be warm, encouraging, and conversational — not robotic
- Ask ONE question at a time, don't overwhelm them
- If they seem unsure, offer specific suggestions based on their industry
- If they don't have a logo or brand assets, reassure them that we can create everything
- After gathering enough info, summarize what you've learned and ask if anything is missing
- When you have enough information, include a JSON block at the end of your message wrapped in <questionnaire_data> tags with the extracted fields:
  <questionnaire_data>{"brandTone":"...","brandColors":[...],"targetAudience":"...","competitors":[...],"contentPreference":"...","mustHaveFeatures":[...],"inspirationUrls":[...],"specialRequests":"..."}</questionnaire_data>
- Only include the JSON when you feel confident you have enough info
- Keep responses concise — 2-3 sentences max per turn`;

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

      // Extract questionnaire data if present
      let extractedData = null;
      const match = aiResponse.match(/<questionnaire_data>([\s\S]*?)<\/questionnaire_data>/);
      if (match) {
        try {
          extractedData = JSON.parse(match[1]);
        } catch {}
      }

      return {
        response: aiResponse.replace(/<questionnaire_data>[\s\S]*?<\/questionnaire_data>/, "").trim(),
        extractedData,
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
- Keep responses concise and action-oriented`;

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
        response: aiResponse.replace(/<upsell_suggestion>[\s\S]*?<\/upsell_suggestion>/, "").trim(),
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
});

export type AppRouter = typeof appRouter;
