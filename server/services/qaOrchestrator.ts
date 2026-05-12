import { runQAInspector, type QAContext } from "./qaInspector";
import type { BuildReporter } from "./buildReporter";

const MAX_ATTEMPTS = 3;
const MAX_TOTAL_TIME_MS = 30 * 60 * 1000; // 30 minutes

export interface QAOrchestratorResult {
  passed: boolean;
  score: number;
  commissioned: boolean;
  reason: string;
}

export async function runQAWithSafeguards(
  ctx: QAContext,
  reporter: BuildReporter,
  db: any
): Promise<QAOrchestratorResult> {
  const startTime = Date.now();
  let attempts = 0;
  let previousFingerprints: string[] = [];
  let lastResult: Awaited<ReturnType<typeof runQAInspector>> | null = null;

  await reporter.info("qa_orchestrator", "QA/QC system starting", `Site: ${ctx.siteUrl}`);

  while (attempts < MAX_ATTEMPTS) {
    if (Date.now() - startTime > MAX_TOTAL_TIME_MS) {
      await reporter.warn("qa_orchestrator", "QA time limit reached (30 min) — commissioning at current state");
      break;
    }

    attempts++;
    await reporter.updateStatus("qa_pending", { qaAttempts: attempts });

    lastResult = await runQAInspector(ctx, reporter, db, previousFingerprints, attempts);

    previousFingerprints = [...previousFingerprints, ...lastResult.issues.map(i => i.fingerprint)];

    // Score threshold decays with attempts
    const threshold = attempts === 1 ? 95 : attempts === 2 ? 90 : 85;

    if (lastResult.score >= threshold) {
      await reporter.success("qa_orchestrator", `QA passed on attempt ${attempts} — score ${lastResult.score}/100`);
      await reporter.updateStatus("commissioned", { commissionedAt: new Date() });
      return {
        passed: true, score: lastResult.score, commissioned: true,
        reason: `Passed QA on attempt ${attempts} with score ${lastResult.score}/100`,
      };
    }

    const criticalRemaining = lastResult.issues.filter(
      i => i.severity === "critical" && !i.fixApplied
    );

    if (criticalRemaining.length === 0 && attempts < MAX_ATTEMPTS) {
      await reporter.warn("qa_orchestrator", `Score ${lastResult.score}/100 — only warnings remain, commissioning`);
      break;
    }

    if (attempts < MAX_ATTEMPTS) {
      await reporter.info(
        "qa_orchestrator",
        `Attempt ${attempts} failed (${lastResult.score}/100) — applying fixes and re-checking`
      );
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  const finalScore = lastResult?.score ?? 0;
  const commissioned = finalScore >= 50;

  if (commissioned) {
    const finalStatus = finalScore >= 85 ? "commissioned" : "commissioned_with_warnings";
    await reporter.updateStatus(finalStatus, { commissionedAt: new Date() });
    await reporter.info("qa_orchestrator", `Site commissioned after ${attempts} attempts — score: ${finalScore}/100`);
    if (finalStatus === "commissioned_with_warnings") {
      try {
        const { notifyOwner } = await import("../_core/notification");
        await notifyOwner({
          title: `NOTICE: QA Commissioned with Warnings: ${ctx.businessName}`,
          content: `Site was commissioned with warnings for ${ctx.businessName} (Project #${ctx.projectId}).\n\nCustomer: ${ctx.email}\nQA Score: ${finalScore}/100 (below 85 ideal threshold)\nStatus: commissioned_with_warnings — site can proceed but has known issues.\n\nReview issues at /admin/onboarding before approving the preview for the customer.`,
        });
      } catch (notifyErr) {
        console.warn("[QAOrchestrator] Warning notification failed:", notifyErr);
      }
    }
  } else {
    await reporter.updateStatus("escalated");
    await reporter.error("qa_orchestrator", `Site ESCALATED — score ${finalScore}/100 too low. Manual review required.`);
    try {
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: `ACTION: QA Escalated — Manual Review Required: ${ctx.businessName}`,
        content: `QA failed for ${ctx.businessName} (Project #${ctx.projectId}).\n\nCustomer: ${ctx.email}\nFinal QA Score: ${finalScore}/100 (below 50 threshold after ${attempts} attempts)\nResult: ESCALATED — site cannot be commissioned automatically.\n\nNext step: Login at /admin/onboarding → find this project → override QA or rebuild site.\n\nCritical issues: ${lastResult?.issues.filter(i => i.severity === "critical").length ?? 0}\nTotal issues: ${lastResult?.issues.length ?? 0}`,
      });
    } catch (notifyErr) {
      console.warn("[QAOrchestrator] Admin notification failed:", notifyErr);
    }
  }

  return {
    passed: finalScore >= 85,
    score: finalScore,
    commissioned,
    reason: commissioned
      ? `Commissioned after ${attempts} attempts — score ${finalScore}/100`
      : `Escalated for manual review — score ${finalScore}/100`,
  };
}
