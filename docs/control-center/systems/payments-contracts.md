# System: Payments and Contracts

## Overview

Stripe handles all payment collection. Contracts activate the nurturing pipeline. These two systems are tightly coupled — don't modify one without understanding the other.

---

## Payment Flow

### Self-Service Projects

1. Customer signs up via public onboarding
2. Blueprint approved
3. Portal shows payment CTA (Stripe checkout)
4. Customer completes payment
5. Stripe webhook fires → `stripe-webhook.ts` handles event
6. Project's payment status updated → generation can begin

**The payment gate is enforced in `siteGenerator.ts`.** If `source === "self_service"` and payment is not confirmed, generation is blocked.

### Rep-Closed Projects

Rep-closed projects (`source === "rep_closed"`) bypass the payment gate. The rep's contract with the customer handles payment collection. The admin manually confirms the contract before triggering generation.

---

## Stripe Webhook

Handler: `server/_core/stripe-webhook.ts` (or wired in `index.ts`)

**Critical:** The Stripe webhook handler MUST be registered BEFORE the JSON body parser in Express. Stripe webhooks require the raw request body for signature verification. If the JSON body parser runs first, the signature check fails.

This ordering is set in `server/_core/index.ts`. Do not reorder middleware without understanding this constraint.

---

## Contracts and the Nurturing Pipeline

Contracts are tracked in the `contracts` table. Key fields:
- `nurturingActive` — boolean; when true, the nurturing pipeline schedules anniversary check-ins
- `anniversaryDay` — the day each month the customer's check-in fires
- `status` — active, paused, cancelled

Nurturing only activates when:
1. A contract exists for the customer
2. `nurturingActive` is `true`
3. Payment is confirmed and contract is in good standing

Do not modify the contract payment state transitions without reading `stripe-webhook.ts` first.

---

## Package Tiers

Customers are on one of three tiers:
- `starter` — basic site, no growth features
- `growth` — includes growth features (gated by `IF_GROWTH_PLUS` blocks in templates)
- `premium` — includes all features (gated by `IF_PREMIUM_PLUS` blocks in templates)

The tier is stored on the contract/project and read by `stripPackageSections` in `templateEngine.ts` at generation time.

---

## Frozen Rules

- Do NOT modify the Stripe webhook handler without fully understanding the state machine it drives
- Do NOT remove the payment gate for self-service projects
- Do NOT manually set `nurturingActive = true` for a customer without a confirmed contract
- Auto-payout to reps is frozen — do not activate
