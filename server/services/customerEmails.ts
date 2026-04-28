/**
 * Customer Lifecycle Emails
 * Wired to Stripe checkout, onboarding stage transitions, and retention events.
 * All emails use the MiniMorph dark premium brand template.
 */
import { sendEmail } from "./email";
import { PACKAGES, type PackageKey } from "../../shared/pricing";

/* ─── Dark Premium Brand HTML wrapper ─── */
function brandWrap(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#111122;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#1c1c30;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
    <div style="background:linear-gradient(135deg,#1c1c30 0%,#222240 100%);padding:28px 32px;border-bottom:1px solid #2d2d45;">
      <h1 style="color:#eaeaf0;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">MiniMorph Studios</h1>
    </div>
    <div style="padding:32px;line-height:1.7;color:#eaeaf0;">
      ${bodyHtml}
    </div>
    <div style="background:#151526;padding:20px 32px;border-top:1px solid #2d2d45;">
      <p style="margin:0;font-size:12px;color:#7a7a90;">
        MiniMorph Studios &mdash; Beautiful websites for growing businesses
      </p>
    </div>
  </div>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════
   1. POST-PURCHASE WELCOME EMAIL
   Sent immediately after checkout.session.completed
   ═══════════════════════════════════════════════════════ */
export async function sendWelcomeEmail(params: {
  to: string;
  customerName: string;
  packageTier: PackageKey;
  businessName?: string;
}) {
  const pkg = PACKAGES[params.packageTier];
  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Welcome to MiniMorph Studios!</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Thank you for choosing the <strong style="color:#eaeaf0;">${pkg.name}</strong> plan${params.businessName ? ` for ${params.businessName}` : ""}. 
      We're excited to start building your new website.
    </p>
    <h3 style="color:#4a9eff;margin:24px 0 12px;font-size:18px;">What Happens Next</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;vertical-align:top;width:40px;">
          <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#4a9eff;color:#111122;text-align:center;line-height:28px;font-size:14px;font-weight:700;">1</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;">
          <strong style="color:#eaeaf0;">Onboarding Questionnaire</strong> (Today)<br/>
          <span style="color:#9898a8;font-size:14px;">Log in to your Customer Portal and tell us about your brand, audience, and vision.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;vertical-align:top;">
          <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#4a9eff;color:#111122;text-align:center;line-height:28px;font-size:14px;font-weight:700;">2</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;">
          <strong style="color:#eaeaf0;">Design Mockup</strong> (Week 1-2)<br/>
          <span style="color:#9898a8;font-size:14px;">Our team creates your custom design based on your answers.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;vertical-align:top;">
          <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#4a9eff;color:#111122;text-align:center;line-height:28px;font-size:14px;font-weight:700;">3</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;">
          <strong style="color:#eaeaf0;">Review & Revisions</strong> (Week 2-3)<br/>
          <span style="color:#9898a8;font-size:14px;">You review the design and request any changes &mdash; up to ${params.packageTier === "premium" ? "unlimited" : "3"} rounds.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;vertical-align:top;">
          <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#d4a853;color:#111122;text-align:center;line-height:28px;font-size:14px;font-weight:700;">4</span>
        </td>
        <td style="padding:12px 16px;">
          <strong style="color:#eaeaf0;">Launch!</strong> (Week 3-4)<br/>
          <span style="color:#9898a8;font-size:14px;">Your new website goes live. We handle everything.</span>
        </td>
      </tr>
    </table>
    <div style="margin:24px 0;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">Your Plan:</strong> ${pkg.name} &mdash; $${pkg.monthlyPrice}/mo<br/>
        <strong style="color:#eaeaf0;">Includes:</strong> ${pkg.features.slice(0, 3).join(", ")}, and more
      </p>
    </div>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      If you have any questions, just reply to this email or use the Support tab in your Customer Portal.
    </p>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);

  return sendEmail({
    to: params.to,
    subject: `Welcome to MiniMorph Studios — Let's build your website!`,
    html,
    transactional: true,
  });
}

