/**
 * ML Feedback Loop Scoring — Production Grade
 * 
 * Learns from conversion data to improve lead scoring over time:
 * 1. Tracks which lead attributes correlate with conversions
 * 2. Adjusts scoring weights based on historical performance
 * 3. Location-based scoring (city/region win rates)
 * 4. Time-of-contact correlation (best contact times per industry)
 * 5. Lead source scoring (which scraping source produces best leads)
 * 6. Recency decay factor (recent data weighted more than old data)
 * 7. Auto-retraining trigger when enough new data accumulates
 * 8. Scoring accuracy tracking (predicted vs actual outcome)
 * 9. Confidence bands (high/medium/low)
 */

import { getDb } from "../db";
import { leads, scrapedBusinesses, outreachSequences } from "../../drizzle/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

/* ═══════════════════════════════════════════════════════
   SCORING MODEL
   ═══════════════════════════════════════════════════════ */

export interface ScoringWeights {
  // Core attribute weights
  noWebsite: number;
  badWebsiteScore: number;
  highGoogleRating: number;
  manyReviews: number;
  hasPhone: number;
  hasEmail: number;
  selfSourcedBonus: number;
  intentSignalBonus: number;
  replyBonus: number;
  // Dimensional multipliers
  industryMultiplier: Record<string, number>;
  locationMultiplier: Record<string, number>;
  sourceMultiplier: Record<string, number>;
  contactTimeMultiplier: Record<string, number>; // hour-of-day → multiplier
  // Meta
  updatedAt: string;
  sampleSize: number;
  recentSampleSize: number; // last 30 days
  version: number;
}

// Default weights (before any learning)
const DEFAULT_WEIGHTS: ScoringWeights = {
  noWebsite: 25,
  badWebsiteScore: 15,
  highGoogleRating: 10,
  manyReviews: 5,
  hasPhone: 10,
  hasEmail: 5,
  selfSourcedBonus: 15,
  intentSignalBonus: 20,
  replyBonus: 15,
  industryMultiplier: {},
  locationMultiplier: {},
  sourceMultiplier: {},
  contactTimeMultiplier: {},
  updatedAt: new Date().toISOString(),
  sampleSize: 0,
  recentSampleSize: 0,
  version: 1,
};

// In-memory cache of learned weights
let cachedWeights: ScoringWeights | null = null;
let lastTrainingSampleSize = 0;
const RETRAIN_THRESHOLD = 5; // Retrain after 5 new closed leads

// Accuracy tracking
interface AccuracyRecord {
  leadId: number;
  predictedScore: number;
  actualOutcome: "won" | "lost";
  scoredAt: string;
  closedAt: string;
}
const accuracyHistory: AccuracyRecord[] = [];

/* ═══════════════════════════════════════════════════════
   RECENCY DECAY
   ═══════════════════════════════════════════════════════ */

/**
 * Apply exponential decay based on how old a data point is.
 * Recent data (< 30 days) gets full weight (1.0).
 * Older data decays: 60 days = 0.5, 90 days = 0.25, etc.
 */
function recencyDecay(dateStr: Date | string | null, halfLifeDays = 60): number {
  if (!dateStr) return 0.5;
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / halfLifeDays);
}

/* ═══════════════════════════════════════════════════════
   WEIGHT COMPUTATION
   ═══════════════════════════════════════════════════════ */

/**
 * Get the current scoring weights (from cache, or compute if stale/retrain needed)
 */
export async function getScoringWeights(): Promise<ScoringWeights> {
  // Check if auto-retrain is needed
  const shouldRetrain = await checkRetrainNeeded();

  if (cachedWeights && !shouldRetrain && Date.now() - new Date(cachedWeights.updatedAt).getTime() < 4 * 60 * 60 * 1000) {
    return cachedWeights;
  }

  cachedWeights = await computeWeightsFromHistory();
  lastTrainingSampleSize = cachedWeights.sampleSize;
  return cachedWeights;
}

/**
 * Check if enough new data has accumulated to trigger retraining
 */
async function checkRetrainNeeded(): Promise<boolean> {
  if (!cachedWeights) return true;

  const db = (await getDb())!;
  const [result] = await db.select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(sql`${leads.stage} IN ('closed_won', 'closed_lost')`);

  const currentCount = Number(result.count);
  return (currentCount - lastTrainingSampleSize) >= RETRAIN_THRESHOLD;
}

