/**
 * Lead Gen Conversation AI — Deep Personalization & Intelligent Warming
 * 
 * This is the brain of the AI-first lead warming system. It:
 * 1. Builds a deep understanding of each business before first contact
 * 2. Crafts hyper-personalized messages that reference specific business details
 * 3. Handles multi-turn conversations with memory and context
 * 4. Detects buying signals and objection patterns
 * 5. Decides when to self-close vs. hand to rep vs. escalate to owner
 * 6. Tracks conversation quality and learns from outcomes
 */

import { invokeLLM } from "../_core/llm";
import { getDb, getProductCatalog } from "../db";
import { leads, aiConversations, outreachSequences, reps, repServiceAreas, emailUnsubscribes } from "../../drizzle/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { sendSms } from "./sms";
import { sendEmail } from "./email";
import { ENV } from "../_core/env";
import type { EnrichmentResult } from "./leadGenEnrichment";

const TIER_KEY_MAP: Record<string, string> = { starter: "Starter", growth: "Growth", premium: "Pro", enterprise: "Enterprise" };

async function getPricingText(): Promise<string> {
  try {
    const catalog = await getProductCatalog();
    const lines = (catalog as any[])
      .filter((p: any) => p.category === "package" && p.active)
      .map((p: any) => {
        const base = parseFloat(p.basePrice);
        const disc = p.discountPercent ?? 0;
        const price = disc > 0 ? Math.round(base * (1 - disc / 100)) : base;
        const name = TIER_KEY_MAP[p.productKey] ?? p.productKey;
        return `${name} ($${price}/mo)`;
      });
    return lines.length ? lines.join(", ") : "Starter $195/mo, Growth $295/mo, Pro $395/mo, Enterprise $495/mo";
  } catch {
    return "Starter $195/mo, Growth $295/mo, Pro $395/mo, Enterprise $495/mo";
  }
}

async function getPackageLines(): Promise<string> {
  try {
    const catalog = await getProductCatalog();
    const packages: Record<string, number> = {};
    for (const p of catalog as any[]) {
      if (p.category === "package" && p.active) {
        const base = parseFloat(p.basePrice);
        const disc = p.discountPercent ?? 0;
        packages[p.productKey] = disc > 0 ? Math.round(base * (1 - disc / 100)) : base;
      }
    }
    const s = packages["starter"] ?? 195;
    const g = packages["growth"] ?? 295;
    const pr = packages["premium"] ?? 395;
    const e = packages["enterprise"] ?? 495;
    return [
      `- Starter ($${s}/mo): Professional 5-page website, mobile responsive, basic SEO`,
      `- Growth ($${g}/mo): Custom design, 10+ pages, advanced SEO, blog, analytics, priority support`,
      `- Pro ($${pr}/mo): Full custom build, 20+ pages, booking integration, SMS alerts, review widget, priority support`,
      `- Enterprise ($${e}/mo): Large ecommerce, custom portals, membership systems, multi-location, custom integrations`,
    ].join("\n");
  } catch {
    return [
      "- Starter ($195/mo): Professional 5-page website, mobile responsive, basic SEO",
      "- Growth ($295/mo): Custom design, 10+ pages, advanced SEO, blog, analytics, priority support",
      "- Pro ($395/mo): Full custom build, 20+ pages, booking integration, SMS alerts, review widget, priority support",
      "- Enterprise ($495/mo): Large ecommerce, custom portals, membership systems, multi-location, custom integrations",
    ].join("\n");
  }
}

// ─── Objection Library ───

