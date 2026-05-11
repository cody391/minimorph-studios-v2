import { Resend } from "resend";
import { ENV } from "../_core/env";
import { eq } from "drizzle-orm";

/**
 * Check if an email address has been unsubscribed.
 * Returns true if the email is on the unsubscribe list.
 */
export async function isEmailUnsubscribed(email: string): Promise<boolean> {
  try {
    const { getDb } = await import("../db");
    const { emailUnsubscribes } = await import("../../drizzle/schema");
    const db = await getDb();
    if (!db) return false;
    const result = await db.select().from(emailUnsubscribes)
      .where(eq(emailUnsubscribes.email, email.toLowerCase())).limit(1);
    return result.length > 0;
  } catch {
    // If DB check fails, don't block email sending
    return false;
  }
}

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!ENV.resendApiKey) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(ENV.resendApiKey);
  }
  return _resend;
}

const getPublicAppUrl = () =>
  (ENV.appUrl || process.env.APP_URL || process.env.VITE_APP_URL || "https://www.minimorphstudios.net").replace(/\/+$/, "");

/* ═══════════════════════════════════════════════════════
   CAN-SPAM COMPLIANCE FOOTER — Dark Premium Brand
   Federal law requires: physical address, sender identification,
   and a working unsubscribe mechanism in all commercial emails.
   ═══════════════════════════════════════════════════════ */
const CAN_SPAM_FOOTER = `
<div style="background:#151526;padding:16px 32px;border-top:1px solid #2d2d45;text-align:center;">
  <p style="margin:0 0 8px;font-size:11px;color:#7a7a90;line-height:1.5;">
    MiniMorph Studios<br/>
    2743 Henry St, PMB 224<br/>
    Muskegon, MI 49441<br/>
    United States<br/>
    You received this email because your business information was publicly available and MiniMorph Studios may be relevant to your online presence.
  </p>
  <p style="margin:0;font-size:11px;color:#7a7a90;">
    <a href="{{unsubscribe_url}}" style="color:#4a9eff;text-decoration:underline;">Unsubscribe</a> &bull;
    <a href="{{privacy_url}}" style="color:#4a9eff;text-decoration:underline;">Privacy Policy</a>
  </p>
</div>`;

/**
 * Build the CAN-SPAM footer with absolute URLs suitable for email clients.
 */
function buildCanSpamFooter(recipientEmail: string): string {
  const base = getPublicAppUrl();
  const encoded = encodeURIComponent(recipientEmail);
  const unsubUrl = `${base}/unsubscribe?email=${encoded}`;
  const privacyUrl = `${base}/privacy`;
  return CAN_SPAM_FOOTER
    .replace("{{unsubscribe_url}}", unsubUrl)
    .replace("{{privacy_url}}", privacyUrl);
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  from?: string;
  /** Set to true to skip CAN-SPAM footer (for transactional emails like password resets) */
  transactional?: boolean;
  attachments?: Array<{ filename: string; content: string }>;
}

export interface SendEmailResult {
  success: boolean;
  resendId?: string;
  error?: string;
}

/**
 * Send a real email via Resend.
 * Automatically appends CAN-SPAM compliance footer to commercial emails.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!params.transactional) {
    const unsubscribed = await isEmailUnsubscribed(params.to);
    if (unsubscribed) {
      console.log(`[Email] Blocked — ${params.to} is unsubscribed`);
      return { success: false, error: "Recipient has unsubscribed" };
    }
  }

  const resend = getResend();

  try {
    const fromAddress = params.from || "MiniMorph Studios <hello@minimorphstudios.net>";

    let htmlContent = params.html;
    if (htmlContent && !params.transactional) {
      const footer = buildCanSpamFooter(params.to);
      if (htmlContent.includes("</body>")) {
        htmlContent = htmlContent.replace("</body>", `${footer}</body>`);
      } else if (htmlContent.includes("</html>")) {
        htmlContent = htmlContent.replace("</html>", `${footer}</html>`);
      } else {
        htmlContent += footer;
      }
    }

    const unsubscribeUrl = `${getPublicAppUrl()}/unsubscribe?email=${encodeURIComponent(params.to)}`;
    const options: Record<string, any> = {
      from: fromAddress,
      to: [params.to],
      subject: params.subject,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:unsubscribe@minimorphstudios.net?subject=unsubscribe-${encodeURIComponent(params.to)}>`,
      },
    };
    if (htmlContent) options.html = htmlContent;
    if (params.text) options.text = params.text;
    // Default Reply-To for all mail — callers can override via params.replyTo
    options.replyTo = params.replyTo || "hello@minimorphstudios.net";
    if (params.attachments?.length) options.attachments = params.attachments;

    const { data, error } = await resend.emails.send(options as any);

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, resendId: data?.id };
  } catch (err: any) {
    console.error("[Email] Send failed:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}

/**
 * Send a branded proposal email with HTML content.
 * Uses the dark premium MiniMorph brand template.
 */
export async function sendProposalEmail(params: {
  to: string;
  subject: string;
  htmlContent: string;
  repName: string;
  repEmail?: string;
}): Promise<SendEmailResult> {
  const wrappedHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#111122;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#1c1c30;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
    <div style="background:linear-gradient(135deg,#1c1c30 0%,#222240 100%);padding:28px 32px;border-bottom:1px solid #2d2d45;">
      <h1 style="color:#eaeaf0;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">MiniMorph Studios</h1>
      <p style="color:#4a9eff;margin:6px 0 0;font-size:13px;font-weight:500;">Proposal from ${params.repName}</p>
    </div>
    <div style="padding:32px;color:#eaeaf0;line-height:1.7;">
      ${params.htmlContent}
    </div>
    <div style="background:#151526;padding:20px 32px;border-top:1px solid #2d2d45;">
      <p style="margin:0;font-size:12px;color:#7a7a90;">
        Sent by ${params.repName}${params.repEmail ? ` &mdash; ${params.repEmail}` : ""}<br/>
        MiniMorph Studios &mdash; Beautiful websites for growing businesses
      </p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: params.to,
    subject: params.subject,
    html: wrappedHtml,
    replyTo: params.repEmail,
  });
}

/**
 * Send a nurture/check-in email to a customer.
 * Uses the dark premium MiniMorph brand template.
 */
export async function sendNurtureEmail(params: {
  to: string;
  subject: string;
  content: string;
  customerName: string;
}): Promise<SendEmailResult> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#111122;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#1c1c30;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
    <div style="background:linear-gradient(135deg,#1c1c30 0%,#222240 100%);padding:28px 32px;border-bottom:1px solid #2d2d45;">
      <h1 style="color:#eaeaf0;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">MiniMorph Studios</h1>
    </div>
    <div style="padding:32px;line-height:1.7;color:#eaeaf0;">
      <p style="margin:0 0 16px;">Hi ${params.customerName},</p>
      ${params.content.split("\n").map((p) => `<p style="margin:0 0 12px;color:#c8c8d8;">${p}</p>`).join("")}
    </div>
    <div style="background:#151526;padding:20px 32px;border-top:1px solid #2d2d45;">
      <p style="margin:0;font-size:12px;color:#7a7a90;">
        MiniMorph Studios &mdash; Beautiful websites for growing businesses
      </p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({ to: params.to, subject: params.subject, html });
}
