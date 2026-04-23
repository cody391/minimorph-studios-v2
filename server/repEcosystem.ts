/**
 * Rep Ecosystem Router — Training, gamification, communication tools, applications
 * Split from main routers.ts to keep files manageable
 */
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import * as db from "./db";

/* ═══════════════════════════════════════════════════════
   GAMIFICATION POINT VALUES
   ═══════════════════════════════════════════════════════ */
const POINT_VALUES = {
  call: 10,
  email: 5,
  meeting: 25,
  proposal: 30,
  follow_up: 8,
  note: 3,
  deal_closed: 200,
} as const;

const LEVEL_THRESHOLDS = {
  rookie: 0,
  closer: 500,
  ace: 2000,
  elite: 5000,
  legend: 15000,
} as const;

const BADGES = {
  first_call: { name: "First Call", description: "Made your first call", condition: (stats: any) => stats.totalCalls >= 1 },
  call_machine: { name: "Call Machine", description: "Made 100 calls", condition: (stats: any) => stats.totalCalls >= 100 },
  closer: { name: "Closer", description: "Closed your first deal", condition: (stats: any) => stats.totalDeals >= 1 },
  five_star: { name: "Five Star", description: "Closed 5 deals", condition: (stats: any) => stats.totalDeals >= 5 },
  streak_7: { name: "Week Warrior", description: "7-day activity streak", condition: (stats: any) => stats.currentStreak >= 7 },
  streak_30: { name: "Iron Will", description: "30-day activity streak", condition: (stats: any) => stats.currentStreak >= 30 },
  revenue_10k: { name: "10K Club", description: "Generated $10K+ in revenue", condition: (stats: any) => stats.totalRevenue >= 10000 },
  revenue_50k: { name: "50K Club", description: "Generated $50K+ in revenue", condition: (stats: any) => stats.totalRevenue >= 50000 },
} as const;

function calculateLevel(points: number): "rookie" | "closer" | "ace" | "elite" | "legend" {
  if (points >= LEVEL_THRESHOLDS.legend) return "legend";
  if (points >= LEVEL_THRESHOLDS.elite) return "elite";
  if (points >= LEVEL_THRESHOLDS.ace) return "ace";
  if (points >= LEVEL_THRESHOLDS.closer) return "closer";
  return "rookie";
}

/* ═══════════════════════════════════════════════════════
   CERTIFICATION QUIZ QUESTIONS
   ═══════════════════════════════════════════════════════ */
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What are MiniMorph Studios' three website packages?",
    options: ["Basic, Pro, Enterprise", "Starter, Growth, Premium", "Bronze, Silver, Gold", "Small, Medium, Large"],
    correctAnswer: 1,
  },
  {
    id: 2,
    question: "What is the starting monthly price for the Starter package?",
    options: ["$99/mo", "$149/mo", "$199/mo", "$249/mo"],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: "How many design revisions are included in every package?",
    options: ["1 round", "2 rounds", "3 rounds", "Unlimited"],
    correctAnswer: 2,
  },
  {
    id: 4,
    question: "What is the commission rate for reps on each sale?",
    options: ["5%", "8%", "10%", "15%"],
    correctAnswer: 2,
  },
  {
    id: 5,
    question: "When a customer says 'I need to think about it,' what's the best response?",
    options: [
      "Pressure them to decide now",
      "Ask what specific concern is holding them back",
      "Offer a discount immediately",
      "Tell them the offer expires today",
    ],
    correctAnswer: 1,
  },
  {
    id: 6,
    question: "What should you do FIRST when contacting a new lead?",
    options: [
      "Send them a pricing sheet",
      "Ask about their business and current website challenges",
      "Tell them about our packages",
      "Ask for their credit card",
    ],
    correctAnswer: 1,
  },
  {
    id: 7,
    question: "How should you handle a customer who wants features not in their package?",
    options: [
      "Say no and move on",
      "Promise to include it for free",
      "Explain the value and suggest upgrading to a higher tier",
      "Tell them to contact support",
    ],
    correctAnswer: 2,
  },
  {
    id: 8,
    question: "What's included in the first year for Growth and Premium customers regarding domains?",
    options: [
      "Nothing — domains are always extra",
      "Free domain registration for the first year",
      "Free domain for life",
      "50% off domain registration",
    ],
    correctAnswer: 1,
  },
  {
    id: 9,
    question: "When representing MiniMorph Studios, which is NOT appropriate?",
    options: [
      "Using your personal email for business communication",
      "Wearing branded materials at meetings",
      "Following up within 24 hours of a meeting",
      "Sending a thank-you note after a call",
    ],
    correctAnswer: 0,
  },
  {
    id: 10,
    question: "What's the best way to handle a competitor comparison question?",
    options: [
      "Trash-talk the competitor",
      "Acknowledge the competitor and highlight MiniMorph's unique value",
      "Ignore the question",
      "Offer to match the competitor's price",
    ],
    correctAnswer: 1,
  },
];

