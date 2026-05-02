/**
 * Lead Generation Engine tRPC Router
 * 
 * Admin-facing endpoints for controlling the lead gen engine.
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { createScrapeJob, runScrapeJob, scoreUnscrapedWebsites, LOW_HANGING_FRUIT_TYPES } from "./services/leadGenScraper";
import { enrichQualifiedBusinesses, batchConvertToLeads } from "./services/leadGenEnrichment";
import { sendDueOutreach, scheduleOutreachSequence } from "./services/leadGenOutreach";
import { autoFeedReps, autoStartOutreach, getRepCapacity, getEngineStats } from "./services/leadGenRouter";
import { scanForEnterpriseLeads, listEnterpriseProspects, updateEnterpriseProspect } from "./services/leadGenEnterprise";
import { generateAuditReport, generateAuditForLead } from "./services/leadGenAudit";
import { analyzeLeadBehavior, scheduleBranchedOutreach, runReengagementCampaign, recordIntentSignal } from "./services/leadGenSmartOutreach";
import { scoreLeadML, rescoreAllLeads, getScoringInsights } from "./services/leadGenScoring";
import { runMultiSourceScrape, enrichWithCompetitors } from "./services/leadGenMultiSource";
import { generateProposal, getRepPerformanceMetrics, findBestRepByPerformance } from "./services/leadGenProposal";
import { batchEnrichContacts, getEnrichmentStatus, enrichBusinessContact } from "./services/contactEnrichment";
import { dedupOrNull } from "./services/leadDedup";
import { sendWebsiteAuditEmail, sendAuditReceivedEmail } from "./services/customerEmails";
import { notifyOwner } from "./_core/notification";
import { runAdaptiveScaling, getAdaptiveScalingSummary, analyzeRepCapacity } from "./services/leadGenAdaptive";
import { handleConversation, buildBusinessIntelligence } from "./services/leadGenConversationAI";
import { getDb } from "./db";
import { scrapeJobs, scrapedBusinesses, outreachSequences, aiConversations, repServiceAreas, enterpriseProspects, leads } from "../drizzle/schema";
import { eq, desc, sql, and, count, isNull } from "drizzle-orm";
import { ENV } from "./_core/env";

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const leadGenRouter = router({
  // ─── Engine Stats ───
  getStats: adminProcedure.query(async () => {
    return getEngineStats();
  }),

  // ─── Rep Capacity ───
  getRepCapacity: adminProcedure.query(async () => {
    return getRepCapacity();
  }),

  // ─── Scrape Jobs ───
  createScrapeJob: adminProcedure
    .input(z.object({
      targetArea: z.string().min(1),
      radiusKm: z.number().min(1).max(100).optional(),
      businessTypes: z.array(z.string()).optional(),
      forRepId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const jobId = await createScrapeJob(input);
      // Run immediately in background
      runScrapeJob(jobId).catch(err =>
        console.error(`[LeadGen] Scrape job ${jobId} failed:`, err)
      );
      return { jobId, status: "started" };
    }),

  listScrapeJobs: adminProcedure.query(async () => {
    const db = (await getDb())!;
    return db.select().from(scrapeJobs).orderBy(desc(scrapeJobs.createdAt)).limit(50);
  }),

  // ─── Scraped Businesses ───
  listScrapedBusinesses: adminProcedure
    .input(z.object({
      jobId: z.number().optional(),
      status: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const conditions = [];
      if (input.jobId) conditions.push(eq(scrapedBusinesses.scrapeJobId, input.jobId));
      if (input.status) conditions.push(eq(scrapedBusinesses.status, input.status as any));

      return db.select().from(scrapedBusinesses)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(scrapedBusinesses.createdAt))
        .limit(input.limit);
    }),

  // ─── Pipeline Actions ───
  scoreWebsites: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .mutation(async ({ input }) => {
      const scored = await scoreUnscrapedWebsites(input.limit);
      return { scored };
    }),

  enrichBusinesses: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .mutation(async ({ input }) => {
      const enriched = await enrichQualifiedBusinesses(input.limit);
      return { enriched };
    }),

  convertToLeads: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .mutation(async ({ input }) => {
      const converted = await batchConvertToLeads(input.limit);
      return { converted };
    }),

  // ─── Outreach ───
  startOutreachForLead: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ input }) => {
      const steps = await scheduleOutreachSequence(input.leadId);
      return { stepsScheduled: steps };
    }),

  sendDueOutreach: adminProcedure.mutation(async () => {
    const sent = await sendDueOutreach();
    return { sent };
  }),

  autoStartOutreach: adminProcedure.mutation(async () => {
    const started = await autoStartOutreach();
    return { started };
  }),

  listOutreachSequences: adminProcedure
    .input(z.object({ leadId: z.number().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const conditions = [];
      if (input.leadId) conditions.push(eq(outreachSequences.leadId, input.leadId));
      return db.select().from(outreachSequences)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(outreachSequences.createdAt))
        .limit(input.limit);
    }),

  // ─── AI Conversations ───
  listConversations: adminProcedure
    .input(z.object({ leadId: z.number().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const conditions = [];
      if (input.leadId) conditions.push(eq(aiConversations.leadId, input.leadId));
      return db.select().from(aiConversations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(aiConversations.createdAt))
        .limit(input.limit);
    }),

  // ─── Rep Service Areas ───
  setRepServiceArea: adminProcedure
    .input(z.object({
      repId: z.number(),
      areaName: z.string().min(1),
      lat: z.number(),
      lng: z.number(),
      radiusKm: z.number().min(1).max(100).default(25),
      isPrimary: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      // Upsert: if primary exists, update it
      if (input.isPrimary) {
        const existing = await db.select().from(repServiceAreas)
          .where(and(eq(repServiceAreas.repId, input.repId), eq(repServiceAreas.isPrimary, true)))
          .limit(1);
        if (existing.length > 0) {
          await db.update(repServiceAreas).set({
            areaName: input.areaName,
            lat: input.lat.toString(),
            lng: input.lng.toString(),
            radiusKm: input.radiusKm,
          }).where(eq(repServiceAreas.id, existing[0].id));
          return { id: existing[0].id, updated: true };
        }
      }
      const [result] = await db.insert(repServiceAreas).values({
        repId: input.repId,
        areaName: input.areaName,
        lat: input.lat.toString(),
        lng: input.lng.toString(),
        radiusKm: input.radiusKm,
        isPrimary: input.isPrimary,
      }).$returningId();
      return { id: result.id, updated: false };
    }),

  listRepServiceAreas: adminProcedure.query(async () => {
    const db = (await getDb())!;
    return db.select().from(repServiceAreas).orderBy(repServiceAreas.repId);
  }),

  // ─── Auto-Feed ───
  autoFeedReps: adminProcedure.mutation(async () => {
    return autoFeedReps();
  }),

  // ─── Enterprise Pipeline ───
  listEnterpriseProspects: adminProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return listEnterpriseProspects(input?.status);
    }),

  updateEnterpriseProspect: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.string().optional(),
      ownerNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateEnterpriseProspect(id, data);
      return { success: true };
    }),

  scanForEnterprise: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .mutation(async ({ input }) => {
      const found = await scanForEnterpriseLeads(input.limit);
      return { found };
    }),

  // ─── Full Pipeline Run ───
  runFullPipeline: adminProcedure.mutation(async () => {
    const results = {
      websitesScored: 0,
      businessesEnriched: 0,
      leadsConverted: 0,
      outreachStarted: 0,
      outreachSent: 0,
      repsFed: { repsChecked: 0, repsFed: 0, leadsGenerated: 0, scrapeJobsCreated: 0 },
      enterpriseFound: 0,
    };

    try {
      results.websitesScored = await scoreUnscrapedWebsites(20);
      results.businessesEnriched = await enrichQualifiedBusinesses(10);
      results.leadsConverted = await batchConvertToLeads(20);
      results.outreachStarted = await autoStartOutreach();
      results.outreachSent = await sendDueOutreach();
      results.repsFed = await autoFeedReps();
      results.enterpriseFound = await scanForEnterpriseLeads(5);
    } catch (err) {
      console.error("[LeadGen] Pipeline run error:", err);
    }

    return results;
  }),

  // ─── Config ───
  getBusinessTypes: adminProcedure.query(() => {
    return LOW_HANGING_FRUIT_TYPES;
  }),

  // ═══════ Phase 29: Enhanced Features ═══════

  // ─── Website Audit ───
  generateAudit: adminProcedure
    .input(z.object({ businessId: z.number() }))
    .mutation(async ({ input }) => {
      const report = await generateAuditReport(input.businessId);
      return { score: report.overallScore, grade: report.overallGrade, storageUrl: report.storageUrl, sections: report.sections.length };
    }),

  generateAuditForLead: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ input }) => {
      const report = await generateAuditForLead(input.leadId);
      if (!report) return null;
      return { score: report.overallScore, grade: report.overallGrade, storageUrl: report.storageUrl };
    }),

  // ─── Smart Outreach ───
  analyzeLeadBehavior: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      return analyzeLeadBehavior(input.leadId);
    }),

  scheduleBranchedOutreach: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ input }) => {
      const scheduled = await scheduleBranchedOutreach(input.leadId);
      return { scheduled };
    }),

  runReengagement: adminProcedure.mutation(async () => {
    const reengaged = await runReengagementCampaign();
    return { reengaged };
  }),

  recordIntentSignal: adminProcedure
    .input(z.object({
      leadId: z.number(),
      type: z.enum(["email_open", "link_click", "website_visit", "multi_open", "audit_view"]),
    }))
    .mutation(async ({ input }) => {
      await recordIntentSignal(input.leadId, { type: input.type });
      return { success: true };
    }),

  // ─── ML Scoring ───
  scoreLeadML: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      return scoreLeadML(input.leadId);
    }),

  rescoreAllLeads: adminProcedure.mutation(async () => {
    const rescored = await rescoreAllLeads();
    return { rescored };
  }),

  getScoringInsights: adminProcedure.query(async () => {
    return getScoringInsights();
  }),

  // ─── Multi-Source Scraping ───
  runMultiSourceScrape: adminProcedure
    .input(z.object({
      location: z.string().min(1),
      lat: z.number().optional(),
      lng: z.number().optional(),
      radius: z.number().optional(),
      sources: z.array(z.enum(["google_maps", "yelp", "directory"])).optional(),
      priorityLevel: z.enum(["high", "medium", "low", "all"]).optional(),
      maxPerSource: z.number().min(5).max(50).optional(),
    }))
    .mutation(async ({ input }) => {
      return runMultiSourceScrape(input);
    }),

  getSourceQuality: adminProcedure.query(async () => {
    const { getSourceQuality } = await import("./services/leadGenMultiSource");
    return getSourceQuality();
  }),

  // ─── Competitor Intelligence ───
  enrichWithCompetitors: adminProcedure
    .input(z.object({ businessId: z.number() }))
    .mutation(async ({ input }) => {
      const competitors = await enrichWithCompetitors(input.businessId);
      return { competitorsFound: competitors.length, competitors };
    }),

  // ─── Proposal Generation ───
  generateProposal: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ input }) => {
      const proposal = await generateProposal(input.leadId);
      return {
        businessName: proposal.businessName,
        recommendedPackage: proposal.recommendedPackage,
        packagePrice: proposal.packagePrice,
        roiEstimate: proposal.roiEstimate,
        storageUrl: proposal.storageUrl,
      };
    }),

  // ─── Performance-Based Routing ───
  getRepPerformance: adminProcedure.query(async () => {
    return getRepPerformanceMetrics();
  }),

  findBestRep: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      return findBestRepByPerformance(input.leadId);
    }),

  // ─── Enhanced Full Pipeline ───
  runEnhancedPipeline: adminProcedure.mutation(async () => {
    const results = {
      websitesScored: 0,
      businessesEnriched: 0,
      leadsConverted: 0,
      outreachStarted: 0,
      outreachSent: 0,
      repsFed: { repsChecked: 0, repsFed: 0, leadsGenerated: 0, scrapeJobsCreated: 0 },
      enterpriseFound: 0,
      leadsRescored: 0,
      reengaged: 0,
    };

    try {
      results.websitesScored = await scoreUnscrapedWebsites(20);
      results.businessesEnriched = await enrichQualifiedBusinesses(10);
      results.leadsConverted = await batchConvertToLeads(20);
      results.leadsRescored = await rescoreAllLeads();
      results.outreachStarted = await autoStartOutreach();
      results.outreachSent = await sendDueOutreach();
      results.repsFed = await autoFeedReps();
      results.enterpriseFound = await scanForEnterpriseLeads(5);
      results.reengaged = await runReengagementCampaign();
    } catch (err) {
      console.error("[LeadGen] Enhanced pipeline run error:", err);
    }

    return results;
  }),

  // ═══════ Phase 31: AI-First Lead Warming ═══════

  // ─── Contact Enrichment (Apollo.io / Hunter.io) ───
  enrichContacts: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(15) }))
    .mutation(async ({ input }) => {
      const result = await batchEnrichContacts(input.limit);
      return result;
    }),

  enrichSingleBusiness: adminProcedure
    .input(z.object({ businessId: z.number() }))
    .mutation(async ({ input }) => {
      const result = await enrichBusinessContact(input.businessId);
      return result;
    }),

  getEnrichmentStatus: adminProcedure.query(async () => {
    return getEnrichmentStatus();
  }),

  // ─── Adaptive Scaling ───
  runAdaptiveScaling: adminProcedure.mutation(async () => {
    const report = await runAdaptiveScaling();
    return report;
  }),

  getAdaptiveScalingSummary: adminProcedure.query(async () => {
    return getAdaptiveScalingSummary();
  }),

  getRepCapacityDetailed: adminProcedure.query(async () => {
    return analyzeRepCapacity();
  }),

  // ─── AI Conversation Agent ───
  triggerConversation: adminProcedure
    .input(z.object({
      leadId: z.number(),
      channel: z.enum(["email", "sms"]),
      content: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const result = await handleConversation(input);
      return result;
    }),

  getBusinessIntelligence: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const intel = await buildBusinessIntelligence(input.leadId);
      return intel;
    }),

  getLeadConversationHistory: adminProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select().from(aiConversations)
        .where(eq(aiConversations.leadId, input.leadId))
        .orderBy(aiConversations.createdAt);
    }),

  // ─── Public Endpoint: Free Website Audit ───

  requestPublicAudit: publicProcedure
    .input(z.object({
      websiteUrl: z.string().optional(),
      email: z.string().email(),
      businessName: z.string().optional(),
      contactName: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;

      // Cross-source dedup: check for existing lead before inserting
      const leadData = {
        businessName: input.businessName || input.websiteUrl || "Unknown Business",
        contactName: input.contactName || "Website Visitor",
        email: input.email,
        phone: input.phone || null,
        website: input.websiteUrl || null,
        source: "website_form" as const,
        temperature: "warm" as const,
        qualificationScore: 60,
        stage: "new" as const,
        notes: `Inbound audit request. Website: ${input.websiteUrl || "none"}. Submitted via free audit page.`,
      };
      const dup = await dedupOrNull(leadData);
      let leadId: number;
      if (dup) {
        leadId = dup.leadId;
      } else {
        const [newLead] = await db.insert(leads).values(leadData).$returningId();
        leadId = newLead.id;
      }

      // Generate audit and send email
      if (input.websiteUrl) {
        // Has website URL — generate audit and email the report
        try {
          const audit = await generateAuditForLead(leadId);
          if (audit) {
            const emailResult = await sendWebsiteAuditEmail({
              to: input.email,
              businessName: input.businessName || input.websiteUrl || "Your Business",
              contactName: input.contactName || undefined,
              websiteUrl: input.websiteUrl,
              auditUrl: audit.storageUrl ? `https://minimorphstudios.net${audit.storageUrl}` : undefined,
              score: audit.overallScore,
              grade: audit.overallGrade,
            });
            if (!emailResult.success) {
              console.error("[PublicAudit] Email send failed:", emailResult.error);
              await notifyOwner({ title: "Free Audit Email Failed", content: `Audit generated for ${input.email} (${input.websiteUrl}) but email delivery failed: ${emailResult.error}` });
            } else {
              console.log(`[PublicAudit] Audit email sent to ${input.email} (score: ${audit.overallScore}, grade: ${audit.overallGrade})`);
            }
            return { success: true, message: "Your audit report is on the way." };
          } else {
            // Audit generation returned null (should not happen with new fallback, but handle gracefully)
            console.error("[PublicAudit] generateAuditForLead returned null for lead", leadId);
            await notifyOwner({ title: "Free Audit Generation Returned Null", content: `Lead ${leadId} (${input.email}, ${input.websiteUrl}) — audit returned null. Manual review needed.` });
            await sendAuditReceivedEmail({ to: input.email, businessName: input.businessName || input.websiteUrl || "Your Business", contactName: input.contactName || undefined });
            return { success: true, message: "We received your request and will review it manually." };
          }
        } catch (err: any) {
          console.error("[PublicAudit] Audit generation failed:", err);
          await notifyOwner({ title: "Free Audit Generation Error", content: `Lead ${leadId} (${input.email}, ${input.websiteUrl}) — error: ${err?.message || "Unknown"}. Manual review needed.` }).catch(() => {});
          // Still send a fallback email so the user isn't left hanging
          await sendAuditReceivedEmail({ to: input.email, businessName: input.businessName || input.websiteUrl || "Your Business", contactName: input.contactName || undefined }).catch(() => {});
          return { success: true, message: "We received your request and will review it manually." };
        }
      } else {
        // No website URL — send "received your request" email and notify admin
        await sendAuditReceivedEmail({
          to: input.email,
          businessName: input.businessName || "Your Business",
          contactName: input.contactName || undefined,
        }).catch(err => console.error("[PublicAudit] Received email failed:", err));
        await notifyOwner({
          title: "Free Audit Request (No Website)",
          content: `${input.contactName || "Visitor"} (${input.email}) requested an audit for "${input.businessName || "Unknown"}" but provided no website URL. Manual outreach needed.`,
        }).catch(() => {});
        return { success: true, message: "We received your request and will review it manually." };
      }
    }),

  // ─── SMS Opt-In Recording ───
  recordSmsOptIn: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      method: z.enum(["verbal_consent", "form_submission", "reply_start", "manual"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const [lead] = await db.select().from(leads).where(eq(leads.id, input.leadId));
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      if (lead.smsOptIn) {
        return { success: true, alreadyOptedIn: true };
      }
      if (lead.smsOptedOut) {
        throw new TRPCError({ code: "CONFLICT", message: "This lead has previously opted out of SMS. Cannot record opt-in while opted out." });
      }
      await db.update(leads).set({
        smsOptIn: true,
        smsOptInAt: new Date(),
        smsOptInMethod: input.method,
      }).where(eq(leads.id, input.leadId));
      return { success: true, alreadyOptedIn: false };
    }),

  // ─── SMS Opt-In Status Check ───
  getSmsOptInStatus: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [lead] = await db.select({
        smsOptIn: leads.smsOptIn,
        smsOptInAt: leads.smsOptInAt,
        smsOptInMethod: leads.smsOptInMethod,
        smsOptedOut: leads.smsOptedOut,
      }).from(leads).where(eq(leads.id, input.leadId));
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      return lead;
    }),

  // ─── System Health Check ───
  systemHealth: adminProcedure.query(async () => {
    const checks: Record<string, { status: "ok" | "missing" | "error"; detail?: string }> = {};

    checks.googleMaps = ENV.googleMapsApiKey ? { status: "ok" } : { status: "missing", detail: "GOOGLE_MAPS_API_KEY not set" };
    checks.yelp = ENV.yelpApiKey ? { status: "ok" } : { status: "missing", detail: "YELP_API_KEY not set" };
    checks.apollo = ENV.apolloApiKey ? { status: "ok" } : { status: "missing", detail: "APOLLO_API_KEY not set" };
    checks.hunter = ENV.hunterApiKey ? { status: "ok" } : { status: "missing", detail: "HUNTER_API_KEY not set" };
    checks.resend = ENV.resendApiKey ? { status: "ok" } : { status: "missing", detail: "RESEND_API_KEY not set" };
    checks.twilio = ENV.twilioAccountSid && ENV.twilioAuthToken ? { status: "ok" } : { status: "missing", detail: "TWILIO credentials not set" };
    checks.anthropic = ENV.anthropicApiKey ? { status: "ok" } : { status: "missing", detail: "ANTHROPIC_API_KEY not set" };

    const allOk = Object.values(checks).every(c => c.status === "ok");
    return { healthy: allOk, checks };
  }),

  // ─── Pipeline Stats ───
  pipelineStats: adminProcedure.query(async () => {
    const db = (await getDb())!;
    const [stats] = await db.select({
      totalLeads: count(leads.id),
    }).from(leads);

    const byStage = await db.select({
      stage: leads.stage,
      cnt: count(leads.id),
    }).from(leads).groupBy(leads.stage);

    const byTemp = await db.select({
      temperature: leads.temperature,
      cnt: count(leads.id),
    }).from(leads).groupBy(leads.temperature);

    const [outreach] = await db.select({ cnt: count(outreachSequences.id) }).from(outreachSequences)
      .where(eq(outreachSequences.status, "scheduled"));

    const [conversations] = await db.select({ cnt: count(aiConversations.id) }).from(aiConversations);

    const selfCloseLeads = await db.select({ cnt: count(leads.id) }).from(leads)
      .where(sql`${leads.checkoutSentAt} IS NOT NULL`);

    return {
      totalLeads: stats?.totalLeads ?? 0,
      byStage: Object.fromEntries(byStage.map(r => [r.stage, r.cnt])),
      byTemperature: Object.fromEntries(byTemp.map(r => [r.temperature, r.cnt])),
      pendingOutreach: outreach?.cnt ?? 0,
      totalConversations: conversations?.cnt ?? 0,
      selfClosesSent: selfCloseLeads[0]?.cnt ?? 0,
    };
  }),
});