/* ═══════════════════════════════════════════════════════
   2. ONBOARDING STAGE TRANSITION EMAILS
   Sent when the project moves between stages
   ═══════════════════════════════════════════════════════ */
export async function sendOnboardingStageEmail(params: {
  to: string;
  customerName: string;
  stage: string;
  businessName?: string;
  projectId?: number;
}) {
  const stageContent: Record<string, { subject: string; body: string }> = {
    questionnaire: {
      subject: "Your onboarding questionnaire is ready",
      body: `
        <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Time to Tell Us About Your Business</h2>
        <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
        <p style="margin:0 0 16px;color:#c8c8d8;">
          Your onboarding questionnaire is ready in your Customer Portal. This helps us understand your brand, 
          target audience, and design preferences so we can build the perfect website for ${params.businessName || "your business"}.
        </p>
        <p style="margin:0 0 16px;color:#c8c8d8;">It takes about 10-15 minutes. The more detail you provide, the better your site will be.</p>
        <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
      `,
    },
    design: {
      subject: "Your design mockup is ready for review!",
      body: `
        <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Your Design Is Ready!</h2>
        <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
        <p style="margin:0 0 16px;color:#c8c8d8;">
          Great news &mdash; your custom website design for ${params.businessName || "your business"} is ready for review!
        </p>
        <p style="margin:0 0 16px;color:#c8c8d8;">
          Log in to your Customer Portal to see the mockup. You can leave feedback and request revisions 
          directly from the Onboarding tab.
        </p>
        <div style="margin:24px 0;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
          <p style="margin:0;font-size:14px;color:#c8c8d8;">
            <strong style="color:#eaeaf0;">Tip:</strong> Be specific with your feedback &mdash; "Make the header bolder" is more actionable 
            than "I don't love it yet." We want to get it perfect for you.
          </p>
        </div>
        <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
      `,
    },
    review: {
      subject: "Your design mockup is ready for review!",
      body: `
        <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Design Review Time</h2>
        <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
        <p style="margin:0 0 16px;color:#c8c8d8;">
          Your website design has been updated and is ready for your review. Head to the Customer Portal 
          to check it out and let us know if it's perfect or if you'd like any adjustments.
        </p>
        <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
      `,
    },
    launch: {
      subject: "Your website is LIVE!",
      body: `
        <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Congratulations &mdash; You're Live!</h2>
        <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
        <p style="margin:0 0 16px;color:#c8c8d8;">
          Your new website for ${params.businessName || "your business"} is officially live! 
        </p>
        <p style="margin:0 0 16px;color:#c8c8d8;">
          Here's what's included in your ongoing service:
        </p>
        <ul style="margin:0 0 16px;padding-left:20px;color:#c8c8d8;">
          <li style="margin-bottom:8px;">Monthly performance reports in your Customer Portal</li>
          <li style="margin-bottom:8px;">Ongoing maintenance and security updates</li>
          <li style="margin-bottom:8px;">Support whenever you need it</li>
          <li style="margin-bottom:8px;">AI-powered recommendations to improve your results</li>
        </ul>
        <p style="margin:0 0 16px;color:#c8c8d8;">
          Check your Customer Portal regularly to see how your site is performing. Your first monthly report 
          will arrive in about 30 days.
        </p>
        <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
      `,
    },
    complete: {
      subject: "Your onboarding is complete!",
      body: `
        <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Onboarding Complete</h2>
        <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
        <p style="margin:0 0 16px;color:#c8c8d8;">
          Your website project is fully complete. Everything is set up and running smoothly.
        </p>
        <p style="margin:0 0 16px;color:#c8c8d8;">
          Remember, your Customer Portal is always available for support requests, monthly reports, 
          and AI-powered insights about your website's performance.
        </p>
        <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
      `,
    },
  };

  const content = stageContent[params.stage];
  if (!content) return { success: false, error: `No email template for stage: ${params.stage}` };

  return sendEmail({
    to: params.to,
    subject: content.subject,
    html: brandWrap(content.body),
    transactional: true,
  });
}

/* ═══════════════════════════════════════════════════════
   3. RENEWAL REMINDER EMAILS
   Sent at 60, 30, and 7 days before contract end
   ═══════════════════════════════════════════════════════ */
