/**
 * Academy Gatekeeper Service
 * 
 * Enforces:
 * 1. Full certification required before rep gets leads or makes live calls
 * 2. AI coaching feedback → personalized micro-lessons → required review queue
 * 3. Daily check-in: reps must complete pending reviews before accessing leads
 * 4. Tier-based training requirements: Bronze reviews everything, Platinum is exempt
 */

import { getDb } from "../db";
import {
  reps, academyProgress, academyCertifications, coachingReviews,
  dailyCheckIns, aiCoachingFeedback, repTiers,
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { ACADEMY_MODULES } from "../academy-curriculum";

/* ─── Rank-based training config ─── */
const RANK_TRAINING_CONFIG: Record<string, {
  maxDailyReviews: number;       // max reviews required per day
  canSkipSuggested: boolean;     // can skip "suggested" priority reviews
  canLetReviewsExpire: boolean;  // reviews auto-expire after 48h
  expiryHours: number;           // how long before reviews expire
  quizRequiredForCritical: boolean;
  quizRequiredForImportant: boolean;
  quizRequiredForSuggested: boolean;
}> = {
  bronze: {
    maxDailyReviews: 10,
    canSkipSuggested: false,
    canLetReviewsExpire: false,
    expiryHours: 0, // never expires
    quizRequiredForCritical: true,
    quizRequiredForImportant: true,
    quizRequiredForSuggested: true,
  },
  silver: {
    maxDailyReviews: 7,
    canSkipSuggested: false,
    canLetReviewsExpire: false,
    expiryHours: 0,
    quizRequiredForCritical: true,
    quizRequiredForImportant: true,
    quizRequiredForSuggested: false, // no quiz for suggested
  },
  gold: {
    maxDailyReviews: 3,
    canSkipSuggested: true, // can skip suggested
    canLetReviewsExpire: true,
    expiryHours: 48,
    quizRequiredForCritical: true,
    quizRequiredForImportant: false, // no quiz for important
    quizRequiredForSuggested: false,
  },
  platinum: {
    maxDailyReviews: 0, // exempt from daily training
    canSkipSuggested: true,
    canLetReviewsExpire: true,
    expiryHours: 24,
    quizRequiredForCritical: false,
    quizRequiredForImportant: false,
    quizRequiredForSuggested: false,
  },
};

/* ─── Category to Academy Module mapping ─── */
const CATEGORY_MODULE_MAP: Record<string, string> = {
  objection_handling: "objection-handling",
  closing: "closing-techniques",
  rapport: "psychology-selling",
  discovery: "discovery-call",
  product_knowledge: "product-mastery",
  tone: "psychology-selling",
  follow_up: "account-management",
  listening: "discovery-call",
  urgency: "closing-techniques",
  personalization: "digital-prospecting",
};

/**
 * Check if a rep is fully certified (passed all 9 academy modules)
 */
export async function isRepCertified(repId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const certs = await db.select()
    .from(academyCertifications)
    .where(
      and(
        eq(academyCertifications.repId, repId),
        eq(academyCertifications.certificationType, "full")
      )
    )
    .limit(1);

  return certs.length > 0;
}

/**
 * Get rep's certification status with details
 */
export async function getCertificationStatus(repId: number): Promise<{
  isFullyCertified: boolean;
  modulesCompleted: number;
  totalModules: number;
  moduleStatuses: { moduleId: string; title: string; passed: boolean; score: number | null }[];
  canAccessLeads: boolean;
  canMakeCalls: boolean;
  blockedReason: string | null;
}> {
  const db = await getDb();
  if (!db) return {
    isFullyCertified: false, modulesCompleted: 0, totalModules: ACADEMY_MODULES.length,
    moduleStatuses: [], canAccessLeads: false, canMakeCalls: false,
    blockedReason: "Database unavailable",
  };

  const progress = await db.select().from(academyProgress).where(eq(academyProgress.repId, repId));
  const fullCert = await db.select().from(academyCertifications).where(
    and(eq(academyCertifications.repId, repId), eq(academyCertifications.certificationType, "full"))
  ).limit(1);

  const isFullyCertified = fullCert.length > 0;
  const moduleStatuses = ACADEMY_MODULES.map(mod => {
    const p = progress.find(pr => pr.moduleId === mod.id);
    return {
      moduleId: mod.id,
      title: mod.title,
      passed: p?.quizPassed ?? false,
      score: p?.quizScore ?? null,
    };
  });
  const modulesCompleted = moduleStatuses.filter(m => m.passed).length;

  // Check daily check-in clearance
  const today = new Date().toISOString().slice(0, 10);
  const checkIn = await db.select().from(dailyCheckIns).where(
    and(eq(dailyCheckIns.repId, repId), eq(dailyCheckIns.checkInDate, today))
  ).limit(1);
  const dailyCleared = checkIn.length > 0 ? checkIn[0].isCleared : false;

  let blockedReason: string | null = null;
  if (!isFullyCertified) {
    blockedReason = `Complete all ${ACADEMY_MODULES.length} academy modules to get certified. ${modulesCompleted}/${ACADEMY_MODULES.length} done.`;
  } else if (!dailyCleared) {
    blockedReason = "Complete your daily training reviews before accessing leads and calls.";
  }

  return {
    isFullyCertified,
    modulesCompleted,
    totalModules: ACADEMY_MODULES.length,
    moduleStatuses,
    canAccessLeads: isFullyCertified && dailyCleared,
    canMakeCalls: isFullyCertified && dailyCleared,
    blockedReason,
  };
}

/**
 * Get rep's accountability tier (Bronze/Silver/Gold/Platinum)
 * Reads from the repTiers table — the single source of truth for tier status
 */
export async function getRepLevel(repId: number): Promise<string> {
  const db = await getDb();
  if (!db) return "bronze";

  const tier = await db.select({ tier: repTiers.tier }).from(repTiers).where(eq(repTiers.repId, repId)).limit(1);
  return tier.length > 0 ? (tier[0].tier || "bronze") : "bronze";
}

/**
 * Generate coaching reviews from AI feedback
 * Called after AI analyzes a rep's conversation
 */
export async function generateCoachingReview(
  feedbackId: number,
  repId: number,
): Promise<{ reviewsCreated: number }> {
  const db = await getDb();
  if (!db) return { reviewsCreated: 0 };

  // Get the feedback
  const feedback = await db.select().from(aiCoachingFeedback)
    .where(eq(aiCoachingFeedback.id, feedbackId)).limit(1);
  if (feedback.length === 0) return { reviewsCreated: 0 };

  const fb = feedback[0];
  const improvements = (fb.improvements as string[]) || [];
  const strengths = (fb.strengths as string[]) || [];

  if (improvements.length === 0) return { reviewsCreated: 0 };

  const level = await getRepLevel(repId);
  const config = RANK_TRAINING_CONFIG[level] || RANK_TRAINING_CONFIG.bronze;

  // Check how many pending reviews the rep already has
  const pendingReviews = await db.select({ count: sql<number>`count(*)` })
    .from(coachingReviews)
    .where(and(eq(coachingReviews.repId, repId), eq(coachingReviews.status, "pending")));
  const pendingCount = Number(pendingReviews[0]?.count ?? 0);

  // Don't overload — cap at maxDailyReviews
  const maxNew = Math.max(0, config.maxDailyReviews - pendingCount);
  if (maxNew === 0) return { reviewsCreated: 0 };

  // Use LLM to generate personalized micro-lessons
  const prompt = `You are an elite sales coach. A sales rep just had a conversation that was analyzed. 
Here are the areas for improvement: ${improvements.join(", ")}
Here are their strengths: ${strengths.join(", ")}
Overall score: ${fb.overallScore}/100
Tone: ${fb.toneAnalysis}
Detailed feedback: ${fb.detailedFeedback}

Generate ${Math.min(improvements.length, maxNew)} micro-lessons. For each, provide:
1. A short title (max 80 chars)
2. A category from: objection_handling, closing, rapport, discovery, product_knowledge, tone, follow_up, listening, urgency, personalization
3. Priority: "critical" if score < 40, "important" if score < 70, "suggested" otherwise
4. A 200-400 word lesson in markdown that teaches the rep how to improve, with a specific example from their conversation
5. A quiz question with 4 options (A-D), the correct answer index (0-3), and an explanation

Return JSON array: [{ title, category, priority, content, quiz: { question, options: [string, string, string, string], correctAnswer: number, explanation: string } }]`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert sales coach. Return valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "coaching_reviews",
          strict: true,
          schema: {
            type: "object",
            properties: {
              reviews: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    category: { type: "string" },
                    priority: { type: "string" },
                    content: { type: "string" },
                    quiz: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        correctAnswer: { type: "integer" },
                        explanation: { type: "string" },
                      },
                      required: ["question", "options", "correctAnswer", "explanation"],
                      additionalProperties: false,
                    },
                  },
                  required: ["title", "category", "priority", "content", "quiz"],
                  additionalProperties: false,
                },
              },
            },
            required: ["reviews"],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = JSON.parse((response.choices[0].message.content as string) || "{}");
    const reviews = parsed.reviews || [];

    let created = 0;
    for (const review of reviews.slice(0, maxNew)) {
      const validCategories = [
        "objection_handling", "closing", "rapport", "discovery", "product_knowledge",
        "tone", "follow_up", "listening", "urgency", "personalization",
      ];
      const category = validCategories.includes(review.category) ? review.category : "tone";
      const validPriorities = ["critical", "important", "suggested"];
      const priority = validPriorities.includes(review.priority) ? review.priority : "important";

      // Calculate expiry based on rank
      let expiresAt: Date | null = null;
      if (config.canLetReviewsExpire && config.expiryHours > 0) {
        expiresAt = new Date(Date.now() + config.expiryHours * 60 * 60 * 1000);
      }

      await db.insert(coachingReviews).values({
        repId,
        feedbackId,
        title: review.title.slice(0, 255),
        content: review.content,
        category: category as any,
        relatedModuleId: CATEGORY_MODULE_MAP[category] || null,
        priority: priority as any,
        quizQuestion: review.quiz,
        expiresAt,
      });
      created++;
    }

    return { reviewsCreated: created };
  } catch (error) {
    console.error("[AcademyGatekeeper] Error generating coaching reviews:", error);
    return { reviewsCreated: 0 };
  }
}

