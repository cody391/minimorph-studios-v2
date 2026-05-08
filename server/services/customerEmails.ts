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
  /** Plaintext temp password — include only at account-creation time, never log */
  tempPassword?: string;
  portalUrl?: string;
}) {
  const pkg = PACKAGES[params.packageTier];
  const portalUrl = params.portalUrl || "https://minimorphstudios.net/portal";

  const credentialBlock = params.tempPassword ? `
    <div style="margin:24px 0;padding:20px;background:#1a2a1a;border-radius:8px;border-left:4px solid #22c55e;">
      <p style="margin:0 0 10px;font-size:15px;color:#eaeaf0;font-weight:600;">Your login credentials</p>
      <p style="margin:4px 0;font-size:14px;color:#c8c8d8;">Email: <strong style="color:#eaeaf0;">${params.to}</strong></p>
      <p style="margin:4px 0;font-size:14px;color:#c8c8d8;">Temporary password: <strong style="color:#eaeaf0;font-family:monospace;font-size:16px;letter-spacing:1px;">${params.tempPassword}</strong></p>
      <p style="margin:12px 0 0;font-size:12px;color:#7a7a90;">Log in and change your password from your portal account settings.</p>
    </div>
    <div style="text-align:center;margin:20px 0;">
      <a href="${portalUrl}" style="display:inline-block;padding:14px 32px;background:#4a9eff;color:#111122;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
        Log In to Your Portal →
      </a>
    </div>` : "";

  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Welcome to MiniMorph Studios!</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Thank you for choosing the <strong style="color:#eaeaf0;">${pkg.name}</strong> plan${params.businessName ? ` for ${params.businessName}` : ""}.
      We're excited to start building your new website.
    </p>
    ${credentialBlock}
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
   1b. STANDALONE CREDENTIAL EMAIL
   Sent on-demand when the customer clicks "Email me a copy"
   ═══════════════════════════════════════════════════════ */
export async function sendCredentialEmail(params: {
  to: string;
  name: string;
  tempPassword: string;
  portalUrl?: string;
}) {
  const portalUrl = params.portalUrl || "https://minimorphstudios.net/portal";
  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Your MiniMorph Login Details</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.name},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Here are your portal login credentials. Keep this email somewhere safe.
    </p>
    <div style="margin:24px 0;padding:20px;background:#1a2a1a;border-radius:8px;border-left:4px solid #22c55e;">
      <p style="margin:0 0 10px;font-size:15px;color:#eaeaf0;font-weight:600;">Your login credentials</p>
      <p style="margin:4px 0;font-size:14px;color:#c8c8d8;">Email: <strong style="color:#eaeaf0;">${params.to}</strong></p>
      <p style="margin:4px 0;font-size:14px;color:#c8c8d8;">Temporary password: <strong style="color:#eaeaf0;font-family:monospace;font-size:16px;letter-spacing:1px;">${params.tempPassword}</strong></p>
      <p style="margin:12px 0 0;font-size:12px;color:#7a7a90;">You can change your password from your account settings after logging in.</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${portalUrl}" style="display:inline-block;padding:14px 32px;background:#4a9eff;color:#111122;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
        Log In to Your Portal →
      </a>
    </div>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);
  return sendEmail({
    to: params.to,
    subject: "Your MiniMorph Studios login details",
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
  const urgency = params.daysRemaining <= 7 ? "urgent" : params.daysRemaining <= 14 ? "soon" : params.daysRemaining <= 30 ? "approaching" : "upcoming";
  const urgencyColor = urgency === "urgent" ? "#ef4444" : "#eaeaf0";

  const isSevenDay = params.daysRemaining <= 7;
  const isThirtyDay = params.daysRemaining > 14 && params.daysRemaining <= 30;
  const isSixtyDay = params.daysRemaining > 30;

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
    ${isSevenDay ? `
    <div style="margin:24px 0;padding:16px;background:#1a2a1a;border-radius:8px;border-left:4px solid #22c55e;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">No action needed.</strong> Your plan will auto-renew for another 12 months at the same rate.
        If you'd like to upgrade, downgrade, or cancel before renewal, visit the Upgrades tab in your Customer Portal.
      </p>
    </div>` : ""}
    ${isThirtyDay ? `
    <div style="margin:24px 0;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">Auto-renewal:</strong> Your plan will automatically renew for another 12 months unless you cancel before the renewal date.
        If you'd like to make any changes, visit the Upgrades tab in your Customer Portal.
      </p>
    </div>` : ""}
    ${isSixtyDay ? `
    <div style="margin:24px 0;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">Heads up:</strong> Your contract renews in about 2 months.
        This is a great time to review your plan and consider any upgrades before renewal.
      </p>
    </div>` : ""}
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Want to upgrade your plan or have questions? Reply to this email or visit the
      Upgrades tab in your Customer Portal.
    </p>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);

  return sendEmail({
    to: params.to,
    subject: urgency === "urgent"
      ? `Your MiniMorph plan renews in ${params.daysRemaining} days — no action needed`
      : `Your MiniMorph plan renews in ${params.daysRemaining} days`,
    html,
  });
}

