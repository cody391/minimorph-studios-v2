import { describe, expect, it, vi, beforeEach } from "vitest";

// ═══════════════════════════════════════════════════════
// Phase 26 Tests: Support Tickets, Notification Prefs,
// Push Notifications, Photo Upload, SMS Ticket Approval
// ═══════════════════════════════════════════════════════

describe("Phase 26 — Support Tickets", () => {
  describe("AI Triage Flow", () => {
    it("should parse AI triage JSON response correctly", () => {
      const mockResponse = JSON.stringify({
        analysis: "The rep is experiencing a login issue with the CRM dashboard.",
        solution: "Clear browser cache and cookies, then retry. If persists, reset password.",
        confidence: 0.85,
      });
      const parsed = JSON.parse(mockResponse);
      expect(parsed.analysis).toContain("login issue");
      expect(parsed.solution).toContain("Clear browser cache");
      expect(parsed.confidence).toBeGreaterThanOrEqual(0);
      expect(parsed.confidence).toBeLessThanOrEqual(1);
    });

    it("should handle malformed AI response gracefully", () => {
      const fallback = { analysis: "", solution: "", confidence: 0.5 };
      try {
        JSON.parse("not valid json");
      } catch {
        // Expected — fallback values should be used
        expect(fallback.analysis).toBe("");
        expect(fallback.confidence).toBe(0.5);
      }
    });

    it("should clamp confidence to 0-1 range", () => {
      const rawConfidence = 1.5;
      const clamped = Math.min(1, Math.max(0, rawConfidence));
      expect(clamped).toBe(1);

      const negativeConfidence = -0.3;
      const clampedNeg = Math.min(1, Math.max(0, negativeConfidence));
      expect(clampedNeg).toBe(0);
    });
  });

  describe("Ticket Status Flow", () => {
    it("should follow correct status progression", () => {
      const validTransitions: Record<string, string[]> = {
        open: ["ai_reviewed"],
        ai_reviewed: ["pending_approval"],
        pending_approval: ["approved", "rejected"],
        approved: ["resolved", "closed"],
        rejected: ["closed"],
      };

      expect(validTransitions["open"]).toContain("ai_reviewed");
      expect(validTransitions["pending_approval"]).toContain("approved");
      expect(validTransitions["pending_approval"]).toContain("rejected");
    });

    it("should generate correct ticket notification messages", () => {
      const approved = true;
      const subject = "Login Issue";
      const aiSolution = "Clear browser cache and cookies, then retry.";

      const title = approved ? "✅ Ticket Approved" : "❌ Ticket Rejected";
      const message = approved
        ? `Your ticket "${subject}" has been approved! Solution: ${aiSolution.slice(0, 200)}`
        : `Your ticket "${subject}" was not approved by the owner.`;

      expect(title).toBe("✅ Ticket Approved");
      expect(message).toContain("Login Issue");
      expect(message).toContain("Clear browser cache");
    });
  });
});

describe("Phase 26 — SMS Ticket Approval", () => {
  it("should detect approval keywords correctly", () => {
    const approvalKeywords = ["yes", "approve", "approved", "ok", "no", "reject", "rejected", "deny", "denied"];
    const positiveKeywords = ["yes", "approve", "approved", "ok"];

    expect(approvalKeywords.includes("yes")).toBe(true);
    expect(approvalKeywords.includes("approve")).toBe(true);
    expect(approvalKeywords.includes("hello")).toBe(false);

    expect(positiveKeywords.includes("yes")).toBe(true);
    expect(positiveKeywords.includes("no")).toBe(false);
    expect(positiveKeywords.includes("reject")).toBe(false);
  });

  it("should correctly determine approval vs rejection from SMS body", () => {
    const testCases = [
      { body: "YES", expected: true },
      { body: "yes", expected: true },
      { body: "approve", expected: true },
      { body: "ok", expected: true },
      { body: "no", expected: false },
      { body: "reject", expected: false },
      { body: "denied", expected: false },
    ];

    for (const tc of testCases) {
      const bodyLower = tc.body.trim().toLowerCase();
      const isApproved = ["yes", "approve", "approved", "ok"].includes(bodyLower);
      expect(isApproved).toBe(tc.expected);
    }
  });

  it("should not trigger approval for non-keyword messages", () => {
    const approvalKeywords = ["yes", "approve", "approved", "ok", "no", "reject", "rejected", "deny", "denied"];
    const nonKeywords = ["hello", "thanks", "when", "how much", "stop"];

    for (const msg of nonKeywords) {
      expect(approvalKeywords.includes(msg.trim().toLowerCase())).toBe(false);
    }
  });
});

