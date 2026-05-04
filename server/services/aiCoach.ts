import * as db from "../db";
import { eq } from "drizzle-orm";

/**
 * AI Communication Coach — reviews every email, SMS, and call
 * and provides actionable feedback to the rep.
 */

interface CoachingInput {
  repId: number;
  communicationType: "email" | "sms" | "call";
  referenceId: number;
  content: string; // The actual email body, SMS text, or call transcription
  context?: string; // Additional context (lead info, purpose, etc.)
}

interface CoachingResult {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  toneAnalysis: string;
  sentimentScore: number;
  keyTakeaways: string[];
  suggestedFollowUp: string;
  laerScore: number;
  laerBreakdown: { listen: number; acknowledge: number; explore: number; respond: number };
  promotableToAcademy: boolean;
  promotionReason: string;
}

/**
 * Analyze a communication and generate coaching feedback.
 * Runs asynchronously after the communication is sent/completed.
 */
export async function analyzeAndCoach(input: CoachingInput): Promise<void> {
  try {
    const { invokeLLM } = await import("../_core/llm");

    const channelLabel = input.communicationType === "call" ? "phone call transcription" : input.communicationType;

    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert sales communication coach for MiniMorph Studios, a web design agency.
You analyze ${channelLabel}s between sales reps and leads/customers using the LAER framework (Listen, Acknowledge, Explore, Respond).

Your job is to:
1. Score the communication 1-100 based on professionalism, persuasiveness, clarity, and rapport-building
2. Identify 2-4 specific strengths (what the rep did well)
3. Identify 2-4 specific improvements (what could be better, with concrete suggestions)
4. Provide detailed feedback in 2-3 paragraphs
5. Analyze the tone (professional, friendly, aggressive, passive, confident, uncertain)
6. Score sentiment (-100 to 100, where positive = warm/engaging, negative = cold/pushy)
7. Extract 2-3 key takeaways that could help other reps
8. Suggest a specific follow-up action
9. LAER framework scoring (each 0-100):
   - Listen: Did the rep listen / read carefully and respond to what was actually said?
   - Acknowledge: Did the rep validate the prospect's concerns or situation?
   - Explore: Did the rep ask good questions to understand the root need?
   - Respond: Did the rep provide a relevant, tailored response vs. a generic pitch?
10. promotableToAcademy: true ONLY if this communication is an exceptional (score >= 85) or a notably bad (score <= 30) example that would provide clear educational value to ALL reps. Include a one-sentence promotionReason explaining why.

Be constructive, specific, and actionable. Reference exact phrases when possible.
For ${channelLabel}s, consider: response time expectations, appropriate length, personalization, clear CTA, professional sign-off.`,
        },
        {
          role: "user",
          content: `Analyze this ${channelLabel}:\n\n${input.context ? `Context: ${input.context}\n\n` : ""}Content:\n${input.content}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "coaching_feedback",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallScore: { type: "integer", description: "Score 1-100" },
              strengths: { type: "array", items: { type: "string" }, description: "2-4 specific strengths" },
              improvements: { type: "array", items: { type: "string" }, description: "2-4 specific improvements" },
              detailedFeedback: { type: "string", description: "2-3 paragraph detailed feedback in markdown" },
              toneAnalysis: { type: "string", enum: ["professional", "friendly", "aggressive", "passive", "confident", "uncertain"] },
              sentimentScore: { type: "integer", description: "Sentiment -100 to 100" },
              keyTakeaways: { type: "array", items: { type: "string" }, description: "2-3 key takeaways" },
              suggestedFollowUp: { type: "string", description: "Specific follow-up action" },
              laerScore: { type: "integer", description: "Overall LAER composite score 0-100" },
              laerBreakdown: {
                type: "object",
                properties: {
                  listen: { type: "integer" },
                  acknowledge: { type: "integer" },
                  explore: { type: "integer" },
                  respond: { type: "integer" },
                },
                required: ["listen", "acknowledge", "explore", "respond"],
                additionalProperties: false,
              },
              promotableToAcademy: { type: "boolean", description: "True if this is an exceptional positive or negative teaching example" },
              promotionReason: { type: "string", description: "One sentence explaining why this is promotable (or empty string if not)" },
            },
            required: ["overallScore", "strengths", "improvements", "detailedFeedback", "toneAnalysis", "sentimentScore", "keyTakeaways", "suggestedFollowUp", "laerScore", "laerBreakdown", "promotableToAcademy", "promotionReason"],
            additionalProperties: false,
          },
        },
      },
    });

    const feedback: CoachingResult = JSON.parse(result.choices[0].message.content as string);

    // Save to database
    await db.createCoachingFeedback({
      repId: input.repId,
      communicationType: input.communicationType,
      referenceId: input.referenceId,
      overallScore: feedback.overallScore,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
      detailedFeedback: feedback.detailedFeedback,
      toneAnalysis: feedback.toneAnalysis as any,
      sentimentScore: feedback.sentimentScore,
      keyTakeaways: [...feedback.keyTakeaways, `LAER: ${feedback.laerScore}/100`] as any,
      suggestedFollowUp: feedback.suggestedFollowUp,
      promotableToAcademy: feedback.promotableToAcademy,
      promotionReason: feedback.promotionReason || null,
    });

    // Notify rep that coaching feedback is ready
    const channelName = input.communicationType === "call" ? "call" : input.communicationType;
    await db.createRepNotification({
      repId: input.repId,
      type: "training_reminder",
      title: "Your coaching feedback is ready",
      message: `We reviewed your ${channelName}. Score: ${feedback.overallScore}/100. LAER: ${feedback.laerScore}/100. Check the AI Coach tab for details.`,
      metadata: { score: feedback.overallScore, laerScore: feedback.laerScore, communicationType: input.communicationType },
    });

    // Feed insights into the training system
    await extractTrainingInsights(input.repId, input.communicationType, feedback);

    // Generate personalized coaching reviews (micro-lessons) for the rep's daily queue
    try {
      const { generateCoachingReview } = await import("./academyGatekeeper");
      // Get the last inserted feedback ID
      const { getDb: getDbFn } = await import("../db");
      const dbConn = await getDbFn();
      if (dbConn) {
        const { aiCoachingFeedback: fbTable } = await import("../../drizzle/schema");
        const { desc: descFn, eq: eqFn } = await import("drizzle-orm");
        const lastFb = await dbConn.select().from(fbTable)
          .where(eqFn(fbTable.repId, input.repId))
          .orderBy(descFn(fbTable.id)).limit(1);
        if (lastFb.length > 0) {
          const result = await generateCoachingReview(lastFb[0].id, input.repId);
          console.log(`[AI Coach] Generated ${result.reviewsCreated} coaching reviews for rep #${input.repId}`);
        }
      }
    } catch (reviewErr) {
      console.error("[AI Coach] Failed to generate coaching reviews:", reviewErr);
    }

    console.log(`[AI Coach] Analyzed ${input.communicationType} #${input.referenceId} for rep #${input.repId}: score ${feedback.overallScore}`);

    // Push notification for coaching feedback
    try {
      const { notifyCoachingFeedback } = await import("./pushNotification");
      await notifyCoachingFeedback(input.repId, input.communicationType);
    } catch (pushErr) {
      console.error("[AI Coach] Push notification failed:", pushErr);
    }
  } catch (err) {
    console.error("[AI Coach] Failed to analyze communication:", err);
    // Non-blocking — don't fail the main operation
  }
}

