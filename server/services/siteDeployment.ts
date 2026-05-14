import { createPagesProject, deployToPages, addCustomDomain, getProjectName, redeployPages } from "./cloudflareDeployment";
import { stripDemoBanner } from "./siteGenerator";
import * as db from "../db";
import { ENV } from "../_core/env";
import { CLOUDFLARE_NS1, CLOUDFLARE_NS2 } from "../config/domain";

function looksLikeHtmlDocument(value: string): boolean {
  const t = value.trimStart().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html") || t.includes("<body");
}

function stripBannersFromPages(pages: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(pages).map(([key, val]) => {
      if (typeof val === "string" && looksLikeHtmlDocument(val)) {
        return [key, stripDemoBanner(val)];
      }
      return [key, val];
    })
  );
}

export interface VerifyResult {
  live: boolean;
  status?: number;
  error?: string;
}

/** Fetches the URL and returns whether it resolves with a 2xx/3xx response. */
export async function verifyLiveUrl(url: string): Promise<VerifyResult> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (res.status >= 200 && res.status < 400) {
      return { live: true, status: res.status };
    }
    return { live: false, status: res.status };
  } catch (err: any) {
    return { live: false, error: String(err?.message ?? err) };
  }
}

export async function deployApprovedSite(projectId: number): Promise<void> {
  const project = await db.getOnboardingProjectById(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  let pages: Record<string, string> = {};
  try {
    pages = JSON.parse(project.generatedSiteHtml || "{}");
  } catch {
    throw new Error("Invalid generated site HTML");
  }

  if (Object.keys(pages).length === 0) {
    console.log(`[Deploy] Project ${projectId} has no pages — skipping Cloudflare deployment`);
    return;
  }

  const businessName = project.businessName || `customer-${projectId}`;
  const cfProjectName = project.cloudflareProjectName || getProjectName(businessName, projectId);

  if (!ENV.cloudflareApiToken || !ENV.cloudflareAccountId) {
    console.log(`[Deploy] Cloudflare not configured — project ${projectId} stays at final_approval for manual launch`);
    try {
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: "Cloudflare Deployment Not Configured",
        content: `Project #${projectId} (${businessName}) is approved but cannot be deployed — Cloudflare API token or account ID is missing.\n\nProject is stuck at final_approval. Configure Cloudflare env vars or deploy manually via Admin → Onboarding Projects.`,
      });
    } catch {}
    return;
  }

  console.log(`[Deploy] Starting deployment for project ${projectId}: ${cfProjectName}`);

  await db.updateOnboardingProject(projectId, {
    stage: "launch",
    cloudflareProjectName: cfProjectName,
    generationLog: "Deploying to Cloudflare Pages...",
  });

  try {
    // Create Cloudflare Pages project — ignore "already exists" error
    try {
      await createPagesProject({ projectName: cfProjectName, customerId: project.customerId! });
    } catch (err: any) {
      if (!err.message?.includes("already exists")) {
        console.warn(`[Deploy] Project creation warning: ${err.message}`);
      }
    }

    // Deploy all pages — strip demo banners from HTML before upload
    const deployment = await deployToPages({ projectName: cfProjectName, pages: stripBannersFromPages(pages) });
    if (!deployment.success) throw new Error("Cloudflare deployment returned failure");

    let liveUrl = deployment.deploymentUrl;

    // Connect custom domain if set
    const domainName = project.domainName;
    if (domainName) {
      try {
        await addCustomDomain({ projectName: cfProjectName, domain: domainName });
        await addCustomDomain({ projectName: cfProjectName, domain: `www.${domainName}` }).catch(() => {});
        liveUrl = `https://${domainName}`;

        // Send DNS setup instructions to customer (friendly, white-glove copy)
        if (project.contactEmail) {
          try {
            const { sendEmail } = await import("./email");
            const customerFirstName = (project.contactName || "there").split(" ")[0];
            await sendEmail({
              to: project.contactEmail,
              subject: `Almost there! One quick step to connect ${domainName}`,
              html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#111122;color:#eaeaf0">
<h2 style="color:#4a9eff">Quick email check before we connect your domain</h2>
<p>Hi ${customerFirstName},</p>
<p>Your new site is built and ready to go live at <strong>${domainName}</strong>. Before we flip the switch, we want to make sure nothing gets disrupted on your end — especially email.</p>

<div style="background:#1a2a1a;border-left:4px solid #4aff88;padding:16px;border-radius:8px;margin:20px 0">
  <strong style="color:#4aff88">Do you receive emails at ${domainName}?</strong><br>
  <span style="color:#c8e8c8">For example: info@${domainName}, hello@${domainName}, or similar?<br>
  If yes — don't worry, we'll take care of it. Just reply to this email and let us know which email addresses you use, and we'll make sure they keep working perfectly after the switch.</span>
</div>

<h3 style="color:#4a9eff;margin-top:28px">Ready to go? Here's all you need to do:</h3>
<ol style="color:#c8c8d8;line-height:2.2">
  <li>Log in to wherever you registered <strong>${domainName}</strong> (GoDaddy, Namecheap, Google Domains, etc.)</li>
  <li>Find <strong>Domain Settings</strong> or <strong>Name Servers</strong></li>
  <li>Replace whatever's there with these two addresses:<br>
    <div style="background:#222240;padding:12px 16px;border-radius:6px;font-family:monospace;margin:8px 0;font-size:15px">
      ${CLOUDFLARE_NS1}<br>${CLOUDFLARE_NS2}
    </div>
  </li>
  <li>Save and you're done — we'll handle the rest</li>
</ol>

<p style="color:#c8c8d8">Once you save, it typically takes a few hours (up to 48) for your domain to fully point to your new site. We'll send you a celebration email the moment it's live.</p>

<div style="background:#1a1a2a;border:1px solid #333360;padding:16px;border-radius:8px;margin:20px 0">
  <strong style="color:#aaaacc">Not sure where your domain is registered?</strong><br>
  <span style="color:#8888aa">No problem at all — just reply to this email. We'll walk you through it step by step.</span>
</div>

<p style="color:#c8c8d8">We're with you every step of the way.</p>
<p style="color:#7a7a90">&mdash; The MiniMorph Studios Team</p>
</body></html>`,
            });
          } catch {}
        }
      } catch (err: any) {
        console.warn(`[Deploy] Custom domain setup warning: ${err.message}`);
      }
    }

    const hasPendingDomain = !!domainName;

    if (hasPendingDomain) {
      // Custom domain: deployment done but DNS not yet propagated.
      // Stage stays at "launch" until admin confirms via adminConfirmDomainLive.
      // liveUrl is the immediately-reachable CF Pages URL until DNS is confirmed.
      await db.updateOnboardingProject(projectId, {
        stage: "launch",
        liveUrl,              // CF Pages URL — reachable now
        generatedSiteUrl: liveUrl,
        generationLog: `Pages deployed at ${liveUrl} — custom domain ${domainName} DNS pending`,
      });
      // DNS email was already sent above. Notify admin only.
      try {
        const { notifyOwner } = await import("../_core/notification");
        await notifyOwner({
          title: `Site Deployed — DNS Pending: ${businessName}`,
          content: `${businessName} (#${projectId}) deployed to Cloudflare Pages at ${liveUrl}.\n\nCustom domain ${domainName} DNS setup email sent to customer.\nSite is NOT complete until admin confirms domain is live via Admin → Launch Readiness → Confirm Domain Live.\n\nNameservers to verify: ${CLOUDFLARE_NS1} / ${CLOUDFLARE_NS2}`,
        });
      } catch {}
    } else {
      // No custom domain — CF Pages URL is immediately live. Mark complete.
      await db.updateOnboardingProject(projectId, {
        stage: "complete",
        liveUrl,
        launchedAt: new Date(),
        generationLog: `Live at ${liveUrl}`,
        generatedSiteUrl: liveUrl,
      });

      // Activate nurturing pipeline only on confirmed-live projects
      await activateNurturing(projectId, project.customerId!, project.contractId);

      // Send celebration email — site is genuinely live right now
      if (project.contactEmail) {
        try {
          const { sendSiteLiveEmail } = await import("./customerEmails");
          await sendSiteLiveEmail({
            to: project.contactEmail,
            customerName: project.contactName,
            businessName,
            liveUrl,
            portalUrl: `${ENV.appUrl || "https://www.minimorphstudios.net"}/portal`,
          });
        } catch (emailErr) {
          console.error("[Deploy] Live email failed:", emailErr);
        }
      }

      try {
        const { notifyOwner } = await import("../_core/notification");
        await notifyOwner({
          title: "Site Live — Customer Added to Nurturing",
          content: `${businessName} (#${projectId}) is live at ${liveUrl}. Celebration email sent to customer.`,
        });
      } catch {}
    }

    console.log(`[Deploy] Project ${projectId} is live at ${liveUrl}`);
  } catch (err) {
    console.error(`[Deploy] Project ${projectId} deployment failed:`, err);
    await db.updateOnboardingProject(projectId, {
      generationLog: `Deployment failed: ${err instanceof Error ? err.message : String(err)}`,
      stage: "final_approval",
    }).catch(() => {});
    try {
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: "Site Deployment Failed",
        content: `Project #${projectId} (${businessName}) failed to deploy to Cloudflare Pages.\nError: ${err instanceof Error ? err.message : String(err)}\n\nProject is back at final_approval. Check Admin → Onboarding Projects for details.`,
      });
    } catch {}
    throw err;
  }
}

