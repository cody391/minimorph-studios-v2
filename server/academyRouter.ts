/**
 * ═══════════════════════════════════════════════════════
 * ACADEMY ROUTER — Sales Training Academy backend
 * ═══════════════════════════════════════════════════════
 */
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  academyProgress,
  academyQuizAttempts,
  academyCertifications,
  coachingReviews,
  dailyCheckIns,
  reps,
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  getCertificationStatus,
  getDailyCheckIn,
  completeCoachingReview,
  canRepAccessLeads,
  getAllRankConfigs,
} from "./services/academyGatekeeper";
import { ACADEMY_MODULES, getTotalQuizQuestions, getTotalEstimatedMinutes } from "./academy-curriculum";

/* ─── Helper: get or create progress row ─── */
async function getOrCreateProgress(repId: number, moduleId: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const mod = ACADEMY_MODULES.find((m) => m.id === moduleId);
  if (!mod) throw new TRPCError({ code: "NOT_FOUND", message: "Module not found" });

  const existing = await db
    .select()
    .from(academyProgress)
    .where(and(eq(academyProgress.repId, repId), eq(academyProgress.moduleId, moduleId)))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(academyProgress).values({
    repId,
    moduleId,
    totalLessons: mod.lessons.length,
  });

  const created = await db
    .select()
    .from(academyProgress)
    .where(and(eq(academyProgress.repId, repId), eq(academyProgress.moduleId, moduleId)))
    .limit(1);

  return created[0];
}

