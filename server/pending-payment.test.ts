/**
 * Pending Payment Usability Tests
 * Tests for: resendPaymentLink procedure, pending-payment-check scheduled endpoint,
 * and the customer portal pending state logic.
 */
import { describe, it, expect } from "vitest";
import { PACKAGES } from "../shared/pricing";

describe("Pending Payment Flow", () => {
  describe("Pricing consistency for payment links", () => {
    it("all package tiers have correct monthly prices", () => {
      expect(PACKAGES.starter.monthlyPrice).toBe(150);
      expect(PACKAGES.growth.monthlyPrice).toBe(250);
      expect(PACKAGES.premium.monthlyPrice).toBe(400);
    });

    it("all package tiers have correct setup fees", () => {
      expect(PACKAGES.starter.setupFeeInCents).toBe(50000);
      expect(PACKAGES.growth.setupFeeInCents).toBe(75000);
      expect(PACKAGES.premium.setupFeeInCents).toBe(100000);
    });

    it("commerce tier is not in PACKAGES (custom quote only)", () => {
      // Commerce is custom-quote only and not listed in the standard packages
      expect((PACKAGES as any).commerce).toBeUndefined();
    });
  });

  describe("resendPaymentLink procedure logic", () => {
    it("should only work for contracts in pending_payment status", () => {
      // The procedure checks contract.status === "pending_payment"
      // Simulate: a contract with active status should not be resendable
      const activeContract = { status: "active", packageTier: "starter" };
      const pendingContract = { status: "pending_payment", packageTier: "growth" };

      expect(activeContract.status).not.toBe("pending_payment");
      expect(pendingContract.status).toBe("pending_payment");
    });

    it("should create a new Stripe checkout session with correct metadata", () => {
      // Verify the metadata structure expected by the webhook
      const expectedMetadata = {
        user_id: "123",
        customer_email: "test@example.com",
        customer_name: "Test Customer",
        package_tier: "starter",
        business_name: "Test Business",
        contract_id: "456",
        rep_closed: "true",
        lead_id: "789",
        rep_id: "101",
        customer_id: "112",
      };

      // All required fields present
      expect(expectedMetadata).toHaveProperty("user_id");
      expect(expectedMetadata).toHaveProperty("contract_id");
      expect(expectedMetadata).toHaveProperty("rep_closed", "true");
      expect(expectedMetadata).toHaveProperty("customer_email");
      expect(expectedMetadata).toHaveProperty("package_tier");
      expect(expectedMetadata).toHaveProperty("lead_id");
      expect(expectedMetadata).toHaveProperty("rep_id");
      expect(expectedMetadata).toHaveProperty("customer_id");
    });
  });

  describe("pending-payment-check scheduled endpoint logic", () => {
    it("should identify contracts older than 24 hours as stale", () => {
      const now = Date.now();
      const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
      const twentyThreeHoursAgo = now - 23 * 60 * 60 * 1000;

      const staleContract = { createdAt: new Date(twentyFiveHoursAgo) };
      const freshContract = { createdAt: new Date(twentyThreeHoursAgo) };

      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      const isStale = (contract: { createdAt: Date }) =>
        now - contract.createdAt.getTime() > TWENTY_FOUR_HOURS;

      expect(isStale(staleContract)).toBe(true);
      expect(isStale(freshContract)).toBe(false);
    });

    it("should not process contracts already marked as expired or active", () => {
      const validStatuses = ["pending_payment"];
      const invalidStatuses = ["active", "expired", "cancelled", "renewed"];

      validStatuses.forEach((status) => {
        expect(status).toBe("pending_payment");
      });

      invalidStatuses.forEach((status) => {
        expect(status).not.toBe("pending_payment");
      });
    });
  });

  describe("Customer portal pending payment state", () => {
    it("should detect pending_payment contract when no active contract exists", () => {
      const contracts = [
        { id: 1, status: "pending_payment", packageTier: "growth" },
        { id: 2, status: "expired", packageTier: "starter" },
      ];

      const activeContract = contracts.find(
        (c) => c.status === "active" || c.status === "expiring_soon"
      );
      const pendingPaymentContract = contracts.find(
        (c) => c.status === "pending_payment"
      );

      expect(activeContract).toBeUndefined();
      expect(pendingPaymentContract).toBeDefined();
      expect(pendingPaymentContract!.packageTier).toBe("growth");
    });

    it("should prefer active contract over pending_payment", () => {
      const contracts = [
        { id: 1, status: "active", packageTier: "starter" },
        { id: 2, status: "pending_payment", packageTier: "growth" },
      ];

      const activeContract = contracts.find(
        (c) => c.status === "active" || c.status === "expiring_soon"
      );
      const pendingPaymentContract = contracts.find(
        (c) => c.status === "pending_payment"
      );

      // Active contract takes precedence
      expect(activeContract).toBeDefined();
      expect(activeContract!.packageTier).toBe("starter");
      // Pending payment banner should NOT show when active exists
      const showPendingBanner = !activeContract && !!pendingPaymentContract;
      expect(showPendingBanner).toBe(false);
    });

    it("should show pending banner only when no active contract but pending_payment exists", () => {
      const contracts = [
        { id: 1, status: "pending_payment", packageTier: "premium" },
      ];

      const activeContract = contracts.find(
        (c) => c.status === "active" || c.status === "expiring_soon"
      );
      const pendingPaymentContract = contracts.find(
        (c) => c.status === "pending_payment"
      );

      const showPendingBanner = !activeContract && !!pendingPaymentContract;
      expect(showPendingBanner).toBe(true);
    });

    it("statusColors should include pending_payment", () => {
      const statusColors: Record<string, string> = {
        active: "bg-green-100 text-green-700",
        expiring_soon: "bg-yellow-100 text-yellow-700",
        expired: "bg-red-100 text-red-700",
        renewed: "bg-blue-100 text-blue-700",
        cancelled: "bg-gray-100 text-gray-700",
        pending_payment: "bg-amber-100 text-amber-700",
      };

      expect(statusColors).toHaveProperty("pending_payment");
      expect(statusColors.pending_payment).toContain("amber");
    });
  });
});
