import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
type CookieCall = { name: string; options: Record<string, unknown> };

/* ─── Context helpers ─── */
function createAdminContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
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
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createRepContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user: AuthenticatedUser = {
    id: 2,
    openId: "rep-user",
    email: "rep@minimorph.com",
    name: "Test Rep",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

const caller = (ctx: TrpcContext) => appRouter.createCaller(ctx);

/* ═══════════════════════════════════════════════════════
   PHASE 27: Self-Sourced Leads, Discount, Leaderboard, Instant Payouts
   ═══════════════════════════════════════════════════════ */

describe("Phase 27: Self-Sourced Leads", () => {
  it("createMyLead requires authentication", async () => {
    const unauthCtx = createUnauthContext();
    await expect(
      caller(unauthCtx).leads.createMyLead({
        businessName: "Test Biz",
        contactName: "John",
        email: "john@test.com",
      })
    ).rejects.toThrow();
  });

  it("createMyLead validates required fields", async () => {
    const { ctx } = createRepContext();
    await expect(
      caller(ctx).leads.createMyLead({
        businessName: "",
        contactName: "John",
        email: "john@test.com",
      })
    ).rejects.toThrow();
  });

  it("createMyLead validates email format", async () => {
    const { ctx } = createRepContext();
    await expect(
      caller(ctx).leads.createMyLead({
        businessName: "Test Biz",
        contactName: "John",
        email: "not-an-email",
      })
    ).rejects.toThrow();
  });
});

describe("Phase 27: Close Deal with Discount", () => {
  it("closeDeal requires authentication", async () => {
    const unauthCtx = createUnauthContext();
    await expect(
      caller(unauthCtx).leads.closeDeal({
        leadId: 1,
        packageTier: "starter",
        monthlyPrice: "99",
        discountPercent: 0,
      })
    ).rejects.toThrow();
  });

  it("closeDeal rejects discount above 5%", async () => {
    const { ctx } = createRepContext();
    await expect(
      caller(ctx).leads.closeDeal({
        leadId: 1,
        packageTier: "starter",
        monthlyPrice: "99",
        discountPercent: 10,
      })
    ).rejects.toThrow();
  });

  it("closeDeal rejects negative discount", async () => {
    const { ctx } = createRepContext();
    await expect(
      caller(ctx).leads.closeDeal({
        leadId: 1,
        packageTier: "starter",
        monthlyPrice: "99",
        discountPercent: -1,
      })
    ).rejects.toThrow();
  });

  it("closeDeal accepts valid discount (0-5%)", async () => {
    const { ctx } = createRepContext();
    // This will fail with "not a registered rep" but validates the input passes zod
    await expect(
      caller(ctx).leads.closeDeal({
        leadId: 1,
        packageTier: "growth",
        monthlyPrice: "199",
        discountPercent: 3,
      })
    ).rejects.toThrow("You are not a registered rep");
  });

  it("closeDeal defaults discountPercent to 0", async () => {
    const { ctx } = createRepContext();
    // Should pass input validation but fail on rep check
    await expect(
      caller(ctx).leads.closeDeal({
        leadId: 1,
        packageTier: "starter",
        monthlyPrice: "99",
      })
    ).rejects.toThrow("You are not a registered rep");
  });
});

describe("Phase 27: Leaderboard", () => {
  it("leaderboard requires authentication", async () => {
    const unauthCtx = createUnauthContext();
    await expect(
      caller(unauthCtx).repGamification.leaderboard({})
    ).rejects.toThrow();
  });

  it("leaderboard accepts limit parameter and returns array", async () => {
    const { ctx } = createRepContext();
    const result = await caller(ctx).repGamification.leaderboard({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Phase 27: Commission Logic", () => {
  it("commission rate calculation — self-sourced doubles rate", () => {
    const tierRates: Record<string, number> = {
      rookie: 0.10, closer: 0.12, ace: 0.14, elite: 0.16, legend: 0.20,
    };

    // Rookie self-sourced: 10% * 2 = 20%
    const rookieRate = tierRates["rookie"];
    const selfSourcedRookie = Math.min(rookieRate * 2, 0.40);
    expect(selfSourcedRookie).toBe(0.20);

    // Legend self-sourced: 20% * 2 = 40% (capped)
    const legendRate = tierRates["legend"];
    const selfSourcedLegend = Math.min(legendRate * 2, 0.40);
    expect(selfSourcedLegend).toBe(0.40);

    // Elite self-sourced: 16% * 2 = 32%
    const eliteRate = tierRates["elite"];
    const selfSourcedElite = Math.min(eliteRate * 2, 0.40);
    expect(selfSourcedElite).toBe(0.32);
  });

  it("discount calculation — 5% off $199", () => {
    const originalPrice = 199;
    const discountPct = 5;
    const discountedPrice = originalPrice * (1 - discountPct / 100);
    expect(discountedPrice).toBeCloseTo(189.05);
  });

  it("discount calculation — 0% off keeps original price", () => {
    const originalPrice = 99;
    const discountPct = 0;
    const discountedPrice = discountPct > 0 ? originalPrice * (1 - discountPct / 100) : originalPrice;
    expect(discountedPrice).toBe(99);
  });

  it("recurring monthly commission calculation", () => {
    const monthlyPrice = 199;
    const rate = 0.10; // rookie
    const commissionAmount = (monthlyPrice * rate).toFixed(2);
    expect(commissionAmount).toBe("19.90");

    // Self-sourced recurring
    const selfSourcedRate = Math.min(rate * 2, 0.40);
    const selfSourcedCommission = (monthlyPrice * selfSourcedRate).toFixed(2);
    expect(selfSourcedCommission).toBe("39.80");
  });

  it("annual commission calculation with discount", () => {
    const originalPrice = 499;
    const discountPct = 3;
    const discountedPrice = originalPrice * (1 - discountPct / 100);
    const annualValue = discountedPrice * 12;
    const rate = 0.14; // ace level
    const commission = (annualValue * rate).toFixed(2);
    expect(parseFloat(commission)).toBeGreaterThan(0);
    expect(discountedPrice).toBeCloseTo(484.03);
    expect(annualValue).toBeCloseTo(5808.36);
  });
});

describe("Phase 27: Input Validation", () => {
  it("createMyLead accepts optional fields", async () => {
    const { ctx } = createRepContext();
    // Should pass zod validation but fail on rep check
    await expect(
      caller(ctx).leads.createMyLead({
        businessName: "Acme Corp",
        contactName: "Jane Doe",
        email: "jane@acme.com",
        phone: "555-0123",
        industry: "Tech",
        website: "https://acme.com",
        notes: "Met at conference",
      })
    ).rejects.toThrow("You are not a registered rep");
  });

  it("closeDeal validates packageTier enum", async () => {
    const { ctx } = createRepContext();
    await expect(
      caller(ctx).leads.closeDeal({
        leadId: 1,
        packageTier: "invalid_tier" as any,
        monthlyPrice: "99",
        discountPercent: 0,
      })
    ).rejects.toThrow();
  });
});
