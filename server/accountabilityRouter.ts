/**
 * Uber-Model AI-Managed Rep Accountability System
 * 
 * This is the brain of the rep management system. No human managers.
 * The AI monitors, scores, allocates, promotes, demotes, warns, and deactivates.
 * 
 * Components:
 * 1. Performance Score Engine — daily 0-100 score from 4 weighted factors
 * 2. Lead Allocation Algorithm — score-based lead distribution (like Uber ride assignment)
 * 3. Residual Commission Decay — activity-based residual adjustments
 * 4. Tier System — Bronze/Silver/Gold/Platinum with commission bumps
 * 5. Strike System — warnings, strikes, deactivation
 * 6. AI Values Monitor — conversation analysis for compliance
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb, getAvgRatingForRep } from "./db";
import { eq, desc, and, gte, lte, sql, count, asc, isNull, inArray } from "drizzle-orm";
import {
  reps,
  repPerformanceScores,
  repActivityLog,
  repStrikes,
  repTiers,
  repLeadAllocations,
  leads,
  commissions,
  contracts,
} from "../drizzle/schema";

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

export const SCORE_WEIGHTS = {
  activity: 0.30,
  closeRate: 0.30,
  clientSatisfaction: 0.20,
  valuesCompliance: 0.20,
} as const;

export const TIER_CONFIG = {
  bronze: {
    name: "Bronze",
    minMonths: 0,
    minMonthlyRevenue: 0,
    commissionRate: 10.00,
    leadPriority: 1, // lowest
    residualDecayMultiplier: 1.0, // standard decay
  },
  silver: {
    name: "Silver",
    minMonths: 3,
    minMonthlyRevenue: 3000,
    commissionRate: 12.00,
    leadPriority: 2,
    residualDecayMultiplier: 1.0,
  },
  gold: {
    name: "Gold",
    minMonths: 6,
    minMonthlyRevenue: 7000,
    commissionRate: 14.00,
    leadPriority: 3,
    residualDecayMultiplier: 0.5, // slower decay
  },
  platinum: {
    name: "Platinum",
    minMonths: 12,
    minMonthlyRevenue: 12000,
    commissionRate: 15.00,
    leadPriority: 4, // highest
    residualDecayMultiplier: 0.0, // no decay
  },
} as const;

export const RESIDUAL_DECAY = {
  activeThresholdDays: 0,     // 0-30 days: 100%
  tier1Days: 30,              // 30-60 days: 75%
  tier1Rate: 0.75,
  tier2Days: 60,              // 60-90 days: 50%
  tier2Rate: 0.50,
  tier3Days: 90,              // 90-120 days: 25%
  tier3Rate: 0.25,
  reassignDays: 120,          // 120+ days: reassigned
  reassignRate: 0.0,
} as const;

export const LEAD_ALLOCATION = {
  timeoutHours: 4,            // Hours before lead is reassigned
  freezeThreshold: 40,        // Score below this = no new leads
  maxActiveLeads: 20,         // Max leads a rep can hold at once
} as const;

export const STRIKE_RULES = {
  maxStrikesBeforeDeactivation: 3,
  strikePeriodMonths: 6,      // Rolling window
  instantDeactivationCategories: ["fraud", "confidentiality_breach", "client_harm"] as string[],
} as const;


// ═══════════════════════════════════════════════════════
// SCORING ENGINE
// ═══════════════════════════════════════════════════════

/**
 * Calculate a rep's Performance Score (0-100)
 * Called on-demand and stored as a daily snapshot
 */
