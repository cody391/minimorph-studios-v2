/**
 * ═══════════════════════════════════════════════════════
 * ASSESSMENT ROUTER — Rep Assessment Gate System
 * Gate 1: Situational Judgment (Character & Integrity) — weighted 2x
 * Gate 2: Sales Aptitude (Skills & Instincts) — weighted 1x
 * ═══════════════════════════════════════════════════════
 */
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { repAssessments, users } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import {
  GATE_1_QUESTIONS,
  GATE_2_QUESTIONS,
  SCORING,
  ALL_QUESTIONS,
} from "./assessmentData";

/* ─── Scoring Engine ─── */

interface ScoringResult {
  gate1Score: number; // percentage 0-100
  gate2Score: number; // percentage 0-100
  totalScore: number; // weighted percentage 0-100
  status: "passed" | "borderline" | "failed";
  gate1Raw: number;
  gate1Max: number;
  gate2Raw: number;
  gate2Max: number;
}

function scoreAssessment(answers: Record<string, string>): ScoringResult {
  // Score Gate 1
  let gate1Raw = 0;
  const gate1Max = SCORING.gate1MaxPerQuestion * SCORING.gate1QuestionCount;
  for (const q of GATE_1_QUESTIONS) {
    const selectedOptionId = answers[q.id];
    if (!selectedOptionId) continue;
    const option = q.options.find((o) => o.id === selectedOptionId);
    if (option) gate1Raw += option.score;
  }

  // Score Gate 2 (only multiple-choice questions, sa6 is free text)
  let gate2Raw = 0;
  const gate2Max = SCORING.gate2MaxPerQuestion * SCORING.gate2QuestionCount; // 5 MC questions
  for (const q of GATE_2_QUESTIONS) {
    if (q.freeText) continue; // sa6 is scored separately / manually
    const selectedOptionId = answers[q.id];
    if (!selectedOptionId) continue;
    const option = q.options.find((o) => o.id === selectedOptionId);
    if (option) gate2Raw += option.score;
  }

  // Calculate percentages
  const gate1Score = gate1Max > 0 ? (gate1Raw / gate1Max) * 100 : 0;
  const gate2Score = gate2Max > 0 ? (gate2Raw / gate2Max) * 100 : 0;

  // Weighted total: Gate 1 counts 2x, Gate 2 counts 1x
  const totalScore =
    (gate1Score * SCORING.gate1Weight + gate2Score * SCORING.gate2Weight) /
    (SCORING.gate1Weight + SCORING.gate2Weight);

  // Determine status
  let status: "passed" | "borderline" | "failed";

  // Check individual gate minimums first
  if (gate1Score < SCORING.gate1MinPercent) {
    // Character is non-negotiable
    status = "failed";
  } else if (gate2Score < SCORING.gate2MinPercent) {
    // Sales aptitude below minimum
    status = "failed";
  } else if (totalScore >= SCORING.autoPassThreshold) {
    status = "passed";
  } else if (totalScore >= SCORING.borderlineMin) {
    status = "borderline";
  } else {
    status = "failed";
  }

  return {
    gate1Score: Math.round(gate1Score * 100) / 100,
    gate2Score: Math.round(gate2Score * 100) / 100,
    totalScore: Math.round(totalScore * 100) / 100,
    status,
    gate1Raw,
    gate1Max,
    gate2Raw,
    gate2Max,
  };
}

export { scoreAssessment };

/* ─── Router ─── */