const COMMON_OBJECTIONS: Record<string, {
  pattern: RegExp;
  category: string;
  suggestedApproach: string;
}> = {
  too_expensive: {
    pattern: /too (expensive|costly|much)|can'?t afford|budget|price is (high|too)|out of (my|our) (price|budget)/i,
    category: "price",
    suggestedApproach: "Acknowledge the concern, then reframe as ROI. Show how much revenue they're losing without a website. Offer flexible payment plans.",
  },
  already_have_website: {
    pattern: /already have|have a website|my (website|site) (is|works)|don'?t need/i,
    category: "status_quo",
    suggestedApproach: "Acknowledge their current site, then reference specific issues from the audit. Use competitor comparison if available.",
  },
  not_right_time: {
    pattern: /not (the right|a good) time|too busy|maybe later|call (me )?back|next (month|quarter|year)/i,
    category: "timing",
    suggestedApproach: "Respect the timing, offer to send a quick summary they can review when ready. Set a follow-up reminder.",
  },
  need_to_think: {
    pattern: /need to think|let me think|talk to (my|the) (partner|wife|husband|boss)|need to discuss/i,
    category: "authority",
    suggestedApproach: "Offer to send a one-pager they can share with the decision-maker. Ask what specific concerns they'd want addressed.",
  },
  diy_preference: {
    pattern: /do it myself|wix|squarespace|wordpress|godaddy|build (it|my own)|nephew|friend/i,
    category: "diy",
    suggestedApproach: "Acknowledge DIY is an option, then highlight the time cost and professional quality difference. Reference businesses in their industry with professional sites.",
  },
  bad_experience: {
    pattern: /bad experience|burned before|scam|waste of money|didn'?t work|last (guy|company|agency)/i,
    category: "trust",
    suggestedApproach: "Empathize with their experience. Offer references, case studies, or a small pilot project. Emphasize money-back guarantee if applicable.",
  },
  no_need: {
    pattern: /don'?t need|word of mouth|enough (customers|business)|doing fine|no need/i,
    category: "no_need",
    suggestedApproach: "Acknowledge their success, then show how a website amplifies word-of-mouth. Reference their Google reviews and how a site converts that traffic.",
  },
};

// ─── Buying Signal Patterns ───

const BUYING_SIGNALS: Record<string, {
  pattern: RegExp;
  strength: "weak" | "medium" | "strong";
  action: string;
}> = {
  pricing_inquiry: {
    pattern: /how much|what.*cost|pricing|price|rate|package|plan|quote/i,
    strength: "strong",
    action: "Send specific pricing with a time-limited offer",
  },
  timeline_question: {
    pattern: /how long|when.*ready|timeline|turnaround|how fast|how quickly/i,
    strength: "strong",
    action: "Give specific timeline and create urgency",
  },
  feature_question: {
    pattern: /can you|do you (offer|do|make)|what (features|about)|include|online (ordering|booking|store)/i,
    strength: "medium",
    action: "Answer specifically and tie features to their business needs",
  },
  comparison: {
    pattern: /compared to|vs|versus|different from|better than|why (should|would) I/i,
    strength: "medium",
    action: "Differentiate clearly and reference their specific situation",
  },
  positive_response: {
    pattern: /sounds good|interesting|tell me more|I('?m| am) interested|that('?s| is) (great|nice|cool)|love (it|that|this)/i,
    strength: "medium",
    action: "Advance the conversation toward a commitment",
  },
  ready_to_buy: {
    pattern: /let'?s (do it|go|start|get started)|sign (me )?up|I('?m| am) (ready|in)|where do I (sign|pay|start)|take my money/i,
    strength: "strong",
    action: "Close immediately — send checkout link",
  },
  referral_mention: {
    pattern: /friend|colleague|neighbor|someone I know|referred|recommendation/i,
    strength: "weak",
    action: "Acknowledge the referral warmly and offer a referral discount",
  },
};

// ─── Business Intelligence Builder ───

export interface BusinessIntelligence {
  businessName: string;
  contactName: string;
  industry: string;
  location: string;
  hasWebsite: boolean;
  websiteUrl?: string;
  websiteScore?: number;
  websiteIssues: string[];
  googleRating?: number;
  reviewCount?: number;
  reviewSentiment?: string;
  competitors: string[];
  painPoints: string[];
  opportunities: string[];
  recommendedPackage: string;
  estimatedRevenueLoss: string;
  personalizedHooks: string[];
  objectionPrep: Record<string, string>;
}

/**
 * Build deep business intelligence from all available data
 */
