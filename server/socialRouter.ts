/**
 * Social Media Management Router — Accounts, posts, campaigns, content calendar,
 * brand kit, analytics, AI content generation, and rep content library.
 * Split from main routers.ts to keep files manageable.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eq, desc, and, gte, lte, sql, asc } from "drizzle-orm";
import {
  socialAccounts, InsertSocialAccount,
  socialCampaigns, InsertSocialCampaign,
  socialPosts, InsertSocialPost,
  contentCalendar, InsertContentCalendarEntry,
  brandAssets, InsertBrandAsset,
  socialAnalytics,
  socialContentLibrary, InsertSocialContentLibraryEntry,
} from "../drizzle/schema";

const PLATFORMS = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "pinterest", "threads"] as const;
type Platform = typeof PLATFORMS[number];

/* ═══════════════════════════════════════════════════════
   SOCIAL ACCOUNTS ROUTER
   ═══════════════════════════════════════════════════════ */
export const socialAccountsRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    return db.select().from(socialAccounts).orderBy(asc(socialAccounts.platform));
  }),

  create: adminProcedure
    .input(z.object({
      platform: z.enum(PLATFORMS),
      accountName: z.string().min(1),
      accountId: z.string().optional(),
      profileUrl: z.string().optional(),
      profileImageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(socialAccounts).values({
        platform: input.platform,
        accountName: input.accountName,
        accountId: input.accountId || null,
        profileUrl: input.profileUrl || null,
        profileImageUrl: input.profileImageUrl || null,
        status: "pending",
      });
      return { id: result.insertId, message: `${input.platform} account added. Connect API keys to activate.` };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      accountName: z.string().optional(),
      accountId: z.string().optional(),
      profileUrl: z.string().optional(),
      profileImageUrl: z.string().optional(),
      status: z.enum(["connected", "disconnected", "expired", "pending"]).optional(),
      followerCount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const db = (await getDb())!;
      await db.update(socialAccounts).set(data).where(eq(socialAccounts.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.delete(socialAccounts).where(eq(socialAccounts.id, input.id));
      return { success: true };
    }),

  getStats: adminProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const accounts = await db.select().from(socialAccounts);
    const connected = accounts.filter(a => a.status === "connected").length;
    const pending = accounts.filter(a => a.status === "pending").length;
    return {
      total: accounts.length,
      connected,
      pending,
      platforms: accounts.map(a => ({ platform: a.platform, name: a.accountName, status: a.status })),
    };
  }),
});

/* ═══════════════════════════════════════════════════════
   SOCIAL CAMPAIGNS ROUTER
   ═══════════════════════════════════════════════════════ */