export function calculatePerformanceScore(metrics: {
  // Activity metrics (last 30 days)
  callsMade: number;
  followUpsSent: number;
  meetingsBooked: number;
  // Close rate metrics
  leadsAssigned: number;
  leadsConverted: number;
  dealsClosed: number;
  // Client satisfaction (average rating 0-5)
  avgClientRating: number;
  totalRatings: number;
  // Values compliance
  totalInteractions: number;
  flaggedInteractions: number;
  activeStrikes: number;
}): {
  overallScore: number;
  activityScore: number;
  closeRateScore: number;
  clientSatisfactionScore: number;
  valuesComplianceScore: number;
} {
  // --- Activity Score (0-100) ---
  // Benchmarks: 5 calls/day = 150/month, 3 follow-ups/day = 90/month, 2 meetings/week = 8/month
  const callScore = Math.min(100, (metrics.callsMade / 150) * 100);
  const followUpScore = Math.min(100, (metrics.followUpsSent / 90) * 100);
  const meetingScore = Math.min(100, (metrics.meetingsBooked / 8) * 100);
  const activityScore = Math.round((callScore * 0.4 + followUpScore * 0.35 + meetingScore * 0.25) * 100) / 100;

  // --- Close Rate Score (0-100) ---
  let closeRateScore = 0;
  if (metrics.leadsAssigned > 0) {
    const rawRate = metrics.leadsConverted / metrics.leadsAssigned;
    // 20% close rate = 100 score, scale linearly
    closeRateScore = Math.min(100, Math.round((rawRate / 0.20) * 100 * 100) / 100);
  } else if (metrics.dealsClosed > 0) {
    closeRateScore = 50; // Some credit for closing without tracked leads
  }

  // --- Client Satisfaction Score (0-100) ---
  let clientSatisfactionScore = 75; // Default if no ratings
  if (metrics.totalRatings > 0) {
    // 5.0 rating = 100, 1.0 = 0
    clientSatisfactionScore = Math.round(((metrics.avgClientRating - 1) / 4) * 100 * 100) / 100;
  }

  // --- Values Compliance Score (0-100) ---
  let valuesComplianceScore = 100; // Start perfect
  if (metrics.totalInteractions > 0) {
    const flagRate = metrics.flaggedInteractions / metrics.totalInteractions;
    valuesComplianceScore = Math.max(0, Math.round((1 - flagRate * 5) * 100 * 100) / 100); // Each flag = -20%
  }
  // Active strikes reduce values score
  valuesComplianceScore = Math.max(0, valuesComplianceScore - (metrics.activeStrikes * 15));

  // --- Weighted Overall ---
  const overallScore = Math.round((
    activityScore * SCORE_WEIGHTS.activity +
    closeRateScore * SCORE_WEIGHTS.closeRate +
    clientSatisfactionScore * SCORE_WEIGHTS.clientSatisfaction +
    valuesComplianceScore * SCORE_WEIGHTS.valuesCompliance
  ) * 100) / 100;

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    activityScore: Math.min(100, Math.max(0, activityScore)),
    closeRateScore: Math.min(100, Math.max(0, closeRateScore)),
    clientSatisfactionScore: Math.min(100, Math.max(0, clientSatisfactionScore)),
    valuesComplianceScore: Math.min(100, Math.max(0, valuesComplianceScore)),
  };
}

/**
 * Determine which tier a rep qualifies for
 */
export function calculateTier(monthsActive: number, monthlyRevenue: number): keyof typeof TIER_CONFIG {
  if (monthsActive >= TIER_CONFIG.platinum.minMonths && monthlyRevenue >= TIER_CONFIG.platinum.minMonthlyRevenue) {
    return "platinum";
  }
  if (monthsActive >= TIER_CONFIG.gold.minMonths && monthlyRevenue >= TIER_CONFIG.gold.minMonthlyRevenue) {
    return "gold";
  }
  if (monthsActive >= TIER_CONFIG.silver.minMonths && monthlyRevenue >= TIER_CONFIG.silver.minMonthlyRevenue) {
    return "silver";
  }
  return "bronze";
}

/**
 * Calculate residual decay rate based on inactivity
 */