// Exported so adminConfirmDomainLive in routers.ts can activate nurturing after DNS confirmation
export async function activateNurturingForProject(
  projectId: number,
  customerId: number,
  contractId: number | null | undefined
): Promise<void> {
  return activateNurturing(projectId, customerId, contractId);
}

async function activateNurturing(
  projectId: number,
  customerId: number,
  contractId: number | null | undefined
): Promise<void> {
  try {
    const { getDb } = await import("../db");
    const database = await getDb();
    if (!database) return;

    const { contracts } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const now = new Date();
    const contractEndDate = new Date(now);
    contractEndDate.setFullYear(contractEndDate.getFullYear() + 1);

    const updatePayload = {
      nurturingActive: true as const,
      anniversaryDay: now.getDate(),
      contractEndDate,
    };

    if (contractId) {
      await database.update(contracts).set(updatePayload).where(eq(contracts.id, contractId));
    } else {
      // Fall back: find active contract by customerId
      await database.update(contracts).set(updatePayload).where(
        and(eq(contracts.customerId, customerId))
      );
    }

    console.log(`[Deploy] Nurturing activated for customer ${customerId}. Anniversary: day ${now.getDate()} of each month.`);
  } catch (err) {
    console.error("[Deploy] Nurturing activation failed:", err);
  }
}

export async function redeploySite(projectId: number): Promise<void> {
  const project = await db.getOnboardingProjectById(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  if (!ENV.cloudflareApiToken || !ENV.cloudflareAccountId) return;

  const businessName = project.businessName || `customer-${projectId}`;
  const cfProjectName = project.cloudflareProjectName || getProjectName(businessName, projectId);

  let pages: Record<string, string> = {};
  try {
    pages = JSON.parse(project.generatedSiteHtml || "{}");
  } catch {
    console.error(`[Deploy] Invalid generatedSiteHtml for project ${projectId}`);
    return;
  }

  if (Object.keys(pages).length === 0) return;

  await redeployPages({ projectName: cfProjectName, pages: stripBannersFromPages(pages) });
  console.log(`[Deploy] Redeployed project ${projectId} to ${cfProjectName}`);
}