/**
 * Force a retrain of the scoring model
 */
export async function forceRetrain(): Promise<{ previousVersion: number; newVersion: number; sampleSize: number }> {
  const previousVersion = cachedWeights?.version || 0;
  cachedWeights = null;
  const newWeights = await getScoringWeights();
  return {
    previousVersion,
    newVersion: newWeights.version,
    sampleSize: newWeights.sampleSize,
  };
}

/**
 * Compute scoring weights from historical conversion data with recency decay
 */
async function computeWeightsFromHistory(): Promise<ScoringWeights> {
  const db = (await getDb())!;

  // Get all closed leads with their attributes
  const closedLeads = await db.select().from(leads).where(
    sql`${leads.stage} IN ('closed_won', 'closed_lost')`
  );

  if (closedLeads.length < 10) {
    return { ...DEFAULT_WEIGHTS, sampleSize: closedLeads.length, recentSampleSize: closedLeads.length };
  }

  // Apply recency decay to each lead
  const weightedLeads = closedLeads.map(l => ({
    ...l,
    weight: recencyDecay(l.updatedAt),
  }));

  const totalWeight = weightedLeads.reduce((sum, l) => sum + l.weight, 0);
  const wonWeighted = weightedLeads.filter(l => l.stage === "closed_won").reduce((sum, l) => sum + l.weight, 0);
  const winRate = wonWeighted / totalWeight;

  // Recent leads (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentLeads = closedLeads.filter(l => new Date(l.updatedAt) > thirtyDaysAgo);

  const weights: ScoringWeights = {
    ...DEFAULT_WEIGHTS,
    sampleSize: closedLeads.length,
    recentSampleSize: recentLeads.length,
    version: (cachedWeights?.version || 0) + 1,
  };

  // ─── Core attribute correlation with decay ───
  weights.noWebsite = computeAttributeWeight(weightedLeads, l => !l.website, 25, winRate);
  weights.hasPhone = computeAttributeWeight(weightedLeads, l => !!l.phone, 10, winRate);
  weights.hasEmail = computeAttributeWeight(weightedLeads, l => !!l.email && !l.email.includes("@unknown"), 5, winRate);
  weights.selfSourcedBonus = computeAttributeWeight(weightedLeads, l => !!l.selfSourced, 15, winRate);

  // ─── Industry multipliers ───
  const industryStats: Record<string, { wonWeight: number; totalWeight: number; count: number }> = {};
  for (const lead of weightedLeads) {
    const industry = lead.industry || "Other";
    if (!industryStats[industry]) industryStats[industry] = { wonWeight: 0, totalWeight: 0, count: 0 };
    industryStats[industry].totalWeight += lead.weight;
    industryStats[industry].count++;
    if (lead.stage === "closed_won") industryStats[industry].wonWeight += lead.weight;
  }

  for (const [industry, stats] of Object.entries(industryStats)) {
    if (stats.count >= 3) {
      const industryWinRate = stats.wonWeight / stats.totalWeight;
      weights.industryMultiplier[industry] = Math.round((industryWinRate / Math.max(winRate, 0.01)) * 100) / 100;
    }
  }

  // ─── Location multipliers (city/region) ───
  const locationStats: Record<string, { wonWeight: number; totalWeight: number; count: number }> = {};
  for (const lead of weightedLeads) {
    const enrichment = (lead.enrichmentData || {}) as any;
    const city = enrichment.city || extractCity(enrichment.address || "");
    if (!city) continue;
    if (!locationStats[city]) locationStats[city] = { wonWeight: 0, totalWeight: 0, count: 0 };
    locationStats[city].totalWeight += lead.weight;
    locationStats[city].count++;
    if (lead.stage === "closed_won") locationStats[city].wonWeight += lead.weight;
  }

  for (const [location, stats] of Object.entries(locationStats)) {
    if (stats.count >= 3) {
      const locWinRate = stats.wonWeight / stats.totalWeight;
      weights.locationMultiplier[location] = Math.round((locWinRate / Math.max(winRate, 0.01)) * 100) / 100;
    }
  }

  // ─── Source multipliers (which scraping source produces best leads) ───
  const sourceStats: Record<string, { wonWeight: number; totalWeight: number; count: number }> = {};
  for (const lead of weightedLeads) {
    const source = lead.source || "manual";
    if (!sourceStats[source]) sourceStats[source] = { wonWeight: 0, totalWeight: 0, count: 0 };
    sourceStats[source].totalWeight += lead.weight;
    sourceStats[source].count++;
    if (lead.stage === "closed_won") sourceStats[source].wonWeight += lead.weight;
  }

  for (const [source, stats] of Object.entries(sourceStats)) {
    if (stats.count >= 3) {
      const srcWinRate = stats.wonWeight / stats.totalWeight;
      weights.sourceMultiplier[source] = Math.round((srcWinRate / Math.max(winRate, 0.01)) * 100) / 100;
    }
  }

  // ─── Time-of-contact correlation ───
  // Group by hour of first outreach to find best contact times
  const outreachData = await db.select({
    leadId: outreachSequences.leadId,
    sentAt: outreachSequences.sentAt,
  }).from(outreachSequences).where(
    and(
      eq(outreachSequences.stepNumber, 1),
      sql`${outreachSequences.sentAt} IS NOT NULL`
    )
  );

  const hourStats: Record<number, { wonWeight: number; totalWeight: number; count: number }> = {};
  for (const outreach of outreachData) {
    if (!outreach.sentAt) continue;
    const hour = new Date(outreach.sentAt).getHours();
    const matchingLead = weightedLeads.find(l => l.id === outreach.leadId);
    if (!matchingLead) continue;

    if (!hourStats[hour]) hourStats[hour] = { wonWeight: 0, totalWeight: 0, count: 0 };
    hourStats[hour].totalWeight += matchingLead.weight;
    hourStats[hour].count++;
    if (matchingLead.stage === "closed_won") hourStats[hour].wonWeight += matchingLead.weight;
  }

  for (const [hour, stats] of Object.entries(hourStats)) {
    if (stats.count >= 3) {
      const hourWinRate = stats.wonWeight / stats.totalWeight;
      weights.contactTimeMultiplier[hour] = Math.round((hourWinRate / Math.max(winRate, 0.01)) * 100) / 100;
    }
  }

  // ─── Cap all weights to reasonable ranges ───
  weights.noWebsite = clamp(weights.noWebsite, 5, 40);
  weights.badWebsiteScore = clamp(weights.badWebsiteScore, 5, 30);
  weights.highGoogleRating = clamp(weights.highGoogleRating, 2, 20);
  weights.manyReviews = clamp(weights.manyReviews, 2, 15);
  weights.hasPhone = clamp(weights.hasPhone, 2, 20);
  weights.hasEmail = clamp(weights.hasEmail, 2, 15);
  weights.selfSourcedBonus = clamp(weights.selfSourcedBonus, 5, 30);
  weights.intentSignalBonus = clamp(weights.intentSignalBonus, 5, 30);
  weights.replyBonus = clamp(weights.replyBonus, 5, 25);

  weights.updatedAt = new Date().toISOString();
  return weights;
}

