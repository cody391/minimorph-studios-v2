import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const buildEndpointUrl = (baseUrl: string): string => {
  const normalizedBase = baseUrl.endsWith("/")
    ? baseUrl
    : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Dispatches a project-owner notification through the Manus Notification Service.
 * Returns `true` if the request was accepted, `false` when the upstream service
 * cannot be reached (callers can fall back to email/slack). Validation errors
 * bubble up as TRPC errors so callers can fix the payload.
 */
async function notifyViaEmail(title: string, content: string): Promise<boolean> {
  try {
    const { sendEmail } = await import("../services/email");
    const adminRecipient = ENV.adminEmail || "cody@wmrum.com";
    const contentHtml = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    await sendEmail({
      to: adminRecipient,
      subject: `[MiniMorph Admin] ${title}`,
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0a0a12;color:#eaeaf0">
<div style="background:#1a1a2a;border:1px solid #333360;border-radius:8px;padding:20px">
<h2 style="color:#4a9eff;margin:0 0 16px">${title.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</h2>
<div style="color:#c8c8d8;font-size:14px;line-height:1.6">${contentHtml}</div>
<p style="color:#666680;font-size:12px;margin-top:20px;border-top:1px solid #333360;padding-top:12px">MiniMorph Studios Admin Alert</p>
</div>
</body></html>`,
    });
    console.log(`[Notification] Email fallback sent to ${adminRecipient}: "${title}"`);
    return true;
  } catch (err) {
    console.warn(`[Notification] Email fallback failed for "${title}":`, err);
    return false;
  }
}

export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    // Forge not configured — fall back to Resend admin email
    if (ENV.resendApiKey) {
      return notifyViaEmail(title, content);
    }
    console.warn(
      `[Notification] Cannot send "${title}" — neither Forge nor Resend configured. ` +
      `Set BUILT_IN_FORGE_API_URL/KEY or RESEND_API_KEY in Railway.`
    );
    return false;
  }

  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}
