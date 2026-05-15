# System: Reps and Commissions

## Status: FROZEN

**Do not activate, modify, or extend this system before first customer delivery is confirmed.**

---

## What This System Does

The rep ecosystem allows MiniMorph to work with commission-based sales representatives who bring in customers. Reps earn a percentage of monthly contract revenue.

---

## Key Files

| File | Purpose |
|---|---|
| `server/repEcosystem.ts` | Core rep logic, commissions, check-ins |
| `client/src/pages/rep/` | Rep dashboard pages |
| `server/routers.ts (repRouter)` | Rep tRPC procedures |

---

## Rep Dashboard Pages

| Page | Purpose |
|---|---|
| `rep/Dashboard.tsx` | Main rep landing page |
| `rep/Leads.tsx` | Leads assigned to this rep |
| `rep/Commissions.tsx` | Commission history and pending payouts |
| `rep/Academy.tsx` | Sales Academy (also frozen) |

---

## Onboarding Flow for Reps

Reps go through an 8-step onboarding flow before they can work leads:
1. Account setup
2. Profile information
3. Contract signing
4. Payment information
5. Background check (if applicable)
6. Academy enrollment
7. Assessment completion
8. Final activation

The `getOnboardingStatus` procedure checks all 8 steps and routes reps to their current step on login.

---

## Commission Model

- Reps earn a percentage of each customer's monthly contract value
- Commission is tracked in the `commissions` table
- Auto-payout is frozen — payouts are currently manual

---

## Current Active Reps (as of last DB cleanup)

| Rep | Status |
|---|---|
| Jodi Sodini | active |
| Quinn Wasilchenko | training |
| Chelsea McKinley | training |

---

## Frozen Rules

- Do not activate auto-payout
- Do not assign leads to reps until first customer delivery is confirmed
- Do not enable the rep dashboard for external reps until the system is formally reviewed
- Rep login and dashboard pages exist and are functional but not used for active customers yet
