import * as db from "../db";
import { invokeLLM } from "../_core/llm";
import { ENV } from "../_core/env";

export async function processSiteChangeRequest(
  projectId: number,
  changeRequest: string,
  requestedBy: string
): Promise<void> {
  const project = await db.getOnboardingProjectById(projectId);
  if (!project) {
    console.error(`[SiteUpdater] Project ${projectId} not found`);
    return;
  }

  if (!project.generatedSiteHtml) {
    console.error(`[SiteUpdater] Project ${projectId} has no generated site yet`);
    return;
  }

  await db.updateOnboardingProject(projectId, {
    generationStatus: "generating",
    generationLog: "Processing change request...",
    lastChangeRequest: changeRequest,
  });

  try {
    let pages: Record<string, string>;
    try {
      pages = JSON.parse(project.generatedSiteHtml);
    } catch {
      throw new Error("Could not parse existing site HTML");
    }

    // Determine which pages are likely affected to keep prompt size reasonable
    const changeRequestLower = changeRequest.toLowerCase();
    const pageKeywords: Record<string, string[]> = {
      index: ["home", "hero", "homepage", "landing", "main"],
      about: ["about", "story", "team", "owner"],
      services: ["service", "offering", "pricing", "package"],
      contact: ["contact", "form", "phone", "email", "address", "hours"],
      gallery: ["gallery", "photo", "image", "portfolio", "work"],
      menu: ["menu", "food", "dish", "drink"],
      quote: ["quote", "estimate", "consultation"],
      blog: ["blog", "article", "post"],
    };
    const affectedPages = Object.keys(pages).filter(name => {
      if (!pageKeywords[name]) return true; // keep unknown pages
      if (changeRequestLower.includes(name)) return true;
      return pageKeywords[name].some(kw => changeRequestLower.includes(kw));
    });
    // Always include index; if nothing matched specifically, send all pages
    const pagesToSendSet = affectedPages.length > 0 ? Array.from(new Set(["index", ...affectedPages])) : Object.keys(pages);
    const pagesToSend = pagesToSendSet;

    const systemPrompt = `You are an expert web designer updating an existing website based on a change request. You will receive the current HTML pages and a change request. Apply the changes and return the COMPLETE updated pages — full HTML from <!DOCTYPE html> to </html> — in the same JSON format.

Output must be valid JSON (no markdown fences):
{
  "pages": {
    "index": "<complete updated HTML>",
    "contact": "<complete updated HTML>"
  },
  "summary": "Brief description of what was changed"
}

CRITICAL: Return COMPLETE HTML for every page you modify — not truncated, not summarized.
Apply ONLY the requested changes. Keep everything else the same. Maintain the same design, color palette, fonts, and structure unless specifically asked to change them.
Only return pages that are in the input — do not invent new pages.`;

    // Send full HTML — Claude's 200K context window handles this comfortably
    const pagesText = pagesToSend
      .map(name => `=== ${name}.html ===\n${pages[name]}`)
      .join("\n\n");

    const skippedPages = Object.keys(pages).filter(p => !pagesToSend.includes(p));
    const skippedNote = skippedPages.length > 0
      ? `\n\nNote: The following pages were not included (not affected by this request): ${skippedPages.join(", ")}. Return only the pages listed above.`
      : "";

    const userPrompt = `Current site pages:\n${pagesText}${skippedNote}\n\nChange request from ${requestedBy}:\n"${changeRequest}"\n\nPlease apply this change request and return the complete updated pages.`;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 16000,
    });

    const rawContent = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "";

    const cleaned = rawContent.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();

    let parsed: { pages: Record<string, string>; summary?: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`AI returned non-JSON output. Raw: ${rawContent.slice(0, 500)}`);
    }

    if (!parsed.pages || typeof parsed.pages !== "object") {
      throw new Error("AI response missing 'pages' object");
    }

    // Merge updated pages back with untouched pages (Claude only received affected pages)
    const mergedPages = { ...pages, ...parsed.pages };

    // Snapshot current HTML before overwriting (enables rollback)
    const versionNumber = await db.getNextSiteVersionNumber(projectId);
    await db.createSiteVersion({
      projectId,
      versionNumber,
      htmlSnapshot: project.generatedSiteHtml,
      changeRequest,
      createdBy: requestedBy,
    });

    // Append to change history
    const existingHistory = (project.changeHistory as Array<{ request: string; respondedAt: string }>) || [];
    const newHistory = [
      ...existingHistory,
      { request: changeRequest, respondedAt: new Date().toISOString() },
    ];

    // Park at pending_admin_review — admin must approve before customer sees changes
    await db.updateOnboardingProject(projectId, {
      generationStatus: "complete",
      generationLog: parsed.summary || "Change request applied.",
      generatedSiteHtml: JSON.stringify(mergedPages),
      changeHistory: newHistory,
      stage: "pending_admin_review",
      adminPreviewApprovedAt: null,
      previewReadyAt: null,
    });

    // Notify admin that revision is ready for review
    try {
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: `ACTION: Revision Ready — Admin Review Required: ${project.businessName}`,
        content: `A revision has been processed for ${project.businessName} (Project #${projectId}).\n\nCustomer: ${project.contactName} <${project.contactEmail}>\nChange request: ${changeRequest}\nRequested by: ${requestedBy}\n\nThe updated site is parked at admin review. Customer cannot see it until you approve.\n\nLogin at /admin/onboarding → find this project → "Approve Preview for Customer".`,
      });
    } catch (notifyErr) {
      console.warn("[SiteUpdater] Admin notification failed:", notifyErr);
    }

    // For live sites: redeploy only after admin approves via adminReleaseLaunch
    // (redeploy-on-approval is handled in adminApprovePreview + adminReleaseLaunch flow)

    // Send updated preview email
    try {
      const { sendUpdatedPreviewReadyEmail } = await import("./customerEmails");
      const updatedProject = await db.getOnboardingProjectById(projectId);
      const revisionsRemaining = updatedProject?.revisionsRemaining ?? 0;
      await sendUpdatedPreviewReadyEmail({
        to: project.contactEmail,
        customerName: project.contactName,
        businessName: project.businessName,
        portalUrl: `${ENV.appUrl || "https://www.minimorphstudios.net"}/portal`,
        revisionsRemaining,
      });
    } catch (emailErr) {
      console.error("[SiteUpdater] Updated preview email failed:", emailErr);
    }

    console.log(`[SiteUpdater] Project ${projectId} updated successfully.`);
  } catch (err) {
    console.error(`[SiteUpdater] Project ${projectId} update failed:`, err);
    await db.updateOnboardingProject(projectId, {
      generationStatus: "failed",
      generationLog: `Change request failed: ${err instanceof Error ? err.message : String(err)}`,
      revisionsCount: Math.max(0, (project.revisionsCount || 1) - 1),
      revisionsRemaining: (project.revisionsRemaining ?? 0) + 1,
    }).catch(() => {});
  }
}