/* ═══════════════════════════════════════════════════════
   10. MONTHLY COMPETITIVE WORKUP EMAIL
   Sent with AI-generated competitive analysis report
   ═══════════════════════════════════════════════════════ */
export async function sendCompetitiveWorkupEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  reportText: string;
}) {
  const formattedReport = params.reportText
    .split("\n")
    .map(line => {
      if (line.startsWith("##")) {
        return `<h3 style="color:#4a9eff;margin:20px 0 8px;font-size:16px;">${line.replace(/^#+\s*/, "")}</h3>`;
      }
      if (line.startsWith("#")) {
        return `<h2 style="color:#eaeaf0;margin:20px 0 10px;font-size:18px;">${line.replace(/^#+\s*/, "")}</h2>`;
      }
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return `<li style="color:#c8c8d8;margin-bottom:4px;">${line.replace(/^[-•]\s*/, "")}</li>`;
      }
      if (line.trim() === "") return "";
      return `<p style="margin:0 0 12px;color:#c8c8d8;">${line}</p>`;
    })
    .join("\n");

  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Your Monthly Competitive Report</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 24px;color:#c8c8d8;">
      Here's your monthly competitive intelligence report for <strong style="color:#eaeaf0;">${params.businessName}</strong>.
      We've analyzed your competitors and identified opportunities to stay ahead.
    </p>
    <div style="background:#1c1c30;border:1px solid #2d2d45;border-radius:8px;padding:24px;margin-bottom:24px;">
      ${formattedReport}
    </div>
    <div style="margin:24px 0;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">View full report:</strong> Log in to your Customer Portal and check the Insights tab
        for the complete analysis and historical reports.
      </p>
    </div>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Have questions or want us to act on any of these insights? Reply to this email or use the Support tab in your portal.
    </p>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);

  return sendEmail({
    to: params.to,
    subject: `Your monthly competitive report — ${params.businessName}`,
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
   @deprecated — Portal-first flow: customers pay via Stripe checkout in the portal.
   Kept for backward compatibility; do not call from new code.
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
   @deprecated — Portal-first flow handles payment reminders via Stripe emails.
   Kept for backward compatibility; do not call from new code.
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

/* ═══════════════════════════════════════════════════════
   11. MONTHLY ANNIVERSARY REPORT EMAIL
   One email per month on the customer's anniversary date.
   Month 1-11: analytics + competitive analysis + PDF invoice.
   Month 12: same + renewal notice paragraph.
   ═══════════════════════════════════════════════════════ */
export async function sendMonthlyReportEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  monthLabel: string;        // "May 2026"
  competitiveReport: string;
  isRenewalMonth: boolean;
  renewalDate?: Date;
  monthlyPrice?: string;     // "199.00"
  packageTier?: string;      // "Growth"
  invoiceHtmlBase64?: string;
  invoiceFilename?: string;
}) {
  const formattedReport = params.competitiveReport
    .split("\n")
    .map(line => {
      if (line.startsWith("##")) {
        return `<h3 style="color:#4a9eff;margin:20px 0 8px;font-size:16px;">${line.replace(/^#+\s*/, "")}</h3>`;
      }
      if (line.startsWith("#")) {
        return `<h2 style="color:#eaeaf0;margin:20px 0 10px;font-size:18px;">${line.replace(/^#+\s*/, "")}</h2>`;
      }
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return `<li style="color:#c8c8d8;margin-bottom:4px;">${line.replace(/^[-•]\s*/, "")}</li>`;
      }
      if (line.trim() === "") return "";
      return `<p style="margin:0 0 12px;color:#c8c8d8;">${line}</p>`;
    })
    .join("\n");

  const renewalNotice = params.isRenewalMonth && params.renewalDate
    ? `<div style="margin:28px 0;padding:20px;background:#1a2a1a;border-radius:8px;border-left:4px solid #22c55e;">
        <p style="margin:0;font-size:14px;color:#c8c8d8;line-height:1.7;">
          <strong style="color:#eaeaf0;">Quick heads up</strong> &mdash; your 12-month agreement renews automatically in 30 days on
          <strong style="color:#eaeaf0;">${params.renewalDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.
          Your service, your site, everything continues seamlessly at
          ${params.monthlyPrice ? `<strong style="color:#eaeaf0;">$${params.monthlyPrice}/mo</strong>` : "the same rate"}.
          If you ever have questions or want to make any changes to your plan, just reply to this email or log into your portal.
          Otherwise, we'll see you next month! &mdash; The MiniMorph Team
        </p>
      </div>`
    : "";

  const invoiceNote = params.invoiceHtmlBase64
    ? `<div style="margin:24px 0;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
        <p style="margin:0;font-size:14px;color:#c8c8d8;">
          <strong style="color:#eaeaf0;">Invoice attached</strong> — your ${params.monthLabel} invoice is included as an attachment.
        </p>
      </div>`
    : "";

  const subject = params.isRenewalMonth
    ? `Your ${params.monthLabel} Report + Renewal Notice — ${params.businessName}`
    : `Your ${params.monthLabel} Report — ${params.businessName}`;

  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Your ${params.monthLabel} Report</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 24px;color:#c8c8d8;">
      Here's your monthly update for <strong style="color:#eaeaf0;">${params.businessName}</strong>.
    </p>

    <h3 style="color:#eaeaf0;margin:0 0 12px;font-size:18px;">Analytics</h3>
    <p style="margin:0 0 24px;color:#c8c8d8;">
      Your full analytics &mdash; traffic, conversions, and performance trends &mdash; are always available in your
      <a href="https://minimorphstudios.net/portal" style="color:#4a9eff;">Customer Portal</a> under the Insights tab.
    </p>

    <h3 style="color:#eaeaf0;margin:0 0 12px;font-size:18px;">Competitive Intelligence</h3>
    <div style="background:#1c1c30;border:1px solid #2d2d45;border-radius:8px;padding:24px;margin-bottom:24px;">
      ${formattedReport}
    </div>

    ${invoiceNote}
    ${renewalNotice}

    <p style="margin:0 0 16px;color:#c8c8d8;">
      Have questions or want us to act on any of these insights? Reply to this email or use the Support tab in your portal.
    </p>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);

  return sendEmail({
    to: params.to,
    subject,
    html,
    attachments: params.invoiceHtmlBase64 && params.invoiceFilename
      ? [{ filename: params.invoiceFilename, content: params.invoiceHtmlBase64 }]
      : undefined,
  });
}