export const academyRouter = router({
  /* ─── List all modules with rep's progress ─── */
  listModules: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { modules: [], totalQuestions: 0, totalMinutes: 0 };

    // Find rep for this user
    const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    const repId = rep.length > 0 ? rep[0].id : null;

    const modules = ACADEMY_MODULES.map((mod) => ({
      id: mod.id,
      title: mod.title,
      description: mod.description,
      icon: mod.icon,
      estimatedMinutes: mod.estimatedMinutes,
      lessonCount: mod.lessons.length,
      quizQuestionCount: mod.quiz.length,
      passingScore: mod.passingScore,
    }));

    // Get progress for this rep
    let progressMap: Record<string, any> = {};
    if (repId) {
      const allProgress = await db
        .select()
        .from(academyProgress)
        .where(eq(academyProgress.repId, repId));
      for (const p of allProgress) {
        progressMap[p.moduleId] = {
          lessonsCompleted: p.lessonsCompleted,
          quizScore: p.quizScore,
          quizPassed: p.quizPassed,
          quizAttempts: p.quizAttempts,
          timeSpentMinutes: p.timeSpentMinutes,
          completedAt: p.completedAt,
        };
      }
    }

    // Get certifications
    let certifications: any[] = [];
    if (repId) {
      certifications = await db
        .select()
        .from(academyCertifications)
        .where(eq(academyCertifications.repId, repId));
    }

    return {
      modules: modules.map((m) => ({
        ...m,
        progress: progressMap[m.id] || null,
      })),
      totalQuestions: getTotalQuizQuestions(),
      totalMinutes: getTotalEstimatedMinutes(),
      certifications,
      isFullyCertified: certifications.some((c) => c.certificationType === "full"),
    };
  }),

  /* ─── Get a specific module's full content ─── */
  getModule: protectedProcedure
    .input(z.object({ moduleId: z.string() }))
    .query(async ({ input, ctx }) => {
      const mod = ACADEMY_MODULES.find((m) => m.id === input.moduleId);
      if (!mod) throw new TRPCError({ code: "NOT_FOUND", message: "Module not found" });

      const db = await getDb();
      const rep = db
        ? await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1)
        : [];
      const repId = rep.length > 0 ? rep[0].id : null;

      let progress = null;
      if (repId && db) {
        progress = await getOrCreateProgress(repId, input.moduleId);
      }

      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        icon: mod.icon,
        estimatedMinutes: mod.estimatedMinutes,
        passingScore: mod.passingScore,
        lessons: mod.lessons.map((l, i) => ({
          index: i,
          title: l.title,
          content: l.content,
          keyTakeaways: l.keyTakeaways,
          script: l.script || null,
          rolePlay: l.rolePlay || null,
        })),
        quizQuestionCount: mod.quiz.length,
        progress,
      };
    }),

  /* ─── Mark a lesson as completed ─── */
  completeLesson: protectedProcedure
    .input(
      z.object({
        moduleId: z.string(),
        lessonIndex: z.number().min(0),
        timeSpentMinutes: z.number().min(0).default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
      if (rep.length === 0) throw new TRPCError({ code: "FORBIDDEN", message: "Not a rep" });
      const repId = rep[0].id;

      const mod = ACADEMY_MODULES.find((m) => m.id === input.moduleId);
      if (!mod) throw new TRPCError({ code: "NOT_FOUND" });

      const progress = await getOrCreateProgress(repId, input.moduleId);
      const newCompleted = Math.max(progress.lessonsCompleted, input.lessonIndex + 1);
      const newTime = progress.timeSpentMinutes + input.timeSpentMinutes;

      await db
        .update(academyProgress)
        .set({
          lessonsCompleted: newCompleted,
          lessonIndex: input.lessonIndex,
          timeSpentMinutes: newTime,
          lastAccessedAt: new Date(),
        })
        .where(eq(academyProgress.id, progress.id));

      return { lessonsCompleted: newCompleted, totalLessons: mod.lessons.length };
    }),

  /* ─── Get quiz questions for a module ─── */
  getQuiz: protectedProcedure
    .input(z.object({ moduleId: z.string() }))
    .query(async ({ input }) => {
      const mod = ACADEMY_MODULES.find((m) => m.id === input.moduleId);
      if (!mod) throw new TRPCError({ code: "NOT_FOUND" });

      // Return questions without correct answers (prevent cheating)
      return {
        moduleId: mod.id,
        moduleTitle: mod.title,
        passingScore: mod.passingScore,
        questions: mod.quiz.map((q) => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options || [],
          difficulty: q.difficulty,
        })),
      };
    }),

  /* ─── Submit quiz answers ─── */
  submitQuiz: protectedProcedure
    .input(
      z.object({
        moduleId: z.string(),
        answers: z.record(z.string(), z.number()), // { questionId: selectedOptionIndex }
        timeSpentSeconds: z.number().min(0).default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
      if (rep.length === 0) throw new TRPCError({ code: "FORBIDDEN", message: "Not a rep" });
      const repId = rep[0].id;

      const mod = ACADEMY_MODULES.find((m) => m.id === input.moduleId);
      if (!mod) throw new TRPCError({ code: "NOT_FOUND" });

      // Grade the quiz
      let correct = 0;
      const results: Array<{
        questionId: string;
        correct: boolean;
        selectedAnswer: number;
        correctAnswer: number | string;
        explanation: string;
      }> = [];

      for (const q of mod.quiz) {
        const userAnswer = input.answers[q.id];
        const isCorrect = userAnswer === q.correctAnswer;
        if (isCorrect) correct++;
        results.push({
          questionId: q.id,
          correct: isCorrect,
          selectedAnswer: userAnswer ?? -1,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        });
      }

      const score = Math.round((correct / mod.quiz.length) * 100);
      const passed = score >= mod.passingScore;

      // Save attempt
      await db.insert(academyQuizAttempts).values({
        repId,
        moduleId: input.moduleId,
        answers: input.answers,
        score,
        passed,
        timeSpentSeconds: input.timeSpentSeconds,
      });

      // Update progress
      const progress = await getOrCreateProgress(repId, input.moduleId);
      const updateData: Record<string, any> = {
        quizScore: score > (progress.quizScore ?? 0) ? score : progress.quizScore,
        quizAttempts: progress.quizAttempts + 1,
        lastAccessedAt: new Date(),
      };

      if (passed && !progress.quizPassed) {
        updateData.quizPassed = true;
        updateData.completedAt = new Date();

        // Award module certification
        const existingCert = await db
          .select()
          .from(academyCertifications)
          .where(
            and(
              eq(academyCertifications.repId, repId),
              eq(academyCertifications.moduleId, input.moduleId)
            )
          )
          .limit(1);

        if (existingCert.length === 0) {
          await db.insert(academyCertifications).values({
            repId,
            certificationType: "module",
            moduleId: input.moduleId,
            score,
          });
        }

        // Check if all modules are now passed → award full certification
        const allProgress = await db
          .select()
          .from(academyProgress)
          .where(eq(academyProgress.repId, repId));

        const passedModules = new Set(allProgress.filter((p) => p.quizPassed).map((p) => p.moduleId));
        // Include current module since we just passed it
        passedModules.add(input.moduleId);

        if (ACADEMY_MODULES.every((m) => passedModules.has(m.id))) {
          const existingFull = await db
            .select()
            .from(academyCertifications)
            .where(
              and(
                eq(academyCertifications.repId, repId),
                eq(academyCertifications.certificationType, "full")
              )
            )
            .limit(1);

          if (existingFull.length === 0) {
            const avgScore = Math.round(
              allProgress.reduce((sum, p) => sum + (p.quizScore ?? 0), 0) / ACADEMY_MODULES.length
            );
            await db.insert(academyCertifications).values({
              repId,
              certificationType: "full",
              score: avgScore,
            });
          }
        }
      }

      await db.update(academyProgress).set(updateData).where(eq(academyProgress.id, progress.id));

      return {
        score,
        passed,
        correctCount: correct,
        totalQuestions: mod.quiz.length,
        passingScore: mod.passingScore,
        results,
      };
    }),

  /* ─── Get quiz history for a module ─── */
  getQuizHistory: protectedProcedure
    .input(z.object({ moduleId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
      if (rep.length === 0) return [];

      return db
        .select()
        .from(academyQuizAttempts)
        .where(
          and(
            eq(academyQuizAttempts.repId, rep[0].id),
            eq(academyQuizAttempts.moduleId, input.moduleId)
          )
        )
        .orderBy(desc(academyQuizAttempts.attemptedAt));
    }),

  /* ─── Admin: get all reps' academy progress ─── */
  adminGetAllProgress: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allReps = await db.select().from(reps);
    const allProgress = await db.select().from(academyProgress);
    const allCerts = await db.select().from(academyCertifications);

    return allReps.map((rep) => {
      const repProgress = allProgress.filter((p) => p.repId === rep.id);
      const repCerts = allCerts.filter((c) => c.repId === rep.id);
      const completedModules = repProgress.filter((p) => p.quizPassed).length;
      const totalModules = ACADEMY_MODULES.length;
      const avgScore =
        repProgress.length > 0
          ? Math.round(
              repProgress.reduce((sum, p) => sum + (p.quizScore ?? 0), 0) / repProgress.length
            )
          : 0;
      const totalTime = repProgress.reduce((sum, p) => sum + p.timeSpentMinutes, 0);

      return {
        repId: rep.id,
        repName: rep.fullName,
        completedModules,
        totalModules,
        completionPercent: Math.round((completedModules / totalModules) * 100),
        avgScore,
        totalTimeMinutes: totalTime,
        isFullyCertified: repCerts.some((c) => c.certificationType === "full"),
        certifications: repCerts,
        moduleProgress: ACADEMY_MODULES.map((mod) => {
          const p = repProgress.find((pr) => pr.moduleId === mod.id);
          return {
            moduleId: mod.id,
            moduleTitle: mod.title,
            lessonsCompleted: p?.lessonsCompleted ?? 0,
            totalLessons: mod.lessons.length,
            quizScore: p?.quizScore ?? null,
            quizPassed: p?.quizPassed ?? false,
            quizAttempts: p?.quizAttempts ?? 0,
          };
        }),
      };
    });
  }),

  /* ─── Certification status (gatekeeper) ─── */
  certificationStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (rep.length === 0) return { isFullyCertified: false, modulesCompleted: 0, totalModules: ACADEMY_MODULES.length, moduleStatuses: [], canAccessLeads: false, canMakeCalls: false, blockedReason: "Not a rep" };
    return getCertificationStatus(rep[0].id);
  }),

  /* ─── Daily check-in (training gate before work) ─── */
  dailyCheckIn: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (rep.length === 0) throw new TRPCError({ code: "FORBIDDEN", message: "Not a rep" });
    return getDailyCheckIn(rep[0].id);
  }),

  /* ─── Get pending coaching reviews ─── */
  pendingReviews: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (rep.length === 0) return [];
    return db.select().from(coachingReviews)
      .where(and(eq(coachingReviews.repId, rep[0].id), eq(coachingReviews.status, "pending")))
      .orderBy(sql`FIELD(${coachingReviews.priority}, 'critical', 'important', 'suggested')`, desc(coachingReviews.createdAt));
  }),

  /* ─── Complete a coaching review (with quiz answer) ─── */
  completeReview: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      quizAnswer: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
      if (rep.length === 0) throw new TRPCError({ code: "FORBIDDEN", message: "Not a rep" });
      return completeCoachingReview(rep[0].id, input.reviewId, input.quizAnswer);
    }),

  /* ─── Check if rep can access leads ─── */
  canAccessLeads: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { allowed: false, reason: "System error" };
    const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
    if (rep.length === 0) return { allowed: false, reason: "Not a rep" };
    return canRepAccessLeads(rep[0].id);
  }),

  /* ─── Get rank training configs (for UI display) ─── */
  rankConfigs: protectedProcedure.query(() => {
    return getAllRankConfigs();
  }),

  /* ─── Get coaching review history ─── */
  reviewHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
      if (rep.length === 0) return [];
      return db.select().from(coachingReviews)
        .where(eq(coachingReviews.repId, rep[0].id))
        .orderBy(desc(coachingReviews.createdAt))
        .limit(input.limit);
    }),

  /* ─── Admin: get academy leaderboard ─── */
  leaderboard: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allReps = await db.select().from(reps);
    const allProgress = await db.select().from(academyProgress);
    const allCerts = await db.select().from(academyCertifications);

    const leaderboard = allReps
      .map((rep) => {
        const repProgress = allProgress.filter((p) => p.repId === rep.id);
        const completedModules = repProgress.filter((p) => p.quizPassed).length;
        const avgScore =
          repProgress.length > 0
            ? Math.round(
                repProgress.reduce((sum, p) => sum + (p.quizScore ?? 0), 0) /
                  Math.max(repProgress.length, 1)
              )
            : 0;
        const totalTime = repProgress.reduce((sum, p) => sum + p.timeSpentMinutes, 0);
        const isFullyCertified = allCerts.some(
          (c) => c.repId === rep.id && c.certificationType === "full"
        );

        return {
          repId: rep.id,
          repName: rep.fullName,
          completedModules,
          totalModules: ACADEMY_MODULES.length,
          avgScore,
          totalTimeMinutes: totalTime,
          isFullyCertified,
          // Score: weight completion + quiz scores
          rankScore: completedModules * 100 + avgScore,
        };
      })
      .sort((a, b) => b.rankScore - a.rankScore);

    return leaderboard;
  }),
});
