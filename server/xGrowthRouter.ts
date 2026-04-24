/**
 * X Growth Engine Router — Automated engagement, follow management,
 * target configuration, activity logging, and approval queue.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq, desc, and, sql, gte, count } from "drizzle-orm";
import {
  xEngagementLog,
  xFollowTracker,
  xGrowthTargets,
  xGrowthConfig,
} from "../drizzle/schema";
import * as xService from "./xService";

const ENGAGEMENT_CATEGORIES = ["rep_recruitment", "lead_gen", "brand_awareness", "authority", "general"] as const;

// ─── Growth Engine Dashboard ──────────────────────────────────────
export const xGrowthDashboardRouter = router({
  /** Get account metrics from X */
  accountMetrics: adminProcedure.query(async () => {
    const result = await xService.getAccountMetrics();
    if (!result.success) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
    }
    return result.metrics!;
  }),

  /** Get rate limit status for today */
  rateLimits: adminProcedure.query(async () => {
    return xService.getRateLimitStatus();
  }),

  /** Get today's engagement stats from the log */
  todayStats: adminProcedure.query(async () => {
    const db = (await getDb())!;
    const today = new Date().toISOString().split("T")[0];
    const rows = await db
      .select({
        actionType: xEngagementLog.actionType,
        status: xEngagementLog.status,
        cnt: count(),
      })
      .from(xEngagementLog)
      .where(gte(xEngagementLog.createdAt, new Date(today + "T00:00:00Z")))
      .groupBy(xEngagementLog.actionType, xEngagementLog.status);

    return rows;
  }),

  /** Get recent engagement activity log */
  activityLog: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db
        .select()
        .from(xEngagementLog)
        .orderBy(desc(xEngagementLog.createdAt))
        .limit(input.limit);
    }),

  /** Get follow tracker summary */
  followStats: adminProcedure.query(async () => {
    const db = (await getDb())!;
    const totalFollowed = await db.select({ cnt: count() }).from(xFollowTracker);
    const followedBack = await db
      .select({ cnt: count() })
      .from(xFollowTracker)
      .where(eq(xFollowTracker.followedBack, true));
    const notUnfollowed = await db
      .select({ cnt: count() })
      .from(xFollowTracker)
      .where(sql`${xFollowTracker.unfollowedAt} IS NULL`);

    return {
      totalFollowed: totalFollowed[0]?.cnt || 0,
      followedBack: followedBack[0]?.cnt || 0,
      activeFollowing: notUnfollowed[0]?.cnt || 0,
    };
  }),
});