const PASSING_SCORE = 80; // Must get 8/10 correct

/* ═══════════════════════════════════════════════════════
   REP TRAINING ROUTER
   ═══════════════════════════════════════════════════════ */
export const repTrainingRouter = router({
  // Get all training modules (for reps)
  modules: protectedProcedure.query(async () => {
    return db.listTrainingModules(true);
  }),
  // Get a specific module
  getModule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getTrainingModule(input.id);
    }),
  // Get rep's training progress
  myProgress: protectedProcedure.query(async ({ ctx }) => {
    const rep = await db.getRepByUserId(ctx.user.id);
    if (!rep) return [];
    return db.getRepTrainingProgress(rep.id);
  }),
  // Mark a module as complete
  completeModule: protectedProcedure
    .input(z.object({ moduleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new Error("Not a rep");
      await db.upsertTrainingProgress(rep.id, input.moduleId, "completed");
      // Update rep's overall training progress
      const modules = await db.listTrainingModules(true);
      const progress = await db.getRepTrainingProgress(rep.id);
      const completedCount = progress.filter((p: any) => p.status === "completed").length;
      const pct = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
      await db.updateRep(rep.id, { trainingProgress: pct });
      // Award points
      await awardPoints(rep.id, 50, "module_complete");
      // Notify rep about progress
      if (pct < 100) {
        const remaining = modules.length - completedCount;
        await db.createRepNotification({
          repId: rep.id,
          type: "training_reminder",
          title: "Training Progress Update",
          message: `Great work! You've completed ${completedCount}/${modules.length} modules (${pct}%). ${remaining} module${remaining > 1 ? "s" : ""} remaining to unlock certification.`,
          metadata: { moduleId: input.moduleId, progress: pct },
        });
      } else {
        await db.createRepNotification({
          repId: rep.id,
          type: "training_reminder",
          title: "All Modules Complete!",
          message: `You've completed all training modules! Take the certification quiz to activate your account.`,
          metadata: { progress: 100 },
        });
      }
      return { success: true, trainingProgress: pct };
    }),
  // Get quiz questions
  getQuiz: protectedProcedure.query(async () => {
    // Return questions without correct answers
    return QUIZ_QUESTIONS.map(({ correctAnswer, ...q }) => q);
  }),
  // Submit quiz answers
  submitQuiz: protectedProcedure
    .input(z.object({
      answers: z.record(z.string(), z.number()), // { "1": 2, "2": 0, ... }
    }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new Error("Not a rep");
      // Grade the quiz
      let correct = 0;
      for (const q of QUIZ_QUESTIONS) {
        if (input.answers[String(q.id)] === q.correctAnswer) correct++;
      }
      const score = Math.round((correct / QUIZ_QUESTIONS.length) * 100);
      const passed = score >= PASSING_SCORE;
      // Get attempt number
      const previousAttempts = await db.getRepQuizResults(rep.id);
      const attemptNumber = previousAttempts.length + 1;
      await db.createQuizResult({
        repId: rep.id,
        score,
        passed,
        answers: input.answers,
        attemptNumber,
      });
      if (passed) {
        await db.updateRep(rep.id, { status: "certified", certifiedAt: new Date(), trainingProgress: 100 });
        await awardPoints(rep.id, 500, "certification");
      }
      return { score, passed, correct, total: QUIZ_QUESTIONS.length, attemptNumber };
    }),
  // Get quiz results
  myQuizResults: protectedProcedure.query(async ({ ctx }) => {
    const rep = await db.getRepByUserId(ctx.user.id);
    if (!rep) return [];
    return db.getRepQuizResults(rep.id);
  }),
  // Admin: manage training modules
  adminCreate: adminProcedure
    .input(z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      content: z.string().min(1),
      sortOrder: z.number().optional(),
      estimatedMinutes: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.createTrainingModule(input as any);
    }),
  adminUpdate: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      content: z.string().optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().optional(),
      estimatedMinutes: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateTrainingModule(id, data as any);
      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   HELPER: Award points and update gamification
   ═══════════════════════════════════════════════════════ */
