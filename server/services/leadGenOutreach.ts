/**
 * Lead Generation AI Outreach Agent
 * 
 * Generates personalized outreach messages, handles inbound replies autonomously,
 * and decides whether to self-close, hand to rep, or escalate to owner.
 */

import { invokeLLM } from "../_core/llm";
import { getDb, createRepNotification } from "../db";
import { leads, outreachSequences, aiConversations, reps, repServiceAreas } from "../../drizzle/schema";
import { eq, and, lte, isNull, desc, sql, inArray } from "drizzle-orm";
import { sendSms } from "./sms";
import { sendEmail } from "./email";
import { ENV } from "../_core/env";
import type { EnrichmentResult } from "./leadGenEnrichment";
import { recordCost, calculateAiCost, COSTS } from "./costTracker";

// Outreach sequence templates (day offsets from lead creation)
// Email-first strategy: cold SMS is blocked by US carriers without opt-in.
// SMS is ONLY sent after explicit opt-in (verbal consent on a call, form, etc.).
export const OUTREACH_SCHEDULE = [
  { day: 0, channel: "email" as const, type: "cold_email" as const, purpose: "intro" },
  { day: 3, channel: "email" as const, type: "warm_email" as const, purpose: "value_add" },
  { day: 7, channel: "rep_call_reminder" as const, type: "call_reminder" as const, purpose: "rep_call_reminder" },
  { day: 10, channel: "email" as const, type: "follow_up" as const, purpose: "case_study" },
  { day: 14, channel: "email" as const, type: "follow_up" as const, purpose: "final_follow_up" },
];

/**
 * Generate a personalized outreach message using AI
 */