export async function buildBusinessIntelligence(leadId: number): Promise<BusinessIntelligence> {
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const enrichment = (lead.enrichmentData || {}) as EnrichmentResult & {
    websiteScore?: number;
    websiteIssues?: string[];
    competitors?: string[];
    googleRating?: number;
    reviewCount?: number;
  };

  const pricingText = await getPricingText();

  // Use AI to generate deep intelligence
  const prompt = `Analyze this business and generate sales intelligence for our web design agency.

BUSINESS DATA:
- Name: ${lead.businessName}
- Contact: ${lead.contactName}
- Industry: ${lead.industry || "Unknown"}
- Location: ${(lead.enrichmentData as any)?.location || "Unknown"}
- Website: ${lead.website || "NONE"}
- Website Score: ${enrichment.websiteScore ?? "N/A"}/100
- Website Issues: ${enrichment.websiteIssues?.join(", ") || "N/A"}
- Google Rating: ${enrichment.googleRating ?? "N/A"}/5
- Review Count: ${enrichment.reviewCount ?? "N/A"}
- Known Pain Points: ${enrichment.painPoints?.join("; ") || "None identified"}
- Competitors: ${enrichment.competitors?.join(", ") || "None identified"}
- Dossier: ${enrichment.dossier || "None"}

Generate detailed sales intelligence:
1. 3-5 personalized hooks (specific things to mention that show we know their business)
2. Estimated monthly revenue they're losing without a proper website (be specific to their industry)
3. Which of our packages would fit them best (${pricingText})
4. Pre-prepared responses to likely objections based on their industry and situation
5. 3 specific opportunities we can help with

Be specific and data-driven. Reference their actual business details.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a business intelligence analyst for a web design agency. Respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "business_intelligence",
        strict: true,
        schema: {
          type: "object",
          properties: {
            personalizedHooks: {
              type: "array",
              items: { type: "string" },
              description: "Specific things to mention that show we know their business",
            },
            estimatedRevenueLoss: {
              type: "string",
              description: "Estimated monthly revenue lost without proper website",
            },
            recommendedPackage: {
              type: "string",
              description: "Best package fit: Starter, Growth, or Premium",
            },
            objectionPrep: {
              type: "object",
              properties: {
                price: { type: "string" },
                timing: { type: "string" },
                diy: { type: "string" },
                trust: { type: "string" },
                no_need: { type: "string" },
              },
              required: ["price", "timing", "diy", "trust", "no_need"],
              additionalProperties: false,
            },
            opportunities: {
              type: "array",
              items: { type: "string" },
              description: "Specific opportunities we can help with",
            },
          },
          required: ["personalizedHooks", "estimatedRevenueLoss", "recommendedPackage", "objectionPrep", "opportunities"],
          additionalProperties: false,
        },
      },
    },
  });

  const aiContent = response.choices?.[0]?.message?.content as string | undefined;
  const aiIntel = aiContent ? JSON.parse(aiContent) : {
    personalizedHooks: [],
    estimatedRevenueLoss: "Unknown",
    recommendedPackage: "Growth",
    objectionPrep: {},
    opportunities: [],
  };

  return {
    businessName: lead.businessName,
    contactName: lead.contactName,
    industry: lead.industry || "Unknown",
    location: (lead.enrichmentData as any)?.location || "Unknown",
    hasWebsite: !!lead.website,
    websiteUrl: lead.website || undefined,
    websiteScore: enrichment.websiteScore,
    websiteIssues: enrichment.websiteIssues || [],
    googleRating: enrichment.googleRating,
    reviewCount: enrichment.reviewCount,
    competitors: enrichment.competitors || [],
    painPoints: enrichment.painPoints || [],
    opportunities: aiIntel.opportunities,
    recommendedPackage: aiIntel.recommendedPackage,
    estimatedRevenueLoss: aiIntel.estimatedRevenueLoss,
    personalizedHooks: aiIntel.personalizedHooks,
    objectionPrep: aiIntel.objectionPrep,
  };
}

// ─── Intelligent Conversation Handler ───

export interface ConversationResult {
  decision: string;
  response?: string;
  assignedToRepId?: number;
  assignedToOwner?: boolean;
  detectedObjection?: string;
  detectedBuyingSignal?: string;
  confidenceScore: number;
  shouldFollowUp: boolean;
  followUpDelay?: number; // hours
}

/**
 * Handle an inbound message with deep context and intelligence
 */
export async function handleConversation(params: {
  leadId: number;
  channel: "email" | "sms";
  content: string;
}): Promise<ConversationResult> {
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, params.leadId));
  if (!lead) throw new Error(`Lead ${params.leadId} not found`);

  // Log inbound message
  await db.insert(aiConversations).values({
    leadId: params.leadId,
    channel: params.channel,
    direction: "inbound",
    content: params.content,
  });

  // Opt-out guard — must run before any AI call
  const OPT_OUT_PATTERN = /\b(stop|unsubscribe|opt[\s-]?out|remove me|do not contact|take me off|no more (emails?|messages?|texts?))\b/i;
  if (OPT_OUT_PATTERN.test(params.content)) {
    await db.update(leads).set({
      stage: "closed_lost",
      temperature: "cold",
      emailOptedOut: true,
      lastTouchAt: new Date(),
    }).where(eq(leads.id, params.leadId));

    // Add to global email blocklist (idempotent)
    if (lead.email) {
      const normalizedEmail = lead.email.trim().toLowerCase();
      const alreadyUnsub = await db.select({ id: emailUnsubscribes.id })
        .from(emailUnsubscribes)
        .where(eq(emailUnsubscribes.email, normalizedEmail))
        .limit(1);
      if (alreadyUnsub.length === 0) {
        await db.insert(emailUnsubscribes).values({ email: normalizedEmail, source: "email_link" });
      }
    }

    // Cancel all pending outreach sequences for this lead
    await db.update(outreachSequences)
      .set({ status: "cancelled" })
      .where(and(eq(outreachSequences.leadId, params.leadId), eq(outreachSequences.status, "scheduled")));

    console.log(`[ConversationAI] Opt-out detected for lead ${params.leadId} — marked closed_lost, sequences cancelled, no AI called`);
    return {
      decision: "mark_not_interested",
      confidenceScore: 100,
      shouldFollowUp: false,
    };
  }

  // Detect objections
  const detectedObjection = detectObjection(params.content);

  // Detect buying signals
  const detectedSignal = detectBuyingSignal(params.content);

  // Get full conversation history
  const history = await db.select()
    .from(aiConversations)
    .where(eq(aiConversations.leadId, params.leadId))
    .orderBy(aiConversations.createdAt)
    .limit(30);

  const conversationHistory = history.map(h =>
    `${h.direction === "inbound" ? "LEAD" : "AI_AGENT"} (${h.channel}): ${h.content}`
  ).join("\n");

  // Build intelligence (use cached if available)
  const enrichment = (lead.enrichmentData || {}) as EnrichmentResult & {
    websiteScore?: number;
    websiteIssues?: string[];
    competitors?: string[];
  };

  const packageLines = await getPackageLines();
  const siteUrl = ENV.appUrl || "https://minimorphstudios.com";

  // Build the AI prompt with deep context
  const prompt = `You are Elena, MiniMorph Studios' website assistant. You're having a warm, genuine conversation with a potential customer.

YOUR PERSONALITY (Elena):
- Warm, direct, and genuinely invested in helping this person's business succeed
- Helpful and specific — not robotic, not scripted, not a generic salesperson
- You reference specific things about THEIR business to show you've done your homework
- You're confident but never pushy; you let the value speak for itself
- You use their first name naturally
- When they're clearly ready to move forward, you make it easy: "I'd love to get started on [businessName] right away. You can begin here: ${siteUrl}/get-started"
- If the lead directly asks whether Elena is AI, automated, a bot, or a real person, answer honestly: "Elena is MiniMorph's automated website assistant. I can help answer your questions, and I can connect you with a real rep if you'd rather talk to someone directly." Then offer the handoff.

BUSINESS INTELLIGENCE:
- Business: ${lead.businessName}
- Contact: ${lead.contactName}
- Industry: ${lead.industry || "Unknown"}
- Location: ${(lead.enrichmentData as any)?.location || "Unknown"}
- Website: ${lead.website || "NONE — they have no website at all"}
${enrichment.websiteScore !== undefined ? `- Website Score: ${enrichment.websiteScore}/100 (${enrichment.websiteScore < 30 ? "very poor" : enrichment.websiteScore < 50 ? "below average" : "needs improvement"})` : ""}
${enrichment.websiteIssues?.length ? `- Known Issues: ${enrichment.websiteIssues.join(", ")}` : ""}
${enrichment.painPoints?.length ? `- Pain Points: ${enrichment.painPoints.join("; ")}` : ""}
${enrichment.competitors?.length ? `- Their Competitors (who have better websites): ${enrichment.competitors.join(", ")}` : ""}
- Qualification Score: ${lead.qualificationScore}/100
- Temperature: ${lead.temperature}

CONVERSATION SO FAR:
${conversationHistory}

NEW MESSAGE FROM ${lead.contactName}:
"${params.content}"

${detectedObjection ? `DETECTED OBJECTION: "${detectedObjection.category}" — ${detectedObjection.suggestedApproach}` : ""}
${detectedSignal ? `DETECTED BUYING SIGNAL: "${detectedSignal.action}" (strength: ${detectedSignal.strength})` : ""}

OUR PACKAGES:
${packageLines}

DECISION RULES:
1. If they show STRONG buying intent → push_for_close (send checkout link)
2. If they have complex needs or want customization beyond our packages → assign_to_rep
3. If they mention wanting full AI automation, custom software, or enterprise needs → assign_to_owner
4. If they say "stop", "unsubscribe", "not interested" firmly → mark_not_interested
5. If they have an objection → handle it using the suggested approach, then try to advance
6. If they ask a question → answer helpfully and naturally advance toward a sale
7. If they're warm but not ready → continue_nurture with a specific follow-up plan

RESPONSE RULES:
- ${params.channel === "sms" ? "Keep SMS under 300 characters. Be concise but warm." : "Keep email to 3-4 short paragraphs max."}
- Reference something specific about their business
- Always include a clear next step or question
- Never be defensive about pricing — reframe as investment/ROI
- If recommending a package, explain WHY it fits their specific needs

Respond in JSON:
{
  "decision": "push_for_close|answer_question|handle_objection|send_info|schedule_call|assign_to_rep|assign_to_owner|mark_not_interested|continue_nurture",
  "confidence": 0-100,
  "reasoning": "brief explanation",
  "response": "your message to the lead (null if assigning)",
  "isEnterprise": true/false,
  "shouldFollowUp": true/false,
  "followUpHours": number or null,
  "recommendedPackage": "Starter|Growth|Premium|null",
  "temperatureChange": "hotter|same|colder"
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert conversational AI sales agent. You build genuine rapport while advancing toward a sale. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "conversation_decision",
        strict: true,
        schema: {
          type: "object",
          properties: {
            decision: { type: "string" },
            confidence: { type: "number" },
            reasoning: { type: "string" },
            response: { type: ["string", "null"] },
            isEnterprise: { type: "boolean" },
            shouldFollowUp: { type: "boolean" },
            followUpHours: { type: ["number", "null"] },
            recommendedPackage: { type: ["string", "null"] },
            temperatureChange: { type: "string" },
          },
          required: ["decision", "confidence", "reasoning", "response", "isEnterprise", "shouldFollowUp", "followUpHours", "recommendedPackage", "temperatureChange"],
          additionalProperties: false,
        },
      },
    },
  });

  const aiContent = response.choices?.[0]?.message?.content as string | undefined;
  if (!aiContent) throw new Error("Empty AI conversation response");

  const aiDecision = JSON.parse(aiContent);

  // Execute the decision
  const result: ConversationResult = {
    decision: aiDecision.decision,
    confidenceScore: aiDecision.confidence,
    detectedObjection: detectedObjection?.category,
    detectedBuyingSignal: detectedSignal?.action,
    shouldFollowUp: aiDecision.shouldFollowUp,
    followUpDelay: aiDecision.followUpHours,
  };

  // Update temperature
  const tempMap: Record<string, "cold" | "warm" | "hot"> = {
    hotter: "hot",
    same: lead.temperature as "cold" | "warm" | "hot",
    colder: "cold",
  };
  const newTemp = tempMap[aiDecision.temperatureChange] || (lead.temperature as "cold" | "warm" | "hot");

  // Handle each decision type
  switch (aiDecision.decision) {
    case "push_for_close": {
      const closeMsg = aiDecision.response || "Ready to get started? Here's your personalized link:";
      await sendResponse(params.channel, lead, closeMsg);
      result.response = closeMsg;
      await db.update(leads).set({
        temperature: "hot",
        stage: "negotiating",
        lastTouchAt: new Date(),
      }).where(eq(leads.id, params.leadId));
      break;
    }

    case "assign_to_rep": {
      const repId = await findBestRepForLead(params.leadId);
      if (repId) {
        await db.update(leads).set({
          assignedRepId: repId,
          stage: "assigned",
          temperature: newTemp,
          lastTouchAt: new Date(),
        }).where(eq(leads.id, params.leadId));
        result.assignedToRepId = repId;
      }
      break;
    }

    case "assign_to_owner": {
      await db.update(leads).set({
        temperature: "hot",
        stage: "assigned",
        lastTouchAt: new Date(),
      }).where(eq(leads.id, params.leadId));
      result.assignedToOwner = true;

      // SMS the owner directly
      const { ENV } = await import("../_core/env");
      if (ENV.ownerPhoneNumber) {
        try {
          await sendSms({
            to: ENV.ownerPhoneNumber,
            body: `🏢 Enterprise Lead!\n${lead.businessName}\n${lead.phone || lead.email || ""}\nLast msg: "${params.content.slice(0, 100)}"\nAI: ${aiDecision.reasoning || "High-value"}\n\nAssigned to you.`,
          });
        } catch (smsErr) {
          console.error("[ConversationAI] Failed to SMS owner:", smsErr);
        }
      }
      break;
    }

    case "mark_not_interested": {
      await db.update(leads).set({
        stage: "closed_lost",
        temperature: "cold",
        lastTouchAt: new Date(),
      }).where(eq(leads.id, params.leadId));
      // Send polite close
      if (aiDecision.response) {
        await sendResponse(params.channel, lead, aiDecision.response);
        result.response = aiDecision.response;
      }
      break;
    }

    default: {
      // answer_question, handle_objection, send_info, continue_nurture, schedule_call
      if (aiDecision.response) {
        await sendResponse(params.channel, lead, aiDecision.response);
        result.response = aiDecision.response;
      }
      await db.update(leads).set({
        temperature: newTemp,
        lastTouchAt: new Date(),
      }).where(eq(leads.id, params.leadId));
      break;
    }
  }

  // Schedule follow-up if needed
  if (aiDecision.shouldFollowUp && aiDecision.followUpHours) {
    const followUpAt = new Date();
    followUpAt.setHours(followUpAt.getHours() + aiDecision.followUpHours);
    await db.insert(outreachSequences).values({
      leadId: params.leadId,
      sequenceType: "follow_up",
      stepNumber: 99, // Follow-up step
      scheduledAt: followUpAt,
      channel: params.channel,
      body: `[AI_FOLLOW_UP] Generate a follow-up based on conversation context`,
      aiGenerated: true,
      status: "scheduled",
    });
  }

  // Log the AI decision
  await db.insert(aiConversations).values({
    leadId: params.leadId,
    channel: params.channel,
    direction: "outbound",
    content: aiDecision.response || `[Decision: ${aiDecision.decision}]`,
    aiDecision: aiDecision.decision,
    aiConfidence: aiDecision.confidence?.toString(),
    aiReasoning: aiDecision.reasoning,
    handedOffToRepId: result.assignedToRepId,
    handedOffToOwner: result.assignedToOwner || false,
  });

  return result;
}

