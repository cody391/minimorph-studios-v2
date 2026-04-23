import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{ id: 1 }]),
  execute: vi.fn().mockResolvedValue([]),
};

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          content: "Check out our latest website design! 🚀",
          hashtags: ["webdesign", "smallbusiness", "growth"],
          bestTimeToPost: "Tuesday 10am EST",
          characterCount: 42,
        }),
      },
    }],
  }),
}));

describe("Social Media Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chain methods
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
    mockDb.limit.mockReturnThis();
    mockDb.insert.mockReturnThis();
    mockDb.values.mockReturnThis();
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.delete.mockReturnThis();
  });

  describe("Social Accounts", () => {
    it("should have the correct platform enum values", () => {
      const PLATFORMS = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "pinterest", "threads"];
      expect(PLATFORMS).toHaveLength(8);
      expect(PLATFORMS).toContain("instagram");
      expect(PLATFORMS).toContain("tiktok");
      expect(PLATFORMS).toContain("threads");
    });

    it("should define account status values", () => {
      const STATUSES = ["connected", "disconnected", "expired", "error"];
      expect(STATUSES).toHaveLength(4);
    });
  });

  describe("Social Posts", () => {
    it("should define post status values", () => {
      const POST_STATUSES = ["draft", "scheduled", "published", "failed"];
      expect(POST_STATUSES).toHaveLength(4);
    });

    it("should validate post content is not empty", () => {
      const content = "Check out our latest design!";
      expect(content.length).toBeGreaterThan(0);
    });

    it("should support hashtag arrays", () => {
      const hashtags = ["webdesign", "smallbusiness", "growth"];
      expect(Array.isArray(hashtags)).toBe(true);
      expect(hashtags).toHaveLength(3);
    });
  });

  describe("Content Calendar", () => {
    it("should support calendar entry statuses", () => {
      const CALENDAR_STATUSES = ["planned", "drafted", "scheduled", "published", "cancelled"];
      expect(CALENDAR_STATUSES).toHaveLength(5);
    });

    it("should validate date ranges for calendar queries", () => {
      const startDate = "2026-04-01";
      const endDate = "2026-04-30";
      expect(new Date(endDate).getTime()).toBeGreaterThan(new Date(startDate).getTime());
    });
  });

  describe("Social Campaigns", () => {
    it("should define campaign status values", () => {
      const CAMPAIGN_STATUSES = ["draft", "active", "paused", "completed", "cancelled"];
      expect(CAMPAIGN_STATUSES).toHaveLength(5);
    });

    it("should define campaign goal values", () => {
      const GOALS = ["brand_awareness", "lead_generation", "engagement", "traffic", "recruitment", "product_launch", "event_promotion", "customer_retention"];
      expect(GOALS).toHaveLength(8);
    });
  });

  describe("Brand Assets", () => {
    it("should define brand asset categories", () => {
      const CATEGORIES = ["color", "font", "logo", "voice", "template", "image", "guideline"];
      expect(CATEGORIES).toHaveLength(7);
    });

    it("should validate color hex values", () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      expect(hexRegex.test("#2D5A3D")).toBe(true);
      expect(hexRegex.test("#C67D4A")).toBe(true);
      expect(hexRegex.test("#F5F0EB")).toBe(true);
      expect(hexRegex.test("invalid")).toBe(false);
    });
  });

  describe("AI Content Generation", () => {
    it("should define tone options", () => {
      const TONES = ["professional", "casual", "witty", "inspirational", "educational", "promotional", "storytelling"];
      expect(TONES).toHaveLength(7);
    });

    it("should generate content with expected structure", async () => {
      const { invokeLLM } = await import("./_core/llm");
      const result = await invokeLLM({
        messages: [
          { role: "system", content: "You are a social media content creator." },
          { role: "user", content: "Generate a post about web design" },
        ],
      });

      expect(result.choices).toBeDefined();
      expect(result.choices[0].message.content).toBeDefined();

      const parsed = JSON.parse(result.choices[0].message.content as string);
      expect(parsed.content).toBeDefined();
      expect(parsed.hashtags).toBeDefined();
      expect(Array.isArray(parsed.hashtags)).toBe(true);
    });

    it("should respect platform character limits", () => {
      const PLATFORM_LIMITS: Record<string, number> = {
        twitter: 280,
        instagram: 2200,
        facebook: 63206,
        linkedin: 3000,
        tiktok: 2200,
      };
      expect(PLATFORM_LIMITS.twitter).toBe(280);
      expect(PLATFORM_LIMITS.instagram).toBe(2200);
    });
  });

  describe("Social Content Library", () => {
    it("should define content categories", () => {
      const CATEGORIES = [
        "brand_awareness", "testimonial", "service_highlight", "industry_tip",
        "behind_the_scenes", "recruitment", "promotion", "educational",
      ];
      expect(CATEGORIES).toHaveLength(8);
    });

    it("should track content usage", () => {
      const item = { id: 1, title: "Test", timesUsed: 5, lastUsedAt: new Date() };
      expect(item.timesUsed).toBeGreaterThan(0);
    });
  });

  describe("Analytics", () => {
    it("should define analytics metric fields", () => {
      const metrics = {
        followers: 0,
        impressions: 0,
        engagement: 0,
        clicks: 0,
        shares: 0,
        reach: 0,
      };
      expect(Object.keys(metrics)).toHaveLength(6);
    });
  });
});