async function awardPoints(repId: number, points: number, reason: string) {
  const gamification = await db.getRepGamification(repId);
  const today = new Date().toISOString().slice(0, 10);
  if (gamification) {
    const newTotal = gamification.totalPoints + points;
    const isNewDay = gamification.lastActiveDate !== today;
    const wasYesterday = gamification.lastActiveDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = isNewDay ? (wasYesterday ? gamification.currentStreak + 1 : 1) : gamification.currentStreak;
    const longestStreak = Math.max(gamification.longestStreak, newStreak);
    await db.upsertRepGamification(repId, {
      totalPoints: newTotal,
      level: calculateLevel(newTotal),
      currentStreak: newStreak,
      longestStreak,
      lastActiveDate: today,
    });
  } else {
    await db.upsertRepGamification(repId, {
      totalPoints: points,
      level: calculateLevel(points),
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
    });
  }
}

/* ═══════════════════════════════════════════════════════
   REP ACTIVITY ROUTER
   ═══════════════════════════════════════════════════════ */
export const repActivityRouter = router({
  // Log an activity (call, email, meeting, etc.)
  log: protectedProcedure
    .input(z.object({
      type: z.enum(["call", "email", "meeting", "proposal", "follow_up", "note", "deal_closed"]),
      leadId: z.number().optional(),
      customerId: z.number().optional(),
      subject: z.string().optional(),
      notes: z.string().optional(),
      outcome: z.enum(["connected", "voicemail", "no_answer", "scheduled", "sent", "completed", "cancelled"]).optional(),
      followUpAt: z.string().optional(), // ISO date string
    }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new Error("Not a rep");
      const points = POINT_VALUES[input.type] || 0;
      await db.createActivityLog({
        repId: rep.id,
        type: input.type,
        leadId: input.leadId,
        customerId: input.customerId,
        subject: input.subject,
        notes: input.notes,
        outcome: input.outcome,
        followUpAt: input.followUpAt ? new Date(input.followUpAt) : undefined,
        pointsEarned: points,
      });
      await awardPoints(rep.id, points, input.type);
      return { success: true, pointsEarned: points };
    }),
  // Get my recent activities
  myActivities: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) return [];
      return db.listRepActivities(rep.id, input?.limit || 50);
    }),
  // Get my activity stats
  myStats: protectedProcedure.query(async ({ ctx }) => {
    const rep = await db.getRepByUserId(ctx.user.id);
    if (!rep) return { totalActivities: 0, todayActivities: 0, totalPoints: 0 };
    return db.getRepActivityStats(rep.id);
  }),
  // Get my upcoming follow-ups
  myFollowUps: protectedProcedure.query(async ({ ctx }) => {
    const rep = await db.getRepByUserId(ctx.user.id);
    if (!rep) return [];
    return db.getRepFollowUps(rep.id);
  }),
});

/* ═══════════════════════════════════════════════════════
   REP GAMIFICATION ROUTER
   ═══════════════════════════════════════════════════════ */
export const repGamificationRouter = router({
  // Get my gamification stats
  myStats: protectedProcedure.query(async ({ ctx }) => {
    const rep = await db.getRepByUserId(ctx.user.id);
    if (!rep) return null;
    const stats = await db.getRepGamification(rep.id);
    return stats ?? null;
  }),
  // Get leaderboard
  leaderboard: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return db.getLeaderboard(input?.limit || 10);
    }),
  // Get available badges
  badges: protectedProcedure.query(async () => {
    return Object.entries(BADGES).map(([slug, badge]) => ({
      slug,
      name: badge.name,
      description: badge.description,
    }));
  }),
});

/* ═══════════════════════════════════════════════════════
   REP COMMUNICATION ROUTER — Email templates + sending
   ═══════════════════════════════════════════════════════ */
