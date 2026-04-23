import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";

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
        content: `Customer #${log.customerId} — ${log.type.replace(/_/g, " ")}\nChannel: ${log.channel}\n\n${log.content || "No content"}`,
      });

      // Mark as sent
      await db.updateNurtureLog(input.id, { status: "sent", sentAt: new Date() });
      return { success: true };
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
  orders: ordersRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
