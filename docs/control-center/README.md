# MMV4 Control Center

**Every future Claude session must read this before doing any work.**

## Required Reading Order

1. [`01_GLOBAL_CONTEXT.md`](01_GLOBAL_CONTEXT.md) — What MiniMorph is, how it sells, what is and is not active
2. [`03_ACTIVE_BUILD_STATE.md`](03_ACTIVE_BUILD_STATE.md) — Current project, active lane, blocker, frozen systems
3. [`09_CLAUDE_RULES.md`](09_CLAUDE_RULES.md) — Mandatory operating rules for all Claude sessions
4. [`10_NEXT_ACTION.md`](10_NEXT_ACTION.md) — The exact next engineering gate

Then read the relevant system file from [`systems/`](systems/) for the active gate.

## Cardinal Rule

> **Do not rely on chat memory as source of truth. Use the repo control center and current git state.**

Chat history is lossy, truncated, and session-scoped. The control center and `git log` are permanent.

## Full File Index

| File | Purpose |
|---|---|
| `01_GLOBAL_CONTEXT.md` | What MiniMorph sells, AI positioning, business model |
| `02_ARCHITECTURE_MAP.md` | System map, key files, flow from intake to launch |
| `03_ACTIVE_BUILD_STATE.md` | Current state snapshot: commit, lane, blocker, next gate |
| `04_SYSTEM_DEPENDENCIES.md` | How systems connect; rules before editing code |
| `05_LAUNCH_GATES.md` | Pre-customer and pre-public-launch gates |
| `06_QUALITY_RULES.md` | Fake proof rules, form rules, 95/100 standard |
| `07_KNOWN_BLOCKERS.md` | Current P0/P1/P2 blockers with exact file locations |
| `08_CHANGE_LOG.md` | Key commits and what each did/did not prove |
| `09_CLAUDE_RULES.md` | Hard rules for all Claude sessions |
| `10_NEXT_ACTION.md` | Next gate: Contact Flow P0 Repair |
| `systems/website-generator.md` | Generator flow, templates, quality rules |
| `systems/elena-intake.md` | Intake agent, questionnaire, blueprint |
| `systems/admin-review.md` | Admin approval gates, QA role |
| `systems/customer-portal.md` | Customer review, payment, portal |
| `systems/contact-lead-flow.md` | /api/contact-submit, broken forms, P0 blocker |
| `systems/payments-contracts.md` | Stripe, contracts, frozen rules |
| `systems/deployment-domains.md` | Cloudflare Pages, Railway, domain flow |
| `systems/reps-commissions.md` | Rep ecosystem — frozen |
| `systems/lead-engine.md` | Lead generation — frozen |

## Update Rule

After every completed gate: update `03_ACTIVE_BUILD_STATE.md`, `07_KNOWN_BLOCKERS.md`, `08_CHANGE_LOG.md`, and `10_NEXT_ACTION.md`.
