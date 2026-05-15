# 04 — System Dependencies

## Dependency Chain

```
Elena Intake / Questionnaire
    ↓ produces questionnaire JSON blob
Blueprint Assembly (admin or automatic)
    ↓ blueprint status: approved
Site Generator (siteGenerator.ts)
    ↓ reads blueprint + assets + questionnaire
    ↓ selects template or LLM fallback
Template Engine (templateEngine.ts)
    ↓ Haiku generates copy tokens
    ↓ injectContentIntoTemplate replaces tokens
    ↓ APP_URL_PLACEHOLDER → public base URL
    ↓ stripPackageSections applies tier gating
    ↓ buildAddonWidgets adds addon HTML/JS
Generated HTML stored in DB (generatedSiteHtml JSON)
    ↓
Admin Review (OnboardingProjects.tsx, ManualFulfillment.tsx)
    ↓ admin approves / edits / regenerates
Customer Preview (CustomerPortal.tsx)
    ↓ customer approves
Final Approval stage → Deployment
    ↓ siteDeployment.ts → cloudflareDeployment.ts
    ↓ pages uploaded to Cloudflare Pages
    ↓ custom domain connected if provided
Customer site is live
    ↓
Contact forms on customer site POST to /api/contact-submit
    ↓ creates contact_submissions row
    ↓ notifies MiniMorph owner (Resend)
    ↓ emails business owner
Support / Nurturing pipeline begins
```

## Key Dependencies Before Editing Code

### Before touching `siteGenerator.ts` or `templateEngine.ts`:
- Run `pnpm check` after any change
- Run `pnpm build` after any change
- Verify `brief.appUrl` never includes `/portal` suffix
- Verify all HONESTY RULES blocks remain in prompts
- Do NOT remove the blueprint-approval gate (line ~645 in siteGenerator.ts)
- Do NOT remove the payment gate for self-service projects

### Before touching any `server/templates/*.html`:
- Check all contact forms use `APP_URL_PLACEHOLDER/api/contact-submit` (not Formspree, not `return false`)
- Check no `★★★★★` or invented metrics are present
- Check no fake testimonials beyond the TESTIMONIAL_1 token slot
- Run the fake-proof grep suite (see `07_KNOWN_BLOCKERS.md`)
- Remember: sub-pages are generated alongside the index page

### Before touching `server/routers.ts`:
- File is ~8000 lines. Procedures are organized into sub-routers.
- `onboarding.*` procedures: use `protectedProcedure` (any logged-in user)
- `admin.*` procedures: use `adminProcedure` (admin role required)
- `onboarding.triggerGeneration`: uses `adminProcedure`
- `onboarding.approveBlueprint`: uses `protectedProcedure` (admin bypasses ownership check)
- Adding a new procedure requires corresponding client hook in tRPC client

### Before touching `drizzle/schema.ts`:
- Any schema change requires a new migration file (pnpm run db:push or manual SQL)
- 58 migrations already exist — numbering must continue sequentially
- Test DB migrations on staging before production if possible

### Before touching `server/_core/index.ts`:
- This is the Express entry point
- Rate limiters are applied per endpoint path — check before adding new public endpoints
- Stripe webhook MUST be registered before the JSON body parser
- `/api/contact-submit` CORS headers are required for cross-origin generated sites

## Contact Form Dependency

The `/api/contact-submit` endpoint is the **critical link** between generated customer sites and MiniMorph's database. If it breaks:
- Customer's visitors submit forms → silence
- Business owner gets no leads
- MiniMorph owner gets no notification
- Customer churns immediately

Every template that has a form MUST use: `APP_URL_PLACEHOLDER/api/contact-submit`

`APP_URL_PLACEHOLDER` is replaced at generation time with `brief.appUrl`, which is set in `siteGenerator.ts` as:
```
(ENV.appUrl || "https://www.minimorphstudios.net").replace(/\/portal\/?$/, "").replace(/\/$/, "")
```

This produces: `https://www.minimorphstudios.net` (no trailing slash, no `/portal`).

## Stripe / Contract Dependency

Contracts are required for the nurturing pipeline to activate (`nurturingActive` flag, `anniversaryDay`). Payment confirmation gates generation only for `source === "self_service"` projects. Rep-closed projects can generate without payment gate.

Do not modify the Stripe webhook handler (`stripe-webhook.ts`) without understanding which contract/payment state transitions it drives.
