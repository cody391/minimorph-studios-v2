# Dev Access Guide

## Overview

The Dev Access system allows the platform owner (admin) to safely test **all roles and pages** without creating separate accounts or weakening production security. It works by temporarily linking the admin user to rep/customer/project records.

---

## Quick Start

1. Sign in with your admin account (OAuth)
2. Navigate to `/dev-access`
3. Click **"Seed Test Data"** — this creates:
   - A rep record linked to your admin user
   - A customer record linked to your admin user
   - A contract linking the customer to the rep
   - An onboarding project for the customer
4. Use the Quick Navigation panel to visit any page

---

## How It Works

### Role System

| Role | Access | How to Get |
|------|--------|------------|
| `admin` | All /admin/* pages, all backend admin procedures | Set `role = "admin"` in users table |
| `user` | Public pages, /portal (if customer record exists), /rep (if rep record exists) | Default for all new users |

### Record Linking

The platform determines what a user can see based on **linked records**:

- **Rep Dashboard** (`/rep`): Requires a row in `reps` table with `userId = currentUser.id`
- **Customer Portal** (`/portal`): Requires a row in `customers` table with `userId = currentUser.id`
- **Onboarding** (`/onboarding`): Requires a customer record with a linked `onboarding_projects` row

The Dev Access system creates these records for the admin user, allowing them to experience each role's UI.

---

## API Reference

All procedures are admin-only (require `role = "admin"`).

### `trpc.devAccess.getDevStatus`

Returns the admin's current linked records.

```ts
const { data } = trpc.devAccess.getDevStatus.useQuery();
// Returns: { userId, userName, userRole, linkedRep, linkedCustomer, linkedProject }
```

### `trpc.devAccess.seedTestData`

Creates rep + customer + contract + onboarding project linked to the admin user. Idempotent — won't create duplicates if records already exist.

```ts
const seed = trpc.devAccess.seedTestData.useMutation();
await seed.mutateAsync();
```

### `trpc.devAccess.unlinkAll`

Removes the admin's userId from all rep/customer records (sets userId to 0/null). Records remain in the database for reference.

```ts
const unlink = trpc.devAccess.unlinkAll.useMutation();
await unlink.mutateAsync();
```

### `trpc.devAccess.linkAsRep` / `trpc.devAccess.linkAsCustomer`

Link the admin to a specific existing rep or customer record by ID.

```ts
const linkRep = trpc.devAccess.linkAsRep.useMutation();
await linkRep.mutateAsync({ repId: 5 });

const linkCustomer = trpc.devAccess.linkAsCustomer.useMutation();
await linkCustomer.mutateAsync({ customerId: 3 });
```

---

## Route Map

### Public (no auth required)
| Route | Page |
|-------|------|
| `/` | Home / Landing |
| `/get-started` | Checkout flow |
| `/login` | Local login |
| `/free-audit` | Free audit form |
| `/become-rep/values` | Rep values gate |
| `/become-rep` | Rep application |
| `/become-rep/trust-gate` | Trust verification |
| `/become-rep/paperwork` | Onboarding paperwork |
| `/become-rep/payout-setup` | Stripe Connect setup |
| `/rep-assessment` | Rep skills assessment |
| `/careers` | Careers page |
| `/showroom/:slug` | Demo site viewer |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/unsubscribe` | Email unsubscribe |
| `/checkout/success` | Post-checkout confirmation |

### Authenticated (requires login)
| Route | Page | Additional Requirement |
|-------|------|----------------------|
| `/portal` | Customer Portal | Customer record linked to user |
| `/onboarding` | Onboarding flow | Customer + onboarding project |
| `/rep` | Rep Dashboard | Rep record linked to user |

### Admin Only (requires `role = "admin"`)
| Route | Page |
|-------|------|
| `/admin` | Admin Overview |
| `/admin/reps` | Rep Management |
| `/admin/leads` | Lead Management |
| `/admin/customers` | Customer Management |
| `/admin/contracts` | Contract Management |
| `/admin/commissions` | Commission Tracking |
| `/admin/nurture` | Nurture Logs |
| `/admin/reports` | Reports |
| `/admin/upsells` | Upsell Opportunities |
| `/admin/renewals` | Renewal Management |
| `/admin/submissions` | Contact Submissions |
| `/admin/analytics` | Analytics Dashboard |
| `/admin/orders` | Order Management |
| `/admin/onboarding` | Onboarding Projects |
| `/admin/lead-gen` | Lead Gen Engine |
| `/admin/widgets` | Widget Catalog |
| `/admin/social` | Social Media Hub |
| `/admin/social/calendar` | Content Calendar |
| `/admin/social/brand` | Brand Kit |
| `/admin/social/ai` | AI Content Studio |
| `/admin/x-growth` | X Growth Engine |
| `/admin/governance` | Governance Panel |
| `/dev-access` | Dev Access Panel |

---

## Security Notes

- All dev access procedures use `adminProcedure` — only users with `role = "admin"` can call them
- No env-gating is needed because admin role IS the security gate
- The `/dev-access` page itself checks `user.role === "admin"` on the frontend
- Unlinking doesn't delete data — it just removes the userId association
- Production users are never affected by dev access operations
