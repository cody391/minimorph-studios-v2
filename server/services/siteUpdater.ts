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

    const systemPrompt = `You are an expert web designer updating an existing website based on a change request. You will receive the current HTML pages as JSON and a change request. Apply the changes and return the updated pages in the same JSON format.

Output must be valid JSON (no markdown fences):
{
  "pages": {
    "index": "<updated HTML>",
    "about": "<updated HTML>",
    "contact": "<updated HTML>"
  },
  "summary": "Brief description of what was changed"
}

Apply ONLY the requested changes. Keep everything else the same. Maintain the same design, color palette, fonts, and structure unless specifically asked to change them.`;

    const pagesText = Object.entries(pages)
      .map(([name, html]) => `=== ${name}.html ===\n${html.slice(0, 3000)}${html.length > 3000 ? "\n...[truncated]" : ""}`)
      .join("\n\n");

    const userPrompt = `Current site pages:\n${pagesText}\n\nChange request from ${requestedBy}:\n"${changeRequest}"\n\nPlease apply this change request and return the updated pages.`;

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

    // Append to change history
    const existingHistory = (project.changeHistory as Array<{ request: string; respondedAt: string }>) || [];
    const newHistory = [
      ...existingHistory,
      { request: changeRequest, respondedAt: new Date().toISOString() },
    ];

    await db.updateOnboardingProject(projectId, {
      generationStatus: "complete",
      generationLog: parsed.summary || "Change request applied.",
      generatedSiteHtml: JSON.stringify(parsed.pages),
      changeHistory: newHistory,
      stage: "review",
    });

    // Redeploy if site is already live
    if (project.stage === "complete" || project.stage === "launch") {
      const { redeploySite } = await import("./siteDeployment");
      redeploySite(projectId).catch(err =>
        console.error("[SiteUpdater] Redeploy error:", err)
      );
    }

    // Send updated preview email
    try {
      const { sendUpdatedPreviewReadyEmail } = await import("./customerEmails");
      const updatedProject = await db.getOnboardingProjectById(projectId);
      const revisionsRemaining = updatedProject?.revisionsRemaining ?? 0;
      await sendUpdatedPreviewReadyEmail({
        to: project.contactEmail,
        customerName: project.contactName,
        businessName: project.businessName,
        portalUrl: `${ENV.appUrl || "https://minimorphstudios.net"}/portal`,
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
    }).catch(() => {});
  }
}
