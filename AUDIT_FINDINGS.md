# MiniMorph Studios — Pre-Launch Security & Compliance Audit

## CRITICAL ISSUES (Must Fix Before Launch)

### 1. MISSING: Twilio Webhook Signature Validation
- **Risk:** HIGH — Anyone can send fake SMS webhooks to trigger AI conversations, opt-outs, or owner notifications
- **Location:** `server/twilio-webhooks.ts`
- **Fix:** Add `twilio.validateRequest()` signature check on all webhook endpoints
- **Status:** NOT IMPLEMENTED

### 2. MISSING: CAN-SPAM Physical Address in Emails
- **Risk:** HIGH — Federal law requires physical mailing address in all commercial emails
- **Location:** `server/services/email.ts` — all email templates
- **Fix:** Add physical business address to email footer
- **Status:** NOT IMPLEMENTED

### 3. MISSING: Email Unsubscribe Link / List-Unsubscribe Header
- **Risk:** HIGH — CAN-SPAM requires one-click unsubscribe in all commercial emails
- **Location:** `server/services/email.ts`
- **Fix:** Add unsubscribe link in email footer + List-Unsubscribe header
- **Status:** NOT IMPLEMENTED

### 4. MISSING: Security Headers (Helmet)
- **Risk:** MEDIUM — No X-Frame-Options, X-Content-Type-Options, CSP, etc.
- **Location:** `server/_core/index.ts`
- **Fix:** Add helmet middleware
- **Status:** NOT IMPLEMENTED

### 5. MISSING: Rate Limiting on Public Endpoints
- **Risk:** MEDIUM — Public endpoints (contact form, rep application, free audit) have no rate limiting
- **Location:** `server/routers.ts`, `server/leadGenRouter.ts`
- **Fix:** Add express-rate-limit on public-facing endpoints
- **Status:** NOT IMPLEMENTED

### 6. MISSING: Privacy Policy & Terms of Service Pages
- **Risk:** HIGH — Required for any business collecting user data, especially with Stripe payments
- **Location:** Frontend — no routes exist
- **Fix:** Create /privacy and /terms pages
- **Status:** NOT IMPLEMENTED

## GOOD (Already Implemented)

### Security ✅
- SQL injection: All queries use Drizzle ORM parameterized queries (safe)
- XSS: Only one dangerouslySetInnerHTML in shadcn chart component (safe — no user input)
- Env var exposure: No server secrets leak to client bundle (only VITE_ prefixed vars)
- Stripe webhook: Properly verified via `stripe.webhooks.constructEvent()`
- Resend webhook: Properly verified via Svix signature validation
- Auth: Protected/admin procedures properly gate sensitive endpoints
- Cookies: httpOnly, secure, sameSite=none (correct for OAuth flow)
- No PCI violations: Card data never touches our server (Stripe Checkout handles it)

### SMS Compliance ✅
- STOP keyword handling: Detects STOP/unsubscribe/cancel/quit/end
- Opt-out tracking: `smsOptedOut` flag in leads table, checked before sending
- Opt-out notice: "Reply STOP to opt out" appended to first SMS
- Opt-out confirmation: Sends unsubscribe confirmation message

### Smart Timing ✅
- Email: Tue-Thu 9-11am local time (best B2B open rates)
- SMS: Mon-Fri 10am-5pm local time (business hours)
- Timezone-aware scheduling

### Error Handling ✅
- All scheduler jobs wrapped in try/catch
- Graceful degradation on API failures
- Proper error logging throughout

## EFFICIENCY IMPROVEMENTS (Nice to Have)

### 7. Database Indexes
- No explicit indexes defined in schema beyond primary keys
- Should add indexes on: leads.assignedRepId, leads.stage, leads.phone, outreachSequences.leadId, aiConversations.leadId
- **Impact:** Query performance at scale

### 8. N+1 Query Patterns
- Some list endpoints fetch related data in loops
- Could use joins or batch queries for better performance
- **Impact:** Minor at current scale, significant at 1000+ leads