/**
 * Get or create today's daily check-in for a rep
 */
export async function getDailyCheckIn(repId: number): Promise<{
  checkIn: DailyCheckIn | null;
  pendingReviews: any[];
  isCleared: boolean;
  level: string;
  config: typeof RANK_TRAINING_CONFIG.bronze;
}> {
  const db = await getDb();
  if (!db) return { checkIn: null, pendingReviews: [], isCleared: false, level: "bronze", config: RANK_TRAINING_CONFIG.bronze };

  const today = new Date().toISOString().slice(0, 10);
  const level = await getRepLevel(repId);
  const config = RANK_TRAINING_CONFIG[level] || RANK_TRAINING_CONFIG.bronze;

  // Expire old reviews for eligible ranks
  if (config.canLetReviewsExpire) {
    await db.update(coachingReviews).set({ status: "skipped" }).where(
      and(
        eq(coachingReviews.repId, repId),
        eq(coachingReviews.status, "pending"),
        sql`${coachingReviews.expiresAt} IS NOT NULL AND ${coachingReviews.expiresAt} < NOW()`
      )
    );
  }

  // Get pending reviews
  let pendingReviews = await db.select().from(coachingReviews).where(
    and(eq(coachingReviews.repId, repId), eq(coachingReviews.status, "pending"))
  ).orderBy(
    sql`FIELD(${coachingReviews.priority}, 'critical', 'important', 'suggested')`,
    desc(coachingReviews.createdAt)
  );

  // Filter based on rank
  if (config.canSkipSuggested) {
    pendingReviews = pendingReviews.filter(r => r.priority !== "suggested");
  }

  // Cap at daily max
  let todayReviews = pendingReviews.slice(0, config.maxDailyReviews);

  // Count quizzes required
  const quizzesRequired = todayReviews.filter(r => {
    if (r.priority === "critical") return config.quizRequiredForCritical;
    if (r.priority === "important") return config.quizRequiredForImportant;
    return config.quizRequiredForSuggested;
  }).length;

  // Get or create check-in
  let existing = await db.select().from(dailyCheckIns).where(
    and(eq(dailyCheckIns.repId, repId), eq(dailyCheckIns.checkInDate, today))
  ).limit(1);

  if (existing.length === 0) {
    // If certified rep has no pending reviews, seed Academy-based training
    if (todayReviews.length === 0 && config.maxDailyReviews > 0) {
      const seeded = await seedDailyTrainingForNewRep(repId);
      if (seeded > 0) {
        // Re-fetch pending reviews after seeding
        let freshReviews = await db.select().from(coachingReviews).where(
          and(eq(coachingReviews.repId, repId), eq(coachingReviews.status, "pending"))
        ).orderBy(
          sql`FIELD(${coachingReviews.priority}, 'critical', 'important', 'suggested')`,
          desc(coachingReviews.createdAt)
        );
        if (config.canSkipSuggested) {
          freshReviews = freshReviews.filter(r => r.priority !== "suggested");
        }
        todayReviews = freshReviews.slice(0, config.maxDailyReviews);
      }
    }
    const isCleared = todayReviews.length === 0;
    await db.insert(dailyCheckIns).values({
      repId,
      checkInDate: today,
      reviewsRequired: todayReviews.length,
      reviewsCompleted: 0,
      quizzesRequired,
      quizzesCompleted: 0,
      isCleared,
      clearedAt: isCleared ? new Date() : undefined,
    });
    existing = await db.select().from(dailyCheckIns).where(
      and(eq(dailyCheckIns.repId, repId), eq(dailyCheckIns.checkInDate, today))
    ).limit(1);
  }

  return {
    checkIn: existing[0] || null,
    pendingReviews: todayReviews,
    isCleared: existing[0]?.isCleared ?? false,
    level,
    config,
  };
}