export async function generateOutreachMessage(params: {
  businessName: string;
  contactName: string;
  industry?: string;
  website?: string;
  websiteScore?: number;
  websiteIssues?: string[];
  painPoints?: string[];
  recommendedApproach?: string;
  dossier?: string;
  channel: "email" | "sms";
  purpose: string;
  previousMessages?: string[];
}): Promise<{ subject?: string; body: string }> {
  const isSms = params.channel === "sms";
  const maxLength = isSms ? 300 : 1500;

  const prompt = `You are Elena Brooks, a team member at MiniMorph Studios (a web design agency).
Generate a ${params.channel === "sms" ? "short SMS" : "professional email"} reaching out to a local business owner.

BUSINESS: ${params.businessName}
CONTACT: ${params.contactName}
INDUSTRY: ${params.industry || "Unknown"}
CURRENT WEBSITE: ${params.website || "NONE — they have no website"}
${params.websiteScore !== undefined ? `WEBSITE SCORE: ${params.websiteScore}/100` : ""}
${params.websiteIssues?.length ? `WEBSITE ISSUES: ${params.websiteIssues.join(", ")}` : ""}
${params.painPoints?.length ? `PAIN POINTS: ${params.painPoints.join("; ")}` : ""}
${params.recommendedApproach ? `APPROACH: ${params.recommendedApproach}` : ""}

OUTREACH STEP: ${params.purpose}
${params.previousMessages?.length ? `PREVIOUS MESSAGES SENT:\n${params.previousMessages.join("\n---\n")}` : "First contact"}

ELENA'S VOICE:
- Warm, direct, genuinely helpful — not pushy or salesy
- Sounds like a real person who actually looked at their business
- References specific things about THEIR business (reviews, industry, location, website issues)
- ${!params.website ? "Emphasizes the real customers they're missing by not having a website" : "Points out specific issues with their current website and what it's costing them"}
- Never sounds like a template — this feels personal
- Sign off as "Elena" (just first name, from MiniMorph Studios)
- ${isSms ? "Under 300 characters. No fluff." : "3-4 short paragraphs max. One clear ask."}

Respond in JSON:
{
  ${!isSms ? '"subject": "email subject line",' : ""}
  "body": "the message content"
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a skilled sales copywriter. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "outreach_message",
        strict: true,
        schema: {
          type: "object",
          properties: {
            subject: { type: ["string", "null"] },
            body: { type: "string" },
          },
          required: ["subject", "body"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices?.[0]?.message?.content as string | undefined;
  if (!content) throw new Error("Empty LLM response for outreach");

  if (response.usage) {
    recordCost({
      costType: "ai_generation",
      amountCents: calculateAiCost(response.usage.prompt_tokens, response.usage.completion_tokens),
      tokensUsed: response.usage.total_tokens,
      description: `AI outreach message generation - ${params.purpose}`,
    });
  }

  const parsed = JSON.parse(content);
  // Truncate if too long
  if (parsed.body.length > maxLength) {
    parsed.body = parsed.body.substring(0, maxLength - 3) + "...";
  }
  return parsed;
}

/**
 * Schedule the full outreach sequence for a lead
 */
export async function scheduleOutreachSequence(leadId: number): Promise<number> {
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const enrichment = (lead.enrichmentData || {}) as EnrichmentResult & {
    websiteScore?: number;
    websiteIssues?: string[];
  };

  let scheduled = 0;
  for (const step of OUTREACH_SCHEDULE) {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + step.day);
    scheduledAt.setHours(10, 0, 0, 0); // Send at 10 AM

    try {
      if (step.channel === "rep_call_reminder") {
        // Schedule a rep call reminder — no AI message generation needed
        await db.insert(outreachSequences).values({
          leadId,
          sequenceType: step.type,
          stepNumber: step.day,
          scheduledAt,
          channel: step.channel,
          subject: `Call reminder: ${lead.businessName}`,
          body: `Reminder to call ${lead.contactName} at ${lead.businessName}. Phone: ${lead.phone || "N/A"}. They received 2 emails already — a call can help move them forward and is a chance to get SMS opt-in consent.`,
          aiGenerated: false,
          status: "scheduled",
        });
        scheduled++;
      } else {
        // Generate the email message via AI
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
          channel: "email",
          purpose: step.purpose,
        });

        await db.insert(outreachSequences).values({
          leadId,
          sequenceType: step.type,
          stepNumber: step.day,
          scheduledAt,
          channel: step.channel,
          subject: message.subject,
          body: message.body,
          aiGenerated: true,
          status: "scheduled",
        });
        scheduled++;
      }
    } catch (err) {
      console.error(`[Outreach] Failed to generate step ${step.purpose} for lead ${leadId}:`, err);
    }
  }

  // Update lead stage to warming
  await db.update(leads).set({ stage: "warming" }).where(eq(leads.id, leadId));

  return scheduled;
}

/**
 * Send all due outreach messages
 */
export async function sendDueOutreach(): Promise<number> {
  const db = (await getDb())!;
  const now = new Date();

  // Part 10: TCPA time-of-day gate (8am–9pm local; use system settings for configurable hours)
  const currentHour = now.getHours();
  try {
    const { systemSettings } = await import("../../drizzle/schema");
    const { eq: eqFn } = await import("drizzle-orm");
    const [startRow] = await db.select({ v: systemSettings.settingValue }).from(systemSettings).where(eqFn(systemSettings.settingKey, "outreach_start_hour")).limit(1);
    const [endRow] = await db.select({ v: systemSettings.settingValue }).from(systemSettings).where(eqFn(systemSettings.settingKey, "outreach_end_hour")).limit(1);
    const startHour = parseInt(startRow?.v ?? "8", 10);
    const endHour = parseInt(endRow?.v ?? "21", 10);
    if (currentHour < startHour || currentHour >= endHour) {
      console.log(`[Outreach] TCPA gate: current hour ${currentHour} outside window ${startHour}–${endHour}. Skipping.`);
      return 0;
    }
  } catch {
    // If settings unavailable, use hardcoded safe hours
    if (currentHour < 8 || currentHour >= 21) return 0;
  }

  const due = await db.select()
    .from(outreachSequences)
    .where(
      and(
        eq(outreachSequences.status, "scheduled"),
        lte(outreachSequences.scheduledAt, now)
      )
    )
    .limit(50);

  let sent = 0;
  for (const seq of due) {
    try {
      const [lead] = await db.select().from(leads).where(eq(leads.id, seq.leadId));
      if (!lead) continue;

      // Block SMS if lead has opted out OR has not opted in
      if (seq.channel === "sms" && (lead.smsOptedOut || !lead.smsOptIn)) {
        await db.update(outreachSequences)
          .set({ status: "cancelled" })
          .where(eq(outreachSequences.id, seq.id));
        continue;
      }

      // Check if lead already replied (stop sequence)
      const hasReplied = await db.select()
        .from(aiConversations)
        .where(
          and(
            eq(aiConversations.leadId, seq.leadId),
            eq(aiConversations.direction, "inbound")
          )
        )
        .limit(1);

      if (hasReplied.length > 0) {
        // Cancel remaining sequence — lead is engaged
        await db.update(outreachSequences)
          .set({ status: "cancelled" })
          .where(
            and(
              eq(outreachSequences.leadId, seq.leadId),
              eq(outreachSequences.status, "scheduled")
            )
          );
        continue;
      }

      if (seq.channel === "rep_call_reminder") {
        // Create a notification for the assigned rep (or all active reps)
        const targetRepId = lead.assignedRepId;
        if (targetRepId) {
          await createRepNotification({
            repId: targetRepId,
            type: "lead_assigned",
            title: "Call Reminder",
            message: seq.body || `Time to call ${lead.contactName} at ${lead.businessName}.`,
            metadata: { leadId: lead.id, businessName: lead.businessName, phone: lead.phone },
          });
        }
        // Mark as sent
        await db.update(outreachSequences)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(outreachSequences.id, seq.id));
      } else if (seq.channel === "sms" && lead.phone && lead.smsOptIn) {
        // Send SMS — only if lead has explicitly opted in
        const body = seq.body || "";
        const smsBody = !lead.smsFirstMessageSent
          ? `${body}\n\nReply STOP to opt out.`
          : body;

        await sendSms({ to: lead.phone, body: smsBody });
        recordCost({ costType: "outreach_sms", amountCents: COSTS.TWILIO_SMS, leadId: seq.leadId, description: `Outreach SMS - step ${seq.stepNumber}` });

        if (!lead.smsFirstMessageSent) {
          await db.update(leads)
            .set({ smsFirstMessageSent: true })
            .where(eq(leads.id, lead.id));
        }

        // Mark as sent + log
        await db.update(outreachSequences)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(outreachSequences.id, seq.id));
        await db.update(leads).set({ lastTouchAt: new Date() }).where(eq(leads.id, seq.leadId));
        await db.insert(aiConversations).values({
          leadId: seq.leadId,
          channel: "sms",
          direction: "outbound",
          content: seq.body || "",
        });
      } else if (seq.channel === "email" && lead.email && (lead as any).emailVerified && !lead.emailOptedOut) {
        // Send email — only to verified addresses
        await sendEmail({
          to: lead.email,
          subject: seq.subject || "A quick note from MiniMorph Studios",
          html: `<div style="font-family: sans-serif; max-width: 600px;">
            <p>${(seq.body || "").replace(/\n/g, "<br/>")}</p>
          </div>`,
        });
        recordCost({ costType: "outreach_email", amountCents: COSTS.RESEND_EMAIL, leadId: seq.leadId, description: `Outreach email - step ${seq.stepNumber}` });

        // Mark as sent + log
        await db.update(outreachSequences)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(outreachSequences.id, seq.id));
        await db.update(leads).set({ lastTouchAt: new Date() }).where(eq(leads.id, seq.leadId));
        await db.insert(aiConversations).values({
          leadId: seq.leadId,
          channel: "email",
          direction: "outbound",
          content: seq.body || "",
        });
      }

      sent++;
    } catch (err) {
      console.error(`[Outreach] Failed to send sequence ${seq.id}:`, err);
    }

    await new Promise(r => setTimeout(r, 500)); // Rate limit
  }

  return sent;
}

/**
 * Handle an inbound reply from a lead (SMS or email)
 * AI decides what to do next: answer, push for close, or hand to rep
 */
export async function handleInboundReply(params: {
  leadId: number;
  channel: "email" | "sms";
  content: string;
  fromPhone?: string;
  fromEmail?: string;
}): Promise<{
  decision: string;
  response?: string;
  assignedToRepId?: number;
  assignedToOwner?: boolean;
}> {
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, params.leadId));
  if (!lead) throw new Error(`Lead ${params.leadId} not found`);

  // Get conversation history
  const history = await db.select()
    .from(aiConversations)
    .where(eq(aiConversations.leadId, params.leadId))
    .orderBy(aiConversations.createdAt)
    .limit(20);

  const enrichment = (lead.enrichmentData || {}) as EnrichmentResult;

  // Log the inbound message
  await db.insert(aiConversations).values({
    leadId: params.leadId,
    channel: params.channel,
    direction: "inbound",
    content: params.content,
  });

  // AI decision
  const conversationContext = history.map(h =>
    `${h.direction === "inbound" ? "LEAD" : "US"} (${h.channel}): ${h.content}`
  ).join("\n");

  const prompt = `You are an AI sales agent for MiniMorph Studios. A lead has replied to our outreach.
Analyze the reply and decide the best next action.

LEAD INFO:
- Business: ${lead.businessName}
- Contact: ${lead.contactName}
- Industry: ${lead.industry || "Unknown"}
- Current Website: ${lead.website || "None"}
- Qualification Score: ${lead.qualificationScore}/100
- Temperature: ${lead.temperature}

CONVERSATION HISTORY:
${conversationContext}

NEW REPLY FROM LEAD:
"${params.content}"

AVAILABLE ACTIONS:
1. "answer_question" - Lead asked a question, answer it helpfully
2. "send_info" - Lead wants more info, send pricing/portfolio details
3. "push_for_close" - Lead shows buying intent, try to close (send them to our website to purchase)
4. "schedule_call" - Lead wants to talk, suggest scheduling a call
5. "assign_to_rep" - Lead needs human touch, hand off to a sales rep
6. "assign_to_owner" - This is a big enterprise deal, send to the owner
7. "mark_not_interested" - Lead clearly not interested
8. "continue_nurture" - Keep them warm, send another touchpoint later

DECISION CRITERIA:
- If they show clear buying intent ("how much", "what packages", "interested"), push_for_close
- If they ask complex questions or want customization, assign_to_rep
- If they mention wanting full automation, AI agents, or enterprise needs, assign_to_owner
- If they say "not interested", "stop", "unsubscribe", mark_not_interested
- If they ask simple questions, answer them directly
- Default to being helpful and moving toward a sale

Respond in JSON:
{
  "decision": "one of the action names above",
  "confidence": 0-100,
  "reasoning": "why you chose this action",
  "response": "the message to send back to the lead (null if assigning to someone)",
  "isEnterprise": true/false
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert AI sales agent. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ai_decision",
        strict: true,
        schema: {
          type: "object",
          properties: {
            decision: { type: "string" },
            confidence: { type: "number" },
            reasoning: { type: "string" },
            response: { type: ["string", "null"] },
            isEnterprise: { type: "boolean" },
          },
          required: ["decision", "confidence", "reasoning", "response", "isEnterprise"],
          additionalProperties: false,
        },
      },
    },
  });

  const aiContent = response.choices?.[0]?.message?.content as string | undefined;
  if (!aiContent) throw new Error("Empty AI decision");

  const aiDecision = JSON.parse(aiContent);

  // Execute the decision
  const result: {
    decision: string;
    response?: string;
    assignedToRepId?: number;
    assignedToOwner?: boolean;
  } = { decision: aiDecision.decision };

  // Update lead temperature based on engagement
  let newTemp: "cold" | "warm" | "hot" = lead.temperature as "cold" | "warm" | "hot";
  if (["push_for_close", "send_info", "schedule_call"].includes(aiDecision.decision)) {
    newTemp = "hot";
  } else if (["answer_question", "continue_nurture"].includes(aiDecision.decision)) {
    newTemp = "warm";
  }

  if (aiDecision.decision === "push_for_close" && aiDecision.response) {
    // Self-close: send personalized checkout link
    const siteUrl = ENV.appUrl || "https://minimorphstudios.com";
    const checkoutUrl = `${siteUrl}/get-started?leadId=${params.leadId}&source=ai_close`;
    const closeMessage = aiDecision.response + `\n\nGet started here: ${checkoutUrl}`;
    if (params.channel === "sms" && lead.phone) {
      await sendSms({ to: lead.phone, body: closeMessage });
    } else if (lead.email && (lead as any).emailVerified) {
      await sendEmail({
        to: lead.email,
        subject: "Ready to get started? Here's your link",
        html: `<div style="font-family: sans-serif;">${closeMessage.replace(/\n/g, "<br/>")}</div>`,
      });
    }
    result.response = closeMessage;
    await db.update(leads).set({
      temperature: "hot",
      stage: "negotiating",
      lastTouchAt: new Date(),
      checkoutUrl,
      checkoutSentAt: new Date(),
      elenaHandoffAt: new Date(),
    } as any).where(eq(leads.id, params.leadId));

  } else if (aiDecision.decision === "assign_to_rep") {
    // Find the nearest available rep
    const repId = await findBestRepForLead(params.leadId);
    if (repId) {
      await db.update(leads).set({
        assignedRepId: repId,
        stage: "assigned",
        temperature: newTemp,
        lastTouchAt: new Date(),
      }).where(eq(leads.id, params.leadId));
      result.assignedToRepId = repId;
      // Notify the rep about the hot lead handoff
      try {
        await createRepNotification({
          repId,
          type: "lead_assigned",
          title: "New Hot Lead",
          message: `AI detected buying intent from ${lead.businessName || "a prospect"}. This lead has been assigned to you for personal follow-up.`,
          metadata: { leadId: params.leadId, businessName: lead.businessName, source: "ai_handoff" },
        });
      } catch (notifErr) {
        console.error("[Outreach] Failed to create rep notification for AI handoff:", notifErr);
      }
    }

  } else if (aiDecision.decision === "assign_to_owner" || aiDecision.isEnterprise) {
    // Enterprise lead — send to owner
    await db.update(leads).set({
      temperature: "hot",
      stage: "assigned",
      lastTouchAt: new Date(),
    }).where(eq(leads.id, params.leadId));
    result.assignedToOwner = true;

    // SMS the owner directly
    if (ENV.ownerPhoneNumber) {
      try {
        await sendSms({
          to: ENV.ownerPhoneNumber,
          body: `🏢 Enterprise Lead Alert!\n${lead.businessName}\n${lead.phone || lead.email || ""}\nAI: ${aiDecision.reasoning || "High-value prospect"}\n\nThis lead has been assigned to you.`,
        });
      } catch (smsErr) {
        console.error("[Outreach] Failed to SMS owner:", smsErr);
      }
    }

  } else if (aiDecision.decision === "mark_not_interested") {
    await db.update(leads).set({
      stage: "closed_lost",
      temperature: "cold",
      lastTouchAt: new Date(),
    }).where(eq(leads.id, params.leadId));

  } else if (aiDecision.response) {
    // Send the AI response
    if (params.channel === "sms" && lead.phone) {
      await sendSms({ to: lead.phone, body: aiDecision.response });
    } else if (lead.email) {
      await sendEmail({
        to: lead.email,
        subject: `Re: ${lead.businessName} - MiniMorph Studios`,
        html: `<div style="font-family: sans-serif;">${aiDecision.response.replace(/\n/g, "<br/>")}</div>`,
      });
    }
    result.response = aiDecision.response;
    await db.update(leads).set({ temperature: newTemp, lastTouchAt: new Date() }).where(eq(leads.id, params.leadId));
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

/**
 * Find the best rep for a lead based on location and capacity
 */
async function findBestRepForLead(leadId: number): Promise<number | null> {
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) return null;

  // Get all active reps with their service areas and current load
  const activeReps = await db.select()
    .from(reps)
    .where(inArray(reps.status, ["active", "certified"]));

  if (activeReps.length === 0) return null;

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

  // Find the rep with the lowest load
  let bestRep = activeReps[0];
  let bestLoad = loadMap.get(bestRep.id) || 0;

  for (const rep of activeReps) {
    const load = loadMap.get(rep.id) || 0;
    if (load < bestLoad) {
      bestRep = rep;
      bestLoad = load;
    }
  }

  return bestRep.id;
}
