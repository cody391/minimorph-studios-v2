import { getDb } from "../db";
import { leadCosts, leads, customers } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

// Cost constants in cents
export const COSTS = {
  // Lead engine
  GOOGLE_MAPS_PLACE: 2,        // $0.02 per place detail
  GOOGLE_MAPS_SEARCH: 2,       // $0.02 per search
  APOLLO_ENRICH: 5,            // $0.05 per enrichment
  HUNTER_EMAIL: 2,             // $0.02 per email found

  // Comms
  RESEND_EMAIL: 1,             // ~$0.001 per email
  TWILIO_SMS: 1,               // ~$0.008 per SMS
  TWILIO_CALL_PER_MIN: 2,      // ~$0.013 per minute
  TWILIO_NUMBER_MONTHLY: 115,  // $1.15/mo per number

  // Anthropic claude-sonnet-4-6: $3/M input, $15/M output
  AI_INPUT_PER_TOKEN: 0.0003,  // cents per input token
  AI_OUTPUT_PER_TOKEN: 0.0015, // cents per output token

  // Infrastructure
  DOMAIN_ANNUAL: 1200,         // $12/yr
  DOMAIN_MONTHLY: 100,         // $1/mo
  S3_MONTHLY: 5,               // ~$0.05/mo

  // ── Site build pipeline ────────────────────────────────────────────────────
  // Target: under $0.10 per complete site build
  SITE_GENERATION_PER_PAGE: 5, // ~$0.048 → 5¢ (6K output tokens @ claude-sonnet)
  ELENA_ONBOARDING: 2,         // ~$0.012 → 2¢ (full onboarding conversation)
  COMPETITOR_SCRAPE: 1,        // ~$0.008 → 1¢ (per competitor URL analyzed)
  NANO_BANANA_2: 7,            // ~$0.067 → 7¢ (Gemini image generation primary)
  UNSPLASH_IMAGE: 0,           // FREE — gallery/about/team slots
  GEMINI_IMAGE: 7,             // ~$0.067 → 7¢ (alias for NANO_BANANA_2)
  R2_STORAGE: 0,               // FREE tier — Cloudflare R2
  CLOUDFLARE_PAGES_DEPLOY: 0,  // FREE tier — wrangler deploy
} as const;

// Helpers for estimating a full site build cost (in cents)
export function estimateSiteBuildCost(pageCount: number, hasCompetitors = false): number {
  return (
    COSTS.SITE_GENERATION_PER_PAGE * pageCount +
    COSTS.ELENA_ONBOARDING +
    (hasCompetitors ? COSTS.COMPETITOR_SCRAPE * 3 : 0) +
    COSTS.GEMINI_IMAGE +    // 1 hero image per site
    COSTS.CLOUDFLARE_PAGES_DEPLOY
  );
  // Example: 4 pages + competitors + hero = 5*4 + 2 + 3 + 1 + 0 = 26¢ → ~$0.08 total
}

export function calculateAiCost(inputTokens: number, outputTokens: number): number {
  return Math.max(1, Math.ceil(
    inputTokens * COSTS.AI_INPUT_PER_TOKEN +
    outputTokens * COSTS.AI_OUTPUT_PER_TOKEN
  ));
}

export async function recordCost(params: {
  costType: typeof leadCosts.$inferInsert["costType"];
  amountCents: number;
  leadId?: number;
  scrapedBusinessId?: number;
  customerId?: number;
  repId?: number;
  description?: string;
  tokensUsed?: number;
  durationSeconds?: number;
}): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const amountCents = Math.max(1, Math.ceil(params.amountCents));
    const month = new Date().toISOString().slice(0, 7);

    await db.insert(leadCosts).values({
      costType: params.costType,
      amountCents,
      leadId: params.leadId ?? null,
      scrapedBusinessId: params.scrapedBusinessId ?? null,
      customerId: params.customerId ?? null,
      repId: params.repId ?? null,
      description: params.description ?? null,
      tokensUsed: params.tokensUsed ?? null,
      durationSeconds: params.durationSeconds ?? null,
      month,
    });

    if (params.leadId) {
      await db.update(leads)
        .set({
          totalCostCents: sql`totalCostCents + ${amountCents}`,
          lastCostUpdate: new Date(),
        })
        .where(eq(leads.id, params.leadId));
    }

    if (params.customerId) {
      await db.update(customers)
        .set({
          totalLifetimeCostCents: sql`totalLifetimeCostCents + ${amountCents}`,
          lastEconomicsUpdate: new Date(),
        })
        .where(eq(customers.id, params.customerId));
    }
  } catch (err) {
    console.error("[CostTracker] Failed to record cost:", err);
  }
}

export async function recordRevenue(params: {
  customerId: number;
  leadId?: number;
  amountCents: number;
  description?: string;
}): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const amountCents = Math.ceil(params.amountCents);

    await db.update(customers)
      .set({
        totalLifetimeRevenueCents: sql`totalLifetimeRevenueCents + ${amountCents}`,
        lastEconomicsUpdate: new Date(),
      })
      .where(eq(customers.id, params.customerId));

    if (params.leadId) {
      await db.update(leads)
        .set({ totalRevenueCents: sql`totalRevenueCents + ${amountCents}` })
        .where(eq(leads.id, params.leadId));
    }
  } catch (err) {
    console.error("[CostTracker] Failed to record revenue:", err);
  }
}
