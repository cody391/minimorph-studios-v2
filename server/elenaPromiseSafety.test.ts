/**
 * Elena Promise Safety — Static phrase scanner.
 *
 * Scans Elena's system prompt and customer-facing copy for phrases that were
 * identified as dangerous or unsupported in the Elena Promise Enforcement Audit
 * (2026-05-15). These tests fail if a blocked phrase reappears in source code.
 *
 * Scope: server/routers.ts (Elena prompt), shared/pricing.ts (package features).
 * Does NOT scan docs/ — docs may reference these phrases as historical findings.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");
const routersSource = readFileSync(join(ROOT, "server/routers.ts"), "utf-8");
const pricingSource = readFileSync(join(ROOT, "shared/pricing.ts"), "utf-8");

// Strip everything before the systemPrompt template literal so we only scan
// Elena's actual prompt text, not comments or safety-rule strings that quote
// the blocked phrases inside "do not say" instruction blocks.
//
// The systemPrompt const starts at "const systemPrompt = `" and ends before
// the closing backtick that terminates the template literal. We extract it
// so our checks apply to what Elena can actually SAY, not to the safety rules
// that name the phrases to avoid.
const PROMPT_START_MARKER = "const systemPrompt = `";
const promptStart = routersSource.indexOf(PROMPT_START_MARKER);
// Anything before promptStart is scaffolding code — not Elena's voice.
const elenaPromptSource =
  promptStart >= 0 ? routersSource.slice(promptStart) : routersSource;

// ---------------------------------------------------------------------------
// SECTION A — Phrases Elena must NEVER use
// These are checked against the extracted prompt text only.
// ---------------------------------------------------------------------------

const BLOCKED_PHRASES: Array<{ phrase: string; reason: string }> = [
  {
    phrase: "automatic from day one",
    reason: "No add-on is automatic from day one — all require team setup.",
  },
  {
    phrase: "runs completely automatically",
    reason: "No add-on runs completely automatically.",
  },
  {
    phrase: "fully automatic from day one",
    reason: "No add-on is fully automatic from day one.",
  },
  {
    phrase: "6-layer automated",
    reason: "The QA process is not a 6-layer automated system.",
  },
  {
    phrase: "automated quality inspection",
    reason: "QA is team-reviewed, not automated inspection.",
  },
  {
    phrase: "HIPAA compliant",
    reason: "HIPAA compliance is not automatically included.",
  },
  {
    phrase: "HIPAA compliance is built in",
    reason: "HIPAA compliance is not built in automatically.",
  },
  {
    phrase: "ABA compliant",
    reason: "ABA compliance is not automatically included.",
  },
  {
    phrase: "state bar compliance is built in",
    reason: "State bar compliance is not built in automatically.",
  },
  {
    phrase: "TTB compliance is automatic",
    reason: "TTB compliance is not automatic.",
  },
  {
    phrase: "we handle all compliance automatically",
    reason: "Compliance handling is not automated.",
  },
  {
    phrase: "monthly performance reports automatically",
    reason: "Monthly performance reports are not automated.",
  },
  {
    phrase: "monthly competitor analysis",
    reason: "Monthly competitor analysis is not automated.",
  },
  {
    phrase: "competitive workup: what your top competitors",
    reason: "Automated competitive workup is not delivered monthly.",
  },
  {
    phrase: "live on your site the day you launch, nothing you need to do",
    reason: "AI chatbot is not live on launch day without team setup.",
  },
  {
    phrase: "review requests go out automatically after each job",
    reason: "Review collection requires team setup, not automatic.",
  },
  {
    phrase: "SEO blog posts go live automatically",
    reason: "SEO blog publishing requires team setup.",
  },
  {
    phrase: "generates monthly automatically",
    reason: "AI photography is not generated and published automatically.",
  },
  {
    phrase: "configured and live on launch day automatically",
    reason: "Lead capture bot requires team setup after launch.",
  },
  {
    phrase: "generated from your site design, ready to download automatically",
    reason: "Brand style guide is not generated and delivered automatically.",
  },
  {
    phrase: "you own the rights to use everything on your site",
    reason: "Cannot make a blanket image rights guarantee.",
  },
  {
    phrase: "After that it runs itself",
    reason: "No add-on runs itself — team setup is required.",
  },
  {
    phrase: "monthly reports without billing you separately",
    reason: "Monthly reports are not a guaranteed automated deliverable.",
  },
  {
    phrase: "every month you'll get a performance report automatically",
    reason: "Monthly performance reports are not automated.",
  },
  {
    phrase: "every month, we analyze your competitors",
    reason: "Monthly competitor analysis is not automated.",
  },
  {
    phrase: "seasonal trends coming up for",
    reason: "Quarterly seasonal trend alerts are not an automated deliverable.",
  },
];

describe("Elena prompt — blocked phrases must not appear", () => {
  for (const { phrase, reason } of BLOCKED_PHRASES) {
    it(`must not contain: "${phrase}"`, () => {
      const lower = elenaPromptSource.toLowerCase();
      const found = lower.includes(phrase.toLowerCase());
      expect(found, `BLOCKED PHRASE FOUND: "${phrase}" — ${reason}`).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// SECTION B — Required guardrail phrases must exist in Elena's prompt
// ---------------------------------------------------------------------------

const REQUIRED_GUARDRAILS: Array<{ phrase: string; reason: string }> = [
  {
    phrase: "requires team setup",
    reason: "Must explain that add-ons require team setup.",
  },
  {
    phrase: "flag this for",
    reason: "Must flag regulated industries / unsupported features for review.",
  },
  {
    phrase: "compliance-sensitive content",
    reason: "Must reference compliance review for regulated industries.",
  },
  {
    phrase: "not promised unless",
    reason: "Must qualify add-on promises with conditions.",
  },
  {
    phrase: "admin review",
    reason: "Must reference admin review for regulated/blocked features.",
  },
  {
    phrase: "team setup after launch",
    reason: "Must communicate that team setup happens after launch.",
  },
  {
    phrase: "ADDON HONESTY RULE",
    reason: "Addon honesty rule must be present in prompt.",
  },
  {
    phrase: "REGULATED INDUSTRY AWARENESS",
    reason: "Regulated industry awareness section must be present.",
  },
  {
    phrase: "FIT-BASED RECOMMENDATION RULE",
    reason: "Fit-based upsell rule must be present in prompt.",
  },
  {
    phrase: "BLOCKED ADD-ONS",
    reason: "Blocked add-ons list must be present in prompt.",
  },
];

describe("Elena prompt — required guardrail phrases must exist", () => {
  for (const { phrase, reason } of REQUIRED_GUARDRAILS) {
    it(`must contain: "${phrase}"`, () => {
      const lower = elenaPromptSource.toLowerCase();
      const found = lower.includes(phrase.toLowerCase());
      expect(found, `MISSING GUARDRAIL: "${phrase}" — ${reason}`).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// SECTION C — Pricing copy must not overpromise
// ---------------------------------------------------------------------------

describe("shared/pricing.ts — pricing features must not overpromise", () => {
  it('must not contain "monthly performance report" as a feature', () => {
    const found = pricingSource
      .toLowerCase()
      .includes("monthly performance report");
    expect(
      found,
      'Pricing feature "Monthly performance report" was re-added — remove it'
    ).toBe(false);
  });

  it('must not contain "automatic" in package feature descriptions', () => {
    // Only check the PACKAGES object, not comments or function names
    const packagesStart = pricingSource.indexOf("export const PACKAGES");
    const packagesEnd = pricingSource.indexOf("} as const;", packagesStart);
    const packagesBlock = pricingSource.slice(packagesStart, packagesEnd);
    const found = packagesBlock.toLowerCase().includes("automatically");
    expect(
      found,
      'Package feature descriptions must not promise anything "automatically"'
    ).toBe(false);
  });
});