export const repCommsRouter = router({
  // List email templates
  templates: protectedProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async () => {
      return db.listEmailTemplates(true);
    }),
  // Get a specific template
  getTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getEmailTemplate(input.id);
    }),
  // Send an email using a template (or custom)
  sendEmail: protectedProcedure
    .input(z.object({
      templateId: z.number().optional(),
      leadId: z.number().optional(),
      customerId: z.number().optional(),
      recipientEmail: z.string().email(),
      recipientName: z.string().optional(),
      subject: z.string().min(1),
      body: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new Error("Not a rep");
      // Save the sent email record
      await db.createSentEmail({
        repId: rep.id,
        templateId: input.templateId,
        leadId: input.leadId,
        customerId: input.customerId,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        subject: input.subject,
        body: input.body,
      });
      // Log as activity
      await db.createActivityLog({
        repId: rep.id,
        type: "email",
        leadId: input.leadId,
        customerId: input.customerId,
        subject: `Email: ${input.subject}`,
        notes: `Sent to ${input.recipientEmail}`,
        outcome: "sent",
        pointsEarned: POINT_VALUES.email,
      });
      await awardPoints(rep.id, POINT_VALUES.email, "email_sent");
      return { success: true, pointsEarned: POINT_VALUES.email };
    }),
  // Generate AI personalized email
  generateEmail: protectedProcedure
    .input(z.object({
      leadId: z.number().optional(),
      customerId: z.number().optional(),
      purpose: z.enum(["intro", "follow_up", "proposal", "close", "check_in"]),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new Error("Not a rep");
      const { invokeLLM } = await import("./_core/llm");
      let recipientInfo = "";
      if (input.leadId) {
        const lead = await db.getLeadById(input.leadId);
        if (lead) recipientInfo = `Business: ${lead.businessName}, Contact: ${lead.contactName}, Industry: ${lead.industry || "Unknown"}, Temperature: ${lead.temperature}`;
      } else if (input.customerId) {
        const customer = await db.getCustomerById(input.customerId);
        if (customer) recipientInfo = `Business: ${customer.businessName}, Contact: ${customer.contactName}, Industry: ${customer.industry || "Unknown"}`;
      }
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional email writer for MiniMorph Studios sales reps. Write a ${input.purpose} email.
The rep's name is ${rep.fullName}. MiniMorph Studios builds premium websites for small businesses.
Packages: Starter ($149/mo), Growth ($249/mo), Premium ($449/mo).
Write in a professional but warm tone. Keep it concise (under 200 words).
Return JSON: { "subject": "...", "body": "..." }`,
          },
          {
            role: "user",
            content: `Recipient: ${recipientInfo}\nPurpose: ${input.purpose}\nAdditional context: ${input.additionalContext || "None"}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "email_draft",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subject: { type: "string" },
                body: { type: "string" },
              },
              required: ["subject", "body"],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(result.choices[0].message.content as string);
    }),
  // Get my sent emails
  mySentEmails: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) return [];
      return db.listRepSentEmails(rep.id, input?.limit || 50);
    }),
  // Admin: manage email templates
  adminCreateTemplate: adminProcedure
    .input(z.object({
      slug: z.string().min(1),
      name: z.string().min(1),
      category: z.enum(["intro", "follow_up", "proposal", "close", "check_in", "referral"]),
      subject: z.string().min(1),
      body: z.string().min(1),
      variables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return db.createEmailTemplate(input as any);
    }),
  adminUpdateTemplate: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
      isActive: z.boolean().optional(),
      variables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateEmailTemplate(id, data as any);
      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   REP APPLICATION ROUTER — Extended application flow
   ═══════════════════════════════════════════════════════ */
export const repApplicationRouter = router({
  // Submit extended application (after initial rep creation)
  submit: protectedProcedure
    .input(z.object({
      availability: z.enum(["full_time", "part_time"]),
      hoursPerWeek: z.number().min(5).max(60),
      salesExperience: z.enum(["none", "1_2_years", "3_5_years", "5_plus_years"]),
      previousIndustries: z.array(z.string()).optional(),
      motivation: z.string().min(50),
      linkedinUrl: z.string().optional(),
      referredBy: z.string().optional(),
      agreedToTerms: z.boolean(),
      agreedToTaxInfo: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new Error("Not a rep — apply first");
      await db.createRepApplication({
        repId: rep.id,
        ...input,
      } as any);
      // Move rep to onboarding status
      await db.updateRep(rep.id, { status: "onboarding" });
      return { success: true };
    }),
  // Get my application
  myApplication: protectedProcedure.query(async ({ ctx }) => {
    const rep = await db.getRepByUserId(ctx.user.id);
    if (!rep) return null;
    const app = await db.getRepApplication(rep.id);
    return app ?? null;
  }),
  // Admin: review application
  review: adminProcedure
    .input(z.object({
      repId: z.number(),
      approved: z.boolean(),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.updateRepApplication(input.repId, {
        reviewNotes: input.reviewNotes,
        reviewedAt: new Date(),
        reviewedBy: ctx.user.id,
      });
      if (input.approved) {
        await db.updateRep(input.repId, { status: "training" });
      } else {
        await db.updateRep(input.repId, { status: "inactive" });
      }
      return { success: true };
    }),
});
