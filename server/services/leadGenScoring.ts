/**
 * ML Feedback Loop Scoring
 * 
 * Learns from conversion data to improve lead scoring over time:
 * 1. Tracks which lead attributes correlate with conversions
 * 2. Adjusts scoring weights based on historical performance
 * 3. Identifies high-value lead patterns by industry, location, size
 * 4. Provides scoring confidence levels
 */

import { getDb } from "../db";
import { leads, scrapedBusinesses } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

/* ═══════════════════════════════════════════════════════
   SCORING MODEL
   ═══════════════════════════════════════════════════════ */

export interface ScoringWeights {
  noWebsite: number;
  badWebsiteScore: number;
  highGoogleRating: number;
  manyReviews: number;
  hasPhone: number;
  hasEmail: number;
  industryMultiplier: Record<string, number>;
  selfSourcedBonus: number;
  intentSignalBonus: number;
  replyBonus: number;
  updatedAt: string;
  sampleSize: number;
}

// Default weights (before any learning)
const DEFAULT_WEIGHTS: ScoringWeights = {
  noWebsite: 25,
  badWebsiteScore: 15,
  highGoogleRating: 10,
  manyReviews: 5,
  hasPhone: 10,
  hasEmail: 5,
  industryMultiplier: {},
  selfSourcedBonus: 15,
  intentSignalBonus: 20,
  replyBonus: 15,
  updatedAt: new Date().toISOString(),
  sampleSize: 0,
};

// In-memory cache of learned weights
let cachedWeights: ScoringWeights | null = null;

/**
 * Get the current scoring weights (from cache or compute)
 */
export async function getScoringWeights(): Promise<ScoringWeights> {
  if (cachedWeights && Date.now() - new Date(cachedWeights.updatedAt).getTime() < 6 * 60 * 60 * 1000) {
    return cachedWeights;
  }
  cachedWeights = await computeWeightsFromHistory();
  return cachedWeights;
}

/**
 * Compute scoring weights from historical conversion data
 */
async function computeWeightsFromHistory(): Promise<ScoringWeights> {
  const db = (await getDb())!;

  // Get all closed leads (won and lost) with their attributes
  const closedLeads = await db.select().from(leads).where(
    sql`${leads.stage} IN ('closed_won', 'closed_lost')`
  );

  if (closedLeads.length < 10) {
    // Not enough data to learn — use defaults
    return { ...DEFAULT_WEIGHTS, sampleSize: closedLeads.length };
  }

  const won = closedLeads.filter(l => l.stage === "closed_won");
  const lost = closedLeads.filter(l => l.stage === "closed_lost");
  const winRate = won.length / closedLeads.length;

  // Analyze which attributes correlate with wins
  const weights = { ...DEFAULT_WEIGHTS };
  weights.sampleSize = closedLeads.length;

  // No website correlation
  const noWebWon = won.filter(l => !l.website).length;
  const noWebLost = lost.filter(l => !l.website).length;
  const noWebTotal = noWebWon + noWebLost;
  if (noWebTotal > 0) {
    const noWebWinRate = noWebWon / noWebTotal;
    weights.noWebsite = Math.round(25 * (noWebWinRate / Math.max(winRate, 0.01)));
  }

  // Has phone correlation
  const phoneWon = won.filter(l => l.phone).length;
  const phoneLost = lost.filter(l => l.phone).length;
  const phoneTotal = phoneWon + phoneLost;
  if (phoneTotal > 0) {
    const phoneWinRate = phoneWon / phoneTotal;
    weights.hasPhone = Math.round(10 * (phoneWinRate / Math.max(winRate, 0.01)));
  }

  // Has email correlation
  const emailWon = won.filter(l => l.email).length;
  const emailLost = lost.filter(l => l.email).length;
  const emailTotal = emailWon + emailLost;
  if (emailTotal > 0) {
    const emailWinRate = emailWon / emailTotal;
    weights.hasEmail = Math.round(5 * (emailWinRate / Math.max(winRate, 0.01)));
  }

  // Self-sourced correlation
  const selfWon = won.filter(l => l.selfSourced).length;
  const selfLost = lost.filter(l => l.selfSourced).length;
  const selfTotal = selfWon + selfLost;
  if (selfTotal > 0) {
    const selfWinRate = selfWon / selfTotal;
    weights.selfSourcedBonus = Math.round(15 * (selfWinRate / Math.max(winRate, 0.01)));
  }

  // Industry multipliers
  const industryStats: Record<string, { won: number; total: number }> = {};
  for (const lead of closedLeads) {
    const industry = lead.industry || "Other";
    if (!industryStats[industry]) industryStats[industry] = { won: 0, total: 0 };
    industryStats[industry].total++;
    if (lead.stage === "closed_won") industryStats[industry].won++;
  }

  for (const [industry, stats] of Object.entries(industryStats)) {
    if (stats.total >= 3) { // Need at least 3 data points
      const industryWinRate = stats.won / stats.total;
      weights.industryMultiplier[industry] = Math.round((industryWinRate / Math.max(winRate, 0.01)) * 100) / 100;
    }
  }

  // Cap weights to reasonable ranges
  weights.noWebsite = Math.min(40, Math.max(5, weights.noWebsite));
  weights.badWebsiteScore = Math.min(30, Math.max(5, weights.badWebsiteScore));
  weights.highGoogleRating = Math.min(20, Math.max(2, weights.highGoogleRating));
  weights.hasPhone = Math.min(20, Math.max(2, weights.hasPhone));
  weights.hasEmail = Math.min(15, Math.max(2, weights.hasEmail));
  weights.selfSourcedBonus = Math.min(30, Math.max(5, weights.selfSourcedBonus));
  weights.intentSignalBonus = Math.min(30, Math.max(5, weights.intentSignalBonus));
  weights.replyBonus = Math.min(25, Math.max(5, weights.replyBonus));

  weights.updatedAt = new Date().toISOString();
  return weights;
}

