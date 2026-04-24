# Values Alignment Audit Notes

## 1. RepValuesGate.tsx — CORE_VALUES
Six values defined:
1. **Integrity First** — no misrepresentation, no overpromising, honesty
2. **Client Obsession** — treat client goals as own, say no if not right fit
3. **Radical Transparency** — no hidden fees, no bait-and-switch, no fine print
4. **Ethical Selling** — consultative, educate not manipulate, sell solutions not fear
5. **Trustworthy Representation** — carry brand proudly, make us proud
6. **Team Above Self** — share leads, celebrate together, no lone wolves

Key phrases: "honest, trustworthy, moral character", "smart, honest, driven", "AI-driven company"

## 2. Assessment Questions (assessmentData.ts)
Gate 1 (Situational Judgment) tests:
- sj1: "Value vs. Price" → maps to Ethical Selling, Radical Transparency
- sj2: "Empathy & Professionalism" → maps to Client Obsession
- sj3: "Integrity" → maps to Integrity First
- sj4: "Team Ethics" → maps to Team Above Self, Trustworthy Representation
- sj5: "Resilience & Attitude" → NOT directly mapped to any core value
- sj6: "Brand Representation" → maps to Trustworthy Representation

**GAP:** No question directly tests "Radical Transparency" (no hidden fees, no fine print).
**GAP:** "Resilience & Attitude" is a good trait but not one of the 6 stated values.
**GAP:** No question tests "Client Obsession" specifically (saying no when not right fit — sj3 is close but labeled Integrity).

## 3. NDA/Trust Gate (onboardingDataRouter.ts)
- NDA is purely legal/IP protection. 7 clauses about confidentiality, IP, non-compete.
- **GAP:** NDA does NOT reference company values, ethics, or character expectations at all.
- The trust gate page (TrustGate.tsx) collects identity info but doesn't reinforce values.

## 4. Academy Training (academy-curriculum.ts)
8 modules: Product Mastery, Psychology of Selling, Discovery Call, Objection Handling, Closing Techniques, Digital Prospecting, Account Management, Advanced Tactics.
- Scattered references to trust, honesty in scripts ("I want to be honest with you", "Never create false scarcity. It destroys trust")
- **MAJOR GAP:** No dedicated module on company values, ethics, or culture.
- Academy teaches HOW to sell but not WHO we are or WHY we sell the way we do.
- No explicit connection between the 6 core values and the sales techniques taught.
- The "never trash the competition" principle aligns with Ethical Selling but isn't framed that way.

## 5. Onboarding Paperwork (OnboardingPaperwork.tsx)
- Rep Agreement is purely contractual (commission rates, termination, non-compete).
- **GAP:** No values statement or code of conduct in the rep agreement.
- NDA reference exists but no values reference.

## SUMMARY OF GAPS
1. **No single source of truth** — values are defined only in RepValuesGate.tsx as a UI array
2. **Academy has zero values training** — teaches sales skills but not the ethical foundation
3. **Assessment doesn't cover all 6 values** — missing Radical Transparency, Client Obsession direct test
4. **NDA is values-free** — purely legal, no ethics/character language
5. **Rep Agreement has no code of conduct** — just contractual terms
6. **Trust Gate page doesn't reinforce values** — just collects data
7. **No values reinforcement after initial gate** — once past the gate, values disappear