// ─── Engagement Actions (Manual / Queued) ─────────────────────────
export const xEngagementRouter = router({
  /** Search for tweets matching a query */
  searchTweets: adminProcedure
    .input(z.object({ query: z.string().min(1), maxResults: z.number().min(1).max(50).default(20) }))
    .mutation(async ({ input }) => {
      const result = await xService.searchTweets(input.query, input.maxResults);
      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
      }
      return result.tweets!;
    }),

  /** Search for users matching a query */
  searchUsers: adminProcedure
    .input(z.object({ query: z.string().min(1), maxResults: z.number().min(1).max(20).default(10) }))
    .mutation(async ({ input }) => {
      const result = await xService.searchUsers(input.query, input.maxResults);
      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
      }
      return result.users!;
    }),

  /** Follow a user */
  followUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      username: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      followersCount: z.number().optional(),
      category: z.enum(ENGAGEMENT_CATEGORIES).default("general"),
    }))
    .mutation(async ({ input }) => {
      const result = await xService.followUser(input.userId);
      const db = (await getDb())!;

      // Log the action
      await db.insert(xEngagementLog).values({
        actionType: "follow",
        targetUserId: input.userId,
        targetUsername: input.username,
        status: result.success ? "executed" : "failed",
        failureReason: result.error || null,
        category: input.category,
      });

      // Track the follow
      if (result.success) {
        await db.insert(xFollowTracker).values({
          userId: input.userId,
          username: input.username,
          name: input.name || null,
          description: input.description || null,
          followersCount: input.followersCount || null,
          category: input.category,
        });
      }

      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
      }
      return { success: true };
    }),

  /** Unfollow a user */
  unfollowUser: adminProcedure
    .input(z.object({ userId: z.string(), username: z.string() }))
    .mutation(async ({ input }) => {
      const result = await xService.unfollowUser(input.userId);
      const db = (await getDb())!;

      await db.insert(xEngagementLog).values({
        actionType: "unfollow",
        targetUserId: input.userId,
        targetUsername: input.username,
        status: result.success ? "executed" : "failed",
        failureReason: result.error || null,
        category: "general",
      });

      if (result.success) {
        await db
          .update(xFollowTracker)
          .set({ unfollowedAt: new Date() })
          .where(eq(xFollowTracker.userId, input.userId));
      }

      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
      }
      return { success: true };
    }),

  /** Like a tweet */
  likeTweet: adminProcedure
    .input(z.object({
      tweetId: z.string(),
      authorUsername: z.string().optional(),
      tweetText: z.string().optional(),
      category: z.enum(ENGAGEMENT_CATEGORIES).default("general"),
    }))
    .mutation(async ({ input }) => {
      const result = await xService.likeTweet(input.tweetId);
      const db = (await getDb())!;

      await db.insert(xEngagementLog).values({
        actionType: "like",
        targetTweetId: input.tweetId,
        targetUsername: input.authorUsername || null,
        targetTweetText: input.tweetText || null,
        status: result.success ? "executed" : "failed",
        failureReason: result.error || null,
        category: input.category,
      });

      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
      }
      return { success: true };
    }),

  /** Queue a reply for approval (doesn't send immediately) */
  queueReply: adminProcedure
    .input(z.object({
      tweetId: z.string(),
      authorUsername: z.string().optional(),
      tweetText: z.string().optional(),
      replyText: z.string().min(1),
      category: z.enum(ENGAGEMENT_CATEGORIES).default("general"),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [entry] = await db.insert(xEngagementLog).values({
        actionType: "reply",
        targetTweetId: input.tweetId,
        targetUsername: input.authorUsername || null,
        targetTweetText: input.tweetText || null,
        replyText: input.replyText,
        status: "pending_approval",
        category: input.category,
      }).$returningId();

      return { id: entry.id, status: "pending_approval" };
    }),

  /** Approve and send a queued reply */
  approveReply: adminProcedure
    .input(z.object({ logId: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [entry] = await db
        .select()
        .from(xEngagementLog)
        .where(and(eq(xEngagementLog.id, input.logId), eq(xEngagementLog.status, "pending_approval")))
        .limit(1);

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reply not found or already processed" });
      }

      const result = await xService.replyToTweet(entry.targetTweetId!, entry.replyText!);

      await db
        .update(xEngagementLog)
        .set({ status: result.success ? "executed" : "failed", failureReason: result.error || null })
        .where(eq(xEngagementLog.id, input.logId));

      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
      }
      return { success: true, replyUrl: result.replyUrl };
    }),

  /** Reject a queued reply */
  rejectReply: adminProcedure
    .input(z.object({ logId: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db
        .update(xEngagementLog)
        .set({ status: "rejected" })
        .where(and(eq(xEngagementLog.id, input.logId), eq(xEngagementLog.status, "pending_approval")));
      return { success: true };
    }),

  /** Get pending approval queue */
  approvalQueue: adminProcedure.query(async () => {
    const db = (await getDb())!;
    return db
      .select()
      .from(xEngagementLog)
      .where(eq(xEngagementLog.status, "pending_approval"))
      .orderBy(desc(xEngagementLog.createdAt));
  }),

  /** Get our followers list */
  getFollowers: adminProcedure
    .input(z.object({ maxResults: z.number().min(1).max(100).default(50) }))
    .mutation(async ({ input }) => {
      const result = await xService.getFollowers(input.maxResults);
      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
      }
      return result.followers!;
    }),

  /** Get who we're following */
  getFollowing: adminProcedure
    .input(z.object({ maxResults: z.number().min(1).max(100).default(50) }))
    .mutation(async ({ input }) => {
      const result = await xService.getFollowing(input.maxResults);
      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
      }
      return result.following!;
    }),
});