/**
 * Compute a single attribute weight using decay-weighted correlation
 */
function computeAttributeWeight(
  weightedLeads: Array<any & { weight: number }>,
  predicate: (l: any) => boolean,
  baseWeight: number,
  overallWinRate: number,
): number {
  const matching = weightedLeads.filter(predicate);
  const matchingWon = matching.filter(l => l.stage === "closed_won");
  const totalWeight = matching.reduce((sum, l) => sum + l.weight, 0);
  const wonWeight = matchingWon.reduce((sum, l) => sum + l.weight, 0);

  if (totalWeight < 0.5) return baseWeight; // Not enough data

  const attrWinRate = wonWeight / totalWeight;
  return Math.round(baseWeight * (attrWinRate / Math.max(overallWinRate, 0.01)));
}

/* ═══════════════════════════════════════════════════════
   LEAD SCORING
   ═══════════════════════════════════════════════════════ */

export type ConfidenceBand = "high" | "medium" | "low";

export interface LeadScore {
  score: number;
  confidence: number;
  confidenceBand: ConfidenceBand;
  factors: Array<{ name: string; impact: number; description: string }>;
  dimensionalFactors: {
    industry?: { name: string; multiplier: number };
    location?: { name: string; multiplier: number };
    source?: { name: string; multiplier: number };
    contactTime?: { bestHour: number; multiplier: number };
  };
}

/**
 * Score a lead using the ML-learned weights with all dimensional factors
 */
