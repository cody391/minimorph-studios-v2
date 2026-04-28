/**
 * ═══════════════════════════════════════════════════════
 * ACADEMY ROUTER — Sales Training Academy backend
 * ═══════════════════════════════════════════════════════
 */
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb, createRepNotification } from "./db";
import {
  academyProgress,
  academyQuizAttempts,
  academyCertifications,
  coachingReviews,
  dailyCheckIns,
  reps,
  rolePlaySessions,
} from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { eq, and, desc, sql } from "drizzle-orm";
import { getScenarioProfile } from "./scenario-profiles";
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
      requiredRolePlay: mod.requiredRolePlay || null,
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

    // Get role play sessions for this rep (scored sessions only)
    let rolePlayMap: Record<string, { scenarioType: string; score: number; status: string }[]> = {};
    if (repId) {
      const rpSessions = await db.select()
        .from(rolePlaySessions)
        .where(and(eq(rolePlaySessions.repId, repId), eq(rolePlaySessions.status, "scored")));
      for (const rp of rpSessions) {
        if (!rolePlayMap[rp.scenarioType]) rolePlayMap[rp.scenarioType] = [];
        rolePlayMap[rp.scenarioType].push({ scenarioType: rp.scenarioType, score: rp.score ?? 0, status: rp.status });
      }
    }

    return {
      modules: modules.map((m) => {
        // Compute role play completion status for this module
        let rolePlayStatus: { scenarioType: string; label: string; minScore: number; passed: boolean; bestScore: number | null }[] | null = null;
        if (m.requiredRolePlay && m.requiredRolePlay.length > 0) {
          rolePlayStatus = m.requiredRolePlay.map(rp => {
            const sessions = rolePlayMap[rp.scenarioType] || [];
            const bestScore = sessions.length > 0 ? Math.max(...sessions.map(s => s.score)) : null;
            return {
              scenarioType: rp.scenarioType,
              label: rp.label,
              minScore: rp.minScore,
              passed: bestScore !== null && bestScore >= rp.minScore,
              bestScore,
            };
          });
        }
        return {
          ...m,
          progress: progressMap[m.id] || null,
          rolePlayStatus,
        };
      }),
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

        // Also check if all required role plays are completed
        const rpSessions = await db.select()
          .from(rolePlaySessions)
          .where(and(eq(rolePlaySessions.repId, repId), eq(rolePlaySessions.status, "scored")));
        const rpScoreMap: Record<string, number> = {};
        for (const rp of rpSessions) {
          rpScoreMap[rp.scenarioType] = Math.max(rpScoreMap[rp.scenarioType] ?? 0, rp.score ?? 0);
        }
        const allRolePlaysCompleted = ACADEMY_MODULES.every((m) => {
          if (!m.requiredRolePlay || m.requiredRolePlay.length === 0) return true;
          return m.requiredRolePlay.every(rp => (rpScoreMap[rp.scenarioType] ?? 0) >= rp.minScore);
        });

        if (ACADEMY_MODULES.every((m) => passedModules.has(m.id)) && allRolePlaysCompleted) {
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
            // Auto-activate rep upon full certification — no admin bottleneck
            await db.update(reps)
              .set({ status: "active", certifiedAt: new Date(), trainingProgress: 100 })
              .where(eq(reps.id, repId));

            // Send automated welcome message
            await createRepNotification({
              repId,
              type: "general",
              title: "🎉 Welcome to the Team — You're Officially Active!",
              message: `Congratulations! You've completed all 9 Academy modules and earned your full MiniMorph certification. Your account is now active — you can access leads, make calls, and start closing deals immediately.\n\nHere's what to do next:\n1. Check your Pipeline for available leads\n2. Review your daily check-in each morning\n3. Start reaching out — your first commission is waiting!\n\nWe're excited to have you on the team. Go make it happen! 🚀`,
              metadata: { event: "full_certification_welcome", avgScore: avgScore },
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

  /* ═══════════════════════════════════════════════════════
     AI ROLE-PLAY — Interactive sales practice with AI prospects
     ═══════════════════════════════════════════════════════ */

  /* ─── List rep's role-play sessions ─── */
  rolePlaySessions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
      if (rep.length === 0) return [];
      return db.select().from(rolePlaySessions)
        .where(eq(rolePlaySessions.repId, rep[0].id))
        .orderBy(desc(rolePlaySessions.createdAt))
        .limit(input?.limit ?? 20);
    }),

  /* ─── Start a new role-play session ─── */
  startRolePlay: protectedProcedure
    .input(z.object({
      scenarioType: z.enum([
        "cold_call", "discovery_call", "objection_handling", "closing",
        "follow_up", "upsell", "angry_customer", "price_negotiation"
      ]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
      if (rep.length === 0) throw new TRPCError({ code: "FORBIDDEN", message: "Not a rep" });

      // Use pre-built scenario profile instead of LLM-generated persona
      const profile = getScenarioProfile(input.scenarioType);
      if (!profile) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown scenario type" });

      // Build a persona object from the profile for backward compatibility
      const persona = {
        name: profile.personName,
        company: profile.businessName,
        industry: profile.industry,
        companySize: 0,
        painPoints: profile.likelyObjectionsOrComplaints.slice(0, 3),
        personality: profile.personPersonality,
        budget: "",
        objections: profile.likelyObjectionsOrComplaints,
        backstory: profile.priorContextSummary,
        // Extended profile fields
        role: profile.personRole,
        businessType: profile.businessType,
        emotionalState: profile.emotionalState,
        conversationStage: profile.conversationStage,
        scenarioType: profile.scenarioType,
        difficulty: profile.difficulty,
      };

      // Use the stage-accurate opening message from the profile
      const openingMessage = profile.openingMessage;

      const initialMessages = [
        { role: "assistant", content: openingMessage, timestamp: Date.now() },
      ];

      const [inserted] = await db.insert(rolePlaySessions).values({
        repId: rep[0].id,
        scenarioType: input.scenarioType,
        prospectPersona: JSON.stringify(persona),
        messages: initialMessages,
        status: "active",
        messageCount: 1,
      });

      return {
        sessionId: inserted.insertId,
        persona,
        messages: initialMessages,
        scenarioType: input.scenarioType,
        briefing: {
          repObjective: profile.repObjective,
          successCriteria: profile.successCriteria,
          conversationStage: profile.conversationStage,
          priorContext: profile.priorContextSummary,
          idealBehaviors: profile.idealRepBehaviors,
          forbiddenBehaviors: profile.forbiddenRepBehaviors,
          difficulty: profile.difficulty,
        },
      };
    }),

  /* ─── Send a message in a role-play session ─── */
  rolePlayMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
      if (rep.length === 0) throw new TRPCError({ code: "FORBIDDEN" });

      const [session] = await db.select().from(rolePlaySessions)
        .where(and(eq(rolePlaySessions.id, input.sessionId), eq(rolePlaySessions.repId, rep[0].id)))
        .limit(1);

      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      if (session.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Session is not active" });

      const persona = JSON.parse(session.prospectPersona);
      const existingMessages = (session.messages as any[]) || [];

      // Build conversation history for LLM using scenario-specific profile
      const profile = getScenarioProfile(session.scenarioType);
      const systemPrompt = profile
        ? `${profile.aiPersonBehaviorInstructions}

IMPORTANT RULES:
- Stay in character at all times. Never break character or mention that you are an AI.
- Keep responses to 1-4 sentences. Be conversational, not robotic.
- Your emotional state: ${profile.emotionalState}
- Your conversation stage: ${profile.conversationStage}
- If the rep does a great job, gradually warm up. If they're pushy, scripted, or miss the mark, become more resistant.
- Your likely objections: ${profile.likelyObjectionsOrComplaints.join("; ")}
- Hidden info to reveal ONLY if the rep asks the right questions: ${profile.hiddenInfoToRevealOnlyIfAsked.join("; ")}
- NEVER mention setup fees.
- NEVER volunteer information the rep hasn't asked about.`
        : `You are ${persona.name}, the ${persona.personality} ${persona.industry} business owner of ${persona.company}.

${persona.backstory}

Your pain points: ${persona.painPoints.join(", ")}
Your objections: ${persona.objections.join(", ")}

This is a ${session.scenarioType.replace(/_/g, " ")} scenario. Stay in character at all times.
Respond naturally. Keep responses to 1-4 sentences. Never break character or mention that you're an AI.`;

      const llmMessages = [
        {
          role: "system" as const,
          content: systemPrompt,
        },
        ...existingMessages.map((m: any) => ({
          role: (m.role === "assistant" ? "assistant" : "user") as "system" | "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: input.message },
      ];

      const response = await invokeLLM({ messages: llmMessages });
      const aiReply = response.choices[0].message.content as string;

      const updatedMessages = [
        ...existingMessages,
        { role: "user", content: input.message, timestamp: Date.now() },
        { role: "assistant", content: aiReply, timestamp: Date.now() },
      ];

      await db.update(rolePlaySessions)
        .set({
          messages: updatedMessages,
          messageCount: updatedMessages.length,
        })
        .where(eq(rolePlaySessions.id, input.sessionId));

      return {
        reply: aiReply,
        messages: updatedMessages,
      };
    }),

  /* ─── End and score a role-play session ─── */
  scoreRolePlay: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
      if (rep.length === 0) throw new TRPCError({ code: "FORBIDDEN" });

      const [session] = await db.select().from(rolePlaySessions)
        .where(and(eq(rolePlaySessions.id, input.sessionId), eq(rolePlaySessions.repId, rep[0].id)))
        .limit(1);

      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const persona = JSON.parse(session.prospectPersona);
      const messages = (session.messages as any[]) || [];

      const conversationText = messages.map((m: any) =>
        `${m.role === "user" ? "REP" : "PROSPECT"}: ${m.content}`
      ).join("\n");

      const scoreResult = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert sales coach evaluating a role-play practice session.

The rep was practicing a ${session.scenarioType.replace(/_/g, " ")} scenario with this prospect:
- Name: ${persona.name}
- Company: ${persona.company} (${persona.industry})
- Personality: ${persona.personality}
- Pain points: ${persona.painPoints.join(", ")}
- Objections: ${persona.objections.join(", ")}

Evaluate the rep's performance and return a JSON object.`,
          },
          {
            role: "user",
            content: `Here is the conversation:\n\n${conversationText}\n\nScore this role-play session.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "roleplay_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "number", description: "Overall score 0-100" },
                feedback: { type: "string", description: "Detailed markdown feedback with specific examples from the conversation" },
                strengths: { type: "array", items: { type: "string" }, description: "3-5 specific things the rep did well" },
                improvements: { type: "array", items: { type: "string" }, description: "3-5 specific areas for improvement" },
                wouldProspectBuy: { type: "boolean", description: "Based on the conversation, would this prospect likely buy?" },
                keyMoment: { type: "string", description: "The most impactful moment in the conversation (good or bad)" },
              },
              required: ["score", "feedback", "strengths", "improvements", "wouldProspectBuy", "keyMoment"],
              additionalProperties: false,
            },
          },
        },
      });

      const evaluation = JSON.parse(scoreResult.choices[0].message.content as string);

      const durationSeconds = messages.length > 0
        ? Math.round((messages[messages.length - 1].timestamp - messages[0].timestamp) / 1000)
        : 0;

      await db.update(rolePlaySessions)
        .set({
          status: "scored",
          score: evaluation.score,
          feedback: evaluation.feedback,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          durationSeconds,
          completedAt: new Date(),
        })
        .where(eq(rolePlaySessions.id, input.sessionId));

      // Check if this role play completion triggers full certification
      // (all quizzes passed + all required role plays passed)
      const rpRepId = rep[0].id;
      const allProgress = await db.select().from(academyProgress).where(eq(academyProgress.repId, rpRepId));
      const passedModules = new Set(allProgress.filter((p) => p.quizPassed).map((p) => p.moduleId));
      const allQuizzesPassed = ACADEMY_MODULES.every((m) => passedModules.has(m.id));

      if (allQuizzesPassed) {
        // Get all scored role play sessions including this one
        const allRpSessions = await db.select()
          .from(rolePlaySessions)
          .where(and(eq(rolePlaySessions.repId, rpRepId), eq(rolePlaySessions.status, "scored")));
        const rpScoreMap: Record<string, number> = {};
        for (const rp of allRpSessions) {
          rpScoreMap[rp.scenarioType] = Math.max(rpScoreMap[rp.scenarioType] ?? 0, rp.score ?? 0);
        }
        const allRolePlaysCompleted = ACADEMY_MODULES.every((m) => {
          if (!m.requiredRolePlay || m.requiredRolePlay.length === 0) return true;
          return m.requiredRolePlay.every(rp => (rpScoreMap[rp.scenarioType] ?? 0) >= rp.minScore);
        });

        if (allRolePlaysCompleted) {
          const existingFull = await db.select()
            .from(academyCertifications)
            .where(and(eq(academyCertifications.repId, rpRepId), eq(academyCertifications.certificationType, "full")))
            .limit(1);

          if (existingFull.length === 0) {
            const avgScore = Math.round(
              allProgress.reduce((sum, p) => sum + (p.quizScore ?? 0), 0) / ACADEMY_MODULES.length
            );
            await db.insert(academyCertifications).values({
              repId: rpRepId,
              certificationType: "full",
              score: avgScore,
            });
            await db.update(reps)
              .set({ status: "active", certifiedAt: new Date(), trainingProgress: 100 })
              .where(eq(reps.id, rpRepId));

            await createRepNotification({
              repId: rpRepId,
              type: "general",
              title: "🎉 Welcome to the Team — You're Officially Active!",
              message: `Congratulations! You've completed all Academy modules, passed every quiz, and proven your skills in Role Play scenarios. Your account is now active — you can access leads, make calls, and start closing deals immediately.\n\nHere's what to do next:\n1. Check your Pipeline for available leads\n2. Review your daily check-in each morning\n3. Start reaching out — your first commission is waiting!\n\nWe're excited to have you on the team. Go make it happen! 🚀`,
            });
          }
        }
      }

      return {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        wouldProspectBuy: evaluation.wouldProspectBuy,
        keyMoment: evaluation.keyMoment,
      };
    }),
});
