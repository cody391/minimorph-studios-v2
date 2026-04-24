import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Phase C tests: Customer portal completion
 * - C1: Referrals tab procedures exist
 * - C2: Support request procedures exist and reject unauth
 * - C4: Ownership checks on byCustomer procedures
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 999,
    openId: "test-portal-user",
    email: "portal@example.com",
    name: "Test Portal User",
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

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin-user",
    email: "admin@example.com",
    name: "Test Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
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

describe("Phase C: Support request procedures", () => {
  it("nurture.createSupportRequest exists on the router", () => {
    expect(appRouter._def.procedures).toHaveProperty("nurture.createSupportRequest");
  });

  it("nurture.mySupportLogs exists on the router", () => {
    expect(appRouter._def.procedures).toHaveProperty("nurture.mySupportLogs");
  });

  it("createSupportRequest rejects unauthenticated callers", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.nurture.createSupportRequest({
        subject: "Test",
        message: "Test message",
        type: "support_request",
      })
    ).rejects.toThrow();
  });

  it("mySupportLogs rejects unauthenticated callers", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.nurture.mySupportLogs()).rejects.toThrow();
  });

  it("mySupportLogs returns empty array for user with no customer record", async () => {
    const ctx = createAuthContext({ id: 99999 });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nurture.mySupportLogs();
    expect(result).toEqual([]);
  });
});

describe("Phase C: Ownership checks on byCustomer procedures", () => {
  it("contracts.byCustomer rejects non-owner access", async () => {
    // User 999 doesn't own customer 1
    const ctx = createAuthContext({ id: 999 });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contracts.byCustomer({ customerId: 1 })
    ).rejects.toThrow("Access denied");
  });

  it("nurture.byCustomer rejects non-owner access", async () => {
    const ctx = createAuthContext({ id: 999 });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.nurture.byCustomer({ customerId: 1 })
    ).rejects.toThrow("Access denied");
  });

  it("reports.byCustomer rejects non-owner access", async () => {
    const ctx = createAuthContext({ id: 999 });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.reports.byCustomer({ customerId: 1 })
    ).rejects.toThrow("Access denied");
  });

  it("upsells.byCustomer rejects non-owner access", async () => {
    const ctx = createAuthContext({ id: 999 });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.upsells.byCustomer({ customerId: 1 })
    ).rejects.toThrow("Access denied");
  });

  it("admin can access any customer's contracts", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Admin should not throw — returns empty array for non-existent customer
    const result = await caller.contracts.byCustomer({ customerId: 99999 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can access any customer's reports", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reports.byCustomer({ customerId: 99999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Phase C: Onboarding ownership check", () => {
  it("onboarding.myProject exists on the router", () => {
    expect(appRouter._def.procedures).toHaveProperty("onboarding.myProject");
  });

  it("onboarding.myProject returns null for non-existent project", async () => {
    const ctx = createAuthContext({ id: 999 });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.myProject({ id: 99999 });
    expect(result).toBeNull();
  });
});