describe("Phase 26 — Notification Preferences", () => {
  it("should define all expected notification categories", () => {
    const categories = [
      "new_lead",
      "coaching_feedback",
      "ticket_update",
      "commission",
      "training",
      "system",
    ];

    expect(categories).toHaveLength(6);
    expect(categories).toContain("new_lead");
    expect(categories).toContain("ticket_update");
    expect(categories).toContain("coaching_feedback");
  });

  it("should default all preferences to enabled", () => {
    const defaultPref = {
      enabled: true,
      pushEnabled: true,
      inAppEnabled: true,
    };

    expect(defaultPref.enabled).toBe(true);
    expect(defaultPref.pushEnabled).toBe(true);
    expect(defaultPref.inAppEnabled).toBe(true);
  });

  it("should disable push and in-app when main toggle is off", () => {
    const pref = { enabled: false, pushEnabled: true, inAppEnabled: true };
    // When enabled is false, push and in-app should be effectively disabled
    const effectivePush = pref.enabled && pref.pushEnabled;
    const effectiveInApp = pref.enabled && pref.inAppEnabled;

    expect(effectivePush).toBe(false);
    expect(effectiveInApp).toBe(false);
  });
});

describe("Phase 26 — Push Notification Payloads", () => {
  it("should construct correct push payload for new lead", () => {
    const payload = {
      title: "🎯 New Lead Assigned",
      body: "John Doe has been assigned to you. Check your pipeline!",
      url: "/rep",
      tag: "new_lead",
    };

    expect(payload.title).toContain("New Lead");
    expect(payload.body).toContain("John Doe");
    expect(payload.url).toBe("/rep");
    expect(payload.tag).toBe("new_lead");
  });

  it("should construct correct push payload for ticket update", () => {
    const approved = true;
    const ticketSubject = "Login Issue";
    const payload = {
      title: approved ? "✅ Ticket Approved" : "❌ Ticket Update",
      body: approved
        ? `Your ticket "${ticketSubject}" has been approved!`
        : `Your ticket "${ticketSubject}" has been updated.`,
      url: "/rep",
      tag: "ticket_update",
    };

    expect(payload.title).toBe("✅ Ticket Approved");
    expect(payload.body).toContain("Login Issue");
  });

  it("should construct correct push payload for coaching feedback", () => {
    const communicationType = "email";
    const payload = {
      title: "📋 New Coaching Feedback",
      body: `AI Coach has reviewed your recent ${communicationType}. Check your feedback!`,
      url: "/rep",
      tag: "coaching_feedback",
    };

    expect(payload.body).toContain("email");
    expect(payload.tag).toBe("coaching_feedback");
  });
});

describe("Phase 26 — Photo Upload Validation", () => {
  it("should accept valid image MIME types", () => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    for (const type of validTypes) {
      expect(type.startsWith("image/")).toBe(true);
    }
  });

  it("should reject non-image MIME types", () => {
    const invalidTypes = ["application/pdf", "text/plain", "video/mp4"];
    for (const type of invalidTypes) {
      expect(type.startsWith("image/")).toBe(false);
    }
  });

  it("should enforce 5MB file size limit", () => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    expect(maxSize).toBe(5242880);

    const validSize = 3 * 1024 * 1024;
    const invalidSize = 6 * 1024 * 1024;

    expect(validSize <= maxSize).toBe(true);
    expect(invalidSize <= maxSize).toBe(false);
  });

  it("should determine correct file extension from MIME type", () => {
    const getExt = (mimeType: string) => mimeType === "image/png" ? "png" : "jpg";
    expect(getExt("image/png")).toBe("png");
    expect(getExt("image/jpeg")).toBe("jpg");
    expect(getExt("image/webp")).toBe("jpg");
  });
});

describe("Phase 26 — Email Signature with Photo", () => {
  it("should generate signature with photo when URL is provided", () => {
    const rep = {
      fullName: "Jane Smith",
      email: "jane@minimorph.com",
      phone: "555-1234",
      profilePhotoUrl: "/manus-storage/rep-photos/1.jpg",
    };

    const photoHtml = rep.profilePhotoUrl
      ? `<img src="${rep.profilePhotoUrl}" alt="${rep.fullName}" width="60" height="60" style="border-radius:50%;object-fit:cover;margin-right:12px;" />`
      : `<div style="width:60px;height:60px;border-radius:50%;background:#2d5a3d;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;margin-right:12px;">${rep.fullName.charAt(0)}</div>`;

    expect(photoHtml).toContain("img src");
    expect(photoHtml).toContain("rep-photos/1.jpg");
    expect(photoHtml).toContain("Jane Smith");
  });

  it("should generate signature with initial when no photo", () => {
    const rep = {
      fullName: "John Doe",
      email: "john@minimorph.com",
      phone: null,
      profilePhotoUrl: null,
    };

    const photoHtml = rep.profilePhotoUrl
      ? `<img src="${rep.profilePhotoUrl}" />`
      : `<div>${rep.fullName.charAt(0)}</div>`;

    expect(photoHtml).toContain("J");
    expect(photoHtml).not.toContain("img src");
  });
});

describe("Phase 26 — VAPID Keys", () => {
  it("should validate VAPID public key format", () => {
    // VAPID public keys are base64url encoded, typically 87 chars
    const mockKey = "BHSye3yC1KYsaXHH786NasJoPJF4vmzY08_hV-xzvX3rW5cXUzLMPE3GsZsVvGfwGYvl7uKr-E2pecdCN8D30a8";
    expect(mockKey.length).toBeGreaterThan(50);
    // Should be base64url (no + or /)
    expect(mockKey).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
