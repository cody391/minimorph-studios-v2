/**
 * Smart Outreach Timing & Drip Campaign Branching
 * 
 * Improvements over the basic outreach system:
 * 1. Smart timing — send emails Tue-Thu 9-11am local time, SMS during business hours
 * 2. Drip campaign branching — different paths based on lead behavior
 * 3. Re-engagement campaigns — 30-day drip for cold leads
 * 4. Intent signal tracking — email opens, link clicks, website visits via UTM
 */

import { getDb } from "../db";
import { leads, outreachSequences, aiConversations } from "../../drizzle/schema";
import { eq, and, lte, sql, ne } from "drizzle-orm";
import { generateOutreachMessage } from "./leadGenOutreach";
import { generateAuditReport } from "./leadGenAudit";
import type { EnrichmentResult } from "./leadGenEnrichment";

/* ═══════════════════════════════════════════════════════
   SMART TIMING
   ═══════════════════════════════════════════════════════ */

/**
 * Get the next optimal send time for a given channel
 * Email: Tue-Thu 9-11am local (best B2B open rates)
 * SMS: Mon-Fri 10am-5pm local (business hours only)
 */
export function getOptimalSendTime(channel: "email" | "sms", timezone?: string): Date {
  const now = new Date();
  // Default to EST if no timezone
  const tz = timezone || "America/New_York";

  // Get current time in the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === "hour")?.value || "12");
  const weekday = parts.find(p => p.type === "weekday")?.value || "Mon";

  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentDay = dayMap[weekday] ?? 1;

  if (channel === "email") {
    // Best days: Tue (2), Wed (3), Thu (4) at 9-11am
    const bestDays = [2, 3, 4];
    const bestHourStart = 9;
    const bestHourEnd = 11;

    // If we're in a good window right now, send soon (within 30 min)
    if (bestDays.includes(currentDay) && hour >= bestHourStart && hour < bestHourEnd) {
      const sendTime = new Date(now);
      sendTime.setMinutes(sendTime.getMinutes() + Math.floor(Math.random() * 30));
      return sendTime;
    }

    // Find the next good slot
    let daysToAdd = 0;
    for (let i = 0; i < 7; i++) {
      const targetDay = (currentDay + i) % 7;
      if (bestDays.includes(targetDay)) {
        if (i === 0 && hour >= bestHourEnd) continue; // Already past window today
        daysToAdd = i;
        break;
      }
    }
    if (daysToAdd === 0 && !bestDays.includes(currentDay)) daysToAdd = (2 - currentDay + 7) % 7 || 7;

    const sendTime = new Date(now);
    sendTime.setDate(sendTime.getDate() + daysToAdd);
    sendTime.setHours(bestHourStart + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
    return sendTime;
  } else {
    // SMS: Mon-Fri 10am-5pm
    const bestHourStart = 10;
    const bestHourEnd = 17;

    if (currentDay >= 1 && currentDay <= 5 && hour >= bestHourStart && hour < bestHourEnd) {
      const sendTime = new Date(now);
      sendTime.setMinutes(sendTime.getMinutes() + Math.floor(Math.random() * 15));
      return sendTime;
    }

    let daysToAdd = 0;
    if (currentDay === 0) daysToAdd = 1; // Sunday → Monday
    else if (currentDay === 6) daysToAdd = 2; // Saturday → Monday
    else if (hour >= bestHourEnd) daysToAdd = currentDay === 5 ? 3 : 1; // After hours → next business day
    // else it's before business hours today, send later today

    const sendTime = new Date(now);
    sendTime.setDate(sendTime.getDate() + daysToAdd);
    sendTime.setHours(bestHourStart + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);
    return sendTime;
  }
}

/* ═══════════════════════════════════════════════════════
   DRIP CAMPAIGN BRANCHING
   ═══════════════════════════════════════════════════════ */

export type LeadBehavior = "opened" | "clicked" | "replied" | "no_engagement" | "objection" | "interested";

/**
 * Analyze a lead's behavior based on their interaction history
 */
export async function analyzeLeadBehavior(leadId: number): Promise<{
  behavior: LeadBehavior;
  engagementScore: number;
  lastInteraction?: Date;
  totalTouches: number;
  repliesReceived: number;
}> {
  const db = (await getDb())!;

  // Get all outreach sent to this lead
  const outreach = await db.select()
    .from(outreachSequences)
    .where(eq(outreachSequences.leadId, leadId));

  // Get all conversations
  const conversations = await db.select()
    .from(aiConversations)
    .where(eq(aiConversations.leadId, leadId));

  const sentMessages = outreach.filter(o => o.status === "sent");
  const inboundReplies = conversations.filter(c => c.direction === "inbound");
  const totalTouches = sentMessages.length;
  const repliesReceived = inboundReplies.length;

  // Determine behavior
  let behavior: LeadBehavior = "no_engagement";
  let engagementScore = 0;

  if (repliesReceived > 0) {
    const lastReply = inboundReplies[inboundReplies.length - 1];
    const content = (lastReply.content || "").toLowerCase();

    // Check for objections
    const objectionWords = ["not interested", "too expensive", "already have", "no thanks", "stop", "remove"];
    const interestWords = ["how much", "pricing", "interested", "tell me more", "sounds good", "when can"];

    if (objectionWords.some(w => content.includes(w))) {
      behavior = "objection";
      engagementScore = 20;
    } else if (interestWords.some(w => content.includes(w))) {
      behavior = "interested";
      engagementScore = 90;
    } else {
      behavior = "replied";
      engagementScore = 60;
    }
  } else if (totalTouches > 0) {
    // No replies — check if they at least opened/clicked (tracked via UTM)
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (lead) {
      const enrichment = (lead.enrichmentData || {}) as any;
      if (enrichment.linkClicked) {
        behavior = "clicked";
        engagementScore = 50;
      } else if (enrichment.emailOpened) {
        behavior = "opened";
        engagementScore = 30;
      }
    }
  }

  const lastInteraction = inboundReplies.length > 0
    ? inboundReplies[inboundReplies.length - 1].createdAt
    : sentMessages.length > 0
      ? sentMessages[sentMessages.length - 1].sentAt || undefined
      : undefined;

  return { behavior, engagementScore, lastInteraction: lastInteraction || undefined, totalTouches, repliesReceived };
}

/**
 * Get the next outreach step based on lead behavior (branching logic)
 */
export async function getBranchedNextStep(leadId: number): Promise<{
  channel: "email" | "sms";
  purpose: string;
  includeAudit: boolean;
  delay: number; // days
} | null> {
  const analysis = await analyzeLeadBehavior(leadId);
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) return null;

  // If lead is closed or assigned, stop
  if (["closed_won", "closed_lost", "assigned"].includes(lead.stage)) return null;

  switch (analysis.behavior) {
    case "interested":
      // Hot lead — push for close immediately via their preferred channel
      return { channel: "email", purpose: "send_pricing_and_close", includeAudit: false, delay: 0 };

    case "replied":
      // Engaged but not buying yet — send case study from their industry
      return { channel: "email", purpose: "industry_case_study", includeAudit: false, delay: 1 };

    case "clicked":
      // Clicked a link — they're researching. Send audit + pricing
      return { channel: "email", purpose: "audit_with_pricing", includeAudit: true, delay: 1 };

    case "opened":
      // Opened but didn't click — try a different angle
      return {
        channel: analysis.totalTouches % 2 === 0 ? "sms" : "email",
        purpose: "different_angle_value_prop",
        includeAudit: true,
        delay: 2,
      };

    case "objection":
      // Objected — handle the objection, then wait longer
      return { channel: "email", purpose: "handle_objection_with_social_proof", includeAudit: false, delay: 5 };

    case "no_engagement":
      // No engagement at all — try the other channel
      if (analysis.totalTouches >= 5) return null; // Give up after 5 attempts
      const lastChannel = analysis.totalTouches % 2 === 0 ? "email" : "sms";
      return {
        channel: lastChannel === "email" ? "sms" : "email",
        purpose: "channel_switch_intro",
        includeAudit: analysis.totalTouches === 0,
        delay: 3,
      };

    default:
      return null;
  }
}

