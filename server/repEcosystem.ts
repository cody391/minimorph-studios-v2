/**
 * Rep Ecosystem Router — Training, gamification, communication tools, applications
 * Split from main routers.ts to keep files manageable
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { repApplications } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "./db";

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
    question: "What are MiniMorph Studios' four website packages?",
    options: ["Basic, Pro, Enterprise, Custom", "Starter, Growth, Premium, Enterprise", "Bronze, Silver, Gold, Platinum", "Small, Medium, Large, XL"],
    correctAnswer: 1,
  },
  {
    id: 2,
    question: "What is the starting monthly price for the Starter package?",
    options: ["$99/mo", "$149/mo", "$195/mo", "$249/mo"],
    correctAnswer: 2,
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
      const emailRecord = await db.createSentEmail({
        repId: rep.id,
        templateId: input.templateId,
        leadId: input.leadId,
        customerId: input.customerId,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        subject: input.subject,
        body: input.body,
      });
      // Build email with signature
      const { buildEmailSignature } = await import("./routers");
      const signature = buildEmailSignature(rep);
      const htmlBody = input.body.replace(/\n/g, "<br/>") + signature;
      // Actually send the email via Resend
      const { sendEmail: deliverEmail } = await import("./services/email");
      const delivery = await deliverEmail({
        to: input.recipientEmail,
        subject: input.subject,
        html: htmlBody,
        text: input.body + `\n\n--\n${rep.fullName}\nSales Representative — MiniMorph Studios\n${rep.email}${rep.phone ? '\n' + rep.phone : ''}`,
        replyTo: ctx.user.email || undefined,
      });
      if (delivery.success && delivery.resendId) {
        // Save the Resend message ID for webhook tracking
        await db.updateEmailResendId(emailRecord.id, delivery.resendId);
      } else if (!delivery.success) {
        console.warn(`[Email] Delivery failed for email #${emailRecord.id}: ${delivery.error}`);
      }
      // Log as activity
      await db.createActivityLog({
        repId: rep.id,
        type: "email",
        leadId: input.leadId,
        customerId: input.customerId,
        subject: `Email: ${input.subject}`,
        notes: `Sent to ${input.recipientEmail}${delivery.success ? " (delivered)" : " (delivery failed)"}`,
        outcome: delivery.success ? "sent" : "cancelled",
        pointsEarned: POINT_VALUES.email,
      });
      await awardPoints(rep.id, POINT_VALUES.email, "email_sent");
      // Trigger AI coaching asynchronously (non-blocking)
      import("./services/aiCoach").then(({ analyzeAndCoach }) => {
        analyzeAndCoach({
          repId: rep.id,
          communicationType: "email",
          referenceId: emailRecord.id,
          content: `Subject: ${input.subject}\n\n${input.body}`,
          context: `Email to ${input.recipientName || input.recipientEmail}${input.leadId ? " (lead)" : ""}${input.customerId ? " (customer)" : ""}`,
        }).catch((err: any) => console.error("[AI Coach] Email analysis failed:", err));
      });
      return { success: true, delivered: delivery.success, pointsEarned: POINT_VALUES.email };
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
Packages: Starter ($195/mo), Growth ($295/mo), Pro ($395/mo), Enterprise ($495/mo).
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
  // ═══ SMS ENDPOINTS ═══
  sendSms: protectedProcedure
    .input(z.object({
      leadId: z.number().optional(),
      customerId: z.number().optional(),
      toNumber: z.string().min(10),
      body: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new Error("Not a rep");

      // SMS compliance: check opt-in and opt-out status
      if (input.leadId) {
        const lead = await db.getLeadById(input.leadId);
        if (lead?.smsOptedOut) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This lead has opted out of SMS messages. Cannot send." });
        }
        if (!lead?.smsOptIn) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This lead has not opted in to SMS. Record their consent first (e.g. verbal consent on a call)." });
        }
      }

      // Part 10: Daily SMS cap check
      try {
        const { getDb: getDbFn } = await import("./db");
        const { systemSettings: settingsTable, smsMessages: smsTable } = await import("../drizzle/schema");
        const { eq: eqFn, gte: gteFn, and: andFn, sql: sqlFn } = await import("drizzle-orm");
        const database = await getDbFn();
        if (database) {
          const [capRow] = await database.select({ settingValue: settingsTable.settingValue })
            .from(settingsTable).where(eqFn(settingsTable.settingKey, "daily_sms_cap")).limit(1);
          const cap = parseInt(capRow?.settingValue || "50", 10);
          const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
          const [{ count }] = await database.select({ count: sqlFn<number>`count(*)` })
            .from(smsTable)
            .where(andFn(eqFn(smsTable.repId, rep.id), eqFn(smsTable.direction, "outbound"), gteFn(smsTable.createdAt, todayStart)));
          if (Number(count) >= cap) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Daily SMS cap of ${cap} messages reached. Try again tomorrow.` });
          }
        }
      } catch (capErr: any) {
        if (capErr.code === "TOO_MANY_REQUESTS") throw capErr;
      }

      // Append opt-out footer on first SMS to this number
      let messageBody = input.body;
      const existingMessages = await db.listSmsThread(rep.id, input.toNumber);
      const isFirstMessage = existingMessages.filter(m => m.direction === "outbound").length === 0;
      if (isFirstMessage) {
        messageBody += "\n\nReply STOP to opt out of messages.";
        // Mark first message sent if we have a lead
        if (input.leadId) {
          await db.markLeadFirstSmsSent(input.leadId);
        }
      }

      const fromNumber = rep.assignedPhoneNumber || process.env.TWILIO_PHONE_NUMBER || "";
      const { sendSms } = await import("./services/sms");
      const result = await sendSms({ to: input.toNumber, body: messageBody, from: fromNumber });
      const smsRecord = await db.createSmsMessage({
        repId: rep.id,
        leadId: input.leadId,
        customerId: input.customerId,
        direction: "outbound",
        fromNumber,
        toNumber: input.toNumber,
        body: input.body,
        twilioSid: result.twilioSid,
        status: result.success ? "sent" : "failed",
      });
      await db.createActivityLog({
        repId: rep.id,
        type: "email", // using email type for SMS since schema doesn't have sms
        leadId: input.leadId,
        customerId: input.customerId,
        subject: `SMS to ${input.toNumber}`,
        notes: input.body.slice(0, 200),
        outcome: result.success ? "sent" : "cancelled",
        pointsEarned: 5,
      });
      await awardPoints(rep.id, 5, "sms_sent");
      // AI coaching (async)
      import("./services/aiCoach").then(({ analyzeAndCoach }) => {
        analyzeAndCoach({
          repId: rep.id,
          communicationType: "sms",
          referenceId: smsRecord.id,
          content: input.body,
          context: `SMS to ${input.toNumber}`,
        }).catch((err: any) => console.error("[AI Coach] SMS analysis failed:", err));
      });
      return { success: result.success, twilioSid: result.twilioSid, error: result.error, pointsEarned: 5 };
    }),
  mySmsThreads: protectedProcedure
    .query(async ({ ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) return [];
      const allSms = await db.listRepSmsConversations(rep.id);
      // Group by phone number into threads
      const threads: Record<string, { phoneNumber: string; messages: typeof allSms; lastMessage: string; lastAt: Date | null }> = {};
      for (const msg of allSms) {
        const otherNumber = msg.direction === "outbound" ? msg.toNumber : msg.fromNumber;
        if (!threads[otherNumber]) {
          threads[otherNumber] = { phoneNumber: otherNumber, messages: [], lastMessage: msg.body, lastAt: msg.createdAt };
        }
        threads[otherNumber].messages.push(msg);
      }
      return Object.values(threads).sort((a, b) => (b.lastAt?.getTime() || 0) - (a.lastAt?.getTime() || 0));
    }),
  smsThread: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .query(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) return [];
      return db.listSmsThread(rep.id, input.phoneNumber);
    }),
  // ═══ VOICE ENDPOINTS ═══
  getVoiceToken: protectedProcedure
    .query(async ({ ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new Error("Not a rep");
      try {
        const { generateVoiceToken } = await import("./services/voice");
        const token = generateVoiceToken(`rep-${rep.id}`);
        return { token, identity: `rep-${rep.id}` };
      } catch (err: any) {
        return { token: null, identity: null, error: err.message };
      }
    }),
  initiateCall: protectedProcedure
    .input(z.object({
      toNumber: z.string().min(10),
      leadId: z.number().optional(),
      customerId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new Error("Not a rep");
      // Create call log record
      const repFromNumber = rep.assignedPhoneNumber || process.env.TWILIO_PHONE_NUMBER || "";
      const callLog = await db.createCallLog({
        repId: rep.id,
        leadId: input.leadId,
        customerId: input.customerId,
        direction: "outbound",
        fromNumber: repFromNumber,
        toNumber: input.toNumber,
        status: "initiated",
        startedAt: new Date(),
      });
      // Initiate the call via Twilio
      const { initiateCall } = await import("./services/voice");
      const { ENV } = await import("./_core/env");
      const callbackBase = ENV.appUrl || ctx.req.headers.origin || "";
      const result = await initiateCall({
        to: input.toNumber,
        from: repFromNumber,
        statusCallback: `${callbackBase}/api/twilio/call-status`,
      });
      if (result.success && result.callSid) {
        await db.updateCallLog(callLog.id, { twilioCallSid: result.callSid });
      }
      await db.createActivityLog({
        repId: rep.id,
        type: "call",
        leadId: input.leadId,
        customerId: input.customerId,
        subject: `Call to ${input.toNumber}`,
        outcome: result.success ? "connected" : "cancelled",
        pointsEarned: 10,
      });
      await awardPoints(rep.id, 10, "call_made");
      return { success: result.success, callLogId: callLog.id, callSid: result.callSid, error: result.error, pointsEarned: 10 };
    }),
  myCallLogs: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) return [];
      return db.listRepCallLogs(rep.id, input?.limit || 50);
    }),
  // ═══ AI COACHING ENDPOINTS ═══
  myCoachingFeedback: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) return [];
      return db.listRepCoachingFeedback(rep.id, input?.limit || 20);
    }),
  getCoachingForMessage: protectedProcedure
    .input(z.object({ communicationType: z.enum(["email", "sms", "call"]), referenceId: z.number() }))
    .query(async ({ input }) => {
      return db.getCoachingFeedback(input.communicationType, input.referenceId);
    }),
  // ═══ TRAINING INSIGHTS ═══
  myTrainingInsights: protectedProcedure
    .query(async () => {
      return db.listTrainingInsights(true);
    }),
  adminListInsights: adminProcedure
    .query(async () => {
      return db.listTrainingInsights(true);
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
      // AI Motivation Review — analyze the "Why MiniMorph" paragraph asynchronously
      // Fire-and-forget so the user doesn't wait
      reviewMotivationWithAI(rep.id, input.motivation).catch((err: any) =>
        console.error("[AI Motivation Review] Failed:", err.message)
      );
      // AUTO-ADVANCE: Skip manual admin review — go straight to training
      // The AI motivation review runs async and can flag issues later
      await db.updateRep(rep.id, { status: "training" });
      console.log(`[Auto-Onboard] Rep ${rep.id} auto-advanced to training status`);

      // Send welcome email to the new rep
      if (rep.email) {
        const { sendEmail } = await import("./services/email");
        sendEmail({
          to: rep.email,
          subject: "Welcome to MiniMorph Studios — You're In!",
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#111122;font-family:Inter,Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#1c1c30;border-radius:8px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1c1c30,#222240);padding:28px 32px;border-bottom:1px solid #2d2d45;">
    <h1 style="color:#eaeaf0;margin:0;font-size:22px;font-weight:700;">MiniMorph Studios</h1>
  </div>
  <div style="padding:32px;color:#eaeaf0;line-height:1.7;">
    <h2 style="margin:0 0 16px;font-size:20px;">Welcome, ${rep.fullName}! 🎉</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Your application has been approved and you're now a MiniMorph Studios rep. Here's what to do next:</p>
    <ol style="margin:0 0 24px;padding-left:20px;color:#c8c8d8;">
      <li style="margin-bottom:8px;"><strong style="color:#eaeaf0;">Complete your training</strong> — log in and finish all academy modules to unlock your rep dashboard.</li>
      <li style="margin-bottom:8px;"><strong style="color:#eaeaf0;">Set up your service area</strong> — tell us where you'll be selling so we can route leads to you.</li>
      <li style="margin-bottom:8px;"><strong style="color:#eaeaf0;">Review the playbook</strong> — everything you need to close your first deal is in the academy.</li>
    </ol>
    <a href="${process.env.APP_URL || "https://minimorphstudios.net"}/rep" style="display:inline-block;background:#22c55e;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px;">Go to My Dashboard</a>
  </div>
  <div style="background:#151526;padding:20px 32px;border-top:1px solid #2d2d45;">
    <p style="margin:0;font-size:12px;color:#7a7a90;">MiniMorph Studios — Beautiful websites for growing businesses</p>
  </div>
</div>
</body></html>`,
        }).catch((e: any) => console.error("[Auto-Onboard] Welcome email failed:", e.message));
      }

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


// AI MOTIVATION REVIEW HELPER
// Analyzes the "Why MiniMorph" paragraph for seriousness
async function reviewMotivationWithAI(repId: number, motivation: string): Promise<void> {
  const database = await getDb();
  if (!database) return;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an HR screening AI for MiniMorph Studios, a premium AI-powered web design company. 
Your job is to analyze a candidate's "Why I want to join MiniMorph" paragraph and assess how serious, genuine, and aligned they are with our values.

Our core values:
- Integrity above all else
- Honest, trustworthy representation of our brand
- Professionalism and attention to detail
- Genuine desire to help businesses succeed
- Smart, driven, and self-motivated

Score each dimension 1-10:
- sincerity: Does this feel genuine or copy-pasted/generic?
- specificity: Do they reference specific things about MiniMorph, AI, web design, or their own relevant experience?
- effort: Did they clearly put thought into this, or is it minimal/lazy?
- alignment: Do their stated values align with ours?
- red_flags: Any concerning patterns (entitlement, dishonesty signals, purely money-motivated with no interest in the work)

Return ONLY valid JSON matching this exact schema.`,
        },
        {
          role: "user",
          content: `Analyze this candidate's motivation paragraph:\n\n"${motivation}"`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "motivation_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sincerity: { type: "integer", description: "1-10 sincerity score" },
              specificity: { type: "integer", description: "1-10 specificity score" },
              effort: { type: "integer", description: "1-10 effort score" },
              alignment: { type: "integer", description: "1-10 values alignment score" },
              red_flags: { type: "array", items: { type: "string" }, description: "List of red flags, empty if none" },
              summary: { type: "string", description: "2-3 sentence assessment summary" },
              overall_score: { type: "integer", description: "1-10 overall motivation score" },
              recommendation: {
                type: "string",
                enum: ["strong_yes", "yes", "maybe", "no", "strong_no"],
                description: "Hiring recommendation",
              },
            },
            required: ["sincerity", "specificity", "effort", "alignment", "red_flags", "summary", "overall_score", "recommendation"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent || typeof rawContent !== 'string') return;

    const analysis = JSON.parse(rawContent);

    // Update the rep application with AI review results
    await database
      .update(repApplications)
      .set({
        aiMotivationScore: analysis.overall_score,
        aiMotivationAnalysis: analysis,
        aiReviewedAt: new Date(),
      })
      .where(eq(repApplications.repId, repId));

    console.log(
      `[AI Motivation Review] Rep ${repId}: score=${analysis.overall_score}/10, recommendation=${analysis.recommendation}`
    );
  } catch (err: any) {
    console.error(`[AI Motivation Review] Error for rep ${repId}:`, err.message);
  }
}

/* ═══════════════════════════════════════════════════
   REP SUPPORT TICKETS ROUTER
   AI triage → Owner SMS approval → Rep notification
   ═══════════════════════════════════════════════════ */
