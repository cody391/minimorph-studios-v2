import Stripe from "stripe";
import { ENV } from "../_core/env";

function getStripe(): Stripe | null {
  if (!ENV.stripeSecretKey) return null;
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-04-30.basil" as any });
}

export async function syncProductToStripe(product: {
  id: number;
  productKey: string;
  name: string;
  description: string | null;
  basePrice: string;
  discountPercent: number;
  discountDuration?: string | null;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  stripeDiscountPriceId?: string | null;
  category: string;
}): Promise<{
  stripeProductId: string;
  stripePriceId: string;
  stripeDiscountPriceId: string | null;
}> {
  const stripe = getStripe();
  if (!stripe) {
    console.warn("[StripeSync] No Stripe key — skipping sync");
    return {
      stripeProductId: product.stripeProductId || "",
      stripePriceId: product.stripePriceId || "",
      stripeDiscountPriceId: product.stripeDiscountPriceId || null,
    };
  }

  const basePrice = parseFloat(product.basePrice);
  const basePriceCents = Math.round(basePrice * 100);
  const isRecurring = product.category !== "one_time";
  const hasDiscount = product.discountPercent > 0;
  const discountedPriceCents = hasDiscount
    ? Math.round(basePrice * (1 - product.discountPercent / 100) * 100)
    : null;

  // ── Step 1: Get or create Stripe Product ──────────────────────────────
  let stripeProductId = product.stripeProductId || null;

  if (!stripeProductId) {
    const existing = await stripe.products.search({
      query: `metadata['productKey']:'${product.productKey}'`,
    });
    if (existing.data.length > 0) {
      stripeProductId = existing.data[0].id;
    } else {
      const created = await stripe.products.create({
        name: product.name,
        description: product.description || undefined,
        metadata: { productKey: product.productKey, category: product.category },
      });
      stripeProductId = created.id;
    }
  } else {
    await stripe.products.update(stripeProductId, {
      name: product.name,
      description: product.description || undefined,
    });
  }

  // ── Step 2: Handle base price ──────────────────────────────────────────
  // Stripe prices are immutable — archive old and create new when price changes
  let stripePriceId = product.stripePriceId || null;
  let needsNewBasePrice = false;

  if (stripePriceId) {
    try {
      const existing = await stripe.prices.retrieve(stripePriceId);
      if (existing.unit_amount !== basePriceCents) {
        await stripe.prices.update(stripePriceId, { active: false });
        needsNewBasePrice = true;
      }
    } catch {
      needsNewBasePrice = true;
    }
  } else {
    needsNewBasePrice = true;
  }

  if (needsNewBasePrice) {
    const newPrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: basePriceCents,
      currency: "usd",
      ...(isRecurring ? { recurring: { interval: "month" } } : {}),
      metadata: { productKey: product.productKey, priceType: "base" },
    });
    stripePriceId = newPrice.id;
  }

  // ── Step 3: Handle discount price ─────────────────────────────────────
  let stripeDiscountPriceId = product.stripeDiscountPriceId || null;

  if (hasDiscount && discountedPriceCents !== null) {
    let needsNewDiscountPrice = false;

    if (stripeDiscountPriceId) {
      try {
        const existing = await stripe.prices.retrieve(stripeDiscountPriceId);
        if (existing.unit_amount !== discountedPriceCents) {
          await stripe.prices.update(stripeDiscountPriceId, { active: false });
          needsNewDiscountPrice = true;
        }
      } catch {
        needsNewDiscountPrice = true;
      }
    } else {
      needsNewDiscountPrice = true;
    }

    if (needsNewDiscountPrice) {
      const discountPrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: discountedPriceCents,
        currency: "usd",
        ...(isRecurring ? { recurring: { interval: "month" } } : {}),
        nickname: `${product.name} — ${product.discountPercent}% off`,
        metadata: {
          productKey: product.productKey,
          priceType: "discount",
          discountPercent: String(product.discountPercent),
          discountDuration: product.discountDuration || "once",
        },
      });
      stripeDiscountPriceId = discountPrice.id;
    }
  } else if (stripeDiscountPriceId) {
    // Discount removed — archive the discount price
    try {
      await stripe.prices.update(stripeDiscountPriceId, { active: false });
    } catch {}
    stripeDiscountPriceId = null;
  }

  console.log(
    `[StripeSync] Synced ${product.productKey}: product=${stripeProductId} base=${stripePriceId} discount=${stripeDiscountPriceId ?? "none"}`
  );

  return { stripeProductId: stripeProductId!, stripePriceId: stripePriceId!, stripeDiscountPriceId };
}

export async function syncAllProductsToStripe(): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  const { getProductCatalog, updateProductStripeIds } = await import("../db");
  const products = await getProductCatalog();

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const product of products) {
    try {
      const result = await syncProductToStripe(product as any);
      await updateProductStripeIds(product.id, result);
      synced++;
    } catch (err: any) {
      failed++;
      errors.push(`${product.productKey}: ${err.message}`);
      console.error(`[StripeSync] Failed to sync ${product.productKey}:`, err);
    }
  }

  return { synced, failed, errors };
}

// Returns the discount price ID if a discount is active, otherwise the base price ID
export function getCheckoutPriceId(product: {
  stripePriceId?: string | null;
  stripeDiscountPriceId?: string | null;
  discountPercent: number;
}): string | null {
  if (product.discountPercent > 0 && product.stripeDiscountPriceId) {
    return product.stripeDiscountPriceId;
  }
  return product.stripePriceId || null;
}
