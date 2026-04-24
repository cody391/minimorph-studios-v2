import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the surgical customer post-payment chain fixes:
 * Fix 4: customers.me procedure (protectedProcedure, returns customer for logged-in user)
 * Fix 6: retention.submitReferral uses sendReferralInviteEmail (no TS error)
 *
 * Fixes 1-3 (webhook creates customer/contract/onboarding) are tested via
 * integration with the Stripe webhook handler, which requires a real DB.
 * These unit tests verify the tRPC layer is wired correctly.
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 999,
    openId: "test-customer-user",
    email: "customer@example.com",
    name: "Test Customer",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("customers.me", () => {
  it("is a callable procedure on the router", () => {
    // Verify the procedure exists on the router (compile-time + runtime check)
    expect(appRouter._def.procedures).toHaveProperty("customers.me");
  });

  it("rejects unauthenticated callers", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.customers.me()).rejects.toThrow();
  });

  it("returns null when no customer record exists for user", async () => {
    // User ID 999 won't have a customer record in test DB
    const ctx = createAuthContext({ id: 999 });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customers.me();
    // Should return null, not throw — graceful empty state
    expect(result).toBeNull();
  });
});

describe("retention router", () => {
  it("submitNps procedure exists on the router", () => {
    expect(appRouter._def.procedures).toHaveProperty("retention.submitNps");
  });

  it("submitReferral procedure exists on the router", () => {
    expect(appRouter._def.procedures).toHaveProperty("retention.submitReferral");
  });

  it("myReferrals procedure exists on the router", () => {
    expect(appRouter._def.procedures).toHaveProperty("retention.myReferrals");
  });

  it("submitNps rejects unauthenticated callers", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.retention.submitNps({ score: 9, feedback: "Great service" })
    ).rejects.toThrow();
  });

  it("submitReferral rejects unauthenticated callers", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.retention.submitReferral({
        referredEmail: "friend@example.com",
        referredName: "Friend",
      })
    ).rejects.toThrow();
  });
});