/**
 * Schedule the next branched outreach step for a lead
 */
export async function scheduleBranchedOutreach(leadId: number): Promise<boolean> {
  const nextStep = await getBranchedNextStep(leadId);
  if (!nextStep) return false;

  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) return false;

  const enrichment = (lead.enrichmentData || {}) as EnrichmentResult & {
    websiteScore?: number;
    websiteIssues?: string[];
    scrapedBusinessId?: number;
  };

  // Get optimal send time
  const sendTime = getOptimalSendTime(nextStep.channel);
  if (nextStep.delay > 0) {
    sendTime.setDate(sendTime.getDate() + nextStep.delay);
  }

  // Generate the message
  try {
    const message = await generateOutreachMessage({
      businessName: lead.businessName,
      contactName: lead.contactName,
      industry: lead.industry || undefined,
      website: lead.website || undefined,
      websiteScore: enrichment.websiteScore,
      websiteIssues: enrichment.websiteIssues,
      painPoints: enrichment.painPoints,
      recommendedApproach: enrichment.recommendedApproach,
      dossier: enrichment.dossier,
      channel: nextStep.channel,
      purpose: nextStep.purpose,
    });

    // If including audit, generate and attach the URL
    let body = message.body;
    if (nextStep.includeAudit && enrichment.scrapedBusinessId) {
      try {
        const audit = await generateAuditReport(enrichment.scrapedBusinessId);
        if (audit.storageUrl) {
          body += nextStep.channel === "email"
            ? `\n\nWe also prepared a free website audit report for ${lead.businessName}: ${audit.storageUrl}`
            : `\nFree audit: ${audit.storageUrl}`;
        }
      } catch {
        // Audit generation failed, send without it
      }
    }

    await db.insert(outreachSequences).values({
      leadId,
      sequenceType: nextStep.purpose as any,
      stepNumber: 99, // Branched steps use 99 to differentiate
      scheduledAt: sendTime,
      channel: nextStep.channel,
      subject: message.subject,
      body,
      aiGenerated: true,
      status: "scheduled",
    });

    return true;
  } catch (err) {
    console.error(`[SmartOutreach] Failed to schedule branched step for lead ${leadId}:`, err);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════
   RE-ENGAGEMENT CAMPAIGNS
   ═══════════════════════════════════════════════════════ */

/**
 * Find cold leads that haven't been touched in 30+ days and re-engage them
 */
export async function runReengagementCampaign(): Promise<number> {
  const db = (await getDb())!;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Find cold leads with no recent activity
  const coldLeads = await db.select()
    .from(leads)
    .where(
      and(
        eq(leads.temperature, "cold"),
        ne(leads.stage, "closed_won"),
        ne(leads.stage, "closed_lost"),
        lte(leads.lastTouchAt, thirtyDaysAgo)
      )
    )
    .limit(20);

  let reengaged = 0;
  for (const lead of coldLeads) {
    try {
      const enrichment = (lead.enrichmentData || {}) as EnrichmentResult;

      // Generate a re-engagement message with new value
      const message = await generateOutreachMessage({
        businessName: lead.businessName,
        contactName: lead.contactName,
        industry: lead.industry || undefined,
        website: lead.website || undefined,
        painPoints: enrichment.painPoints,
        channel: "email",
        purpose: "re_engagement_new_value",
        previousMessages: ["(Previous outreach was sent 30+ days ago with no response)"],
      });

      const sendTime = getOptimalSendTime("email");

      await db.insert(outreachSequences).values({
        leadId: lead.id,
        sequenceType: "follow_up",
        stepNumber: 100, // Re-engagement uses 100
        scheduledAt: sendTime,
        channel: "email",
        subject: message.subject,
        body: message.body,
        aiGenerated: true,
        status: "scheduled",
      });

      // Reset temperature to give them another chance
      await db.update(leads).set({ temperature: "cold" }).where(eq(leads.id, lead.id));
      reengaged++;
    } catch (err) {
      console.error(`[SmartOutreach] Re-engagement failed for lead ${lead.id}:`, err);
    }
  }

  return reengaged;
}

/* ═══════════════════════════════════════════════════════
   INTENT SIGNAL TRACKING
   ═══════════════════════════════════════════════════════ */

/**
 * Record an intent signal for a lead (email open, link click, website visit)
 */
export async function recordIntentSignal(leadId: number, signal: {
  type: "email_open" | "link_click" | "website_visit" | "multi_open" | "audit_view";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) return;

  const enrichment = (lead.enrichmentData || {}) as any;
  const signals = enrichment.intentSignals || [];
  signals.push({
    type: signal.type,
    timestamp: new Date().toISOString(),
    metadata: signal.metadata,
  });

  // Update enrichment data with signal
  const updates: Record<string, unknown> = {
    enrichmentData: {
      ...enrichment,
      intentSignals: signals,
      emailOpened: enrichment.emailOpened || signal.type === "email_open",
      linkClicked: enrichment.linkClicked || signal.type === "link_click",
      websiteVisited: enrichment.websiteVisited || signal.type === "website_visit",
      auditViewed: enrichment.auditViewed || signal.type === "audit_view",
    },
  };

  // Auto-warm leads based on intent signals
  const strongSignals = ["link_click", "website_visit", "audit_view", "multi_open"];
  if (strongSignals.includes(signal.type) && lead.temperature === "cold") {
    updates.temperature = "warm";
  }

  // If multiple strong signals, make them hot
  const strongSignalCount = signals.filter((s: any) => strongSignals.includes(s.type)).length;
  if (strongSignalCount >= 2) {
    updates.temperature = "hot";
  }

  await db.update(leads).set(updates).where(eq(leads.id, leadId));

  // If lead just became hot, schedule immediate branched outreach
  if (updates.temperature === "hot" && lead.temperature !== "hot") {
    await scheduleBranchedOutreach(leadId);
  }
}

/**
 * Generate a UTM-tagged URL for tracking
 */
export function generateTrackingUrl(baseUrl: string, leadId: number, campaign: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", "minimorph");
  url.searchParams.set("utm_medium", "outreach");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", `lead_${leadId}`);
  return url.toString();
}
