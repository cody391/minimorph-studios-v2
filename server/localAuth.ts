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
      const redirectTo = rep ? "/rep" : "/customer/portal";

      return {
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        isRep: !!rep,
        redirectTo,
      };
    }),

  /** Request a password reset link — sends email with a 1-hour token */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email);
      // Always return success — don't reveal whether the email exists
      if (!user || !user.passwordHash) return { success: true };

      const { getDb } = await import("./db");
      const { passwordResetTokens } = await import("../drizzle/schema");
      const database = await getDb();
      if (!database) return { success: true };

      const rawToken = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await database.insert(passwordResetTokens).values({
        userId: user.id,
        token: rawToken,
        expiresAt,
      });

      const origin = (ctx.req.headers.origin as string) || "https://www.minimorphstudios.net";
      const resetUrl = `${origin}/reset-password?token=${rawToken}`;

      const { sendPasswordResetEmail } = await import("./services/customerEmails");
      await sendPasswordResetEmail({
        to: user.email!,
        name: user.name || user.email!,
        resetUrl,
      }).catch((e) => console.error("[Auth] Failed to send reset email:", e));

      return { success: true };
    }),

  /** Consume a password reset token and set a new password, then log in */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { passwordResetTokens, users: usersTable } = await import("../drizzle/schema");
      const { eq, and, isNull, gt } = await import("drizzle-orm");
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const now = new Date();
      const [row] = await database
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, input.token),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, now)
          )
        )
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This reset link is invalid or has expired. Please request a new one.",
        });
      }

      // Mark token as used
      await database
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(eq(passwordResetTokens.id, row.id));

      // Update password
      const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
      const [user] = await database
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, row.userId))
        .limit(1);

      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });

      await db.upsertUser({ openId: user.openId, passwordHash, lastSignedIn: now });

      // Auto-login
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return { success: true };
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
