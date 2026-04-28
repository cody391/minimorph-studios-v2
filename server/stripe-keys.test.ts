import { describe, it, expect } from "vitest";
import Stripe from "stripe";

describe("Custom Stripe Keys Validation", () => {
  it("should have CUSTOM_STRIPE_SECRET_KEY set", () => {
    expect(process.env.CUSTOM_STRIPE_SECRET_KEY).toBeDefined();
    expect(process.env.CUSTOM_STRIPE_SECRET_KEY).toMatch(/^sk_test_/);
  });

  it("should have CUSTOM_STRIPE_PUBLISHABLE_KEY set", () => {
    expect(process.env.CUSTOM_STRIPE_PUBLISHABLE_KEY).toBeDefined();
    expect(process.env.CUSTOM_STRIPE_PUBLISHABLE_KEY).toMatch(/^pk_test_/);
  });

  it("should have VITE_CUSTOM_STRIPE_PUBLISHABLE_KEY set for frontend", () => {
    expect(process.env.VITE_CUSTOM_STRIPE_PUBLISHABLE_KEY).toBeDefined();
    expect(process.env.VITE_CUSTOM_STRIPE_PUBLISHABLE_KEY).toMatch(/^pk_test_/);
  });

  it("should be able to list customers with the custom secret key", async () => {
    const stripe = new Stripe(process.env.CUSTOM_STRIPE_SECRET_KEY!, {
      apiVersion: "2025-04-30.basil" as any,
    });
    const customers = await stripe.customers.list({ limit: 1 });
    expect(customers).toBeDefined();
    expect(customers.object).toBe("list");
  }, 15000);

  it("should be able to list Connect accounts (Connect enabled)", async () => {
    const stripe = new Stripe(process.env.CUSTOM_STRIPE_SECRET_KEY!, {
      apiVersion: "2025-04-30.basil" as any,
    });
    const accounts = await stripe.accounts.list({ limit: 1 });
    expect(accounts).toBeDefined();
    expect(accounts.object).toBe("list");
  }, 15000);
});
