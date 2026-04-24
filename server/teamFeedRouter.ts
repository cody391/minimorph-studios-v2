/**
 * ═══════════════════════════════════════════════════════
 * TEAM FEED ROUTER — Community announcements, wins, tips, shoutouts
 * ═══════════════════════════════════════════════════════
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { teamFeed, reps, repTiers } from "../drizzle/schema";
import { desc, eq } from "drizzle-orm";

export const teamFeedRouter = router({
  /** List all feed entries (newest first, pinned on top) */
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const entries = await db
      .select({
        id: teamFeed.id,
        repId: teamFeed.repId,
        type: teamFeed.type,
        title: teamFeed.title,
        content: teamFeed.content,
        metadata: teamFeed.metadata,
        isPinned: teamFeed.isPinned,
        likes: teamFeed.likes,
        createdAt: teamFeed.createdAt,
        repName: reps.fullName,
        repPhoto: reps.profilePhotoUrl,
      })
      .from(teamFeed)
      .leftJoin(reps, eq(teamFeed.repId, reps.id))
      .orderBy(desc(teamFeed.isPinned), desc(teamFeed.createdAt))
      .limit(50);
    return entries;
  }),

  /** Get Platinum mentors */
  mentors: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const mentors = await db
      .select({
        id: reps.id,
        fullName: reps.fullName,
        profilePhotoUrl: reps.profilePhotoUrl,
      })
      .from(reps)
      .innerJoin(repTiers, eq(reps.id, repTiers.repId))
      .where(eq(repTiers.tier, "platinum"));
    return mentors;
  }),

  /** Create a new post (reps can post tips and shoutouts) */
  create: protectedProcedure
    .input(z.object({
      type: z.enum(["tip", "shoutout"]),
      title: z.string().min(1).max(255),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const rep = await db.select().from(reps).where(eq(reps.userId, ctx.user.id)).limit(1);
      if (!rep.length) throw new TRPCError({ code: "FORBIDDEN", message: "Rep profile required" });

      await db.insert(teamFeed).values({
        repId: rep[0].id,
        type: input.type,
        title: input.title,
        content: input.content,
      });
      return { success: true };
    }),

  /** Like a post */
  like: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const entry = await db.select().from(teamFeed).where(eq(teamFeed.id, input.id)).limit(1);
      if (!entry.length) throw new TRPCError({ code: "NOT_FOUND" });
      await db.update(teamFeed).set({ likes: (entry[0].likes || 0) + 1 }).where(eq(teamFeed.id, input.id));
      return { success: true };
    }),
});