/* ═══════════════════════════════════════════════════════
   12. BUILD STARTED EMAIL
   Sent when Elena hands brief to build team
   ═══════════════════════════════════════════════════════ */
export async function sendBuildStartedEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  portalUrl: string;
}) {
  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">We're on it &mdash; building your website now!</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Elena has handed your brief to our build team. We're generating your <strong style="color:#eaeaf0;">${params.businessName}</strong> website right now.
    </p>
    <p style="margin:0 0 24px;color:#c8c8d8;">
      You'll receive another email the moment your preview is ready &mdash; usually within a few minutes. In the meantime, you can track progress in your portal.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${params.portalUrl}" style="display:inline-block;padding:14px 32px;background:#4a9eff;color:#111122;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
        Track Progress in Portal
      </a>
    </div>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);
  return sendEmail({
    to: params.to,
    subject: `We're on it — your site is being built`,
    html,
    transactional: true,
  });
}

/* ═══════════════════════════════════════════════════════
   13. PREVIEW READY EMAIL
   Sent when site generation completes
   ═══════════════════════════════════════════════════════ */
export async function sendPreviewReadyEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  pageNames: string[];
  portalUrl: string;
  revisionsRemaining: number;
}) {
  const pageList = params.pageNames
    .map(p => `<li style="color:#c8c8d8;margin-bottom:6px;">${p.charAt(0).toUpperCase() + p.slice(1)} page</li>`)
    .join("");

  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Your ${params.businessName} website preview is ready!</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      We built something really great for you. Your site preview is waiting in your portal &mdash; take a look, explore every page, and let us know what you think.
    </p>
    <h3 style="color:#4a9eff;margin:20px 0 10px;font-size:16px;">Pages Generated</h3>
    <ul style="margin:0 0 20px;padding-left:20px;">
      ${pageList}
    </ul>
    <div style="margin:20px 0;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">Revision Policy:</strong> You have <strong style="color:#eaeaf0;">${params.revisionsRemaining} round${params.revisionsRemaining !== 1 ? "s" : ""} of revisions</strong> included.
        Request any changes directly in the portal and we'll turn them around fast.
      </p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${params.portalUrl}" style="display:inline-block;padding:14px 40px;background:#4a9eff;color:#111122;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
        Review Your Site
      </a>
    </div>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);
  return sendEmail({
    to: params.to,
    subject: `Your ${params.businessName} website preview is ready for review`,
    html,
    transactional: true,
  });
}