export async function scoreLeadML(leadId: number): Promise<LeadScore> {
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const weights = await getScoringWeights();
  const enrichment = (lead.enrichmentData || {}) as any;
  let score = 30; // Base score
  const factors: Array<{ name: string; impact: number; description: string }> = [];
  const dimensionalFactors: LeadScore["dimensionalFactors"] = {};

  // ─── Core attribute scoring ───
  if (!lead.website) {
    score += weights.noWebsite;
    factors.push({ name: "No Website", impact: weights.noWebsite, description: "Business has no website — high opportunity" });
  } else if (enrichment.websiteScore && enrichment.websiteScore < 40) {
    score += weights.badWebsiteScore;
    factors.push({ name: "Poor Website", impact: weights.badWebsiteScore, description: `Website scored ${enrichment.websiteScore}/100` });
  }

  if (enrichment.googleRating && Number(enrichment.googleRating) >= 4.0) {
    score += weights.highGoogleRating;
    factors.push({ name: "High Google Rating", impact: weights.highGoogleRating, description: `${enrichment.googleRating} stars — good business, just needs web help` });
  }

  if (enrichment.googleReviewCount && enrichment.googleReviewCount > 20) {
    score += weights.manyReviews;
    factors.push({ name: "Active Business", impact: weights.manyReviews, description: `${enrichment.googleReviewCount} reviews — established business` });
  }

  if (lead.phone) {
    score += weights.hasPhone;
    factors.push({ name: "Phone Available", impact: weights.hasPhone, description: "Can reach via phone/SMS" });
  }
  if (lead.email && !lead.email.includes("@unknown")) {
    score += weights.hasEmail;
    factors.push({ name: "Email Available", impact: weights.hasEmail, description: "Can reach via email" });
  }

  if (lead.selfSourced) {
    score += weights.selfSourcedBonus;
    factors.push({ name: "Self-Sourced", impact: weights.selfSourcedBonus, description: "Rep personally knows this lead" });
  }

  // Intent signals
  const signals = enrichment.intentSignals || [];
  const strongSignals = signals.filter((s: any) => ["link_click", "website_visit", "audit_view"].includes(s.type));
  if (strongSignals.length > 0) {
    const intentImpact = Math.min(weights.intentSignalBonus * Math.min(strongSignals.length, 3), 30);
    score += intentImpact;
    factors.push({ name: "Intent Signals", impact: intentImpact, description: `${strongSignals.length} strong intent signals detected` });
  }

  // Reply bonus
  if (enrichment.hasReplied) {
    score += weights.replyBonus;
    factors.push({ name: "Has Replied", impact: weights.replyBonus, description: "Lead has engaged in conversation" });
  }

  // ─── Dimensional multipliers ───

  // Industry
  const industry = lead.industry || "Other";
  const industryMult = weights.industryMultiplier[industry];
  if (industryMult && industryMult !== 1) {
    const adjustment = Math.round(score * (industryMult - 1) * 0.3);
    score += adjustment;
    dimensionalFactors.industry = { name: industry, multiplier: industryMult };
    factors.push({
      name: "Industry Factor",
      impact: adjustment,
      description: industryMult > 1
        ? `${industry} converts ${Math.round((industryMult - 1) * 100)}% above average`
        : `${industry} converts ${Math.round((1 - industryMult) * 100)}% below average`,
    });
  }

  // Location
  const city = enrichment.city || extractCity(enrichment.address || "");
  if (city) {
    const locMult = weights.locationMultiplier[city];
    if (locMult && locMult !== 1) {
      const adjustment = Math.round(score * (locMult - 1) * 0.2);
      score += adjustment;
      dimensionalFactors.location = { name: city, multiplier: locMult };
      factors.push({
        name: "Location Factor",
        impact: adjustment,
        description: locMult > 1
          ? `${city} converts ${Math.round((locMult - 1) * 100)}% above average`
          : `${city} converts ${Math.round((1 - locMult) * 100)}% below average`,
      });
    }
  }

  // Source
  const source = lead.source || "manual";
  const srcMult = weights.sourceMultiplier[source];
  if (srcMult && srcMult !== 1) {
    const adjustment = Math.round(score * (srcMult - 1) * 0.15);
    score += adjustment;
    dimensionalFactors.source = { name: source, multiplier: srcMult };
    factors.push({
      name: "Source Quality",
      impact: adjustment,
      description: srcMult > 1
        ? `${source} leads convert ${Math.round((srcMult - 1) * 100)}% above average`
        : `${source} leads convert ${Math.round((1 - srcMult) * 100)}% below average`,
    });
  }

  // Best contact time
  const bestHour = findBestContactHour(weights.contactTimeMultiplier);
  if (bestHour !== null) {
    dimensionalFactors.contactTime = {
      bestHour,
      multiplier: weights.contactTimeMultiplier[bestHour.toString()] || 1,
    };
  }

  // ─── Cap score ───
  score = clamp(score, 0, 100);

  // ─── Confidence calculation ───
  const confidence = computeConfidence(weights);
  const confidenceBand: ConfidenceBand = confidence >= 75 ? "high" : confidence >= 50 ? "medium" : "low";

  // ─── Track for accuracy measurement ───
  trackPrediction(leadId, score);

  return { score, confidence, confidenceBand, factors, dimensionalFactors };
}