/**
 * Score a lead using the ML-learned weights
 */
export async function scoreLeadML(leadId: number): Promise<{
  score: number;
  confidence: number;
  factors: Array<{ name: string; impact: number; description: string }>;
}> {
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const weights = await getScoringWeights();
  const enrichment = (lead.enrichmentData || {}) as any;
  let score = 30; // Base score
  const factors: Array<{ name: string; impact: number; description: string }> = [];

  // No website
  if (!lead.website) {
    score += weights.noWebsite;
    factors.push({ name: "No Website", impact: weights.noWebsite, description: "Business has no website — high opportunity" });
  } else if (enrichment.websiteScore && enrichment.websiteScore < 40) {
    score += weights.badWebsiteScore;
    factors.push({ name: "Poor Website", impact: weights.badWebsiteScore, description: `Website scored ${enrichment.websiteScore}/100` });
  }

  // Google rating
  if (enrichment.googleRating && Number(enrichment.googleRating) >= 4.0) {
    score += weights.highGoogleRating;
    factors.push({ name: "High Google Rating", impact: weights.highGoogleRating, description: `${enrichment.googleRating} stars — good business, just needs web help` });
  }

  // Reviews
  if (enrichment.googleReviewCount && enrichment.googleReviewCount > 20) {
    score += weights.manyReviews;
    factors.push({ name: "Active Business", impact: weights.manyReviews, description: `${enrichment.googleReviewCount} reviews — established business` });
  }

  // Contact info
  if (lead.phone) {
    score += weights.hasPhone;
    factors.push({ name: "Phone Available", impact: weights.hasPhone, description: "Can reach via phone/SMS" });
  }
  if (lead.email && !lead.email.includes("@unknown")) {
    score += weights.hasEmail;
    factors.push({ name: "Email Available", impact: weights.hasEmail, description: "Can reach via email" });
  }

  // Self-sourced
  if (lead.selfSourced) {
    score += weights.selfSourcedBonus;
    factors.push({ name: "Self-Sourced", impact: weights.selfSourcedBonus, description: "Rep personally knows this lead" });
  }

  // Intent signals
  const signals = enrichment.intentSignals || [];
  const strongSignals = signals.filter((s: any) => ["link_click", "website_visit", "audit_view"].includes(s.type));
  if (strongSignals.length > 0) {
    score += weights.intentSignalBonus;
    factors.push({ name: "Intent Signals", impact: weights.intentSignalBonus, description: `${strongSignals.length} strong intent signals detected` });
  }

  // Industry multiplier
  const industry = lead.industry || "Other";
  const multiplier = weights.industryMultiplier[industry];
  if (multiplier && multiplier !== 1) {
    const adjustment = Math.round(score * (multiplier - 1) * 0.3);
    score += adjustment;
    factors.push({
      name: "Industry Factor",
      impact: adjustment,
      description: multiplier > 1
        ? `${industry} converts ${Math.round((multiplier - 1) * 100)}% above average`
        : `${industry} converts ${Math.round((1 - multiplier) * 100)}% below average`,
    });
  }

  // Cap score
  score = Math.min(100, Math.max(0, score));

  // Confidence based on sample size
  let confidence = 30; // Low confidence with no data
  if (weights.sampleSize >= 10) confidence = 50;
  if (weights.sampleSize >= 25) confidence = 70;
  if (weights.sampleSize >= 50) confidence = 85;
  if (weights.sampleSize >= 100) confidence = 95;

  return { score, confidence, factors };
}

/**
 * Re-score all active leads using the latest ML weights
 */
export async function rescoreAllLeads(): Promise<number> {
  const db = (await getDb())!;

  // Force weight recalculation
  cachedWeights = null;

  const activeLeads = await db.select({ id: leads.id })
    .from(leads)
    .where(
      sql`${leads.stage} NOT IN ('closed_won', 'closed_lost')`
    )
    .limit(200);

  let rescored = 0;
  for (const lead of activeLeads) {
    try {
      const result = await scoreLeadML(lead.id);
      await db.update(leads).set({
        qualificationScore: result.score,
      }).where(eq(leads.id, lead.id));
      rescored++;
    } catch (err) {
      console.error(`[Scoring] Failed to rescore lead ${lead.id}:`, err);
    }
  }

  return rescored;
}

/**
 * Get scoring model insights for the admin dashboard
 */
export async function getScoringInsights(): Promise<{
  weights: ScoringWeights;
  topIndustries: Array<{ industry: string; multiplier: number; sampleSize: number }>;
  overallWinRate: number;
  totalClosedLeads: number;
  modelConfidence: number;
}> {
  const weights = await getScoringWeights();
  const db = (await getDb())!;

  const [closedWon] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.stage, "closed_won"));
  const [closedLost] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.stage, "closed_lost"));
  const totalClosed = Number(closedWon.count) + Number(closedLost.count);
  const winRate = totalClosed > 0 ? Number(closedWon.count) / totalClosed : 0;

  const topIndustries = Object.entries(weights.industryMultiplier)
    .map(([industry, multiplier]) => ({ industry, multiplier, sampleSize: 0 }))
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 10);

  let modelConfidence = 30;
  if (weights.sampleSize >= 10) modelConfidence = 50;
  if (weights.sampleSize >= 25) modelConfidence = 70;
  if (weights.sampleSize >= 50) modelConfidence = 85;
  if (weights.sampleSize >= 100) modelConfidence = 95;

  return {
    weights,
    topIndustries,
    overallWinRate: Math.round(winRate * 100),
    totalClosedLeads: totalClosed,
    modelConfidence,
  };
}