/* ═══════════════════════════════════════════════════════
   14. CHANGES RECEIVED EMAIL
   Sent immediately when customer submits a change request
   ═══════════════════════════════════════════════════════ */
export async function sendChangesReceivedEmail(params: {
  to: string;
  customerName: string;
  portalUrl: string;
}) {
  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Got it &mdash; working on your changes</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      We received your change request and we're on it. You'll get an email the moment your updated preview is ready &mdash; usually within a few minutes.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${params.portalUrl}" style="display:inline-block;padding:12px 32px;background:#4a9eff;color:#111122;text-decoration:none;border-radius:8px;font-weight:700;">
        Track in Portal
      </a>
    </div>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);
  return sendEmail({
    to: params.to,
    subject: `Got it — working on your changes`,
    html,
    transactional: true,
  });
}

/* ═══════════════════════════════════════════════════════
   15. UPDATED PREVIEW READY EMAIL
   Sent when processSiteChangeRequest() completes
   ═══════════════════════════════════════════════════════ */
export async function sendUpdatedPreviewReadyEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  portalUrl: string;
  revisionsRemaining: number;
}) {
  const revisionsNote = params.revisionsRemaining > 0
    ? `You have <strong style="color:#eaeaf0;">${params.revisionsRemaining} revision round${params.revisionsRemaining !== 1 ? "s" : ""}</strong> remaining.`
    : `You've used all your included revision rounds. Additional rounds are available at $149/round — reply to request one.`;

  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Your changes are live in preview</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      We've made your requested changes to <strong style="color:#eaeaf0;">${params.businessName}</strong>. Take a look and let us know if it's perfect or if you'd like any more adjustments.
    </p>
    <div style="margin:20px 0;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">${revisionsNote}</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${params.portalUrl}" style="display:inline-block;padding:14px 40px;background:#4a9eff;color:#111122;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
        Review Updated Site
      </a>
    </div>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);
  return sendEmail({
    to: params.to,
    subject: `Your changes are live in preview — ${params.businessName}`,
    html,
    transactional: true,
  });
}

/* ═══════════════════════════════════════════════════════
   16. APPROVAL CONFIRMATION EMAIL
   Sent when customer clicks "Approve & Launch"
   ═══════════════════════════════════════════════════════ */