// ─── Helper Functions ───

function detectObjection(text: string): { category: string; suggestedApproach: string } | null {
  for (const [, obj] of Object.entries(COMMON_OBJECTIONS)) {
    if (obj.pattern.test(text)) {
      return { category: obj.category, suggestedApproach: obj.suggestedApproach };
    }
  }
  return null;
}

function detectBuyingSignal(text: string): { strength: string; action: string } | null {
  let strongest: { strength: string; action: string } | null = null;
  const strengthOrder = { strong: 3, medium: 2, weak: 1 };

  for (const [, signal] of Object.entries(BUYING_SIGNALS)) {
    if (signal.pattern.test(text)) {
      if (!strongest || strengthOrder[signal.strength] > strengthOrder[strongest.strength as keyof typeof strengthOrder]) {
        strongest = { strength: signal.strength, action: signal.action };
      }
    }
  }
  return strongest;
}

async function sendResponse(
  channel: "email" | "sms",
  lead: { phone: string | null; email: string | null; businessName: string; smsFirstMessageSent: boolean | null; id: number },
  message: string
): Promise<void> {
  if (channel === "sms" && lead.phone) {
    const body = !lead.smsFirstMessageSent
      ? `${message}\n\nReply STOP to opt out.`
      : message;
    await sendSms({ to: lead.phone, body });
    if (!lead.smsFirstMessageSent) {
      const db = (await getDb())!;
      await db.update(leads).set({ smsFirstMessageSent: true }).where(eq(leads.id, lead.id));
    }
  } else if (lead.email) {
    await sendEmail({
      to: lead.email,
      subject: `Re: ${lead.businessName} - MiniMorph Studios`,
      html: `<div style="font-family: sans-serif; max-width: 600px;">${message.replace(/\n/g, "<br/>")}</div>`,
    });
  }
}