export async function sendRenewalReminderEmail(params: {
  to: string;
  customerName: string;
  daysRemaining: number;
  packageTier: PackageKey;
  endDate: Date;
}) {
  const pkg = PACKAGES[params.packageTier];
  const urgency = params.daysRemaining <= 7 ? "urgent" : params.daysRemaining <= 30 ? "soon" : "upcoming";
  const urgencyColor = urgency === "urgent" ? "#ef4444" : "#eaeaf0";

  const html = brandWrap(`
    <h2 style="color:${urgencyColor};margin:0 0 16px;font-size:24px;">
      ${urgency === "urgent" ? "Your contract expires in " + params.daysRemaining + " days" :
        urgency === "soon" ? "Renewal reminder &mdash; " + params.daysRemaining + " days left" :
        "Your contract renewal is coming up"}
    </h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Your ${pkg.name} plan ($${pkg.monthlyPrice}/mo) ${urgency === "urgent" ? "expires" : "is set to renew"} on 
      <strong style="color:#eaeaf0;">${params.endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.
    </p>
    ${urgency === "urgent" ? `
    <div style="margin:24px 0;padding:16px;background:#2a1a1a;border-radius:8px;border-left:4px solid #ef4444;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">Action needed:</strong> To avoid any interruption to your website service, 
        please ensure your payment method is up to date in your Customer Portal.
      </p>
    </div>` : ""}
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Want to upgrade your plan or have questions about renewal? Reply to this email or visit the 
      Upgrades tab in your Customer Portal.
    </p>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);

  return sendEmail({
    to: params.to,
    subject: urgency === "urgent"
      ? `Action needed: Your MiniMorph plan expires in ${params.daysRemaining} days`
      : `Your MiniMorph plan renews in ${params.daysRemaining} days`,
    html,
  });
}

/* ═══════════════════════════════════════════════════════
   4. NPS SURVEY EMAIL
   Sent at 30 days and 6 months post-launch
   ═══════════════════════════════════════════════════════ */
export async function sendNpsSurveyEmail(params: {
  to: string;
  customerName: string;
  surveyUrl: string;
  milestone: "30_day" | "6_month";
}) {
  const milestoneText = params.milestone === "30_day" ? "one month" : "six months";

  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">How are we doing?</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      It's been ${milestoneText} since your website launched, and we'd love to hear how things are going. 
      Your feedback helps us improve our service for everyone.
    </p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      It takes less than 2 minutes:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${params.surveyUrl}" style="display:inline-block;padding:12px 32px;background:#4a9eff;color:#111122;text-decoration:none;border-radius:6px;font-weight:700;">
        Share Your Feedback
      </a>
    </div>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);

  return sendEmail({
    to: params.to,
    subject: `Quick question — How's your MiniMorph experience?`,
    html,
  });
}

/* ═══════════════════════════════════════════════════════
   5. REFERRAL INVITATION EMAIL
   Sent when customer refers a friend
   ═══════════════════════════════════════════════════════ */
export async function sendReferralInviteEmail(params: {
  to: string;
  referrerName: string;
  referralUrl: string;
}) {
  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">${params.referrerName} thinks you'd love MiniMorph Studios</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi there,</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Your friend ${params.referrerName} is a MiniMorph Studios customer and thought you might benefit from 
      a professional website for your business.
    </p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      As a referred customer, you'll get a <strong style="color:#eaeaf0;">free website audit</strong> to see exactly how we can help.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${params.referralUrl}" style="display:inline-block;padding:12px 32px;background:#4a9eff;color:#111122;text-decoration:none;border-radius:6px;font-weight:700;">
        Get Your Free Audit
      </a>
    </div>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);

  return sendEmail({
    to: params.to,
    subject: `${params.referrerName} invited you to MiniMorph Studios`,
    html,
  });
}

/* ═══════════════════════════════════════════════════════
   6. PAYMENT FAILED EMAIL
   Sent when invoice.payment_failed fires
   ═══════════════════════════════════════════════════════ */