export async function sendApprovalConfirmationEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  expectedLaunchDate: string;
}) {
  const html = brandWrap(`
    <h2 style="color:#22c55e;margin:0 0 16px;font-size:24px;">Site approved &mdash; preparing your launch!</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      You've approved your <strong style="color:#eaeaf0;">${params.businessName}</strong> website. Our team is now handling the final launch steps.
    </p>
    <h3 style="color:#4a9eff;margin:20px 0 10px;font-size:16px;">What's Happening Now</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #2d2d45;vertical-align:top;width:36px;">
          <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#4a9eff;color:#111122;text-align:center;line-height:24px;font-size:12px;font-weight:700;">1</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #2d2d45;color:#c8c8d8;font-size:14px;">Connecting your domain to the new site</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #2d2d45;vertical-align:top;">
          <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#4a9eff;color:#111122;text-align:center;line-height:24px;font-size:12px;font-weight:700;">2</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #2d2d45;color:#c8c8d8;font-size:14px;">Setting up SSL certificate and configuring DNS</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;vertical-align:top;">
          <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#4a9eff;color:#111122;text-align:center;line-height:24px;font-size:12px;font-weight:700;">3</span>
        </td>
        <td style="padding:10px 16px;color:#c8c8d8;font-size:14px;">Final QA and going live</td>
      </tr>
    </table>
    <div style="margin:24px 0;padding:16px;background:#1a2a1a;border-radius:8px;border-left:4px solid #22c55e;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">Expected timeline:</strong> ${params.expectedLaunchDate}. DNS propagation can take 24-48 hours &mdash; your site will be fully live worldwide during this window.
      </p>
    </div>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      You'll receive one more email the moment your site is officially live. We're almost there!
    </p>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);
  return sendEmail({
    to: params.to,
    subject: `Site approved — preparing your launch`,
    html,
    transactional: true,
  });
}

/* ═══════════════════════════════════════════════════════
   17. SITE LIVE CELEBRATION EMAIL
   Sent by admin.markSiteLive — the big one
   ═══════════════════════════════════════════════════════ */
export async function sendSiteLiveEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  liveUrl: string;
  portalUrl: string;
}) {
  const html = brandWrap(`
    <h2 style="color:#22c55e;margin:0 0 16px;font-size:26px;">${params.businessName} is LIVE!</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Congratulations &mdash; your website is officially live on the internet. Visit it right now:
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${params.liveUrl}" style="display:inline-block;padding:16px 44px;background:#22c55e;color:#111122;text-decoration:none;border-radius:8px;font-weight:700;font-size:18px;">
        Visit ${params.businessName}
      </a>
    </div>
    <h3 style="color:#4a9eff;margin:28px 0 12px;font-size:17px;">Here's what happens next</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;vertical-align:top;width:28px;font-size:18px;">📊</td>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;">
          <strong style="color:#eaeaf0;">Monthly Performance Reports</strong><br/>
          <span style="color:#c8c8d8;font-size:14px;">Every month on your anniversary date, we'll send you a full performance report including analytics, competitive analysis with three specific recommendations, and your invoice &mdash; all in one email.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;vertical-align:top;font-size:18px;">🔍</td>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;">
          <strong style="color:#eaeaf0;">Competitive Intelligence</strong><br/>
          <span style="color:#c8c8d8;font-size:14px;">We track your competitors so you don't have to. Every month you'll know exactly what they're doing and how to stay ahead.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;vertical-align:top;font-size:18px;">🎛️</td>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;">
          <strong style="color:#eaeaf0;">Your Customer Portal</strong><br/>
          <span style="color:#c8c8d8;font-size:14px;">Log in anytime to request changes, view reports, manage your plan, or get help from our AI assistant. It's your command center.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;vertical-align:top;font-size:18px;">🔄</td>
        <td style="padding:12px 16px;border-bottom:1px solid #2d2d45;">
          <strong style="color:#eaeaf0;">Auto-Renewal</strong><br/>
          <span style="color:#c8c8d8;font-size:14px;">Your 12-month plan renews automatically at the same rate &mdash; no action needed. You'll get a heads-up in your Month 12 report. Cancel or change anytime through the portal.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;vertical-align:top;font-size:18px;">🏠</td>
        <td style="padding:12px 16px;">
          <strong style="color:#eaeaf0;">You Own Your Site</strong><br/>
          <span style="color:#c8c8d8;font-size:14px;">Your website, your content, your domain &mdash; it all belongs to you. We're the team that keeps it running beautifully, but you own everything.</span>
        </td>
      </tr>
    </table>
    <div style="margin:28px 0;padding:20px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
      <p style="margin:0 0 8px;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">Bookmark your portal:</strong>
      </p>
      <a href="${params.portalUrl}" style="color:#4a9eff;font-size:14px;">${params.portalUrl}</a>
    </div>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Share your new site with the world, and don't hesitate to reach out if you need anything. We're your long-term web partner &mdash; we're not going anywhere.
    </p>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);
  return sendEmail({
    to: params.to,
    subject: `${params.businessName} is LIVE!`,
    html,
    transactional: true,
  });
}

/* ═══════════════════════════════════════════════════════
   Portal Access Email
   Sent when a rep closes a deal — replaces old payment-first flow.
   Customer clicks to log in and meet Elena.
   ═══════════════════════════════════════════════════════ */