type DailyCheckIn = typeof dailyCheckIns.$inferSelect;

/**
 * Complete a coaching review (with optional quiz answer)
 */
export async function completeCoachingReview(
  repId: number,
  reviewId: number,
  quizAnswer?: number,
): Promise<{ success: boolean; quizPassed?: boolean; explanation?: string }> {
  const db = await getDb();
  if (!db) return { success: false };

  const review = await db.select().from(coachingReviews).where(
    and(eq(coachingReviews.id, reviewId), eq(coachingReviews.repId, repId))
  ).limit(1);

  if (review.length === 0) return { success: false };
  const r = review[0];
  if (r.status !== "pending") return { success: false };

  const level = await getRepLevel(repId);
  const config = RANK_TRAINING_CONFIG[level] || RANK_TRAINING_CONFIG.bronze;

  // Check if quiz is required for this priority level
  const quizRequired = r.priority === "critical" ? config.quizRequiredForCritical
    : r.priority === "important" ? config.quizRequiredForImportant
    : config.quizRequiredForSuggested;

  let quizPassed: boolean | undefined;
  let explanation: string | undefined;

  if (quizRequired && r.quizQuestion) {
    const quiz = r.quizQuestion as { question: string; options: string[]; correctAnswer: number; explanation: string };
    if (quizAnswer === undefined) return { success: false };
    quizPassed = quizAnswer === quiz.correctAnswer;
    explanation = quiz.explanation;

    await db.update(coachingReviews).set({
      status: "completed",
      quizAnswer,
      quizPassed,
      completedAt: new Date(),
    }).where(eq(coachingReviews.id, reviewId));
  } else {
    // No quiz needed — just mark as completed
    await db.update(coachingReviews).set({
      status: "completed",
      completedAt: new Date(),
    }).where(eq(coachingReviews.id, reviewId));
  }

  // Update daily check-in
  const today = new Date().toISOString().slice(0, 10);
  const checkIn = await db.select().from(dailyCheckIns).where(
    and(eq(dailyCheckIns.repId, repId), eq(dailyCheckIns.checkInDate, today))
  ).limit(1);

  if (checkIn.length > 0) {
    const ci = checkIn[0];
    const newReviewsCompleted = ci.reviewsCompleted + 1;
    const newQuizzesCompleted = ci.quizzesCompleted + (quizPassed !== undefined ? 1 : 0);

    // Check if all reviews are done
    const remainingPending = await db.select({ count: sql<number>`count(*)` })
      .from(coachingReviews)
      .where(and(eq(coachingReviews.repId, repId), eq(coachingReviews.status, "pending")));
    const remaining = Number(remainingPending[0]?.count ?? 0);

    // Filter remaining by rank config
    const isCleared = remaining === 0 || (config.canSkipSuggested && remaining === 0);

    await db.update(dailyCheckIns).set({
      reviewsCompleted: newReviewsCompleted,
      quizzesCompleted: newQuizzesCompleted,
      isCleared,
      clearedAt: isCleared ? new Date() : undefined,
    }).where(eq(dailyCheckIns.id, ci.id));
  }

  return { success: true, quizPassed, explanation };
}

