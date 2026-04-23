import { Resend } from "resend";
import { ENV } from "../_core/env";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!ENV.resendApiKey) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(ENV.resendApiKey);
  }
  return _resend;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  from?: string;
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
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const resend = getResend();

  try {
    const fromAddress = params.from || "MiniMorph Studios <onboarding@resend.dev>";

    const options: Record<string, any> = {
      from: fromAddress,
      to: [params.to],
      subject: params.subject,
    };
    if (params.html) options.html = params.html;
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