export async function sendPortalAccessEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  packageTier: PackageKey;
  repName: string;
  portalUrl: string;
  tempPassword?: string;
}) {
  const pkg = PACKAGES[params.packageTier];
  const html = brandWrap(`
    <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">You're booked — meet your design team</h2>
    <p style="margin:0 0 16px;color:#c8c8d8;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;color:#c8c8d8;">
      Exciting news — ${params.repName} just confirmed your <strong style="color:#eaeaf0;">${pkg.name}</strong> package
      for ${params.businessName}. Your onboarding portal is ready and your design specialist Elena is waiting to get started.
    </p>
    <div style="margin:24px 0;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
      <p style="margin:0;font-size:14px;color:#c8c8d8;">
        <strong style="color:#eaeaf0;">Package:</strong> ${pkg.name}<br/>
        <strong style="color:#eaeaf0;">Includes:</strong> ${pkg.features.slice(0, 4).join(", ")}
      </p>
    </div>
    <p style="margin:0 0 20px;color:#c8c8d8;">
      Log in to your portal, answer a few questions about your business, and Elena will design your website brief. Once everything looks perfect, you'll complete payment and we'll start building.
    </p>
    ${params.tempPassword ? `
    <div style="margin:20px 0;padding:20px;background:#1a2a1a;border-radius:8px;border-left:4px solid #22c55e;">
      <p style="margin:0 0 10px;font-size:15px;color:#eaeaf0;font-weight:600;">Your login credentials</p>
      <p style="margin:0 4px;font-size:14px;color:#c8c8d8;">Email: <strong style="color:#eaeaf0;">${params.to}</strong></p>
      <p style="margin:0 4px;font-size:14px;color:#c8c8d8;">Temporary password: <strong style="color:#eaeaf0;font-family:monospace;font-size:16px;letter-spacing:1px;">${params.tempPassword}</strong></p>
      <p style="margin:10px 0 0;font-size:12px;color:#7a7a90;">You can change your password after logging in from your account settings.</p>
    </div>` : ""}
    <div style="text-align:center;margin:24px 0;">
      <a href="${params.portalUrl}" style="display:inline-block;padding:14px 32px;background:#4a9eff;color:#111122;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
        Log In &amp; Meet Elena →
      </a>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:#9898a8;">
      The whole onboarding takes about 10 minutes. You can pause and come back anytime.
    </p>
    <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
  `);
  return sendEmail({
    to: params.to,
    subject: `Your website build is booked — log in to get started`,
    html,
    transactional: true,
  });
}

/* ═══════════════════════════════════════════════════════
   MONTHLY NURTURE EMAILS
   Personalized monthly emails with addon recommendations
   by business type, featuring ROI math. Tracks which
   addons have been pitched to avoid repetition.
   ═══════════════════════════════════════════════════════ */