async function findBestRepForLead(leadId: number): Promise<number | null> {
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) return null;

  // Get all active reps
  const activeReps = await db.select().from(reps).where(inArray(reps.status, ["active", "certified"]));
  if (activeReps.length === 0) return null;

  // Get service areas for location matching
  const areas = await db.select().from(repServiceAreas);
  const repAreaMap = new Map<number, string[]>();
  for (const area of areas) {
    const existing = repAreaMap.get(area.repId) || [];
    existing.push(area.areaName.toLowerCase());
    repAreaMap.set(area.repId, existing);
  }

  // Get lead counts per rep
  const repLoads = await db.select({
    repId: leads.assignedRepId,
    count: sql<number>`count(*)`,
  })
    .from(leads)
    .where(
      and(
        sql`${leads.assignedRepId} IS NOT NULL`,
        sql`${leads.stage} NOT IN ('closed_won', 'closed_lost')`
      )
    )
    .groupBy(leads.assignedRepId);

  const loadMap = new Map(repLoads.map(r => [r.repId, Number(r.count)]));

  // Score reps: location match + low load + performance
  let bestRep = activeReps[0];
  let bestScore = -1;

  for (const rep of activeReps) {
    let score = 100;

    // Location match bonus
    const repCities = repAreaMap.get(rep.id) || [];
    const leadLocation = ((lead.enrichmentData as any)?.location || "").toLowerCase();
    if (leadLocation && repCities.some(c => leadLocation.includes(c))) {
      score += 50;
    }

    // Lower load = higher score
    const load = loadMap.get(rep.id) || 0;
    score -= load * 5;

    // Performance bonus (total deals closed)
    score += (rep.totalDeals || 0) * 2;

    if (score > bestScore) {
      bestScore = score;
      bestRep = rep;
    }
  }

  return bestRep.id;
}

// ─── Exports for Objection & Signal Detection (for testing) ───

export { detectObjection, detectBuyingSignal, COMMON_OBJECTIONS, BUYING_SIGNALS };
