import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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
      return db.createRep({ ...input, userId, status: "applied" });
    }),

  // Protected: get current user's rep profile
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    return db.getRepByUserId(ctx.user.id);
  }),

  // Protected: get a rep by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getRepById(input.id);
    }),

  // Admin: list all reps
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
});

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
      return db.getLeadById(input.id);
    }),

  // Admin: update lead
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

  // Admin: assign lead to rep
  assign: adminProcedure
    .input(z.object({ leadId: z.number(), repId: z.number() }))
    .mutation(async ({ input }) => {
      await db.updateLead(input.leadId, {
        assignedRepId: input.repId,
        stage: "assigned",
        temperature: "warm",
      });
      return { success: true };
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
      return db.getCustomerById(input.id);
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
      return db.getContractById(input.id);
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
        amount: z.string(),
        type: z.enum(["initial_sale", "renewal", "upsell"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.createCommission(input);
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
        type: z.enum(["tier_upgrade", "add_pages", "add_feature", "add_service"]).optional(),
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
      return db.createContactSubmission(input);
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
   DASHBOARD ROUTER
   ═══════════════════════════════════════════════════════ */
const dashboardRouter = router({
  stats: adminProcedure.query(async () => {
    return db.getDashboardStats();
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
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
