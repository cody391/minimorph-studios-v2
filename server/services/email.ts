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

/* ═══════════════════════════════════════════════════════
   CAN-SPAM COMPLIANCE FOOTER
   Federal law requires: physical address, sender identification,
   and a working unsubscribe mechanism in all commercial emails.
   ═══════════════════════════════════════════════════════ */
const CAN_SPAM_FOOTER = `
<div style="background:#f1ede7;padding:16px 32px;border-top:1px solid #e0d9cf;text-align:center;">
  <p style="margin:0 0 8px;font-size:11px;color:#8a8a8a;line-height:1.5;">
    MiniMorph Studios &bull; Muskegon, MI 49440<br/>
    You received this email because you inquired about our services or were contacted by a MiniMorph representative.
  </p>
  <p style="margin:0;font-size:11px;color:#8a8a8a;">
    <a href="{{unsubscribe_url}}" style="color:#6b7c6e;text-decoration:underline;">Unsubscribe</a> &bull;
    <a href="{{privacy_url}}" style="color:#6b7c6e;text-decoration:underline;">Privacy Policy</a>
  </p>
</div>`;

/**
 * Build the CAN-SPAM footer with proper URLs.
 * Uses the app's origin for unsubscribe and privacy links.
 */
function buildCanSpamFooter(recipientEmail: string): string {
  // Encode the email for the unsubscribe link
  const encoded = encodeURIComponent(recipientEmail);
  // Use a generic unsubscribe endpoint — the frontend will handle the confirmation
  const unsubUrl = `/unsubscribe?email=${encoded}`;
  const privacyUrl = `/privacy`;
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
}

export interface SendEmailResult {
  success: boolean;
  resendId?: string;
  error?: string;
}

/**
 * Send a real email via Resend.
 * Uses the default "from" address based on the configured domain,
 * or falls back to Resend's onboarding address for testing.
 * Automatically appends CAN-SPAM compliance footer to commercial emails.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  // CAN-SPAM: Check unsubscribe list before sending commercial emails
  if (!params.transactional) {
    const unsubscribed = await isEmailUnsubscribed(params.to);
    if (unsubscribed) {
      console.log(`[Email] Blocked — ${params.to} is unsubscribed`);
      return { success: false, error: "Recipient has unsubscribed" };
    }
  }

  const resend = getResend();

  try {
    const fromAddress = params.from || "MiniMorph Studios <onboarding@resend.dev>";

    // Append CAN-SPAM footer to HTML emails unless marked transactional
    let htmlContent = params.html;
    if (htmlContent && !params.transactional) {
      // Insert footer before closing </body> or </html> tags, or append
      const footer = buildCanSpamFooter(params.to);
      if (htmlContent.includes("</body>")) {
        htmlContent = htmlContent.replace("</body>", `${footer}</body>`);
      } else if (htmlContent.includes("</html>")) {
        htmlContent = htmlContent.replace("</html>", `${footer}</html>`);
      } else {
        htmlContent += footer;
      }
    }

    const options: Record<string, any> = {
      from: fromAddress,
      to: [params.to],
      subject: params.subject,
      headers: {
        // List-Unsubscribe header for email clients (one-click unsubscribe)
        "List-Unsubscribe": `<mailto:unsubscribe@minimorphstudios.com?subject=unsubscribe-${encodeURIComponent(params.to)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
    if (htmlContent) options.html = htmlContent;
    if (params.text) options.text = params.text;
    if (params.replyTo) options.replyTo = params.replyTo;

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
<body style="margin:0;padding:0;background-color:#f8f6f3;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:#2d4a3e;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">MiniMorph Studios</h1>
      <p style="color:#c8b89a;margin:4px 0 0;font-size:13px;">Proposal from ${params.repName}</p>
    </div>
    <div style="padding:32px;">
      ${params.htmlContent}
    </div>
    <div style="background:#f8f6f3;padding:20px 32px;border-top:1px solid #e8e2d8;">
      <p style="margin:0;font-size:12px;color:#6b7c6e;">
        Sent by ${params.repName}${params.repEmail ? ` — ${params.repEmail}` : ""}<br/>
        MiniMorph Studios — Beautiful websites for growing businesses
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
<body style="margin:0;padding:0;background-color:#f8f6f3;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:#2d4a3e;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">MiniMorph Studios</h1>
    </div>
    <div style="padding:32px;line-height:1.7;color:#2d4a3e;">
      <p style="margin:0 0 16px;">Hi ${params.customerName},</p>
      ${params.content.split("\n").map((p) => `<p style="margin:0 0 12px;">${p}</p>`).join("")}
    </div>
    <div style="background:#f8f6f3;padding:20px 32px;border-top:1px solid #e8e2d8;">
      <p style="margin:0;font-size:12px;color:#6b7c6e;">
        MiniMorph Studios — Beautiful websites for growing businesses
      </p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({ to: params.to, subject: params.subject, html });
}