// ─── Growth Targets Configuration ─────────────────────────────────
export const xGrowthTargetsRouter = router({
  /** List all targets */
  list: adminProcedure.query(async () => {
    const db = (await getDb())!;
    return db.select().from(xGrowthTargets).orderBy(desc(xGrowthTargets.priority));
  }),

  /** Add a new target */
  add: adminProcedure
    .input(z.object({
      targetType: z.enum(["keyword", "hashtag", "account", "community"]),
      value: z.string().min(1),
      category: z.enum(["rep_recruitment", "lead_gen", "brand_awareness", "authority"]),
      priority: z.number().min(1).max(10).default(5),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(xGrowthTargets).values({
        targetType: input.targetType,
        value: input.value,
        category: input.category,
        priority: input.priority,
      }).$returningId();
      return { id: result.id };
    }),

  /** Toggle a target active/inactive */
  toggle: adminProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db
        .update(xGrowthTargets)
        .set({ isActive: input.isActive })
        .where(eq(xGrowthTargets.id, input.id));
      return { success: true };
    }),

  /** Delete a target */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      await db.delete(xGrowthTargets).where(eq(xGrowthTargets.id, input.id));
      return { success: true };
    }),

  /** Seed default targets for MiniMorph Studios */
  seedDefaults: adminProcedure.mutation(async () => {
    const db = (await getDb())!;
    const defaults = [
      // Rep recruitment targets
      { targetType: "hashtag" as const, value: "#remotesales", category: "rep_recruitment" as const, priority: 8 },
      { targetType: "hashtag" as const, value: "#sidehustle", category: "rep_recruitment" as const, priority: 8 },
      { targetType: "hashtag" as const, value: "#salesjobs", category: "rep_recruitment" as const, priority: 7 },
      { targetType: "hashtag" as const, value: "#freelancesales", category: "rep_recruitment" as const, priority: 7 },
      { targetType: "keyword" as const, value: "looking for remote sales", category: "rep_recruitment" as const, priority: 9 },
      { targetType: "keyword" as const, value: "commission based work", category: "rep_recruitment" as const, priority: 8 },
      // Lead gen targets
      { targetType: "hashtag" as const, value: "#smallbusiness", category: "lead_gen" as const, priority: 9 },
      { targetType: "hashtag" as const, value: "#entrepreneur", category: "lead_gen" as const, priority: 8 },
      { targetType: "hashtag" as const, value: "#needawebsite", category: "lead_gen" as const, priority: 10 },
      { targetType: "keyword" as const, value: "need a website for my business", category: "lead_gen" as const, priority: 10 },
      { targetType: "keyword" as const, value: "small business website", category: "lead_gen" as const, priority: 9 },
      { targetType: "keyword" as const, value: "website redesign", category: "lead_gen" as const, priority: 8 },
      // Brand awareness targets
      { targetType: "hashtag" as const, value: "#webdesign", category: "brand_awareness" as const, priority: 7 },
      { targetType: "hashtag" as const, value: "#digitalmarketing", category: "brand_awareness" as const, priority: 6 },
      { targetType: "hashtag" as const, value: "#AIwebdesign", category: "brand_awareness" as const, priority: 8 },
      // Authority targets
      { targetType: "hashtag" as const, value: "#startups", category: "authority" as const, priority: 6 },
      { targetType: "hashtag" as const, value: "#growthhacking", category: "authority" as const, priority: 6 },
      { targetType: "keyword" as const, value: "AI web development", category: "authority" as const, priority: 7 },
    ];

    for (const target of defaults) {
      await db.insert(xGrowthTargets).values(target);
    }

    return { count: defaults.length };
  }),
});

// ─── Follow Tracker ───────────────────────────────────────────────
export const xFollowTrackerRouter = router({
  /** List tracked follows */
  list: adminProcedure
    .input(z.object({
      activeOnly: z.boolean().default(true),
      limit: z.number().min(1).max(200).default(100),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      let query = db.select().from(xFollowTracker).orderBy(desc(xFollowTracker.followedAt)).limit(input.limit);
      if (input.activeOnly) {
        return db
          .select()
          .from(xFollowTracker)
          .where(sql`${xFollowTracker.unfollowedAt} IS NULL`)
          .orderBy(desc(xFollowTracker.followedAt))
          .limit(input.limit);
      }
      return query;
    }),
});
