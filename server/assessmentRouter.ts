/**
 * ═══════════════════════════════════════════════════════
 * ASSESSMENT ROUTER — Rep Assessment Gate System
 * Gate 1: Situational Judgment (Character & Integrity) — weighted 2x
 * Gate 2: Sales Aptitude (Skills & Instincts) — weighted 1x
 * Features: 20-min timer, 30-day retake cooldown, trust gate
 * ═══════════════════════════════════════════════════════
 */
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { repAssessments, repOnboardingData, users } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  GATE_1_QUESTIONS,
  GATE_2_QUESTIONS,
  SCORING,
  ALL_QUESTIONS,
} from "./assessmentData";

/* ─── Seeded Shuffle (deterministic per user+attempt) ─── */
function hashSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  const rng = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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

export { scoreAssessment, hashSeed, seededShuffle };

/* ─── Helpers ─── */

const RETAKE_COOLDOWN_MS = SCORING.retakeCooldownDays * 24 * 60 * 60 * 1000;
const TIME_LIMIT_WITH_GRACE =
  SCORING.timeLimitSeconds + SCORING.gracePeriodSeconds;

/** Get the latest assessment for a user */
async function getLatestAssessment(db: any, userId: number) {
  const results = await db
    .select()
    .from(repAssessments)
    .where(eq(repAssessments.userId, userId))
    .orderBy(desc(repAssessments.completedAt))
    .limit(1);
  return results[0] || null;
}

/** Count total attempts for a user */
async function getAttemptCount(db: any, userId: number): Promise<number> {
  const results = await db
    .select({ id: repAssessments.id })
    .from(repAssessments)
    .where(eq(repAssessments.userId, userId));
  return results.length;
}

/** Check if user has signed the NDA (trust gate) */
async function hasSignedNda(db: any, userId: number): Promise<boolean> {
  const results = await db
    .select({ ndaSignedAt: repOnboardingData.ndaSignedAt })
    .from(repOnboardingData)
    .where(eq(repOnboardingData.userId, userId))
    .limit(1);
  return results.length > 0 && results[0].ndaSignedAt != null;
}

/* ─── Router ─── */

