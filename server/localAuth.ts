/**
 * Local Email/Password Authentication
 * For reps and customers — email/password based.
 * Admin continues to use platform OAuth.
 */
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

const SALT_ROUNDS = 12;

/** Generate a unique openId for local (email/password) users */
function generateLocalOpenId(): string {
  return "local_" + randomBytes(16).toString("base64url");
}

export const localAuthRouter = router({
  /** Register a new user with email + password */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().min(1, "Name is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if email already exists
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists. Please log in instead.",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

      // Generate a local openId
      const openId = generateLocalOpenId();

      // Create user
      await db.upsertUser({
        openId,
        name: input.name,
        email: input.email,
        loginMethod: "email_password",
        passwordHash,
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create account" });
      }

      // Create session token and set cookie
      const sessionToken = await sdk.createSessionToken(openId, {
        name: input.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      };
    }),

  /** Log in with email + password */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      // Update last sign-in
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      // Create session token and set cookie
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Determine where to redirect
      const rep = await db.getRepByUserId(user.id);
      const redirectTo = rep ? "/rep/dashboard" : "/customer/portal";

      return {
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        isRep: !!rep,
        redirectTo,
      };
    }),

  /** Get current auth status (works for both OAuth and local users) */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const rep = await db.getRepByUserId(ctx.user.id);
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
      isRep: !!rep,
      repStatus: rep?.status ?? null,
    };
  }),
});