const BUSINESS_ADDON_MAP: Record<string, string[]> = {
  restaurant: ["review_collector", "ai_chatbot", "booking_widget", "menu_price_list", "event_calendar", "email_marketing_setup", "seo_autopilot", "social_feed_embed", "competitor_monitoring", "sms_alerts"],
  bar: ["event_calendar", "review_collector", "social_feed_embed", "menu_price_list", "email_marketing_setup", "seo_autopilot", "ai_chatbot", "booking_widget", "competitor_monitoring", "sms_alerts"],
  cafe: ["review_collector", "social_feed_embed", "menu_price_list", "email_marketing_setup", "seo_autopilot", "event_calendar", "ai_chatbot", "booking_widget", "competitor_monitoring", "sms_alerts"],
  coffee: ["review_collector", "social_feed_embed", "menu_price_list", "email_marketing_setup", "event_calendar", "online_store", "seo_autopilot", "ai_chatbot", "competitor_monitoring", "ai_photography"],
  contractor: ["sms_alerts", "review_collector", "booking_widget", "seo_autopilot", "lead_capture_bot", "competitor_monitoring", "ai_chatbot", "email_marketing_setup", "social_feed_embed", "online_store"],
  plumber: ["sms_alerts", "review_collector", "booking_widget", "seo_autopilot", "lead_capture_bot", "competitor_monitoring", "ai_chatbot", "email_marketing_setup", "social_feed_embed", "online_store"],
  electrician: ["sms_alerts", "review_collector", "booking_widget", "seo_autopilot", "lead_capture_bot", "competitor_monitoring", "ai_chatbot", "email_marketing_setup", "social_feed_embed", "online_store"],
  roofer: ["sms_alerts", "review_collector", "booking_widget", "seo_autopilot", "lead_capture_bot", "competitor_monitoring", "ai_chatbot", "email_marketing_setup", "social_feed_embed", "online_store"],
  landscaper: ["sms_alerts", "review_collector", "booking_widget", "seo_autopilot", "lead_capture_bot", "competitor_monitoring", "ai_chatbot", "email_marketing_setup", "social_feed_embed", "online_store"],
  gym: ["event_calendar", "booking_widget", "email_marketing_setup", "online_store", "ai_chatbot", "review_collector", "lead_capture_bot", "seo_autopilot", "social_feed_embed", "competitor_monitoring"],
  fitness: ["booking_widget", "event_calendar", "email_marketing_setup", "review_collector", "ai_chatbot", "online_store", "lead_capture_bot", "seo_autopilot", "social_feed_embed", "competitor_monitoring"],
  salon: ["booking_widget", "review_collector", "social_feed_embed", "email_marketing_setup", "ai_photography", "menu_price_list", "ai_chatbot", "seo_autopilot", "lead_capture_bot", "competitor_monitoring"],
  spa: ["booking_widget", "review_collector", "social_feed_embed", "email_marketing_setup", "ai_photography", "menu_price_list", "ai_chatbot", "seo_autopilot", "lead_capture_bot", "competitor_monitoring"],
  lawyer: ["booking_widget", "ai_chatbot", "review_collector", "lead_capture_bot", "sms_alerts", "seo_autopilot", "competitor_monitoring", "email_marketing_setup", "social_feed_embed", "priority_support"],
  medical: ["booking_widget", "ai_chatbot", "review_collector", "lead_capture_bot", "sms_alerts", "seo_autopilot", "email_marketing_setup", "competitor_monitoring", "social_feed_embed", "priority_support"],
  dental: ["booking_widget", "review_collector", "ai_chatbot", "lead_capture_bot", "sms_alerts", "seo_autopilot", "email_marketing_setup", "competitor_monitoring", "social_feed_embed", "priority_support"],
  realEstate: ["lead_capture_bot", "sms_alerts", "ai_chatbot", "email_marketing_setup", "booking_widget", "competitor_monitoring", "seo_autopilot", "social_feed_embed", "review_collector", "video_background"],
  ecommerce: ["online_store", "lead_capture_bot", "seo_autopilot", "ai_chatbot", "email_marketing_setup", "social_feed_embed", "review_collector", "competitor_monitoring", "ai_photography", "sms_alerts"],
  retail: ["online_store", "email_marketing_setup", "lead_capture_bot", "social_feed_embed", "review_collector", "ai_chatbot", "seo_autopilot", "competitor_monitoring", "ai_photography", "sms_alerts"],
  distillery: ["event_calendar", "online_store", "social_feed_embed", "review_collector", "email_marketing_setup", "seo_autopilot", "video_background", "brand_style_guide", "ai_photography", "competitor_monitoring"],
  brewery: ["event_calendar", "online_store", "social_feed_embed", "review_collector", "email_marketing_setup", "seo_autopilot", "menu_price_list", "ai_photography", "competitor_monitoring", "brand_style_guide"],
  winery: ["event_calendar", "email_marketing_setup", "online_store", "social_feed_embed", "review_collector", "seo_autopilot", "ai_photography", "booking_widget", "competitor_monitoring", "brand_style_guide"],
  photographer: ["booking_widget", "social_feed_embed", "ai_photography", "lead_capture_bot", "email_marketing_setup", "seo_autopilot", "review_collector", "competitor_monitoring", "brand_style_guide", "video_background"],
  default: ["review_collector", "seo_autopilot", "sms_alerts", "booking_widget", "ai_chatbot", "email_marketing_setup", "lead_capture_bot", "social_feed_embed", "competitor_monitoring", "online_store"],
};

function getAddonQueueForBusiness(businessType: string): string[] {
  const normalized = businessType.toLowerCase().trim();
  if (BUSINESS_ADDON_MAP[normalized]) return BUSINESS_ADDON_MAP[normalized];
  for (const [key, addons] of Object.entries(BUSINESS_ADDON_MAP)) {
    if (key === "default") continue;
    if (normalized.includes(key) || key.includes(normalized)) return addons;
  }
  return BUSINESS_ADDON_MAP.default;
}

async function getAddonDetails(addonKey: string): Promise<any | null> {
  try {
    const { listProductCatalog } = await import("../db");
    const items = await listProductCatalog(true);
    return items.find((p: any) => p.productKey === addonKey) ?? null;
  } catch {
    return null;
  }
}

export async function getNextAddonForNurture(customer: {
  businessName?: string | null;
  industry?: string | null;
  nurtureAddonsSent?: any;
  activeAddons?: string[];
}): Promise<any | null> {
  const businessType = customer.industry || customer.businessName || "default";
  const activeAddons: string[] = customer.activeAddons ?? [];
  const raw = customer.nurtureAddonsSent;
  const sentAddons: string[] = Array.isArray(raw) ? raw : (typeof raw === "string" ? JSON.parse(raw) : []);
  const queue = getAddonQueueForBusiness(businessType);
  for (const addonKey of queue) {
    if (!activeAddons.includes(addonKey) && !sentAddons.includes(addonKey)) {
      return await getAddonDetails(addonKey);
    }
  }
  return null;
}

