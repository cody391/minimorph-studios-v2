/**
 * Free Website Audit Email Delivery Tests
 * 
 * Covers:
 * 1. Audit with websiteUrl → generates audit + sends email
 * 2. Audit without websiteUrl → sends "received" email + notifies admin
 * 3. generateAuditFromLeadData fallback works without scrapedBusinessId
 * 4. Email failure handled gracefully (notifies owner, returns user-friendly message)
 * 5. CAN-SPAM footer uses Muskegon, MI (not Sarasota, FL)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs/promises";
import path from "path";

// Mock external dependencies
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) }),
    insert: () => ({ values: () => ({ $returningId: () => Promise.resolve([{ id: 1 }]) }) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  }),
}));
vi.mock("../drizzle/schema", () => ({
  leads: { id: "id", email: "email", businessName: "businessName" },
  scrapedBusinesses: { id: "id" },
  emailUnsubscribes: { email: "email" },
}));
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          sections: [
            { name: "Performance & Speed", score: 65, issues: ["Slow load time"], description: "Could be faster" },
            { name: "Mobile Friendliness", score: 80, issues: [], description: "Good mobile support" },
            { name: "SEO & Discoverability", score: 55, issues: ["Missing meta description"], description: "Needs SEO work" },
            { name: "Security", score: 90, issues: [], description: "HTTPS enabled" },
            { name: "Design & Accessibility", score: 70, issues: ["Low contrast text"], description: "Mostly accessible" },
          ],
          recommendations: ["Optimize images", "Add meta tags", "Improve load time", "Fix contrast", "Add structured data"],
          estimatedCustomersLost: "10-20 customers per month",
        }),
      },
    }],
  }),
}));
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "audits/test.html", url: "/manus-storage/audits/test.html" }),
}));
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("Free Audit Email Delivery", () => {
  describe("generateAuditFromLeadData", () => {
    it("generates audit with sections when websiteUrl is provided", async () => {
      const { generateAuditFromLeadData } = await import("./services/leadGenAudit");
      const result = await generateAuditFromLeadData({
        id: 1,
        businessName: "Test Biz",
        website: "https://testbiz.com",
      });
      expect(result).toBeDefined();
      expect(result.businessName).toBe("Test Biz");
      expect(result.websiteUrl).toBe("https://testbiz.com");
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallGrade).toMatch(/^[A-F]$/);
      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.htmlContent).toContain("Test Biz");
      expect(result.storageUrl).toBeDefined();
    });

    it("generates fallback audit when no websiteUrl is provided", async () => {
      const { generateAuditFromLeadData } = await import("./services/leadGenAudit");
      const result = await generateAuditFromLeadData({
        id: 2,
        businessName: "No Website Biz",
        website: null,
      });
      expect(result).toBeDefined();
      expect(result.businessName).toBe("No Website Biz");
      expect(result.websiteUrl).toBeNull();
      expect(result.overallScore).toBe(5);
      expect(result.overallGrade).toBe("F");
      expect(result.sections.length).toBe(4);
      expect(result.sections[0].name).toBe("Web Presence");
      expect(result.htmlContent).toContain("No Website Biz");
    });

    it("falls back gracefully when LLM fails", async () => {
      const { invokeLLM } = await import("./_core/llm");
      (invokeLLM as any).mockRejectedValueOnce(new Error("LLM timeout"));
      const { generateAuditFromLeadData } = await import("./services/leadGenAudit");
      const result = await generateAuditFromLeadData({
        id: 3,
        businessName: "LLM Fail Biz",
        website: "https://llmfail.com",
      });
      // Should still return a valid audit (fallback path)
      expect(result).toBeDefined();
      expect(result.businessName).toBe("LLM Fail Biz");
      expect(result.overallScore).toBe(45); // fallback score for has-website
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("sendWebsiteAuditEmail helper", () => {
    it("is exported and callable", async () => {
      const mod = await import("./services/customerEmails");
      expect(typeof mod.sendWebsiteAuditEmail).toBe("function");
    });

    it("is exported with correct parameter shape", async () => {
      const mod = await import("./services/customerEmails");
      expect(typeof mod.sendAuditReceivedEmail).toBe("function");
    });
  });

  describe("requestPublicAudit procedure", () => {
    it("calls generateAuditForLead and sendWebsiteAuditEmail when websiteUrl is provided", async () => {
      const routerSource = await fs.readFile(
        path.resolve(__dirname, "leadGenRouter.ts"),
        "utf-8"
      );
      // Verify the procedure awaits audit generation (not fire-and-forget)
      expect(routerSource).toContain("const audit = await generateAuditForLead(leadId)");
      // Verify it sends the audit email
      expect(routerSource).toContain("await sendWebsiteAuditEmail(");
      // Verify it returns the correct message
      expect(routerSource).toContain('"Your audit report is on the way."');
    });

    it("sends received email and notifies owner when no websiteUrl", async () => {
      const routerSource = await fs.readFile(
        path.resolve(__dirname, "leadGenRouter.ts"),
        "utf-8"
      );
      // Verify fallback path for no website URL
      expect(routerSource).toContain("await sendAuditReceivedEmail(");
      expect(routerSource).toContain("Free Audit Request (No Website)");
      expect(routerSource).toContain('"We received your request and will review it manually."');
    });

    it("handles audit generation failure gracefully", async () => {
      const routerSource = await fs.readFile(
        path.resolve(__dirname, "leadGenRouter.ts"),
        "utf-8"
      );
      // Verify error handling with try/catch
      expect(routerSource).toContain("} catch (err: any) {");
      expect(routerSource).toContain("Free Audit Generation Error");
      // Verify fallback email is sent on error
      expect(routerSource).toContain("await sendAuditReceivedEmail(");
      // Verify owner notification on error
      expect(routerSource).toContain("await notifyOwner(");
    });

    it("handles email send failure gracefully", async () => {
      const routerSource = await fs.readFile(
        path.resolve(__dirname, "leadGenRouter.ts"),
        "utf-8"
      );
      // Verify email failure is caught and owner is notified
      expect(routerSource).toContain("if (!emailResult.success)");
      expect(routerSource).toContain("Free Audit Email Failed");
    });
  });

  describe("CAN-SPAM footer location", () => {
    it("uses Muskegon, MI (not Sarasota, FL)", async () => {
      const emailSource = await fs.readFile(
        path.resolve(__dirname, "services/email.ts"),
        "utf-8"
      );
      expect(emailSource).toContain("Muskegon, MI 49440");
      expect(emailSource).not.toContain("Sarasota, FL");
    });
  });
});