/**
 * Check if rep can access leads (certified + daily cleared)
 */
export async function canRepAccessLeads(repId: number): Promise<{
  allowed: boolean;
  reason: string | null;
}> {
  const certified = await isRepCertified(repId);
  if (!certified) {
    return { allowed: false, reason: "You must complete all academy modules and pass certification before accessing leads." };
  }

  const db = await getDb();
  if (!db) return { allowed: false, reason: "System error" };

  const today = new Date().toISOString().slice(0, 10);
  const checkIn = await db.select().from(dailyCheckIns).where(
    and(eq(dailyCheckIns.repId, repId), eq(dailyCheckIns.checkInDate, today))
  ).limit(1);

  // If no check-in exists, create one to determine if cleared
  if (checkIn.length === 0) {
    const result = await getDailyCheckIn(repId);
    return {
      allowed: result.isCleared,
      reason: result.isCleared ? null : "Complete your daily training reviews before accessing leads.",
    };
  }

  return {
    allowed: checkIn[0].isCleared,
    reason: checkIn[0].isCleared ? null : "Complete your daily training reviews before accessing leads.",
  };
}

/**
 * Get rank training config for a level
 */
export function getRankTrainingConfig(level: string) {
  return RANK_TRAINING_CONFIG[level] || RANK_TRAINING_CONFIG.bronze;
}