export function calculateResidualDecay(
  daysSinceLastActive: number,
  tierDecayMultiplier: number
): number {
  if (tierDecayMultiplier === 0) return 1.0; // Platinum: no decay

  let baseRate = 1.0;
  if (daysSinceLastActive >= RESIDUAL_DECAY.reassignDays) {
    baseRate = RESIDUAL_DECAY.reassignRate;
  } else if (daysSinceLastActive >= RESIDUAL_DECAY.tier3Days) {
    baseRate = RESIDUAL_DECAY.tier3Rate;
  } else if (daysSinceLastActive >= RESIDUAL_DECAY.tier2Days) {
    baseRate = RESIDUAL_DECAY.tier2Rate;
  } else if (daysSinceLastActive >= RESIDUAL_DECAY.tier1Days) {
    baseRate = RESIDUAL_DECAY.tier1Rate;
  }

  // Apply tier multiplier (Gold decays at half speed)
  if (baseRate < 1.0 && tierDecayMultiplier > 0) {
    const decayAmount = 1.0 - baseRate;
    baseRate = 1.0 - (decayAmount * tierDecayMultiplier);
  }

  return Math.round(baseRate * 100) / 100;
}


// ═══════════════════════════════════════════════════════
// tRPC ROUTER
// ═══════════════════════════════════════════════════════