export const repSupportTicketsRouter = router({
  // Submit a new support ticketet
  submit: protectedProcedure
    .input(z.object({
      subject: z.string().min(3).max(255),
      description: z.string().min(10),
      category: z.enum(["technical", "billing", "lead_issue", "training", "feature_request", "other"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "Not a rep" });

      // 1. Create the ticket
      const ticketId = await db.createSupportTicket({
        repId: rep.id,
        subject: input.subject,
        description: input.description,
        category: input.category || "other",
        priority: input.priority || "medium",
        status: "open",
      });

      // 2. AI analysis (async but we await it for the SMS)
      let aiAnalysis = "";
      let aiSolution = "";
      let aiConfidence = "0.50";
      try {
        const { invokeLLM } = await import("./_core/llm");
        const aiResult = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a support ticket triage AI for MiniMorph Studios, a web design agency. Analyze the support ticket and provide:
1. A brief analysis of the issue
2. A proposed solution or action
3. A confidence score (0.0 to 1.0) for your proposed solution

Return JSON: { "analysis": "...", "solution": "...", "confidence": 0.85 }`,
            },
            {
              role: "user",
              content: `Ticket from rep "${rep.fullName}":
Subject: ${input.subject}
Category: ${input.category || "other"}
Priority: ${input.priority || "medium"}
Description: ${input.description}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "ticket_triage",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  analysis: { type: "string", description: "Analysis of the issue" },
                  solution: { type: "string", description: "Proposed solution" },
                  confidence: { type: "number", description: "Confidence score 0-1" },
                },
                required: ["analysis", "solution", "confidence"],
                additionalProperties: false,
              },
            },
          },
        });
        const rawContent = aiResult.choices[0].message.content;
        const parsed = JSON.parse(typeof rawContent === "string" ? rawContent : "{}");
        aiAnalysis = parsed.analysis || "";
        aiSolution = parsed.solution || "";
        aiConfidence = String(Math.min(1, Math.max(0, parsed.confidence || 0.5)));
      } catch (err) {
        console.error("[Support Ticket] AI triage failed:", err);
        aiAnalysis = "AI analysis unavailable — manual review required.";
        aiSolution = "Please review this ticket manually.";
      }

      // 3. Update ticket with AI results
      await db.updateSupportTicket(ticketId, {
        aiAnalysis,
        aiSolution,
        aiConfidence,
        status: "ai_reviewed",
      });

      // 4. Send SMS to owner for approval
      try {
        const { sendSms } = await import("./services/sms");
        const { ENV } = await import("./_core/env");

        // Send SMS directly to owner's phone
        if (ENV.ownerPhoneNumber) {
          const smsBody = `🎫 Ticket #${ticketId} — ${input.subject}\nRep: ${rep.fullName} | Priority: ${input.priority || "medium"}\n\nAI: ${aiAnalysis}\nSolution: ${aiSolution}\nConfidence: ${(parseFloat(aiConfidence) * 100).toFixed(0)}%\n\nReply YES to approve or NO to reject.`;
          await sendSms({ to: ENV.ownerPhoneNumber, body: smsBody });
          console.log(`[Support Ticket] SMS sent to owner at ${ENV.ownerPhoneNumber}`);
        }

        // Also send via notification system (push/in-app)
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({
          title: `🎫 Support Ticket #${ticketId} — Needs Approval`,
          content: `Rep: ${rep.fullName}\nSubject: ${input.subject}\nPriority: ${input.priority || "medium"}\n\nAI Analysis: ${aiAnalysis}\n\nProposed Solution: ${aiSolution}\n\nConfidence: ${(parseFloat(aiConfidence) * 100).toFixed(0)}%\n\nReply YES to approve or NO to reject.`,
        });

        // Update ticket to pending_approval
        await db.updateSupportTicket(ticketId, {
          status: "pending_approval",
          ownerApproval: "pending",
        });
      } catch (err) {
        console.error("[Support Ticket] Owner notification failed:", err);
      }

      return { ticketId, aiAnalysis, aiSolution, aiConfidence: parseFloat(aiConfidence) };
    }),

  // List my tickets
  myTickets: protectedProcedure
    .query(async ({ ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) return [];
      return db.listRepSupportTickets(rep.id);
    }),

  // Get a specific ticket
  getTicket: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "Not a rep" });
      const ticket = await db.getSupportTicketById(input.id);
      if (!ticket || ticket.repId !== rep.id) throw new TRPCError({ code: "NOT_FOUND" });
      return ticket;
    }),

  // Admin: list all tickets
  adminList: adminProcedure
    .query(async () => {
      return db.listAllSupportTickets();
    }),

  // Admin: manually approve/reject a ticket
  adminResolve: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      approved: z.boolean(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const ticket = await db.getSupportTicketById(input.ticketId);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

      await db.updateSupportTicket(input.ticketId, {
        status: input.approved ? "approved" : "rejected",
        ownerApproval: input.approved ? "approved" : "rejected",
        ownerNotes: input.notes || undefined,
        resolvedAt: new Date(),
      });

      // Notify the rep
      await db.createRepNotification({
        repId: ticket.repId,
        type: "general",
        title: input.approved ? "✅ Ticket Approved" : "❌ Ticket Rejected",
        message: input.approved
          ? `Your ticket "${ticket.subject}" has been approved. Solution: ${ticket.aiSolution?.slice(0, 200) || "See ticket details."}`
          : `Your ticket "${ticket.subject}" was not approved.${input.notes ? ` Notes: ${input.notes}` : ""}`,
        metadata: { ticketId: input.ticketId },
      });

      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   REP NOTIFICATION PREFERENCES ROUTER
   ═══════════════════════════════════════════════════════ */
export const repNotifPrefsRouter = router({
  // Get my notification preferences
  myPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) return [];
      // Initialize defaults if none exist
      await db.initDefaultNotificationPreferences(rep.id);
      return db.getRepNotificationPreferences(rep.id);
    }),

  // Update a preference
  update: protectedProcedure
    .input(z.object({
      category: z.string(),
      enabled: z.boolean(),
      pushEnabled: z.boolean(),
      inAppEnabled: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "Not a rep" });
      await db.upsertNotificationPreference(rep.id, input.category, input.enabled, input.pushEnabled, input.inAppEnabled);
      return { success: true };
    }),

  // Subscribe to push notifications
  subscribePush: protectedProcedure
    .input(z.object({
      endpoint: z.string(),
      p256dh: z.string(),
      auth: z.string(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const rep = await db.getRepByUserId(ctx.user.id);
      if (!rep) throw new TRPCError({ code: "FORBIDDEN", message: "Not a rep" });
      await db.savePushSubscription({
        repId: rep.id,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userAgent: input.userAgent,
      });
      return { success: true };
    }),

  // Unsubscribe from push notifications
  unsubscribePush: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ input }) => {
      await db.deletePushSubscription(input.endpoint);
      return { success: true };
    }),

  // Get VAPID public key for client-side push subscription
  vapidPublicKey: protectedProcedure
    .query(async () => {
      const { ENV } = await import("./_core/env");
      return { vapidPublicKey: ENV.vapidPublicKey };
    }),
});