/* ═══════════════════════════════════════════════════════
   ACCURACY TRACKING
   ═══════════════════════════════════════════════════════ */

/**
 * Track a scoring prediction for later accuracy measurement
 */
function trackPrediction(leadId: number, score: number) {
  // Keep last 500 predictions in memory
  if (accuracyHistory.length > 500) accuracyHistory.shift();
  // Only track if not already tracked
  if (!accuracyHistory.find(r => r.leadId === leadId)) {
    accuracyHistory.push({
      leadId,
      predictedScore: score,
      actualOutcome: "lost", // Will be updated when lead closes
      scoredAt: new Date().toISOString(),
      closedAt: "",
    });
  }
}

/**
 * Record the actual outcome of a lead for accuracy measurement.
 * Call this when a lead is closed (won or lost).
 */
export function recordOutcome(leadId: number, outcome: "won" | "lost") {
  const record = accuracyHistory.find(r => r.leadId === leadId);
  if (record) {
    record.actualOutcome = outcome;
    record.closedAt = new Date().toISOString();
  }
}

/**
 * Get scoring accuracy metrics
 */
export function getScoringAccuracy(): {
  totalPredictions: number;
  closedPredictions: number;
  accuracy: number;
  avgScoreWon: number;
  avgScoreLost: number;
  calibrationError: number;
  recentAccuracy: number;
} {
  const closed = accuracyHistory.filter(r => r.closedAt);
  if (closed.length === 0) {
    return { totalPredictions: accuracyHistory.length, closedPredictions: 0, accuracy: 0, avgScoreWon: 0, avgScoreLost: 0, calibrationError: 0, recentAccuracy: 0 };
  }

  const won = closed.filter(r => r.actualOutcome === "won");
  const lost = closed.filter(r => r.actualOutcome === "lost");

  const avgScoreWon = won.length > 0 ? won.reduce((s, r) => s + r.predictedScore, 0) / won.length : 0;
  const avgScoreLost = lost.length > 0 ? lost.reduce((s, r) => s + r.predictedScore, 0) / lost.length : 0;

  // Accuracy: how often did high-scoring leads actually convert?
  // A "correct" prediction: score >= 60 and won, OR score < 60 and lost
  const correct = closed.filter(r =>
    (r.predictedScore >= 60 && r.actualOutcome === "won") ||
    (r.predictedScore < 60 && r.actualOutcome === "lost")
  );
  const accuracy = Math.round((correct.length / closed.length) * 100);

  // Calibration error: difference between predicted win probability and actual
  const buckets: Record<string, { predicted: number; actual: number; count: number }> = {};
  for (const r of closed) {
    const bucket = Math.floor(r.predictedScore / 20) * 20; // 0, 20, 40, 60, 80
    const key = bucket.toString();
    if (!buckets[key]) buckets[key] = { predicted: 0, actual: 0, count: 0 };
    buckets[key].predicted += r.predictedScore / 100;
    buckets[key].actual += r.actualOutcome === "won" ? 1 : 0;
    buckets[key].count++;
  }
  let calError = 0;
  let calBuckets = 0;
  for (const b of Object.values(buckets)) {
    if (b.count >= 2) {
      calError += Math.abs((b.predicted / b.count) - (b.actual / b.count));
      calBuckets++;
    }
  }
  const calibrationError = calBuckets > 0 ? Math.round((calError / calBuckets) * 100) : 0;

  // Recent accuracy (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recent = closed.filter(r => r.closedAt > thirtyDaysAgo);
  const recentCorrect = recent.filter(r =>
    (r.predictedScore >= 60 && r.actualOutcome === "won") ||
    (r.predictedScore < 60 && r.actualOutcome === "lost")
  );
  const recentAccuracy = recent.length > 0 ? Math.round((recentCorrect.length / recent.length) * 100) : 0;

  return {
    totalPredictions: accuracyHistory.length,
    closedPredictions: closed.length,
    accuracy,
    avgScoreWon: Math.round(avgScoreWon),
    avgScoreLost: Math.round(avgScoreLost),
    calibrationError,
    recentAccuracy,
  };
}