export const accountabilityRouter = router({

  // --- ACTIVITY LOGGING ---

  logActivity: protectedProcedure
    .input(z.object({
      activityType: z.enum([
        "call_made", "call_received", "email_sent", "email_received",
        "meeting_booked", "meeting_completed", "follow_up_sent",
        "proposal_sent", "deal_closed", "deal_lost",
        "lead_accepted", "lead_rejected", "lead_timeout",
        "login", "training_completed", "quiz_passed"
      ]),
      leadId: z.number().optional(),
      customerId: z.number().optional(),
      contractId: z.number().optional(),
      notes: z.string().optional(),
      durationSeconds: z.number().optional(),
      outcome: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    // Find the rep for this user
    const [rep] = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });

      await db.insert(repActivityLog).values({
        repId: rep.id,
        activityType: input.activityType,
        leadId: input.leadId ?? null,
        customerId: input.customerId ?? null,
        contractId: input.contractId ?? null,
        notes: input.notes ?? null,
        durationSeconds: input.durationSeconds ?? null,
        outcome: input.outcome ?? null,
      });

      // Update lastActiveAt on tier record
      await db.update(repTiers)
        .set({ lastActiveAt: new Date() })
        .where(eq(repTiers.repId, rep.id));

      return { success: true };
    }),

  // --- PERFORMANCE SCORE ---

  getMyScore: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [rep] = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });

    // Get latest score
    const [latestScore] = await db.select()
      .from(repPerformanceScores)
      .where(eq(repPerformanceScores.repId, rep.id))
      .orderBy(desc(repPerformanceScores.periodDate))
      .limit(1);

    // Get score history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const scoreHistory = await db.select()
      .from(repPerformanceScores)
      .where(and(
        eq(repPerformanceScores.repId, rep.id),
        gte(repPerformanceScores.periodDate, thirtyDaysAgo)
      ))
      .orderBy(asc(repPerformanceScores.periodDate));

    return { latestScore, scoreHistory };
  }),

  calculateAndStoreScore: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [rep] = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Gather activity metrics
    const activities = await db.select()
      .from(repActivityLog)
      .where(and(
        eq(repActivityLog.repId, rep.id),
        gte(repActivityLog.createdAt, thirtyDaysAgo)
      ));

    const callsMade = activities.filter(a => a.activityType === "call_made").length;
    const followUpsSent = activities.filter(a => a.activityType === "follow_up_sent").length;
    const meetingsBooked = activities.filter(a => a.activityType === "meeting_booked").length;
    const dealsClosed = activities.filter(a => a.activityType === "deal_closed").length;

    // Get lead assignment data
    const allocations = await db.select()
      .from(repLeadAllocations)
      .where(and(
        eq(repLeadAllocations.repId, rep.id),
        gte(repLeadAllocations.assignedAt, thirtyDaysAgo)
      ));
    const leadsAssigned = allocations.length;
    const leadsConverted = allocations.filter(a => a.outcome === "closed_won").length;

    // Get active strikes
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - STRIKE_RULES.strikePeriodMonths);
    const activeStrikesResult = await db.select({ cnt: count() })
      .from(repStrikes)
      .where(and(
        eq(repStrikes.repId, rep.id),
        eq(repStrikes.status, "confirmed"),
        gte(repStrikes.createdAt, sixMonthsAgo)
      ));
    const activeStrikes = Number(activeStrikesResult[0]?.cnt ?? 0);

    // Flagged interactions (from strikes with source ai_monitor)
    const flaggedResult = await db.select({ cnt: count() })
      .from(repStrikes)
      .where(and(
        eq(repStrikes.repId, rep.id),
        eq(repStrikes.source, "ai_monitor"),
        gte(repStrikes.createdAt, thirtyDaysAgo)
      ));
    const flaggedInteractions = Number(flaggedResult[0]?.cnt ?? 0);

    const totalInteractions = callsMade + followUpsSent + meetingsBooked;

    const ratingData = await getAvgRatingForRep(rep.id);

    const scores = calculatePerformanceScore({
      callsMade,
      followUpsSent,
      meetingsBooked,
      leadsAssigned,
      leadsConverted,
      dealsClosed,
      avgClientRating: ratingData ? ratingData.avg : 0,
      totalRatings: ratingData ? ratingData.total : 0,
      totalInteractions,
      flaggedInteractions,
      activeStrikes,
    });

    // Store the score
    const now = new Date();
    await db.insert(repPerformanceScores).values({
      repId: rep.id,
      overallScore: scores.overallScore.toString(),
      activityScore: scores.activityScore.toString(),
      closeRateScore: scores.closeRateScore.toString(),
      clientSatisfactionScore: scores.clientSatisfactionScore.toString(),
      valuesComplianceScore: scores.valuesComplianceScore.toString(),
      callsMade,
      followUpsSent,
      meetingsBooked,
      dealsClosed,
      leadsAssigned,
      leadsConverted,
      periodDate: now,
    });

    // Update the rep's performanceScore field
    await db.update(reps)
      .set({ performanceScore: scores.overallScore.toString() })
      .where(eq(reps.id, rep.id));

    return scores;
  }),

  // --- TIER MANAGEMENT ---

  getMyTier: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [rep] = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });

    const [tier] = await db.select()
      .from(repTiers)
      .where(eq(repTiers.repId, rep.id))
      .limit(1);

    if (!tier) {
      // Initialize tier for this rep
      const [newTier] = await db.insert(repTiers).values({
        repId: rep.id,
        tier: "bronze",
        commissionRate: TIER_CONFIG.bronze.commissionRate.toString(),
        monthlyRevenue: "0.00",
        monthsActive: 0,
        residualDecayRate: "1.00",
        lastActiveAt: new Date(),
      }).$returningId();

      return {
        tier: "bronze" as const,
        commissionRate: TIER_CONFIG.bronze.commissionRate,
        config: TIER_CONFIG.bronze,
        nextTier: TIER_CONFIG.silver,
        residualDecayRate: 1.0,
        lastActiveAt: new Date(),
      };
    }

    const tierKey = tier.tier as keyof typeof TIER_CONFIG;
    const tierConfig = TIER_CONFIG[tierKey];
    const tierOrder: (keyof typeof TIER_CONFIG)[] = ["bronze", "silver", "gold", "platinum"];
    const currentIndex = tierOrder.indexOf(tierKey);
    const nextTierKey = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;

    return {
      tier: tierKey,
      commissionRate: Number(tier.commissionRate),
      config: tierConfig,
      nextTier: nextTierKey ? TIER_CONFIG[nextTierKey] : null,
      residualDecayRate: Number(tier.residualDecayRate),
      lastActiveAt: tier.lastActiveAt,
      monthlyRevenue: Number(tier.monthlyRevenue),
      monthsActive: tier.monthsActive,
    };
  }),

  recalculateTier: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [rep] = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });

    // Calculate months active
    const monthsActive = Math.floor(
      (Date.now() - new Date(rep.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // Calculate rolling 30-day revenue from commissions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const revenueResult = await db.select({
      total: sql<string>`COALESCE(SUM(${commissions.amount}), 0)`,
    })
      .from(commissions)
      .where(and(
        eq(commissions.repId, rep.id),
        gte(commissions.createdAt, thirtyDaysAgo)
      ));
    const monthlyRevenue = Number(revenueResult[0]?.total ?? 0);

    const newTier = calculateTier(monthsActive, monthlyRevenue);
    const tierConfig = TIER_CONFIG[newTier];

    // Get current tier record
    const [currentTier] = await db.select()
      .from(repTiers)
      .where(eq(repTiers.repId, rep.id))
      .limit(1);

    // Calculate residual decay
    const lastActive = currentTier?.lastActiveAt ?? rep.createdAt;
    const daysSinceActive = Math.floor(
      (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
    );
    const decayRate = calculateResidualDecay(daysSinceActive, tierConfig.residualDecayMultiplier);

    if (currentTier) {
      const previousTier = currentTier.tier as keyof typeof TIER_CONFIG;
      await db.update(repTiers)
        .set({
          tier: newTier,
          commissionRate: tierConfig.commissionRate.toString(),
          monthlyRevenue: monthlyRevenue.toString(),
          monthsActive,
          residualDecayRate: decayRate.toString(),
          previousTier: previousTier !== newTier ? previousTier : currentTier.previousTier as typeof newTier,
          promotedAt: previousTier !== newTier ? new Date() : currentTier.promotedAt,
        })
        .where(eq(repTiers.repId, rep.id));
    } else {
      await db.insert(repTiers).values({
        repId: rep.id,
        tier: newTier,
        commissionRate: tierConfig.commissionRate.toString(),
        monthlyRevenue: monthlyRevenue.toString(),
        monthsActive,
        residualDecayRate: decayRate.toString(),
        lastActiveAt: new Date(),
        promotedAt: new Date(),
      });
    }

    return { tier: newTier, commissionRate: tierConfig.commissionRate, decayRate, monthlyRevenue, monthsActive };
  }),

  // --- LEAD ALLOCATION ---

  getLeadQueue: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [rep] = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });

    // Get active lead allocations for this rep
    const activeAllocations = await db.select()
      .from(repLeadAllocations)
      .where(and(
        eq(repLeadAllocations.repId, rep.id),
        eq(repLeadAllocations.status, "assigned")
      ))
      .orderBy(desc(repLeadAllocations.assignedAt));

    // Get lead details for each allocation
    const leadIds = activeAllocations.map(a => a.leadId);
    let leadDetails: any[] = [];
    if (leadIds.length > 0) {
      leadDetails = await db.select()
        .from(leads)
        .where(sql`${leads.id} IN (${sql.join(leadIds.map(id => sql`${id}`), sql`, `)})`);
    }

    return {
      allocations: activeAllocations,
      leads: leadDetails,
      maxLeads: LEAD_ALLOCATION.maxActiveLeads,
      timeoutHours: LEAD_ALLOCATION.timeoutHours,
    };
  }),

  acceptLead: protectedProcedure
    .input(z.object({ allocationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [rep] = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
      if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });

      const [allocation] = await db.select()
        .from(repLeadAllocations)
        .where(and(
          eq(repLeadAllocations.id, input.allocationId),
          eq(repLeadAllocations.repId, rep.id),
          eq(repLeadAllocations.status, "assigned")
        ))
        .limit(1);

      if (!allocation) throw new TRPCError({ code: "NOT_FOUND", message: "Lead allocation not found or already processed" });

      await db.update(repLeadAllocations)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(repLeadAllocations.id, input.allocationId));

      // Log the activity
      await db.insert(repActivityLog).values({
        repId: rep.id,
        activityType: "lead_accepted",
        leadId: allocation.leadId,
      });

      return { success: true };
    }),

  rejectLead: protectedProcedure
    .input(z.object({ allocationId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [rep] = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
      if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });

      await db.update(repLeadAllocations)
        .set({ status: "rejected", outcome: input.reason ?? "rejected_by_rep" })
        .where(and(
          eq(repLeadAllocations.id, input.allocationId),
          eq(repLeadAllocations.repId, rep.id)
        ));

      // Log the activity
      await db.insert(repActivityLog).values({
        repId: rep.id,
        activityType: "lead_rejected",
        notes: input.reason,
      });

      return { success: true };
    }),

  // --- STRIKES ---

  getMyStrikes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [rep] = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - STRIKE_RULES.strikePeriodMonths);

    const strikes = await db.select()
      .from(repStrikes)
      .where(and(
        eq(repStrikes.repId, rep.id),
        gte(repStrikes.createdAt, sixMonthsAgo)
      ))
      .orderBy(desc(repStrikes.createdAt));

    const confirmedStrikes = strikes.filter(s => s.status === "confirmed" && s.severity === "strike");

    return {
      strikes,
      confirmedStrikeCount: confirmedStrikes.length,
      maxStrikes: STRIKE_RULES.maxStrikesBeforeDeactivation,
      strikePeriodMonths: STRIKE_RULES.strikePeriodMonths,
    };
  }),

  // --- MISSED OPPORTUNITIES ---

  getMissedOpportunities: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [rep] = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Leads that timed out or were lost
    const missed = await db.select()
      .from(repLeadAllocations)
      .where(and(
        eq(repLeadAllocations.repId, rep.id),
        gte(repLeadAllocations.assignedAt, thirtyDaysAgo),
        sql`${repLeadAllocations.status} IN ('timeout', 'lost')`
      ))
      .orderBy(desc(repLeadAllocations.assignedAt));

    // Estimate lost revenue (average deal value * missed leads)
    const avgDealValue = 2500; // Approximate average
    const estimatedLostRevenue = missed.length * avgDealValue;

    return {
      missedLeads: missed,
      estimatedLostRevenue,
      message: missed.length > 0
        ? `You left an estimated $${estimatedLostRevenue.toLocaleString()} on the table this month from ${missed.length} missed lead${missed.length === 1 ? "" : "s"}.`
        : "No missed opportunities this month. Keep it up!",
    };
  }),

  // --- EARNINGS SUMMARY ---

  getEarningsSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [rep] = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get commissions for different periods
    const allCommissions = await db.select()
      .from(commissions)
      .where(eq(commissions.repId, rep.id));

    const todayEarnings = allCommissions
      .filter(c => new Date(c.createdAt) >= todayStart)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const weekEarnings = allCommissions
      .filter(c => new Date(c.createdAt) >= weekStart)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const monthEarnings = allCommissions
      .filter(c => new Date(c.createdAt) >= monthStart)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    // Residual earnings (from recurring contracts)
    const [tierRecord] = await db.select()
      .from(repTiers)
      .where(eq(repTiers.repId, rep.id))
      .limit(1);
    const decayRate = tierRecord ? Number(tierRecord.residualDecayRate) : 1.0;

    const totalResiduals = allCommissions
      .filter((c: any) => c.type === "recurring_monthly")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    return {
      today: todayEarnings,
      thisWeek: weekEarnings,
      thisMonth: monthEarnings,
      totalResiduals,
      residualDecayRate: decayRate,
      totalAllTime: allCommissions.reduce((sum, c) => sum + Number(c.amount), 0),
    };
  }),

  // --- ACTIVITY SUMMARY ---

  getActivitySummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [rep] = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Rep profile not found" });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayActivities = await db.select()
      .from(repActivityLog)
      .where(and(
        eq(repActivityLog.repId, rep.id),
        gte(repActivityLog.createdAt, todayStart)
      ));

    return {
      today: {
        callsMade: todayActivities.filter(a => a.activityType === "call_made").length,
        emailsSent: todayActivities.filter(a => a.activityType === "email_sent").length,
        followUpsSent: todayActivities.filter(a => a.activityType === "follow_up_sent").length,
        meetingsBooked: todayActivities.filter(a => a.activityType === "meeting_booked").length,
        meetingsCompleted: todayActivities.filter(a => a.activityType === "meeting_completed").length,
        proposalsSent: todayActivities.filter(a => a.activityType === "proposal_sent").length,
        dealsClosed: todayActivities.filter(a => a.activityType === "deal_closed").length,
      },
      totalToday: todayActivities.length,
    };
  }),

  // ═══════════════════════════════════════════════════════
  // ADMIN PROCEDURES
  // ═══════════════════════════════════════════════════════

  adminGetAllScores: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get latest score for each rep
    const allReps = await db.select().from(reps).where(
      sql`${reps.status} IN ('active', 'certified', 'training', 'onboarding')`
    );

    const scores = [];
    for (const rep of allReps) {
      const [latestScore] = await db.select()
        .from(repPerformanceScores)
        .where(eq(repPerformanceScores.repId, rep.id))
        .orderBy(desc(repPerformanceScores.periodDate))
        .limit(1);

      const [tier] = await db.select()
        .from(repTiers)
        .where(eq(repTiers.repId, rep.id))
        .limit(1);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const strikeResult = await db.select({ cnt: count() })
        .from(repStrikes)
        .where(and(
          eq(repStrikes.repId, rep.id),
          eq(repStrikes.status, "confirmed"),
          eq(repStrikes.severity, "strike"),
          gte(repStrikes.createdAt, sixMonthsAgo)
        ));

      scores.push({
        rep,
        latestScore,
        tier: tier ?? null,
        activeStrikes: Number(strikeResult[0]?.cnt ?? 0),
      });
    }

    return scores;
  }),

  adminIssueStrike: protectedProcedure
    .input(z.object({
      repId: z.number(),
      severity: z.enum(["warning", "strike", "instant_deactivation"]),
      category: z.enum([
        "values_violation", "performance", "professionalism",
        "fraud", "confidentiality_breach", "client_harm",
        "misrepresentation", "inactivity"
      ]),
      description: z.string().min(10),
      evidence: z.string().optional(),
      requiredAction: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.insert(repStrikes).values({
        repId: input.repId,
        severity: input.severity,
        category: input.category,
        description: input.description,
        evidence: input.evidence ?? null,
        source: "admin_manual",
        status: "confirmed",
        resolvedBy: ctx.user.id,
        resolvedAt: new Date(),
        requiredAction: input.requiredAction ?? null,
      });

      // Check if instant deactivation
      if (input.severity === "instant_deactivation" ||
          STRIKE_RULES.instantDeactivationCategories.includes(input.category)) {
        await db.update(reps)
          .set({ status: "suspended" })
          .where(eq(reps.id, input.repId));
        return { deactivated: true };
      }

      // Check strike count for auto-deactivation
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - STRIKE_RULES.strikePeriodMonths);
      const strikeResult = await db.select({ cnt: count() })
        .from(repStrikes)
        .where(and(
          eq(repStrikes.repId, input.repId),
          eq(repStrikes.status, "confirmed"),
          eq(repStrikes.severity, "strike"),
          gte(repStrikes.createdAt, sixMonthsAgo)
        ));

      const strikeCount = Number(strikeResult[0]?.cnt ?? 0);
      if (strikeCount >= STRIKE_RULES.maxStrikesBeforeDeactivation) {
        await db.update(reps)
          .set({ status: "suspended" })
          .where(eq(reps.id, input.repId));
        return { deactivated: true, reason: `${strikeCount} strikes in ${STRIKE_RULES.strikePeriodMonths} months` };
      }

      return { deactivated: false, strikeCount };
    }),

  adminReviewStrike: protectedProcedure
    .input(z.object({
      strikeId: z.number(),
      action: z.enum(["confirm", "dismiss"]),
      resolution: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(repStrikes)
        .set({
          status: input.action === "confirm" ? "confirmed" : "dismissed",
          resolvedBy: ctx.user.id,
          resolvedAt: new Date(),
          resolution: input.resolution ?? null,
        })
        .where(eq(repStrikes.id, input.strikeId));

      return { success: true };
    }),

  adminGetStrikes: protectedProcedure
    .input(z.object({ repId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const conditions = input?.repId
        ? [eq(repStrikes.repId, input.repId)]
        : [];

      const strikes = await db.select()
        .from(repStrikes)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(repStrikes.createdAt))
        .limit(100);

      return strikes;
    }),

  adminAllocateLead: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      repId: z.number().optional(), // If not provided, auto-assign to best rep
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let targetRepId = input.repId;

      if (!targetRepId) {
        // Auto-assign: find the highest-scoring active rep with capacity
        const activeReps = await db.select()
          .from(reps)
          .where(inArray(reps.status, ["active", "certified"]));

        let bestRep: { id: number; score: number } | null = null;

        for (const rep of activeReps) {
          // Check current lead count
          const activeLeadResult = await db.select({ cnt: count() })
            .from(repLeadAllocations)
            .where(and(
              eq(repLeadAllocations.repId, rep.id),
              sql`${repLeadAllocations.status} IN ('assigned', 'accepted')`
            ));
          const activeLeadCount = Number(activeLeadResult[0]?.cnt ?? 0);
          if (activeLeadCount >= LEAD_ALLOCATION.maxActiveLeads) continue;

          // Check score threshold
          const score = Number(rep.performanceScore ?? 0);
          if (score < LEAD_ALLOCATION.freezeThreshold) continue;

          if (!bestRep || score > bestRep.score) {
            bestRep = { id: rep.id, score };
          }
        }

        if (!bestRep) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "No eligible reps available for lead assignment"
          });
        }
        targetRepId = bestRep.id;
      }

      // Get rep's current score and tier
      const [rep] = await db.select().from(reps).where(eq(reps.id, targetRepId)).limit(1);
      const [tier] = await db.select().from(repTiers).where(eq(repTiers.repId, targetRepId)).limit(1);

      const timeoutAt = new Date();
      timeoutAt.setHours(timeoutAt.getHours() + LEAD_ALLOCATION.timeoutHours);

      await db.insert(repLeadAllocations).values({
        repId: targetRepId,
        leadId: input.leadId,
        scoreAtAssignment: (rep?.performanceScore ?? "0").toString(),
        tierAtAssignment: (tier?.tier ?? "bronze") as "bronze" | "silver" | "gold" | "platinum",
        timeoutAt,
      });

      // Update lead status
      await db.update(leads)
        .set({ stage: "assigned", assignedRepId: targetRepId })
        .where(eq(leads.id, input.leadId));

      return { repId: targetRepId, timeoutAt };
    }),

  adminOverrideScore: protectedProcedure
    .input(z.object({
      repId: z.number(),
      overallScore: z.number().min(0).max(100),
      reason: z.string().min(5),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(reps)
        .set({ performanceScore: input.overallScore.toString() })
        .where(eq(reps.id, input.repId));

      // Log the override as an activity
      await db.insert(repActivityLog).values({
        repId: input.repId,
        activityType: "login", // Using login as a generic admin action
        notes: `Admin override: Score set to ${input.overallScore}. Reason: ${input.reason}`,
        metadata: JSON.stringify({ type: "admin_score_override", by: ctx.user.id }),
      });

      return { success: true };
    }),

  adminDeactivateRep: protectedProcedure
    .input(z.object({
      repId: z.number(),
      reason: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Freeze leads first
      await db.update(repLeadAllocations)
        .set({ status: "timeout", outcome: "rep_deactivated" })
        .where(and(
          eq(repLeadAllocations.repId, input.repId),
          sql`${repLeadAllocations.status} IN ('assigned', 'accepted')`
        ));

      // Suspend the rep
      await db.update(reps)
        .set({ status: "suspended" })
        .where(eq(reps.id, input.repId));

      // Log the deactivation
      await db.insert(repStrikes).values({
        repId: input.repId,
        severity: "instant_deactivation",
        category: "performance",
        description: input.reason,
        source: "admin_manual",
        status: "confirmed",
        resolvedBy: ctx.user.id,
        resolvedAt: new Date(),
      });

      return { success: true };
    }),
});
