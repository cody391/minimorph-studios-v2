# Phase 1 Audit — Current Support

## 1. Onboarding Questionnaire Fields
EXISTING: 7 fields — brandTone, brandColors, targetAudience, competitors, contentPreference, mustHaveFeatures, inspirationUrls, specialRequests
STORED: JSON blob in onboarding_projects.questionnaire column
MISSING: No websiteType/businessType field. No conditional branching. No industry-specific questions. No service area, menu, product count, licensing, booking, etc.

## 2. Conditional Onboarding Logic
EXISTING: None. Single flat form for all business types.
MISSING: Entire conditional branching system.

## 3. Ecommerce-Specific Fields
EXISTING: None. No product count, categories, variants, shipping, tax, platform preference fields.
MISSING: Entire ecommerce questionnaire branch.

## 4. Admin Review Triggers
EXISTING: None for onboarding/projects. adminReview exists only for rep assessment and accountability strikes.
MISSING: No flag on onboarding_projects for admin review / custom quote. No trigger logic.

## 5. AI Concierge/Agent Guidance
EXISTING: Two AI prompts — onboardingChat (gathers 7 questionnaire fields) and portalChat (knows customer info, widgets, upsells). Both use inline system prompts in routers.ts.
MISSING: No structured knowledge base. No integration classification. No scope guardrails. No "not supported" or "custom quote" logic. AI can overpromise.

## 6. Package Selection Logic
EXISTING: 3 packages in stripe-products.ts — Starter ($149/mo), Growth ($299/mo), Premium ($499/mo). Premium mentions "E-commerce integration" as a feature.
MISSING: No ecommerce-specific package. No guardrail preventing ecommerce from being sold as Starter/Growth. No Commerce tier.

## 7. Widget Catalog / Upsell Catalog
EXISTING: widgetCatalogRouter in routers.ts. Schema has widget_catalog table with name, slug, description, monthlyPrice, oneTimePrice, category, isActive.
MISSING: No seed data found in code. Catalog may be empty in DB. No integration classification matrix.

## 8. Demo Site Routes/Cards
EXISTING: Portfolio section on Home page shows empty state ("be among the first to be featured"). No demo routes, no industry concept cards.
MISSING: Entire demo/sample site strategy.

## 9. Integration Options
EXISTING: Built-in integrations — Stripe (payments), Twilio (SMS), Resend (email), Google Maps, S3 (storage), LLM (AI). Widget catalog has slots for add-ons.
MISSING: No classification of what's included vs upsell vs custom quote. No structured integration matrix.