export async function sendPaymentFailedEmail(params: {
  to: string;
  customerName: string;
  packageTier: PackageKey;
  attemptCount: number;
}) {
  const pkg = PACKAGES[params.packageTier];
  const isFirstAttempt = params.attemptCount <= 1;

  const html = brandWrap(`
    <h2 style="color:#ef4444;margin:0 0 16px;font-size:24px;">
      ${isFirstAttempt ? "Payment issue with your account" : "Urgent: Payment still failing"}
    </h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      We were unable to process your monthly payment of <strong style="color:#eaeaf0;">$${pkg.monthlyPrice}</strong> for your 
      ${pkg.name} plan. ${isFirstAttempt
        ? "This can happen if your card expired or your bank flagged the charge."
        : `This is attempt #${params.attemptCount}. Please update your payment method to avoid service interruption.`}
    </p>
    <div style="margin:24px 0;padding:16px;background:#2a1a1a;border-radius:8px;border-left:4px solid #ef4444;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">What to do:</strong> Log into your Customer Portal and update your payment method, 
        or reply to this email and we'll help you sort it out.
      </p>
    </div>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);

  return sendEmail({
    to: params.to,
    subject: isFirstAttempt
      ? `Action needed: Payment failed for your MiniMorph plan`
      : `Urgent: Update your payment method — attempt #${params.attemptCount}`,
    html,
  });
}


/* ═══════════════════════════════════════════════════════
   7. PAYMENT LINK EMAIL (Rep-Closed Deals)
   Sent when a rep closes a deal and generates a Stripe checkout link
   ═══════════════════════════════════════════════════════ */
export async function sendPaymentLinkEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  packageTier: PackageKey;
  paymentUrl: string;
  repName: string;
}) {
  const pkg = PACKAGES[params.packageTier];
  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Your Website Build is Ready to Start</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Great news! ${params.repName} has put together your <strong style="color:#eaeaf0;">${pkg.name}</strong> package
      for ${params.businessName}. We're ready to start building your website as soon as payment is confirmed.
    </p>
    <div style="margin:24px 0;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">Package:</strong> ${pkg.name}<br/>
        <strong style="color:#eaeaf0;">Monthly:</strong> $${pkg.monthlyPrice}/mo<br/>
        ${pkg.setupFeeInCents > 0 ? `<strong style="color:#eaeaf0;">One-time setup:</strong> $${(pkg.setupFeeInCents / 100).toFixed(0)}<br/>` : ""}
        <strong style="color:#eaeaf0;">Includes:</strong> ${pkg.features.slice(0, 4).join(", ")}
      </p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${params.paymentUrl}" style="display:inline-block;padding:14px 32px;background:#4a9eff;color:#111122;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
        Complete Payment &amp; Get Started
      </a>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:#9898a8;">
      Once payment is confirmed, your onboarding portal will activate and our team will begin your custom website build.
    </p>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);
  return sendEmail({
    to: params.to,
    subject: `Complete your payment — ${pkg.name} package for ${params.businessName}`,
    html,
    transactional: true,
  });
}

/* ═══════════════════════════════════════════════════════
   7b. PAYMENT LINK REMINDER EMAIL
   Sent when a pending_payment contract is older than 24h
   ═══════════════════════════════════════════════════════ */
export async function sendPaymentLinkReminderEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  packageTier: PackageKey;
}) {
  const pkg = PACKAGES[params.packageTier];
  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Friendly Reminder: Complete Your Payment</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      We noticed your payment for the <strong style="color:#eaeaf0;">${pkg.name}</strong> package for ${params.businessName}
      hasn't been completed yet. Your original payment link may have expired.
    </p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      No worries &mdash; our team will send you a fresh payment link shortly. If you have any questions
      about your package or need to make changes, just reply to this email.
    </p>
    <div style="margin:24px 0;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">Package:</strong> ${pkg.name}<br/>
        <strong style="color:#eaeaf0;">Monthly:</strong> $${pkg.monthlyPrice}/mo<br/>
        ${pkg.setupFeeInCents > 0 ? `<strong style="color:#eaeaf0;">One-time setup:</strong> $${(pkg.setupFeeInCents / 100).toFixed(0)}<br/>` : ""}
      </p>
    </div>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);
  return sendEmail({
    to: params.to,
    subject: `Reminder: Complete your ${pkg.name} payment — ${params.businessName}`,
    html,
    transactional: true,
  });
}