export const assessmentRouter = router({
  /**
   * Get assessment questions (public to authenticated users)
   * Returns questions without score values (so candidates can't game it)
   */
   getQuestions: protectedProcedure.query(async ({ ctx }) => {
    // Seeded shuffle: deterministic per user+attempt so questions stay stable during a session
    // but different across attempts
    const db = await getDb();
    const attemptCount = db ? await getAttemptCount(db, ctx.user.id) : 0;
    const seed = hashSeed(`${ctx.user.id}-${attemptCount}`);

    const sanitize = (questions: typeof GATE_1_QUESTIONS) => {
      const shuffled = seededShuffle(
        questions.map((q) => ({
          id: q.id,
          gate: q.gate,
          category: q.category,
          scenario: q.scenario,
          freeText: q.freeText || false,
          options: seededShuffle(
            q.options.map((o) => ({ id: o.id, text: o.text })),
            hashSeed(`${seed}-${q.id}`)
          ),
        })),
        seed
      );
      return shuffled;
    };
    return {
      gate1: sanitize(GATE_1_QUESTIONS),
      gate2: sanitize(GATE_2_QUESTIONS),
      totalQuestions: ALL_QUESTIONS.length,
      timeLimitSeconds: SCORING.timeLimitSeconds,
    };
  }),

  /**
   * Start the assessment — records startedAt timestamp for timer enforcement
   * Returns the server start time so frontend can sync its countdown
   */
  startAssessment: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });

    // Check trust gate — NDA must be signed before assessment
    const ndaSigned = await hasSignedNda(db, ctx.user.id);
    if (!ndaSigned) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "You must complete the trust verification step before taking the assessment.",
      });
    }

    // Check for existing passed/borderline assessment
    const latest = await getLatestAssessment(db, ctx.user.id);
    if (latest) {
      if (latest.status === "passed" || latest.adminOverride === "approved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already passed the assessment.",
        });
      }
      if (latest.status === "borderline" && !latest.adminOverride) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Your previous assessment is under review. Please wait for a decision.",
        });
      }

      // Check retake cooldown for failed assessments
      if (latest.status === "failed" || latest.adminOverride === "rejected") {
        const completedTime = new Date(latest.completedAt).getTime();
        const cooldownEnd = completedTime + RETAKE_COOLDOWN_MS;
        const now = Date.now();
        if (now < cooldownEnd) {
          const retakeDate = new Date(cooldownEnd);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `You can retake the assessment after ${retakeDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Use this time to study our sales approach and values.`,
          });
        }
      }
    }

    const attemptCount = await getAttemptCount(db, ctx.user.id);
    const startedAt = new Date();

    return {
      startedAt: startedAt.toISOString(),
      timeLimitSeconds: SCORING.timeLimitSeconds,
      attemptNumber: attemptCount + 1,
    };
  }),

  /**
   * Check retake eligibility — returns status for UI display
   */
  checkEligibility: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });

    const latest = await getLatestAssessment(db, ctx.user.id);

    // Check trust gate
    const ndaSigned = await hasSignedNda(db, ctx.user.id);

    if (!latest) {
      return {
        canTake: ndaSigned,
        reason: ndaSigned
          ? "ready"
          : "nda_required",
        retakeAvailableAt: null,
        attemptNumber: 1,
        previousStatus: null,
      };
    }

    if (latest.status === "passed" || latest.adminOverride === "approved") {
      return {
        canTake: false,
        reason: "already_passed",
        retakeAvailableAt: null,
        attemptNumber: null,
        previousStatus: "passed",
      };
    }

    if (latest.status === "borderline" && !latest.adminOverride) {
      return {
        canTake: false,
        reason: "under_review",
        retakeAvailableAt: null,
        attemptNumber: null,
        previousStatus: "borderline",
      };
    }

    // Failed or rejected — check cooldown
    const completedTime = new Date(latest.completedAt).getTime();
    const cooldownEnd = completedTime + RETAKE_COOLDOWN_MS;
    const now = Date.now();
    const attemptCount = await getAttemptCount(db, ctx.user.id);

    if (now < cooldownEnd) {
      return {
        canTake: false,
        reason: "cooldown",
        retakeAvailableAt: new Date(cooldownEnd).toISOString(),
        attemptNumber: attemptCount + 1,
        previousStatus: "failed",
      };
    }

    return {
      canTake: ndaSigned,
      reason: ndaSigned ? "retake_ready" : "nda_required",
      retakeAvailableAt: null,
      attemptNumber: attemptCount + 1,
      previousStatus: "failed",
    };
  }),

  /**
   * Submit assessment answers
   * Scores automatically and stores result
   * Enforces timer — rejects submissions that are too late
   */
  submit: protectedProcedure
    .input(
      z.object({
        answers: z.record(z.string(), z.string()), // { questionId: optionId }
        freeTextAnswer: z.string().optional(), // sa6 free-text pitch
        startedAt: z.string(), // ISO timestamp from startAssessment
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      // Check trust gate
      const ndaSigned = await hasSignedNda(db, ctx.user.id);
      if (!ndaSigned) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Trust verification required before assessment.",
        });
      }

      // Check for existing passed assessment
      const latest = await getLatestAssessment(db, ctx.user.id);
      if (latest) {
        if (latest.status === "passed" || latest.adminOverride === "approved") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have already passed the assessment.",
          });
        }
        if (latest.status === "borderline" && !latest.adminOverride) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Your assessment is under review.",
          });
        }
        // Check cooldown for failed
        if (latest.status === "failed" || latest.adminOverride === "rejected") {
          const completedTime = new Date(latest.completedAt).getTime();
          const cooldownEnd = completedTime + RETAKE_COOLDOWN_MS;
          if (Date.now() < cooldownEnd) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Retake cooldown period has not expired.",
            });
          }
        }
      }

      // Timer enforcement — check if submission is within allowed time
      const startedAt = new Date(input.startedAt);
      const now = new Date();
      const elapsedSeconds = (now.getTime() - startedAt.getTime()) / 1000;

      if (elapsedSeconds > TIME_LIMIT_WITH_GRACE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Time expired. Your assessment was not submitted within the 20-minute time limit.",
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
      const attemptCount = await getAttemptCount(db, ctx.user.id);

      // Store in database
      await db.insert(repAssessments).values({
        userId: ctx.user.id,
        gate1Score: result.gate1Score.toFixed(2),
        gate2Score: result.gate2Score.toFixed(2),
        totalScore: result.totalScore.toFixed(2),
        status: result.status,
        answers: input.answers,
        freeTextAnswer: input.freeTextAnswer || null,
        startedAt: startedAt,
        timeLimitSeconds: SCORING.timeLimitSeconds,
        attemptNumber: attemptCount + 1,
      });

      return {
        gate1Score: result.gate1Score,
        gate2Score: result.gate2Score,
        totalScore: result.totalScore,
        status: result.status,
        gate1Label: "Situational Judgment",
        gate2Label: "Sales Aptitude",
        attemptNumber: attemptCount + 1,
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
      .orderBy(desc(repAssessments.completedAt))
      .limit(1);

    if (result.length === 0) return null;

    const assessment = result[0];

    // Calculate retake info if failed
    let retakeAvailableAt: string | null = null;
    if (
      assessment.status === "failed" ||
      assessment.adminOverride === "rejected"
    ) {
      const completedTime = new Date(assessment.completedAt).getTime();
      const cooldownEnd = completedTime + RETAKE_COOLDOWN_MS;
      if (Date.now() < cooldownEnd) {
        retakeAvailableAt = new Date(cooldownEnd).toISOString();
      }
    }

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
      attemptNumber: assessment.attemptNumber,
      retakeAvailableAt,
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
          attemptNumber: repAssessments.attemptNumber,
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
          startedAt: repAssessments.startedAt,
          attemptNumber: repAssessments.attemptNumber,
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
