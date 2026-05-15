# 09 — Claude Rules

**These rules apply to every Claude session working on MMV4. No exceptions.**

---

## Rule 1: Read Before Acting

Before doing any work, read in this order:
1. `docs/control-center/01_GLOBAL_CONTEXT.md`
2. `docs/control-center/03_ACTIVE_BUILD_STATE.md`
3. `docs/control-center/09_CLAUDE_RULES.md` (this file)
4. `docs/control-center/10_NEXT_ACTION.md`
5. The relevant `systems/*.md` file for the active gate

Do not start coding before reading the active build state. The chat context from previous sessions is not reliable. The control center is the source of truth.

---

## Rule 2: Do Not Touch Frozen Systems

The following systems are frozen. Do not modify, enable, debug, or extend them for any reason unless the user explicitly unlocks them:

- Lead engine (`leadGen*.ts`, lead scraping, Yelp Fusion, Bing/Google Places)
- Rep ecosystem (`repEcosystem.ts`, `client/src/pages/rep/`)
- Sales Academy (`academyRouter.ts`, `academy-curriculum.ts`)
- X/Twitter growth engine (`xGrowthRouter.ts`, `xService.ts`)
- Broadcasts (`admin/Broadcasts.tsx`)
- Social media scheduling (`socialRouter.ts`)
- Auto-domain registration
- Auto-payout to reps

If a bug is found in a frozen system that does not affect the active gate, document it in `07_KNOWN_BLOCKERS.md` as P2 and leave it alone.

---

## Rule 3: No Fake Proof — Ever

Never write, restore, or generate:
- `★★★★★` in any content, testimonial, or review section
- Invented member/client/project counts
- Invented ratings (4.9★, 5/5, etc.)
- Superlatives ("Best in [city]", "#1", "Top-rated")
- Free trials, guarantees, or promotions not provided by the customer
- Fake testimonial cards beyond the TESTIMONIAL_1 slot

If a template passes through your hands for any reason, run the grep suite before committing:
```bash
grep -r "★★★★★" server/templates/
grep -r "formspree" server/templates/
grep -rn "return false" server/templates/
```

---

## Rule 4: Forms Must Use APP_URL_PLACEHOLDER

Every form on every template must use:
```html
<form action="APP_URL_PLACEHOLDER/api/contact-submit" method="POST">
```

Never:
- Hardcode `https://www.minimorphstudios.net` in a template
- Use `formspree.io`
- Use `onsubmit="return false;"`
- Leave an empty or placeholder `action`

---

## Rule 5: Don't Drift the Scope

Each session is assigned a specific gate from `10_NEXT_ACTION.md`. Work only within that gate.

Do not:
- Refactor code that isn't part of the gate
- Add features not requested
- Enable frozen systems
- Fix P2 bugs while a P0 is open
- Make "while I'm here" improvements

If you notice something wrong outside the gate scope, add it to `07_KNOWN_BLOCKERS.md` and leave it for the appropriate gate.

---

## Rule 6: Build Must Pass

Before any commit:
```bash
pnpm check    # TypeScript type check
pnpm build    # Full production build
```

Both must pass with zero errors. A passing `pnpm check` with a failing build is not acceptable. A commit with type errors is not acceptable. Do not skip these checks.

---

## Rule 7: Only Commit Docs or App Code — Not Mixed

When closing a documentation-only gate (like Control Center Creation), use:
```bash
git add docs/control-center
git diff --stat HEAD
```

Verify that only documentation files are staged. Do not accidentally include app code changes.

When closing an app code gate, verify that documentation files weren't accidentally modified.

---

## Rule 8: Deployment is Confirmed by HTTP Header — Not by Git Push

A successful `git push` only updates the repository. Railway autodeploy may take 1–3 minutes.

Confirm deployment:
```bash
curl -sI https://www.minimorphstudios.net/health | grep last-modified
```

A changed `Last-Modified` timestamp compared to before the push means Railway picked up the new commit and restarted.

---

## Rule 9: Update the Control Center After Every Gate

After closing a gate, update:
- `03_ACTIVE_BUILD_STATE.md` — new HEAD, new active lane, new blocker
- `07_KNOWN_BLOCKERS.md` — move resolved blockers to "Resolved" section
- `08_CHANGE_LOG.md` — add entry for the key commit
- `10_NEXT_ACTION.md` — advance to the next gate

These updates should be in a separate commit from the gate work itself, or bundled with the final gate commit. Never leave the control center stale.

---

## Rule 10: Don't Invent State

If you're unsure whether something is deployed, working, or done — check:
- `git log --oneline` for what's committed
- HTTP header check for what's deployed
- Static file grep for what's in templates
- `pnpm check` / `pnpm build` for what compiles

Do not assume a thing is done because it was discussed in chat. Do not assume a deployment succeeded because the push succeeded. Verify.
