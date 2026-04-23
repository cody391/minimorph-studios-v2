import * as db from "../db";

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
You analyze ${channelLabel}s between sales reps and leads/customers.

Your job is to:
1. Score the communication 1-100 based on professionalism, persuasiveness, clarity, and rapport-building
2. Identify 2-4 specific strengths (what the rep did well)
3. Identify 2-4 specific improvements (what could be better, with concrete suggestions)
4. Provide detailed feedback in 2-3 paragraphs
5. Analyze the tone (professional, friendly, aggressive, passive, confident, uncertain)
6. Score sentiment (-100 to 100, where positive = warm/engaging, negative = cold/pushy)
7. Extract 2-3 key takeaways that could help other reps
8. Suggest a specific follow-up action

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
            },
            required: ["overallScore", "strengths", "improvements", "detailedFeedback", "toneAnalysis", "sentimentScore", "keyTakeaways", "suggestedFollowUp"],
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
      keyTakeaways: feedback.keyTakeaways,
      suggestedFollowUp: feedback.suggestedFollowUp,
    });

    // Feed insights into the training system
    await extractTrainingInsights(input.repId, input.communicationType, feedback);

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