export async function sendMonthlyNurtureEmail(customer: {
  id: number;
  email: string;
  contactName: string;
  businessName: string;
  nurtureMonth?: number | null;
  nurtureAddonsSent?: any;
  industry?: string | null;
  activeAddons?: string[];
}): Promise<{ sent: boolean; addonKey?: string }> {
  try {
    const addon = await getNextAddonForNurture(customer);
    const month = (customer.nurtureMonth ?? 0) + 1;
    const firstName = (customer.contactName || "").split(" ")[0] || "there";
    const businessName = customer.businessName || "your business";

    const subject = addon
      ? `Month ${month} — ${businessName} performance report + one idea`
      : `Month ${month} — ${businessName} performance report`;

    let addonHtml = "";
    if (addon) {
      const basePrice = parseFloat(addon.basePrice);
      const priceLabel = addon.category === "one_time" ? `$${basePrice} one-time` : `$${basePrice}/mo`;
      addonHtml = `
        <div style="background:#1a2a1a;border-left:4px solid #22c55e;padding:20px 24px;margin:28px 0;border-radius:0 8px 8px 0;">
          <p style="color:#86efac;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">
            One idea for ${businessName}
          </p>
          <h3 style="color:#eaeaf0;font-size:19px;font-weight:700;margin:0 0 10px;">${addon.name}</h3>
          <p style="color:#c8c8d8;font-size:14px;line-height:1.65;margin:0 0 12px;">
            ${addon.longDescription || addon.description || ""}
          </p>
          ${addon.howItWorks ? `<p style="color:#9898a8;font-size:13px;line-height:1.6;margin:0 0 12px;"><strong style="color:#c8c8d8;">How it works:</strong> ${addon.howItWorks}</p>` : ""}
          ${addon.roiExample ? `<p style="color:#9898a8;font-size:13px;line-height:1.6;margin:0 0 16px;"><strong style="color:#c8c8d8;">The math:</strong> ${addon.roiExample}</p>` : ""}
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
            <span style="color:#eaeaf0;font-size:15px;font-weight:700;">${priceLabel}</span>
            <a href="https://www.minimorphstudios.net/portal" style="color:#4a9eff;font-size:14px;font-weight:600;text-decoration:none;">Add to my plan →</a>
          </div>
        </div>`;
    }

    const html = brandWrap(`
      <p style="color:#c8c8d8;font-size:16px;margin:0 0 20px;">Hey ${firstName},</p>
      <p style="color:#c8c8d8;font-size:15px;line-height:1.65;margin:0 0 20px;">
        Month ${month} is in the books for ${businessName}. Your full performance report is waiting in your portal — traffic, rankings, leads captured, and what moved this month.
      </p>
      <div style="text-align:left;margin:0 0 24px;">
        <a href="https://www.minimorphstudios.net/portal" style="display:inline-block;background:#4a9eff;color:#111122;font-size:14px;font-weight:700;padding:13px 26px;border-radius:8px;text-decoration:none;">
          View My Report →
        </a>
      </div>
      ${addonHtml}
      <div style="background:#1c1c30;border:1px solid #2d2d45;padding:20px 24px;border-radius:8px;margin:28px 0 20px;">
        <p style="color:#7a7a90;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Your plan includes every month</p>
        <ul style="margin:0;padding-left:20px;color:#9898a8;font-size:13px;line-height:2.1;">
          <li>Monthly performance report</li>
          <li>Change requests (48-hr turnaround)</li>
          <li>Security monitoring + daily backups</li>
          <li>Hosting + SSL (zero action needed)</li>
          <li>AI recommendations in your portal</li>
        </ul>
      </div>
      <p style="color:#7a7a90;font-size:13px;line-height:1.6;margin:20px 0 0;border-top:1px solid #2d2d45;padding-top:20px;">
        Questions? Reply to this email or open a support ticket in your portal. We're here.
      </p>
    `);

    await sendEmail({
      to: customer.email,
      subject,
      html,
    });

    console.log(`[Nurture] Sent month ${month} email to ${customer.email}${addon ? ` featuring ${addon.name}` : ""}`);
    return { sent: true, addonKey: addon?.productKey };
  } catch (err: any) {
    console.error("[Nurture] Failed to send to", customer.email, ":", err.message);
    return { sent: false };
  }
}
