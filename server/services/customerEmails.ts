/**
 * Customer Lifecycle Emails
 * Wired to Stripe checkout, onboarding stage transitions, and retention events.
 * All emails use the MiniMorph brand template (forest/cream/terracotta).
 */
import { sendEmail } from "./email";
import { PACKAGES, type PackageKey } from "../../shared/pricing";

/* ─── Brand HTML wrapper ─── */
function brandWrap(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8f6f3;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:#2d4a3e;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">MiniMorph Studios</h1>
    </div>
    <div style="padding:32px;line-height:1.7;color:#2d4a3e;">
      ${bodyHtml}
    </div>
    <div style="background:#f8f6f3;padding:20px 32px;border-top:1px solid #e8e2d8;">
      <p style="margin:0;font-size:12px;color:#6b7c6e;">
        MiniMorph Studios — Beautiful websites for growing businesses
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
    <h2 style="color:#2d4a3e;margin:0 0 16px;font-size:24px;">Welcome to MiniMorph Studios!</h2>
    <p style="margin:0 0 16px;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;">
      Thank you for choosing the <strong>${pkg.name}</strong> plan${params.businessName ? ` for ${params.businessName}` : ""}. 
      We're excited to start building your new website.
    </p>
    <h3 style="color:#c0705a;margin:24px 0 12px;font-size:18px;">What Happens Next</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e8e2d8;vertical-align:top;width:40px;">
          <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#2d4a3e;color:#fff;text-align:center;line-height:28px;font-size:14px;">1</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #e8e2d8;">
          <strong>Onboarding Questionnaire</strong> (Today)<br/>
          <span style="color:#6b7c6e;font-size:14px;">Log in to your Customer Portal and tell us about your brand, audience, and vision.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e8e2d8;vertical-align:top;">
          <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#2d4a3e;color:#fff;text-align:center;line-height:28px;font-size:14px;">2</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #e8e2d8;">
          <strong>Design Mockup</strong> (Week 1-2)<br/>
          <span style="color:#6b7c6e;font-size:14px;">Our team creates your custom design based on your answers.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e8e2d8;vertical-align:top;">
          <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#2d4a3e;color:#fff;text-align:center;line-height:28px;font-size:14px;">3</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #e8e2d8;">
          <strong>Review & Revisions</strong> (Week 2-3)<br/>
          <span style="color:#6b7c6e;font-size:14px;">You review the design and request any changes — up to ${params.packageTier === "premium" ? "unlimited" : "3"} rounds.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;vertical-align:top;">
          <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#c0705a;color:#fff;text-align:center;line-height:28px;font-size:14px;">4</span>
        </td>
        <td style="padding:12px 16px;">
          <strong>Launch!</strong> (Week 3-4)<br/>
          <span style="color:#6b7c6e;font-size:14px;">Your new website goes live. We handle everything.</span>
        </td>
      </tr>
    </table>
    <div style="margin:24px 0;padding:16px;background:#f8f6f3;border-radius:8px;border-left:4px solid #c0705a;">
      <p style="margin:0;font-size:14px;color:#2d4a3e;">
        <strong>Your Plan:</strong> ${pkg.name} — $${pkg.monthlyPrice}/mo<br/>
        <strong>Includes:</strong> ${pkg.features.slice(0, 3).join(", ")}, and more
      </p>
    </div>
    <p style="margin:0 0 16px;">
      If you have any questions, just reply to this email or use the Support tab in your Customer Portal.
    </p>
    <p style="margin:0;color:#6b7c6e;">— The MiniMorph Studios Team</p>
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
        <h2 style="color:#2d4a3e;margin:0 0 16px;font-size:24px;">Time to Tell Us About Your Business</h2>
        <p style="margin:0 0 16px;">Hi ${params.customerName},</p>
        <p style="margin:0 0 16px;">
          Your onboarding questionnaire is ready in your Customer Portal. This helps us understand your brand, 
          target audience, and design preferences so we can build the perfect website for ${params.businessName || "your business"}.
        </p>
        <p style="margin:0 0 16px;">It takes about 10-15 minutes. The more detail you provide, the better your site will be.</p>
        <p style="margin:0;color:#6b7c6e;">— The MiniMorph Studios Team</p>
      `,
    },
    design: {
      subject: "Your design mockup is ready for review!",
      body: `
        <h2 style="color:#2d4a3e;margin:0 0 16px;font-size:24px;">Your Design Is Ready!</h2>
        <p style="margin:0 0 16px;">Hi ${params.customerName},</p>
        <p style="margin:0 0 16px;">
          Great news — your custom website design for ${params.businessName || "your business"} is ready for review!
        </p>
        <p style="margin:0 0 16px;">
          Log in to your Customer Portal to see the mockup. You can leave feedback and request revisions 
          directly from the Onboarding tab.
        </p>
        <div style="margin:24px 0;padding:16px;background:#f8f6f3;border-radius:8px;border-left:4px solid #c0705a;">
          <p style="margin:0;font-size:14px;color:#2d4a3e;">
            <strong>Tip:</strong> Be specific with your feedback — "Make the header bolder" is more actionable 
            than "I don't love it yet." We want to get it perfect for you.
          </p>
        </div>
        <p style="margin:0;color:#6b7c6e;">— The MiniMorph Studios Team</p>
      `,
    },
    review: {
      subject: "Your design mockup is ready for review!",
      body: `
        <h2 style="color:#2d4a3e;margin:0 0 16px;font-size:24px;">Design Review Time</h2>
        <p style="margin:0 0 16px;">Hi ${params.customerName},</p>
        <p style="margin:0 0 16px;">
          Your website design has been updated and is ready for your review. Head to the Customer Portal 
          to check it out and let us know if it's perfect or if you'd like any adjustments.
        </p>
        <p style="margin:0;color:#6b7c6e;">— The MiniMorph Studios Team</p>
      `,
    },
    launch: {
      subject: "Your website is LIVE! 🎉",
      body: `
        <h2 style="color:#2d4a3e;margin:0 0 16px;font-size:24px;">Congratulations — You're Live!</h2>
        <p style="margin:0 0 16px;">Hi ${params.customerName},</p>
        <p style="margin:0 0 16px;">
          Your new website for ${params.businessName || "your business"} is officially live! 
        </p>
        <p style="margin:0 0 16px;">
          Here's what's included in your ongoing service:
        </p>
        <ul style="margin:0 0 16px;padding-left:20px;color:#2d4a3e;">
          <li style="margin-bottom:8px;">Monthly performance reports in your Customer Portal</li>
          <li style="margin-bottom:8px;">Ongoing maintenance and security updates</li>
          <li style="margin-bottom:8px;">Support whenever you need it</li>
          <li style="margin-bottom:8px;">AI-powered recommendations to improve your results</li>
        </ul>
        <p style="margin:0 0 16px;">
          Check your Customer Portal regularly to see how your site is performing. Your first monthly report 
          will arrive in about 30 days.
        </p>
        <p style="margin:0;color:#6b7c6e;">— The MiniMorph Studios Team</p>
      `,
    },
    complete: {
      subject: "Your onboarding is complete!",
      body: `
        <h2 style="color:#2d4a3e;margin:0 0 16px;font-size:24px;">Onboarding Complete</h2>
        <p style="margin:0 0 16px;">Hi ${params.customerName},</p>
        <p style="margin:0 0 16px;">
          Your website project is fully complete. Everything is set up and running smoothly.
        </p>
        <p style="margin:0 0 16px;">
          Remember, your Customer Portal is always available for support requests, monthly reports, 
          and AI-powered insights about your website's performance.
        </p>
        <p style="margin:0;color:#6b7c6e;">— The MiniMorph Studios Team</p>
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
  const urgencyColor = urgency === "urgent" ? "#c0705a" : "#2d4a3e";

  const html = brandWrap(`
    <h2 style="color:${urgencyColor};margin:0 0 16px;font-size:24px;">
      ${urgency === "urgent" ? "Your contract expires in " + params.daysRemaining + " days" :
        urgency === "soon" ? "Renewal reminder — " + params.daysRemaining + " days left" :
        "Your contract renewal is coming up"}
    </h2>
    <p style="margin:0 0 16px;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;">
      Your ${pkg.name} plan ($${pkg.monthlyPrice}/mo) ${urgency === "urgent" ? "expires" : "is set to renew"} on 
      <strong>${params.endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.
    </p>
    ${urgency === "urgent" ? `
    <div style="margin:24px 0;padding:16px;background:#fef3f0;border-radius:8px;border-left:4px solid #c0705a;">
      <p style="margin:0;font-size:14px;color:#2d4a3e;">
        <strong>Action needed:</strong> To avoid any interruption to your website service, 
        please ensure your payment method is up to date in your Customer Portal.
      </p>
    </div>` : ""}
    <p style="margin:0 0 16px;">
      Want to upgrade your plan or have questions about renewal? Reply to this email or visit the 
      Upgrades tab in your Customer Portal.
    </p>
    <p style="margin:0;color:#6b7c6e;">— The MiniMorph Studios Team</p>
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
    <h2 style="color:#2d4a3e;margin:0 0 16px;font-size:24px;">How are we doing?</h2>
    <p style="margin:0 0 16px;">Hi ${params.customerName},</p>
    <p style="margin:0 0 16px;">
      It's been ${milestoneText} since your website launched, and we'd love to hear how things are going. 
      Your feedback helps us improve our service for everyone.
    </p>
    <p style="margin:0 0 16px;">
      It takes less than 2 minutes:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${params.surveyUrl}" style="display:inline-block;padding:12px 32px;background:#c0705a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">
        Share Your Feedback
      </a>
    </div>
    <p style="margin:0;color:#6b7c6e;">— The MiniMorph Studios Team</p>
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
    <h2 style="color:#2d4a3e;margin:0 0 16px;font-size:24px;">${params.referrerName} thinks you'd love MiniMorph Studios</h2>
    <p style="margin:0 0 16px;">Hi there,</p>
    <p style="margin:0 0 16px;">
      Your friend ${params.referrerName} is a MiniMorph Studios customer and thought you might benefit from 
      a professional website for your business.
    </p>
    <p style="margin:0 0 16px;">
      As a referred customer, you'll get a <strong>free website audit</strong> to see exactly how we can help.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${params.referralUrl}" style="display:inline-block;padding:12px 32px;background:#c0705a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">
        Get Your Free Audit
      </a>
    </div>
    <p style="margin:0;color:#6b7c6e;">— The MiniMorph Studios Team</p>
  `);

  return sendEmail({
    to: params.to,
    subject: `${params.referrerName} invited you to MiniMorph Studios`,
    html,
  });
}