/* ═══════════════════════════════════════════════════════
   8. WEBSITE AUDIT EMAIL
   Sent after free audit generation completes.
   Contains the audit score/grade and a link to the full report.
   ═══════════════════════════════════════════════════════ */
export async function sendWebsiteAuditEmail(params: {
  to: string;
  businessName: string;
  contactName?: string;
  websiteUrl?: string;
  auditUrl?: string;
  score: number;
  grade: string;
}) {
  const gradeColor = params.grade === "A" ? "#22c55e" : params.grade === "B" ? "#84cc16" : params.grade === "C" ? "#eab308" : params.grade === "D" ? "#f97316" : "#ef4444";
  const greeting = params.contactName ? `Hi ${params.contactName},` : "Hi there,";
  const viewReportButton = params.auditUrl
    ? `<div style="text-align:center;margin:24px 0;">
        <a href="${params.auditUrl}" style="display:inline-block;padding:14px 32px;background:#4a9eff;color:#111122;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
          View Full Audit Report
        </a>
      </div>`
    : "";

  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Your Website Audit is Ready</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">${greeting}</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      We've completed the free website audit for <strong style="color:#eaeaf0;">${params.businessName}</strong>${params.websiteUrl ? ` (${params.websiteUrl})` : ""}.
      Here's your overall score:
    </p>
    <div style="text-align:center;margin:24px 0;padding:24px;background:#222240;border-radius:12px;">
      <div style="display:inline-block;width:80px;height:80px;border-radius:50%;border:6px solid ${gradeColor};line-height:68px;text-align:center;">
        <span style="font-size:32px;font-weight:800;color:${gradeColor};">${params.grade}</span>
      </div>
      <p style="margin:12px 0 0;font-size:20px;font-weight:600;color:#eaeaf0;">${params.score}/100</p>
    </div>
    ${viewReportButton}
    <p style="margin:0 0 16px;font-size:14px;color:#9898a8;">
      Your report includes performance analysis, mobile responsiveness, SEO review, security assessment, and actionable recommendations.
    </p>
    <div style="margin:24px 0;padding:16px;background:#1a2a1a;border-radius:8px;border-left:4px solid #22c55e;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">Want help fixing these issues?</strong><br/>
        Our team specializes in building modern, high-performing websites. Reply to this email or
        <a href="https://minimorphstudios.net/get-started" style="color:#4a9eff;font-weight:600;">get a free consultation</a>.
      </p>
    </div>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);

  return sendEmail({
    to: params.to,
    subject: `Your Website Audit Results: Grade ${params.grade} (${params.score}/100) — ${params.businessName}`,
    html,
  });
}

/* ═══════════════════════════════════════════════════════
   9. AUDIT REQUEST RECEIVED EMAIL (No Website URL)
   Sent when a visitor requests an audit but provides no website URL.
   Lets them know we received the request and will review manually.
   ═══════════════════════════════════════════════════════ */
export async function sendAuditReceivedEmail(params: {
  to: string;
  businessName: string;
  contactName?: string;
}) {
  const greeting = params.contactName ? `Hi ${params.contactName},` : "Hi there,";
  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">We Received Your Request</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">${greeting}</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Thank you for your interest in a website audit for <strong style="color:#eaeaf0;">${params.businessName}</strong>.
    </p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Since we didn't receive a website URL, one of our team members will review your request
      and reach out within 1 business day with personalized recommendations for your online presence.
    </p>
    <div style="margin:24px 0;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #d4a853;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">In the meantime:</strong> If you'd like to get started right away, you can
        <a href="https://minimorphstudios.net/get-started" style="color:#4a9eff;font-weight:600;">explore our packages</a>
        or reply to this email with any questions.
      </p>
    </div>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);

  return sendEmail({
    to: params.to,
    subject: `We received your audit request — ${params.businessName}`,
    html,
    transactional: true,
  });
}
