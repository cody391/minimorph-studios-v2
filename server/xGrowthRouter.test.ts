import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@minimorph.com",
    name: "Admin User",
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

function createNonAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
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

describe("X Growth Engine - Access Control", () => {
  it("rejects unauthenticated users from dashboard metrics", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.xGrowthDashboard.rateLimits()).rejects.toThrow();
  });

  it("rejects non-admin users from dashboard metrics", async () => {
    const ctx = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.xGrowthDashboard.rateLimits()).rejects.toThrow();
  });

  it("allows admin users to access rate limits", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.xGrowthDashboard.rateLimits();
    // rateLimits returns the current rate limit status object
    expect(result).toBeDefined();
    expect(result).toHaveProperty("follows");
    expect(result).toHaveProperty("likes");
    expect(result).toHaveProperty("replies");
    expect(result).toHaveProperty("unfollows");
  });

  it("allows admin users to access today stats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.xGrowthDashboard.todayStats();
    // Should return an array (possibly empty)
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows admin users to access activity log", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.xGrowthDashboard.activityLog({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("X Growth Engine - Targets", () => {
  it("rejects unauthenticated users from targets", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.xGrowthTargets.list()).rejects.toThrow();
  });

  it("allows admin to list targets", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.xGrowthTargets.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows admin to add a target", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.xGrowthTargets.add({
      targetType: "keyword",
      value: "test_keyword_vitest",
      category: "brand_awareness",
      priority: 7,
    });
    expect(result).toHaveProperty("id");
    expect(result.id).toBeGreaterThan(0);

    // Clean up: delete the test target
    await caller.xGrowthTargets.delete({ id: result.id });
  });

  it("allows admin to seed default targets", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.xGrowthTargets.seedDefaults();
    expect(result).toHaveProperty("count");
    expect(typeof result.count).toBe("number");
  });
});

describe("X Growth Engine - Engagement", () => {
  it("rejects unauthenticated users from engagement actions", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.xEngagement.searchTweets({ query: "test", maxResults: 5 })
    ).rejects.toThrow();
  });

  it("allows admin to access the approval queue", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.xEngagement.approvalQueue();
    expect(Array.isArray(result)).toBe(true);
  });
});