export const socialCampaignsRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    return db.select().from(socialCampaigns).orderBy(desc(socialCampaigns.createdAt));
  }),

  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [campaign] = await db.select().from(socialCampaigns).where(eq(socialCampaigns.id, input.id));
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      // Get associated posts
      const posts = await db.select().from(socialPosts).where(eq(socialPosts.campaignId, input.id));
      return { ...campaign, posts };
    }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      goal: z.enum(["brand_awareness", "lead_generation", "engagement", "traffic", "recruitment", "product_launch", "event_promotion", "customer_retention"]),
      platforms: z.array(z.enum(PLATFORMS)),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      budget: z.number().optional(),
      targetAudience: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(socialCampaigns).values({
        name: input.name,
        description: input.description || null,
        goal: input.goal,
        platforms: input.platforms,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        budget: input.budget?.toString() || null,
        targetAudience: input.targetAudience || null,
        status: "draft",
      });
      return { id: result.insertId };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      goal: z.enum(["brand_awareness", "lead_generation", "engagement", "traffic", "recruitment", "product_launch", "event_promotion", "customer_retention"]).optional(),
      platforms: z.array(z.enum(PLATFORMS)).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      budget: z.number().optional(),
      targetAudience: z.string().optional(),
      status: z.enum(["draft", "active", "paused", "completed", "archived"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, startDate, endDate, budget, ...rest } = input;
      const db = (await getDb())!;
      const data: Record<string, unknown> = { ...rest };
      if (startDate) data.startDate = new Date(startDate);
      if (endDate) data.endDate = new Date(endDate);
      if (budget !== undefined) data.budget = budget.toString();
      await db.update(socialCampaigns).set(data).where(eq(socialCampaigns.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.delete(socialCampaigns).where(eq(socialCampaigns.id, input.id));
      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   SOCIAL POSTS ROUTER
   ═══════════════════════════════════════════════════════ */
export const socialPostsRouter = router({
  list: adminProcedure
    .input(z.object({
      status: z.enum(["draft", "scheduled", "publishing", "published", "failed", "archived"]).optional(),
      platform: z.enum(PLATFORMS).optional(),
      campaignId: z.number().optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      let query = db.select().from(socialPosts).orderBy(desc(socialPosts.createdAt)).limit(input?.limit ?? 50);
      // Note: filtering done in-memory for simplicity with drizzle
      const all = await query;
      let filtered = all;
      if (input?.status) filtered = filtered.filter(p => p.status === input.status);
      if (input?.platform) filtered = filtered.filter(p => p.platform === input.platform);
      if (input?.campaignId) filtered = filtered.filter(p => p.campaignId === input.campaignId);
      return filtered;
    }),

  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, input.id));
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      return post;
    }),

  create: adminProcedure
    .input(z.object({
      platform: z.enum(PLATFORMS),
      content: z.string().min(1),
      mediaUrls: z.array(z.string()).optional(),
      mediaType: z.enum(["none", "image", "video", "carousel", "story", "reel"]).optional(),
      hashtags: z.array(z.string()).optional(),
      scheduledAt: z.string().optional(),
      campaignId: z.number().optional(),
      accountId: z.number().optional(),
      aiGenerated: z.boolean().optional(),
      aiPrompt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(socialPosts).values({
        platform: input.platform,
        content: input.content,
        mediaUrls: input.mediaUrls || null,
        mediaType: input.mediaType || "none",
        hashtags: input.hashtags || null,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        campaignId: input.campaignId || null,
        accountId: input.accountId || null,
        status: input.scheduledAt ? "scheduled" : "draft",
        aiGenerated: input.aiGenerated || false,
        aiPrompt: input.aiPrompt || null,
        createdBy: ctx.user.id,
      });
      return { id: result.insertId };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      content: z.string().optional(),
      mediaUrls: z.array(z.string()).optional(),
      mediaType: z.enum(["none", "image", "video", "carousel", "story", "reel"]).optional(),
      hashtags: z.array(z.string()).optional(),
      scheduledAt: z.string().optional(),
      status: z.enum(["draft", "scheduled", "publishing", "published", "failed", "archived"]).optional(),
      campaignId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, scheduledAt, ...rest } = input;
      const db = (await getDb())!;
      const data: Record<string, unknown> = { ...rest };
      if (scheduledAt) data.scheduledAt = new Date(scheduledAt);
      await db.update(socialPosts).set(data).where(eq(socialPosts.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.delete(socialPosts).where(eq(socialPosts.id, input.id));
      return { success: true };
    }),

  // Bulk create posts for multiple platforms from same content
  bulkCreate: adminProcedure
    .input(z.object({
      platforms: z.array(z.enum(PLATFORMS)),
      content: z.string().min(1),
      mediaUrls: z.array(z.string()).optional(),
      hashtags: z.array(z.string()).optional(),
      scheduledAt: z.string().optional(),
      campaignId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const ids: number[] = [];
      for (const platform of input.platforms) {
        const [result] = await db.insert(socialPosts).values({
          platform,
          content: input.content,
          mediaUrls: input.mediaUrls || null,
          hashtags: input.hashtags || null,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          campaignId: input.campaignId || null,
          status: input.scheduledAt ? "scheduled" : "draft",
          createdBy: ctx.user.id,
        });
        ids.push(result.insertId);
      }
      return { ids, count: ids.length };
    }),

  getStats: adminProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const posts = await db.select().from(socialPosts);
    const drafts = posts.filter(p => p.status === "draft").length;
    const scheduled = posts.filter(p => p.status === "scheduled").length;
    const published = posts.filter(p => p.status === "published").length;
    const failed = posts.filter(p => p.status === "failed").length;
    const totalEngagement = posts.reduce((sum, p) =>
      sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0);
    const totalImpressions = posts.reduce((sum, p) => sum + (p.impressions || 0), 0);
    return { total: posts.length, drafts, scheduled, published, failed, totalEngagement, totalImpressions };
  }),
});

/* ═══════════════════════════════════════════════════════
   CONTENT CALENDAR ROUTER
   ═══════════════════════════════════════════════════════ */
export const contentCalendarRouter = router({
  list: adminProcedure
    .input(z.object({
      startDate: z.string().optional(), // YYYY-MM-DD
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const entries = await db.select().from(contentCalendar).orderBy(asc(contentCalendar.scheduledDate));
      if (input?.startDate && input?.endDate) {
        return entries.filter(e => e.scheduledDate >= input.startDate! && e.scheduledDate <= input.endDate!);
      }
      return entries;
    }),

  create: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      platforms: z.array(z.enum(["instagram", "facebook", "linkedin", "tiktok", "x", "all"])),
      scheduledDate: z.string(), // YYYY-MM-DD
      scheduledTime: z.string().optional(), // HH:MM
      contentType: z.enum(["post", "story", "reel", "video", "carousel", "article", "poll", "event"]).optional(),
      campaignId: z.number().optional(),
      color: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(contentCalendar).values({
        title: input.title,
        description: input.description || null,
        platforms: input.platforms,
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime || null,
        contentType: input.contentType || "post",
        campaignId: input.campaignId || null,
        color: input.color || null,
        notes: input.notes || null,
        status: "planned",
        createdBy: ctx.user.id,
      });
      return { id: result.insertId };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      platforms: z.array(z.enum(["instagram", "facebook", "linkedin", "tiktok", "x", "all"])).optional(),
      scheduledDate: z.string().optional(),
      scheduledTime: z.string().optional(),
      contentType: z.enum(["post", "story", "reel", "video", "carousel", "article", "poll", "event"]).optional(),
      status: z.enum(["idea", "planned", "in_progress", "ready", "published", "skipped"]).optional(),
      postId: z.number().optional(),
      campaignId: z.number().optional(),
      color: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const db = (await getDb())!;
      await db.update(contentCalendar).set(data).where(eq(contentCalendar.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.delete(contentCalendar).where(eq(contentCalendar.id, input.id));
      return { success: true };
    }),
});

/* ═══════════════════════════════════════════════════════
   BRAND ASSETS ROUTER
   ═══════════════════════════════════════════════════════ */
export const brandAssetsRouter = router({
  list: adminProcedure
    .input(z.object({
      category: z.enum(["color", "font", "logo", "voice", "template", "image", "guideline"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const assets = await db.select().from(brandAssets).orderBy(asc(brandAssets.sortOrder));
      if (input?.category) return assets.filter(a => a.category === input.category);
      return assets;
    }),

  create: adminProcedure
    .input(z.object({
      category: z.enum(["color", "font", "logo", "voice", "template", "image", "guideline"]),
      name: z.string().min(1),
      value: z.string().optional(),
      description: z.string().optional(),
      url: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(brandAssets).values({
        category: input.category,
        name: input.name,
        value: input.value || null,
        description: input.description || null,
        url: input.url || null,
        sortOrder: input.sortOrder || 0,
      });
      return { id: result.insertId };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      value: z.string().optional(),
      description: z.string().optional(),
      url: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const db = (await getDb())!;
      await db.update(brandAssets).set(data).where(eq(brandAssets.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.delete(brandAssets).where(eq(brandAssets.id, input.id));
      return { success: true };
    }),

  // Seed default brand assets for MiniMorph
  seedDefaults: adminProcedure.mutation(async ({ ctx }) => {
    const db = (await getDb())!;
    const existing = await db.select().from(brandAssets);
    if (existing.length > 0) return { message: "Brand assets already exist", seeded: 0 };

    const defaults: InsertBrandAsset[] = [
      // Colors
      { category: "color", name: "Forest Green (Primary)", value: "#2D5016", description: "Main brand color — headers, CTAs, accents", sortOrder: 1 },
      { category: "color", name: "Warm Cream (Background)", value: "#FDF6EC", description: "Page backgrounds, cards", sortOrder: 2 },
      { category: "color", name: "Burnt Orange (Accent)", value: "#C4652A", description: "Highlights, hover states, emphasis", sortOrder: 3 },
      { category: "color", name: "Deep Charcoal (Text)", value: "#1A1A1A", description: "Body text, headings", sortOrder: 4 },
      { category: "color", name: "Sage Green (Secondary)", value: "#7A9E6D", description: "Secondary elements, badges", sortOrder: 5 },
      { category: "color", name: "Warm Gold", value: "#D4A843", description: "Premium accents, stars, ratings", sortOrder: 6 },
      // Fonts
      { category: "font", name: "Heading Font", value: "Playfair Display", description: "Serif font for headings — elegant, premium feel", sortOrder: 1 },
      { category: "font", name: "Body Font", value: "Inter", description: "Clean sans-serif for body text — highly readable", sortOrder: 2 },
      { category: "font", name: "Accent Font", value: "Lora", description: "Italic serif for quotes and emphasis", sortOrder: 3 },
      // Voice
      { category: "voice", name: "Brand Tone", value: "Warm, professional, approachable — like a trusted advisor who genuinely cares about your success. Never salesy or pushy.", description: "Overall brand voice direction", sortOrder: 1 },
      { category: "voice", name: "Do's", value: "Use 'we' and 'your'. Be specific with numbers. Show empathy. Use active voice. Keep sentences short.", description: "Writing guidelines to follow", sortOrder: 2 },
      { category: "voice", name: "Don'ts", value: "Never use jargon. Avoid 'synergy', 'leverage', 'disrupt'. Don't make promises we can't keep. No ALL CAPS.", description: "Writing guidelines to avoid", sortOrder: 3 },
      { category: "voice", name: "Tagline", value: "Websites that grow with your business", description: "Primary brand tagline", sortOrder: 4 },
      { category: "voice", name: "Elevator Pitch", value: "MiniMorph Studios builds premium websites for small businesses with 12 months of ongoing support, AI-powered account management, and monthly performance reports. We're not just a web agency — we're your digital growth partner.", description: "30-second brand description", sortOrder: 5 },
      // Guidelines
      { category: "guideline", name: "Social Media Voice", value: "Conversational but professional. Use emojis sparingly (1-2 per post max). Always include a CTA. Share real results and testimonials when possible.", description: "How to write social media posts", sortOrder: 1 },
      { category: "guideline", name: "Hashtag Strategy", value: "Mix of branded (#MiniMorph #MiniMorphStudios), industry (#WebDesign #SmallBusiness), and trending tags. 5-8 hashtags on Instagram, 2-3 on LinkedIn/X.", description: "Hashtag usage guidelines", sortOrder: 2 },
      { category: "guideline", name: "Visual Style", value: "Warm, organic color palette. Clean layouts with generous white space. Real photography over stock when possible. Subtle gradients and soft shadows.", description: "Visual design direction", sortOrder: 3 },
    ];

    for (const asset of defaults) {
      await db.insert(brandAssets).values(asset);
    }
    return { message: "Default brand assets seeded", seeded: defaults.length };
  }),
});

/* ═══════════════════════════════════════════════════════
   SOCIAL ANALYTICS ROUTER
   ═══════════════════════════════════════════════════════ */
export const socialAnalyticsRouter = router({
  getOverview: adminProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const accounts = await db.select().from(socialAccounts);
    const posts = await db.select().from(socialPosts);
    const campaigns = await db.select().from(socialCampaigns);

    const totalFollowers = accounts.reduce((sum, a) => sum + (a.followerCount || 0), 0);
    const publishedPosts = posts.filter(p => p.status === "published");
    const totalEngagement = publishedPosts.reduce((sum, p) =>
      sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0);
    const totalImpressions = publishedPosts.reduce((sum, p) => sum + (p.impressions || 0), 0);
    const totalReach = publishedPosts.reduce((sum, p) => sum + (p.reach || 0), 0);

    // Platform breakdown
    const platformStats = PLATFORMS.map(platform => {
      const acct = accounts.find(a => a.platform === platform);
      const platPosts = publishedPosts.filter(p => p.platform === platform);
      return {
        platform,
        connected: !!acct && acct.status === "connected",
        accountName: acct?.accountName || null,
        followers: acct?.followerCount || 0,
        posts: platPosts.length,
        engagement: platPosts.reduce((s, p) => s + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0),
        impressions: platPosts.reduce((s, p) => s + (p.impressions || 0), 0),
      };
    }).filter(p => p.posts > 0 || p.connected);

    return {
      totalFollowers,
      totalPosts: posts.length,
      publishedPosts: publishedPosts.length,
      scheduledPosts: posts.filter(p => p.status === "scheduled").length,
      draftPosts: posts.filter(p => p.status === "draft").length,
      totalEngagement,
      totalImpressions,
      totalReach,
      activeCampaigns: campaigns.filter(c => c.status === "active").length,
      platformStats,
    };
  }),

  // Get daily analytics for a date range
  getDailyMetrics: adminProcedure
    .input(z.object({
      startDate: z.string(), // YYYY-MM-DD
      endDate: z.string(),
      platform: z.enum(PLATFORMS).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const metrics = await db.select().from(socialAnalytics)
        .orderBy(asc(socialAnalytics.date));
      let filtered = metrics.filter(m => m.date >= input.startDate && m.date <= input.endDate);
      if (input.platform) filtered = filtered.filter(m => m.platform === input.platform);
      return filtered;
    }),

  // Record daily analytics snapshot (for manual entry or API sync)
  recordSnapshot: adminProcedure
    .input(z.object({
      accountId: z.number(),
      platform: z.enum(PLATFORMS),
      date: z.string(),
      followers: z.number().optional(),
      followersGained: z.number().optional(),
      impressions: z.number().optional(),
      reach: z.number().optional(),
      engagement: z.number().optional(),
      engagementRate: z.number().optional(),
      clicks: z.number().optional(),
      shares: z.number().optional(),
      profileViews: z.number().optional(),
      websiteClicks: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(socialAnalytics).values({
        accountId: input.accountId,
        platform: input.platform,
        date: input.date,
        followers: input.followers || 0,
        followersGained: input.followersGained || 0,
        impressions: input.impressions || 0,
        reach: input.reach || 0,
        engagement: input.engagement || 0,
        engagementRate: input.engagementRate?.toString() || "0",
        clicks: input.clicks || 0,
        shares: input.shares || 0,
        profileViews: input.profileViews || 0,
        websiteClicks: input.websiteClicks || 0,
      });
      return { id: result.insertId };
    }),
});

/* ═══════════════════════════════════════════════════════
   AI CONTENT GENERATION ROUTER
   ═══════════════════════════════════════════════════════ */
export const aiContentRouter = router({
  // Generate a single post for a specific platform
  generatePost: adminProcedure
    .input(z.object({
      platform: z.enum(PLATFORMS),
      topic: z.string().min(1),
      tone: z.string().optional(), // "professional", "casual", "humorous", etc.
      includeHashtags: z.boolean().default(true),
      includeEmoji: z.boolean().default(true),
      campaignGoal: z.string().optional(),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("./_core/llm");
      // Get brand voice from brand assets
      const db = (await getDb())!;
      const voiceAssets = await db.select().from(brandAssets)
        .where(eq(brandAssets.category, "voice"));
      const brandVoice = voiceAssets.map(v => `${v.name}: ${v.value}`).join("\n");

      const platformLimits: Record<string, string> = {
        instagram: "2,200 characters max. Visual-first. 20-30 hashtags work well. Use line breaks for readability.",
        facebook: "No strict limit but 40-80 characters get most engagement. Questions and stories work well.",
        linkedin: "3,000 characters max. Professional tone. Use bullet points. 3-5 hashtags max.",
        tiktok: "150 characters for caption. Trendy, casual, use trending sounds/hashtags references.",
        x: "280 characters max. Punchy, conversational. 1-2 hashtags max. Threads for longer content.",
        youtube: "5,000 characters for description. SEO-optimized. Include timestamps and links.",
        pinterest: "500 characters for description. Keyword-rich. Include relevant search terms.",
        threads: "500 characters. Conversational, authentic. Minimal hashtags.",
      };

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a social media content creator for MiniMorph Studios, a premium web design agency for small businesses.

BRAND VOICE:
${brandVoice || "Warm, professional, approachable — like a trusted advisor."}

PLATFORM: ${input.platform}
PLATFORM GUIDELINES: ${platformLimits[input.platform] || "Standard post format."}

Generate a single social media post. Return JSON with:
- content: the post text (properly formatted for the platform)
- hashtags: array of relevant hashtags (without #)
- suggestedMediaType: "image" | "video" | "carousel" | "none"
- suggestedMediaDescription: brief description of ideal accompanying media
- estimatedEngagement: "low" | "medium" | "high"
- bestTimeToPost: suggested time (e.g., "Tuesday 10am EST")`
          },
          {
            role: "user",
            content: `Topic: ${input.topic}
${input.tone ? `Tone: ${input.tone}` : ""}
${input.campaignGoal ? `Campaign Goal: ${input.campaignGoal}` : ""}
${input.additionalContext ? `Additional Context: ${input.additionalContext}` : ""}
${input.includeHashtags ? "Include relevant hashtags." : "No hashtags."}
${input.includeEmoji ? "Use emojis where appropriate." : "No emojis."}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "social_post",
            strict: true,
            schema: {
              type: "object",
              properties: {
                content: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } },
                suggestedMediaType: { type: "string" },
                suggestedMediaDescription: { type: "string" },
                estimatedEngagement: { type: "string" },
                bestTimeToPost: { type: "string" },
              },
              required: ["content", "hashtags", "suggestedMediaType", "suggestedMediaDescription", "estimatedEngagement", "bestTimeToPost"],
              additionalProperties: false,
            },
          },
        },
      });

      const generated = JSON.parse(String(result.choices[0].message.content || "{}"));
      return generated;
    }),

  // Generate posts for multiple platforms from a single brief
  generateMultiPlatform: adminProcedure
    .input(z.object({
      platforms: z.array(z.enum(PLATFORMS)),
      topic: z.string().min(1),
      tone: z.string().optional(),
      campaignGoal: z.string().optional(),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const db = (await getDb())!;
      const voiceAssets = await db.select().from(brandAssets)
        .where(eq(brandAssets.category, "voice"));
      const brandVoice = voiceAssets.map(v => `${v.name}: ${v.value}`).join("\n");

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a social media content creator for MiniMorph Studios.

BRAND VOICE:
${brandVoice || "Warm, professional, approachable."}

Generate unique, platform-optimized posts for each requested platform. Each post should be tailored to the platform's style and audience while maintaining consistent messaging.

Return a JSON object with a "posts" array, each containing:
- platform: the platform name
- content: the post text
- hashtags: array of hashtags (without #)
- suggestedMediaType: "image" | "video" | "carousel" | "none"
- characterCount: number of characters`
          },
          {
            role: "user",
            content: `Generate posts for: ${input.platforms.join(", ")}
Topic: ${input.topic}
${input.tone ? `Tone: ${input.tone}` : ""}
${input.campaignGoal ? `Goal: ${input.campaignGoal}` : ""}
${input.additionalContext ? `Context: ${input.additionalContext}` : ""}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "multi_platform_posts",
            strict: true,
            schema: {
              type: "object",
              properties: {
                posts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      platform: { type: "string" },
                      content: { type: "string" },
                      hashtags: { type: "array", items: { type: "string" } },
                      suggestedMediaType: { type: "string" },
                      characterCount: { type: "number" },
                    },
                    required: ["platform", "content", "hashtags", "suggestedMediaType", "characterCount"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["posts"],
              additionalProperties: false,
            },
          },
        },
      });

      return JSON.parse(String(result.choices[0].message.content || '{"posts":[]}'));
    }),

  // Generate a week of content from a strategy brief
  generateWeeklyPlan: adminProcedure
    .input(z.object({
      platforms: z.array(z.enum(PLATFORMS)),
      weekStartDate: z.string(), // YYYY-MM-DD
      themes: z.array(z.string()), // ["client spotlight", "industry tips", "behind the scenes"]
      postsPerDay: z.number().default(1),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const db = (await getDb())!;
      const voiceAssets = await db.select().from(brandAssets)
        .where(eq(brandAssets.category, "voice"));
      const brandVoice = voiceAssets.map(v => `${v.name}: ${v.value}`).join("\n");

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a social media strategist for MiniMorph Studios, a premium web design agency.

BRAND VOICE:
${brandVoice || "Warm, professional, approachable."}

Generate a full week (7 days) of social media content. For each day, create ${input.postsPerDay} post(s) distributed across the requested platforms.

Return JSON with a "days" array (7 items), each containing:
- date: YYYY-MM-DD
- dayOfWeek: "Monday", "Tuesday", etc.
- posts: array of posts for that day, each with:
  - platform: target platform
  - content: the post text
  - hashtags: array of hashtags
  - theme: which theme this post belongs to
  - contentType: "post" | "story" | "reel" | "carousel"
  - suggestedTime: best posting time (e.g., "10:00 AM")
  - suggestedMediaDescription: what image/video to use`
          },
          {
            role: "user",
            content: `Week starting: ${input.weekStartDate}
Platforms: ${input.platforms.join(", ")}
Themes to rotate: ${input.themes.join(", ")}
Posts per day: ${input.postsPerDay}
${input.additionalContext ? `Additional context: ${input.additionalContext}` : ""}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "weekly_content_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string" },
                      dayOfWeek: { type: "string" },
                      posts: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            platform: { type: "string" },
                            content: { type: "string" },
                            hashtags: { type: "array", items: { type: "string" } },
                            theme: { type: "string" },
                            contentType: { type: "string" },
                            suggestedTime: { type: "string" },
                            suggestedMediaDescription: { type: "string" },
                          },
                          required: ["platform", "content", "hashtags", "theme", "contentType", "suggestedTime", "suggestedMediaDescription"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["date", "dayOfWeek", "posts"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["days"],
              additionalProperties: false,
            },
          },
        },
      });

      return JSON.parse(String(result.choices[0].message.content || '{"days":[]}'));
    }),

  // Generate hashtag suggestions
  suggestHashtags: adminProcedure
    .input(z.object({
      topic: z.string().min(1),
      platform: z.enum(PLATFORMS),
      count: z.number().default(15),
    }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a social media hashtag strategist. Suggest ${input.count} hashtags for ${input.platform} related to the given topic. Mix branded, industry, and trending hashtags.

Return JSON with:
- hashtags: array of objects with { tag: string (without #), category: "branded" | "industry" | "trending" | "niche", popularity: "high" | "medium" | "low" }`
          },
          { role: "user", content: `Topic: ${input.topic}\nBrand: MiniMorph Studios (web design agency for small businesses)` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "hashtag_suggestions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                hashtags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tag: { type: "string" },
                      category: { type: "string" },
                      popularity: { type: "string" },
                    },
                    required: ["tag", "category", "popularity"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["hashtags"],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(String(result.choices[0].message.content || '{"hashtags":[]}'));
    }),

  // Repurpose content (turn a blog post, email, or description into social posts)
  repurposeContent: adminProcedure
    .input(z.object({
      sourceContent: z.string().min(1),
      sourceType: z.enum(["blog_post", "email", "description", "testimonial", "case_study", "announcement"]),
      targetPlatforms: z.array(z.enum(PLATFORMS)),
    }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const db = (await getDb())!;
      const voiceAssets = await db.select().from(brandAssets)
        .where(eq(brandAssets.category, "voice"));
      const brandVoice = voiceAssets.map(v => `${v.name}: ${v.value}`).join("\n");

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a content repurposing specialist for MiniMorph Studios.

BRAND VOICE:
${brandVoice || "Warm, professional, approachable."}

Take the source content and transform it into platform-specific social media posts. Each post should feel native to its platform, not like a copy-paste.

Return JSON with a "posts" array, each containing:
- platform: target platform
- content: the repurposed post text
- hashtags: relevant hashtags (without #)
- hook: the attention-grabbing first line
- cta: the call-to-action`
          },
          {
            role: "user",
            content: `Source type: ${input.sourceType}
Target platforms: ${input.targetPlatforms.join(", ")}

Source content:
${input.sourceContent}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "repurposed_content",
            strict: true,
            schema: {
              type: "object",
              properties: {
                posts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      platform: { type: "string" },
                      content: { type: "string" },
                      hashtags: { type: "array", items: { type: "string" } },
                      hook: { type: "string" },
                      cta: { type: "string" },
                    },
                    required: ["platform", "content", "hashtags", "hook", "cta"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["posts"],
              additionalProperties: false,
            },
          },
        },
      });
      return JSON.parse(String(result.choices[0].message.content || '{"posts":[]}'));
    }),
});