export const assessmentRouter = router({
  /**
   * Get assessment questions (public to authenticated users)
   * Returns questions without score values (so candidates can't game it)
   */
  getQuestions: protectedProcedure.query(() => {
    const sanitize = (questions: typeof GATE_1_QUESTIONS) =>
      questions.map((q) => ({
        id: q.id,
        gate: q.gate,
        category: q.category,
        scenario: q.scenario,
        freeText: q.freeText || false,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          // DO NOT include score
        })),
      }));

    return {
      gate1: sanitize(GATE_1_QUESTIONS),
      gate2: sanitize(GATE_2_QUESTIONS),
      totalQuestions: ALL_QUESTIONS.length,
    };
  }),

  /**
   * Submit assessment answers
   * Scores automatically and stores result
   */
  submit: protectedProcedure
    .input(
      z.object({
        answers: z.record(z.string(), z.string()), // { questionId: optionId }
        freeTextAnswer: z.string().optional(), // sa6 free-text pitch
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      // Check if user already has a completed assessment
      const existing = await db
        .select()
        .from(repAssessments)
        .where(eq(repAssessments.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already completed the assessment.",
        });
      }

      // Validate that all required questions are answered
      const requiredIds = ALL_QUESTIONS.filter((q) => !q.freeText).map(
        (q) => q.id
      );
      const missingAnswers = requiredIds.filter((id) => !input.answers[id]);
      if (missingAnswers.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Please answer all questions. Missing: ${missingAnswers.join(", ")}`,
        });
      }

      // Score the assessment
      const result = scoreAssessment(input.answers);

      // Store in database
      await db.insert(repAssessments).values({
        userId: ctx.user.id,
        gate1Score: result.gate1Score.toFixed(2),
        gate2Score: result.gate2Score.toFixed(2),
        totalScore: result.totalScore.toFixed(2),
        status: result.status,
        answers: input.answers,
        freeTextAnswer: input.freeTextAnswer || null,
      });

      return {
        gate1Score: result.gate1Score,
        gate2Score: result.gate2Score,
        totalScore: result.totalScore,
        status: result.status,
        gate1Label: "Situational Judgment",
        gate2Label: "Sales Aptitude",
      };
    }),

  /**
   * Get current user's assessment result
   */
  getMyResult: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });

    const result = await db
      .select()
      .from(repAssessments)
      .where(eq(repAssessments.userId, ctx.user.id))
      .limit(1);

    if (result.length === 0) return null;

    const assessment = result[0];
    return {
      id: assessment.id,
      gate1Score: parseFloat(assessment.gate1Score),
      gate2Score: parseFloat(assessment.gate2Score),
      totalScore: parseFloat(assessment.totalScore),
      status: assessment.status,
      adminOverride: assessment.adminOverride,
      reviewNotes: assessment.reviewNotes,
      completedAt: assessment.completedAt,
      reviewedAt: assessment.reviewedAt,
    };
  }),

  /**
   * Admin: list all assessments with user info
   */
  adminList: adminProcedure
    .input(
      z
        .object({
          status: z
            .enum(["passed", "borderline", "failed"])
            .optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      let query = db
        .select({
          id: repAssessments.id,
          userId: repAssessments.userId,
          userName: users.name,
          userEmail: users.email,
          gate1Score: repAssessments.gate1Score,
          gate2Score: repAssessments.gate2Score,
          totalScore: repAssessments.totalScore,
          status: repAssessments.status,
          freeTextAnswer: repAssessments.freeTextAnswer,
          adminOverride: repAssessments.adminOverride,
          reviewNotes: repAssessments.reviewNotes,
          completedAt: repAssessments.completedAt,
          reviewedAt: repAssessments.reviewedAt,
        })
        .from(repAssessments)
        .leftJoin(users, eq(repAssessments.userId, users.id))
        .orderBy(desc(repAssessments.completedAt));

      const results = await query;

      // Filter by status if provided
      if (input?.status) {
        return results.filter((r) => r.status === input.status);
      }

      return results;
    }),

  /**
   * Admin: review a borderline assessment (approve or reject)
   */
  adminReview: adminProcedure
    .input(
      z.object({
        assessmentId: z.number(),
        decision: z.enum(["approved", "rejected"]),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const existing = await db
        .select()
        .from(repAssessments)
        .where(eq(repAssessments.id, input.assessmentId))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assessment not found",
        });
      }

      await db
        .update(repAssessments)
        .set({
          adminOverride: input.decision,
          reviewNotes: input.reviewNotes || null,
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
        })
        .where(eq(repAssessments.id, input.assessmentId));

      return { success: true };
    }),

  /**
   * Admin: get detailed view of a single assessment with all answers
   */
  adminGetDetail: adminProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const result = await db
        .select({
          id: repAssessments.id,
          userId: repAssessments.userId,
          userName: users.name,
          userEmail: users.email,
          gate1Score: repAssessments.gate1Score,
          gate2Score: repAssessments.gate2Score,
          totalScore: repAssessments.totalScore,
          status: repAssessments.status,
          answers: repAssessments.answers,
          freeTextAnswer: repAssessments.freeTextAnswer,
          adminOverride: repAssessments.adminOverride,
          reviewNotes: repAssessments.reviewNotes,
          completedAt: repAssessments.completedAt,
          reviewedAt: repAssessments.reviewedAt,
          reviewedBy: repAssessments.reviewedBy,
        })
        .from(repAssessments)
        .leftJoin(users, eq(repAssessments.userId, users.id))
        .where(eq(repAssessments.id, input.assessmentId))
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assessment not found",
        });
      }

      const assessment = result[0];

      // Enrich answers with question text and correct answer info
      const answersObj = (assessment.answers || {}) as Record<string, string>;
      const enrichedAnswers = ALL_QUESTIONS.map((q) => {
        const selectedId = answersObj[q.id];
        const selectedOption = q.options.find((o) => o.id === selectedId);
        const bestOption = q.options.reduce((a, b) =>
          a.score > b.score ? a : b
        );

        return {
          questionId: q.id,
          gate: q.gate,
          category: q.category,
          scenario: q.scenario,
          selectedOptionId: selectedId || null,
          selectedOptionText: selectedOption?.text || null,
          selectedScore: selectedOption?.score ?? 0,
          maxScore: q.freeText ? 0 : bestOption.score,
          isFreeText: q.freeText || false,
          freeTextResponse:
            q.freeText ? assessment.freeTextAnswer : null,
        };
      });

      return {
        ...assessment,
        gate1Score: parseFloat(assessment.gate1Score as string),
        gate2Score: parseFloat(assessment.gate2Score as string),
        totalScore: parseFloat(assessment.totalScore as string),
        enrichedAnswers,
      };
    }),
});