/* ═══════════════════════════════════════════════════════
   BATCH OPERATIONS
   ═══════════════════════════════════════════════════════ */

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
    .limit(500);

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

/* ═══════════════════════════════════════════════════════
   INSIGHTS & DASHBOARD
   ═══════════════════════════════════════════════════════ */

/**
 * Get comprehensive scoring model insights for the admin dashboard
 */
export async function getScoringInsights(): Promise<{
  weights: ScoringWeights;
  topIndustries: Array<{ industry: string; multiplier: number; sampleSize: number }>;
  topLocations: Array<{ location: string; multiplier: number; sampleSize: number }>;
  topSources: Array<{ source: string; multiplier: number; sampleSize: number }>;
  bestContactHours: Array<{ hour: number; multiplier: number }>;
  overallWinRate: number;
  totalClosedLeads: number;
  modelConfidence: number;
  modelVersion: number;
  accuracy: ReturnType<typeof getScoringAccuracy>;
  retrainStatus: { lastTrained: string; nextRetrainAt: number; autoRetrainEnabled: boolean };
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

  const topLocations = Object.entries(weights.locationMultiplier)
    .map(([location, multiplier]) => ({ location, multiplier, sampleSize: 0 }))
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 10);

  const topSources = Object.entries(weights.sourceMultiplier)
    .map(([source, multiplier]) => ({ source, multiplier, sampleSize: 0 }))
    .sort((a, b) => b.multiplier - a.multiplier);

  const bestContactHours = Object.entries(weights.contactTimeMultiplier)
    .map(([hour, multiplier]) => ({ hour: parseInt(hour), multiplier }))
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 5);

  const modelConfidence = computeConfidence(weights);

  return {
    weights,
    topIndustries,
    topLocations,
    topSources,
    bestContactHours,
    overallWinRate: Math.round(winRate * 100),
    totalClosedLeads: totalClosed,
    modelConfidence,
    modelVersion: weights.version,
    accuracy: getScoringAccuracy(),
    retrainStatus: {
      lastTrained: weights.updatedAt,
      nextRetrainAt: lastTrainingSampleSize + RETRAIN_THRESHOLD,
      autoRetrainEnabled: true,
    },
  };
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeConfidence(weights: ScoringWeights): number {
  let confidence = 20;
  if (weights.sampleSize >= 10) confidence = 40;
  if (weights.sampleSize >= 25) confidence = 55;
  if (weights.sampleSize >= 50) confidence = 70;
  if (weights.sampleSize >= 100) confidence = 85;
  if (weights.sampleSize >= 200) confidence = 95;

  // Boost confidence if we have recent data
  if (weights.recentSampleSize >= 5) confidence += 5;
  if (weights.recentSampleSize >= 15) confidence += 5;

  // Boost confidence if we have dimensional data
  if (Object.keys(weights.industryMultiplier).length >= 3) confidence += 3;
  if (Object.keys(weights.locationMultiplier).length >= 2) confidence += 2;

  return clamp(confidence, 10, 99);
}

function extractCity(address: string): string {
  if (!address) return "";
  // Try to extract city from common address formats
  const parts = address.split(",").map(p => p.trim());
  if (parts.length >= 2) {
    // Usually city is the second-to-last part before state/zip
    return parts[parts.length - 2] || parts[0];
  }
  return parts[0] || "";
}

function findBestContactHour(timeMultiplier: Record<string, number>): number | null {
  let bestHour: number | null = null;
  let bestMult = 0;
  for (const [hour, mult] of Object.entries(timeMultiplier)) {
    if (mult > bestMult) {
      bestMult = mult;
      bestHour = parseInt(hour);
    }
  }
  return bestHour;
}