/* ═══════════════════════════════════════════════════════
   SOCIAL CONTENT LIBRARY ROUTER (for reps)
   ═══════════════════════════════════════════════════════ */
export const socialLibraryRouter = router({
  // Reps can see approved content
  listApproved: protectedProcedure
    .input(z.object({
      category: z.enum(["brand_awareness", "testimonial", "service_highlight", "industry_tip", "behind_the_scenes", "recruitment", "promotion", "educational"]).optional(),
      platform: z.enum(["instagram", "facebook", "linkedin", "tiktok", "x", "all"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const items = await db.select().from(socialContentLibrary)
        .where(eq(socialContentLibrary.isApproved, true))
        .orderBy(desc(socialContentLibrary.createdAt));
      let filtered = items;
      if (input?.category) filtered = filtered.filter(i => i.category === input.category);
      if (input?.platform && input.platform !== "all") filtered = filtered.filter(i => i.platform === input.platform || i.platform === "all");
      return filtered;
    }),

  // Admin: full CRUD
  listAll: adminProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    return db.select().from(socialContentLibrary).orderBy(desc(socialContentLibrary.createdAt));
  }),

  create: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      platform: z.enum(["instagram", "facebook", "linkedin", "tiktok", "x", "all"]),
      category: z.enum(["brand_awareness", "testimonial", "service_highlight", "industry_tip", "behind_the_scenes", "recruitment", "promotion", "educational"]),
      mediaUrls: z.array(z.string()).optional(),
      hashtags: z.array(z.string()).optional(),
      isApproved: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(socialContentLibrary).values({
        title: input.title,
        content: input.content,
        platform: input.platform,
        category: input.category,
        mediaUrls: input.mediaUrls || null,
        hashtags: input.hashtags || null,
        isApproved: input.isApproved,
      });
      return { id: result.insertId };
    }),

  approve: adminProcedure
    .input(z.object({ id: z.number(), approved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.update(socialContentLibrary)
        .set({ isApproved: input.approved })
        .where(eq(socialContentLibrary.id, input.id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.delete(socialContentLibrary).where(eq(socialContentLibrary.id, input.id));
      return { success: true };
    }),

  // Track when a rep shares content
  trackShare: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.update(socialContentLibrary)
        .set({ timesShared: sql`${socialContentLibrary.timesShared} + 1` })
        .where(eq(socialContentLibrary.id, input.id));
      return { success: true };
    }),
});
