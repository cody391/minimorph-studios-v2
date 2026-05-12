import { createPagesProject, deployToPages, addCustomDomain, getProjectName, redeployPages } from "./cloudflareDeployment";
import * as db from "../db";
import { ENV } from "../_core/env";

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

    // Deploy all pages
    const deployment = await deployToPages({ projectName: cfProjectName, pages });
    if (!deployment.success) throw new Error("Cloudflare deployment returned failure");

    let liveUrl = deployment.deploymentUrl;

    // Connect custom domain if set
    const domainName = project.domainName;
    if (domainName) {
      try {
        await addCustomDomain({ projectName: cfProjectName, domain: domainName });
        await addCustomDomain({ projectName: cfProjectName, domain: `www.${domainName}` }).catch(() => {});
        liveUrl = `https://${domainName}`;

        // Send DNS setup instructions to customer
        if (project.contactEmail) {
          try {
            const { sendEmail } = await import("./email");
            await sendEmail({
              to: project.contactEmail,
              subject: `Action needed: Connect your domain ${domainName}`,
              html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#111122;color:#eaeaf0">
<h2 style="color:#4a9eff">One last step — connect your domain</h2>
<p>To make <strong>${domainName}</strong> point to your new site, update your nameservers at your domain registrar.</p>
<h3 style="color:#4a9eff">Your new nameservers:</h3>
<div style="background:#222240;padding:16px;border-radius:8px;font-family:monospace;margin:16px 0">
  vera.ns.cloudflare.com<br>wade.ns.cloudflare.com
</div>
<ol style="color:#c8c8d8;line-height:2">
  <li>Log in to wherever you bought <strong>${domainName}</strong></li>
  <li>Find <strong>DNS Settings</strong> or <strong>Nameservers</strong></li>
  <li>Replace existing nameservers with the two above</li>
  <li>Save — propagation takes 24–48 hours</li>
</ol>
<p style="background:#2a1a1a;border-left:4px solid #ff6b6b;padding:12px 16px;border-radius:4px;color:#ffb3b3;margin:16px 0"><strong>⚠️ Important — Email on your domain:</strong> Switching nameservers will transfer DNS control to Cloudflare. If you currently receive email at <strong>${domainName}</strong> (e.g. info@${domainName}), your existing MX records must be re-added inside Cloudflare before you change nameservers, or email delivery will stop. Please check with your email provider before making this change, or contact us and we'll help you.</p>
<p style="color:#c8c8d8">We'll send you another email the moment your domain is fully live. If you need help, reply to this email.</p>
<p style="color:#7a7a90">&mdash; The MiniMorph Studios Team</p>
</body></html>`,
            });
          } catch {}
        }
      } catch (err: any) {
        console.warn(`[Deploy] Custom domain setup warning: ${err.message}`);
      }
    }

    // Mark project as complete
    await db.updateOnboardingProject(projectId, {
      stage: "complete",
      liveUrl,
      launchedAt: new Date(),
      generationLog: `Live at ${liveUrl}`,
      generatedSiteUrl: liveUrl,
    });

    // Activate nurturing pipeline
    await activateNurturing(projectId, project.customerId!, project.contractId);

    // Send celebration email
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

    // Notify admin
    try {
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: "Site Auto-Deployed — Customer Added to Nurturing",
        content: `${businessName} (#${projectId}) is live at ${liveUrl}. Deployment was automatic via Cloudflare Pages.`,
      });
    } catch {}

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

  await redeployPages({ projectName: cfProjectName, pages });
  console.log(`[Deploy] Redeployed project ${projectId} to ${cfProjectName}`);
}