/**
 * Get all rank configs for display
 */
export function getAllRankConfigs() {
  return Object.entries(RANK_TRAINING_CONFIG).map(([level, config]) => ({
    level,
    ...config,
  }));
}


/**
 * Seed daily training reviews for new reps who have no conversation data yet.
 * Pulls from Academy curriculum to generate relevant micro-lessons and quizzes.
 * Called automatically when getDailyCheckIn finds 0 pending reviews for a certified rep.
 */
export async function seedDailyTrainingForNewRep(repId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const level = await getRepLevel(repId);
  const config = RANK_TRAINING_CONFIG[level] || RANK_TRAINING_CONFIG.bronze;

  // Platinum reps are exempt
  if (config.maxDailyReviews === 0) return 0;

  // Check if rep already has pending reviews
  const pending = await db.select({ count: sql<number>`count(*)` })
    .from(coachingReviews)
    .where(and(eq(coachingReviews.repId, repId), eq(coachingReviews.status, "pending")));
  if (Number(pending[0]?.count ?? 0) > 0) return 0;

  // Check what modules the rep has completed to pull relevant content
  const progress = await db.select().from(academyProgress).where(eq(academyProgress.repId, repId));
  const completedModuleIds = progress.filter(p => p.quizPassed).map(p => p.moduleId);

  // Pick modules to review — prioritize completed ones (reinforcement), but include all
  const modulesToReview = ACADEMY_MODULES.filter(m => completedModuleIds.includes(m.id));
  if (modulesToReview.length === 0) return 0; // Not certified yet, no seeding needed

  // Pick random modules for today's reviews (up to maxDailyReviews)
  const shuffled = [...modulesToReview].sort(() => Math.random() - 0.5);
  const toGenerate = Math.min(config.maxDailyReviews, shuffled.length);
  const selectedModules = shuffled.slice(0, toGenerate);

  let created = 0;
  for (const mod of selectedModules) {
    // Pick a random lesson from the module
    const lesson = mod.lessons[Math.floor(Math.random() * mod.lessons.length)];
    // Pick a random quiz question from the module
    const quizQ = mod.quiz[Math.floor(Math.random() * mod.quiz.length)];

    const category = CATEGORY_MODULE_MAP[mod.id] 
      ? Object.entries(CATEGORY_MODULE_MAP).find(([, v]) => v === mod.id)?.[0] || "product_knowledge"
      : "product_knowledge";

    const validCategories = [
      "objection_handling", "closing", "rapport", "discovery",
      "product_knowledge", "tone", "follow_up", "listening",
      "urgency", "personalization",
    ];
    const safeCategory = validCategories.includes(category) ? category : "product_knowledge";

    // Extract a key takeaway from the lesson as the micro-lesson content
    const keyTakeaways = lesson.keyTakeaways || [];
    const content = `## ${lesson.title}\n\n${keyTakeaways.length > 0 
      ? keyTakeaways.map((t: string) => `- ${t}`).join("\n") 
      : "Review this module's core concepts and apply them in your next conversation."}`;

    const quizData = {
      question: quizQ.question,
      options: quizQ.options,
      correctAnswer: quizQ.correctAnswer,
      explanation: quizQ.explanation,
    };

    const priorities = ["important", "suggested"] as const;
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    await db.insert(coachingReviews).values({
      repId,
      feedbackId: 0, // 0 = seeded from Academy curriculum, not from conversation feedback
      category: safeCategory as "objection_handling" | "closing" | "rapport" | "discovery" | "product_knowledge" | "tone" | "follow_up" | "listening" | "urgency" | "personalization",
      priority,
      title: `Review: ${lesson.title}`,
      content,
      relatedModuleId: mod.id,
      quizQuestion: quizData,
      status: "pending",
    });
    created++;
  }

  return created;
}