/**
 * Extract patterns from coaching feedback and update training insights.
 */
async function extractTrainingInsights(
  repId: number,
  communicationType: "email" | "sms" | "call",
  feedback: CoachingResult
): Promise<void> {
  try {
    // Process strengths as best practices
    for (const strength of feedback.strengths) {
      const existing = await db.getTrainingInsightByTitle(strength);
      if (existing) {
        await db.updateTrainingInsight(existing.id, {
          frequency: existing.frequency + 1,
          lastSeenAt: new Date(),
          exampleSnippets: [
            ...((existing.exampleSnippets as any[]) || []).slice(-9),
            { repId, communicationType, snippet: strength, score: feedback.overallScore },
          ],
        });
      } else {
        await db.createTrainingInsight({
          category: "best_practice",
          title: strength,
          description: `Observed in ${communicationType} communication. ${feedback.detailedFeedback.slice(0, 200)}...`,
          frequency: 1,
          communicationType: communicationType as any,
          exampleSnippets: [{ repId, communicationType, snippet: strength, score: feedback.overallScore }],
        });
      }
    }

    // Process improvements as common mistakes
    for (const improvement of feedback.improvements) {
      const existing = await db.getTrainingInsightByTitle(improvement);
      if (existing) {
        await db.updateTrainingInsight(existing.id, {
          frequency: existing.frequency + 1,
          lastSeenAt: new Date(),
          exampleSnippets: [
            ...((existing.exampleSnippets as any[]) || []).slice(-9),
            { repId, communicationType, snippet: improvement, score: feedback.overallScore },
          ],
        });
      } else {
        await db.createTrainingInsight({
          category: "common_mistake",
          title: improvement,
          description: `Area for improvement in ${communicationType} communication. Suggested fix: ${improvement}`,
          frequency: 1,
          communicationType: communicationType as any,
          exampleSnippets: [{ repId, communicationType, snippet: improvement, score: feedback.overallScore }],
        });
      }
    }
  } catch (err) {
    console.error("[AI Coach] Failed to extract training insights:", err);
  }
}
