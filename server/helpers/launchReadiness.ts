export interface AddonResult {
  addon: string;
  success: boolean;
  details?: string;
  error?: string;
}

export interface LaunchReadinessInput {
  stage?: string | null;
  approvedAt?: Date | string | null;
  paymentConfirmedAt?: Date | string | null;
  domainName?: string | null;
  generatedSiteHtml?: string | null;
  adminPreviewApprovedAt?: Date | string | null;
  qaScore?: number | null;
  qaIssues?: Array<{ severity: string; type?: string; description?: string }> | null;
  addonResults?: AddonResult[] | null;
}

export interface LaunchReadinessResult {
  ready: boolean;
  blockers: string[];
  warnings: string[];
  requiresOverride: boolean;
}

export function calculateLaunchReadiness(
  project: LaunchReadinessInput,
  options?: { allowOverrideForManualAddons?: boolean },
): LaunchReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  let requiresOverride = false;

  if (!project.paymentConfirmedAt) {
    blockers.push("Payment not confirmed");
  }

  if (!project.adminPreviewApprovedAt) {
    blockers.push("Admin preview not approved");
  }

  if (!project.approvedAt) {
    blockers.push("Customer final approval missing");
  }

  if (!project.generatedSiteHtml) {
    blockers.push("Site has not been generated");
  }

  const criticalIssues = (project.qaIssues ?? []).filter(i => i.severity === "critical");
  if (criticalIssues.length > 0) {
    blockers.push(`${criticalIssues.length} unresolved critical QA issue(s)`);
  }

  if (project.domainName && project.stage === "launch") {
    blockers.push(`Custom domain ${project.domainName} DNS not yet confirmed live`);
  }

  const manualAddons = (project.addonResults ?? []).filter(r => !r.success);
  if (manualAddons.length > 0) {
    if (options?.allowOverrideForManualAddons) {
      requiresOverride = true;
      warnings.push(`${manualAddons.length} add-on(s) require manual team fulfillment`);
    } else {
      blockers.push(`${manualAddons.length} add-on(s) require manual fulfillment before launch`);
    }
  }

  return {
    ready: blockers.length === 0 && !requiresOverride,
    blockers,
    warnings,
    requiresOverride,
  };
}
