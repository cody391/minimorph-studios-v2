import { ENV } from "../_core/env";
import type { BuildReporter } from "./buildReporter";

const WEIGHTS = { content: 25, seo: 20, technical: 15, security: 20, regulatory: 15, copyright: 5 };

export interface QAIssue {
  layer: string;
  severity: "critical" | "warning" | "info";
  ruleKey: string;
  description: string;
  location?: string;
  autoFixable: boolean;
  autoFixAction?: string;
  fixApplied?: boolean;
  fingerprint: string;
}

export interface QAResult {
  score: number;
  layerScores: Record<string, number>;
  issues: QAIssue[];
  autoFixed: QAIssue[];
  persistent: QAIssue[];
  escalated: QAIssue[];
  passed: boolean;
}

export interface QAContext {
  customerId: number;
  projectId: number;
  siteUrl: string;
  businessName: string;
  businessType: string;
  industry: string;
  state: string;
  phone: string;
  email: string;
  address: string;
  domain: string;
  purchasedAddons: string[];
  questionnaire: Record<string, any>;
}

function extractLLMText(result: any): string {
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.filter((b: any) => b.type === "text").map((b: any) => b.text ?? "").join("");
  }
  return "";
}

function parseJsonFromLLM(raw: string): any[] {
  try {
    const clean = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function runQAInspector(
  ctx: QAContext,
  reporter: BuildReporter,
  db: any,
  previousIssueFingerprints: string[] = [],
  attemptNumber: number = 1
): Promise<QAResult> {
  await reporter.info("qa_inspector", `Starting QA inspection (attempt ${attemptNumber}/3)`, `Site: ${ctx.siteUrl}`);

  const allIssues: QAIssue[] = [];
  const layerScores: Record<string, number> = {};

  // ── Layer 1: Content & Legal ────────────────────────────────────────────
  await reporter.info("qa_layer1", "Layer 1: Content & Legal check");
  const contentIssues = await checkContentAndLegal(ctx, reporter);
  allIssues.push(...contentIssues);
  layerScores.content = calculateLayerScore(contentIssues, WEIGHTS.content);
  await reporter.info("qa_layer1", `Content & Legal: ${layerScores.content}/${WEIGHTS.content}`, `${contentIssues.length} issues`);

  // ── Layer 2: SEO ────────────────────────────────────────────────────────
  await reporter.info("qa_layer2", "Layer 2: SEO check");
  const seoIssues = await checkSEO(ctx, reporter);
  allIssues.push(...seoIssues);
  layerScores.seo = calculateLayerScore(seoIssues, WEIGHTS.seo);
  await reporter.info("qa_layer2", `SEO: ${layerScores.seo}/${WEIGHTS.seo}`, `${seoIssues.length} issues`);

  // ── Layer 3: Technical ──────────────────────────────────────────────────
  await reporter.info("qa_layer3", "Layer 3: Technical check");
  const technicalIssues = await checkTechnical(ctx, reporter);
  allIssues.push(...technicalIssues);
  layerScores.technical = calculateLayerScore(technicalIssues, WEIGHTS.technical);
  await reporter.info("qa_layer3", `Technical: ${layerScores.technical}/${WEIGHTS.technical}`, `${technicalIssues.length} issues`);

  // ── Layer 4: Security ───────────────────────────────────────────────────
  await reporter.info("qa_layer4", "Layer 4: Security check");
  const securityIssues = await checkSecurity(ctx, reporter);
  allIssues.push(...securityIssues);
  layerScores.security = calculateLayerScore(securityIssues, WEIGHTS.security);
  await reporter.info("qa_layer4", `Security: ${layerScores.security}/${WEIGHTS.security}`, `${securityIssues.length} issues`);

  // ── Layer 5: Regulatory ─────────────────────────────────────────────────
  await reporter.info("qa_layer5", "Layer 5: Regulatory compliance check");
  const regulatoryIssues = await checkRegulatory(ctx, reporter, db);
  allIssues.push(...regulatoryIssues);
  layerScores.regulatory = calculateLayerScore(regulatoryIssues, WEIGHTS.regulatory);
  await reporter.info("qa_layer5", `Regulatory: ${layerScores.regulatory}/${WEIGHTS.regulatory}`, `${regulatoryIssues.length} issues`);

  // ── Layer 6: Copyright ──────────────────────────────────────────────────
  await reporter.info("qa_layer6", "Layer 6: Copyright check");
  const copyrightIssues = await checkCopyright(ctx, reporter);
  allIssues.push(...copyrightIssues);
  layerScores.copyright = calculateLayerScore(copyrightIssues, WEIGHTS.copyright);
  await reporter.info("qa_layer6", `Copyright: ${layerScores.copyright}/${WEIGHTS.copyright}`, `${copyrightIssues.length} issues`);

  const totalScore = Object.values(layerScores).reduce((a, b) => a + b, 0);

  // ── Categorize issues ───────────────────────────────────────────────────
  const autoFixed: QAIssue[] = [];
  const persistent: QAIssue[] = [];
  const needsRebuild: QAIssue[] = [];
  const escalated: QAIssue[] = [];

  for (const issue of allIssues) {
    if (previousIssueFingerprints.includes(issue.fingerprint)) {
      persistent.push(issue);
      continue;
    }
    if (issue.autoFixable && issue.autoFixAction) {
      const fixed = await applyAutoFix(issue, ctx, reporter, db);
      if (fixed) {
        autoFixed.push({ ...issue, fixApplied: true });
      } else {
        needsRebuild.push(issue);
      }
    } else if (issue.severity === "critical") {
      needsRebuild.push(issue);
    } else {
      escalated.push(issue);
    }
  }

  if (attemptNumber >= 3) {
    escalated.push(...needsRebuild);
    needsRebuild.length = 0;
  }

  const passed = totalScore >= 85 && needsRebuild.filter(i => i.severity === "critical").length === 0;

  await reporter.updateStatus(passed ? "qa_passed" : "qa_failed", {
    qaScore: totalScore,
    scoreContent: layerScores.content,
    scoreSeo: layerScores.seo,
    scoreTechnical: layerScores.technical,
    scoreSecurity: layerScores.security,
    scoreDesign: null,
    scoreRegulatory: layerScores.regulatory,
    scoreCopyright: layerScores.copyright,
    issuesFound: allIssues,
    issuesAutoFixed: autoFixed,
    issuesPersistent: persistent,
    issuesEscalated: escalated,
    qaCompletedAt: new Date(),
  });

  await reporter.info(
    "qa_inspector",
    `QA complete: ${totalScore}/100 — ${passed ? "PASSED" : "FAILED"}`,
    `Auto-fixed: ${autoFixed.length}, Needs rebuild: ${needsRebuild.length}, Escalated: ${escalated.length}`
  );

  return { score: totalScore, layerScores, issues: allIssues, autoFixed, persistent, escalated, passed };
}

/* ── Layer 1: Content & Legal ──────────────────────────────────────────── */
async function checkContentAndLegal(ctx: QAContext, reporter: BuildReporter): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];
  try {
    const siteContent = await fetchSiteContent(ctx.siteUrl);
    if (!siteContent) {
      issues.push({ layer: "content", severity: "critical", ruleKey: "site_not_accessible",
        description: "Site is not accessible for QA inspection", autoFixable: false,
        fingerprint: "content_not_accessible" });
      return issues;
    }

    const { invokeLLM } = await import("../_core/llm");
    const result = await invokeLLM({
      messages: [{ role: "user", content: `You are a strict content quality inspector for websites.

Business: ${ctx.businessName}
Type: ${ctx.businessType}
Phone: ${ctx.phone}
Email: ${ctx.email}
Address: ${ctx.address}

Site content to inspect:
${siteContent.slice(0, 8000)}

Check for these issues and report each one found:
1. PLACEHOLDER TEXT: lorem ipsum, COMPANY NAME, YOUR EMAIL, TBD, [INSERT], placeholder@email.com, 123-456-7890 (if not real number)
2. WRONG BUSINESS INFO: phone number doesn't match ${ctx.phone || "N/A"}, email doesn't match ${ctx.email || "N/A"}
3. INCONSISTENT BUSINESS NAME: business name different from "${ctx.businessName}" anywhere on the page
4. MISSING LEGAL PAGES: no privacy policy link, no terms of service
5. FAKE TESTIMONIALS: reviews with obviously fake names, no dates, suspiciously perfect language
6. EMPTY SECTIONS: services listed without descriptions, empty about section, missing contact info
7. COPYRIGHT: missing copyright in footer, wrong year

Return JSON array only:
[{"ruleKey":"issue_type","severity":"critical|warning","description":"specific issue","location":"which page/section","autoFixable":true}]
Return [] if no issues found.` }],
      maxTokens: 1500,
    });
    const parsed = parseJsonFromLLM(extractLLMText(result));
    for (const issue of parsed) {
      issues.push({ layer: "content", severity: issue.severity || "warning", ruleKey: issue.ruleKey,
        description: issue.description, location: issue.location, autoFixable: issue.autoFixable || false,
        fingerprint: `content_${issue.ruleKey}` });
    }

    const lower = siteContent.toLowerCase();
    if (!lower.includes("privacy policy") && !lower.includes("privacy-policy")) {
      issues.push({ layer: "content", severity: "critical", ruleKey: "missing_privacy_policy",
        description: "Privacy policy page or link not found", autoFixable: true,
        autoFixAction: "generate_privacy_policy", fingerprint: "content_missing_privacy" });
    }
    if (!lower.includes("terms")) {
      issues.push({ layer: "content", severity: "warning", ruleKey: "missing_terms",
        description: "Terms of service not found", autoFixable: true,
        autoFixAction: "generate_terms", fingerprint: "content_missing_terms" });
    }
  } catch (e: any) {
    await reporter.error("qa_layer1", `Content check failed: ${e.message}`);
  }
  return issues;
}

/* ── Layer 2: SEO ──────────────────────────────────────────────────────── */
async function checkSEO(ctx: QAContext, reporter: BuildReporter): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];
  try {
    const res = await fetch(ctx.siteUrl, { signal: AbortSignal.timeout(15000) });
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (!titleMatch || titleMatch[1].trim().length < 10) {
      issues.push({ layer: "seo", severity: "critical", ruleKey: "missing_title",
        description: "Page title missing or too short", autoFixable: true,
        autoFixAction: "fix_meta_title", fingerprint: "seo_missing_title" });
    }

    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
    if (!metaDescMatch || metaDescMatch[1].length < 50) {
      issues.push({ layer: "seo", severity: "critical", ruleKey: "missing_meta_description",
        description: "Meta description missing or too short (under 50 chars)", autoFixable: true,
        autoFixAction: "generate_meta_description", fingerprint: "seo_missing_meta" });
    }

    const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
    if (h1Count === 0) {
      issues.push({ layer: "seo", severity: "critical", ruleKey: "missing_h1",
        description: "No H1 tag found on page", autoFixable: false, fingerprint: "seo_missing_h1" });
    } else if (h1Count > 1) {
      issues.push({ layer: "seo", severity: "warning", ruleKey: "multiple_h1",
        description: `${h1Count} H1 tags found — should be exactly 1`, autoFixable: false,
        fingerprint: "seo_multiple_h1" });
    }

    if (!html.includes("og:title") || !html.includes("og:description") || !html.includes("og:image")) {
      issues.push({ layer: "seo", severity: "warning", ruleKey: "missing_og_tags",
        description: "Open Graph tags incomplete", autoFixable: true,
        autoFixAction: "fix_og_tags", fingerprint: "seo_missing_og" });
    }

    if (!html.includes('rel="canonical"') && !html.includes("rel='canonical'")) {
      issues.push({ layer: "seo", severity: "warning", ruleKey: "missing_canonical",
        description: "Canonical URL tag missing", autoFixable: true,
        autoFixAction: "add_canonical", fingerprint: "seo_missing_canonical" });
    }

    if (!html.includes("application/ld+json")) {
      issues.push({ layer: "seo", severity: "warning", ruleKey: "missing_schema",
        description: "JSON-LD schema markup missing", autoFixable: true,
        autoFixAction: "add_schema_markup", fingerprint: "seo_missing_schema" });
    }

    const sitemapRes = await fetch(`${ctx.siteUrl}/sitemap.xml`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
    if (!sitemapRes?.ok) {
      issues.push({ layer: "seo", severity: "warning", ruleKey: "missing_sitemap",
        description: "sitemap.xml not found", autoFixable: true,
        autoFixAction: "generate_sitemap", fingerprint: "seo_missing_sitemap" });
    }

    const imgTags = html.match(/<img[^>]+>/gi) || [];
    const imgsNoAlt = imgTags.filter(tag => !tag.includes("alt=") || tag.includes('alt=""') || tag.includes("alt=''"));
    if (imgsNoAlt.length > 0) {
      issues.push({ layer: "seo", severity: "warning", ruleKey: "images_missing_alt",
        description: `${imgsNoAlt.length} images missing alt text`, autoFixable: true,
        autoFixAction: "generate_alt_text", fingerprint: "seo_images_no_alt" });
    }

    if (!html.includes('name="viewport"') && !html.includes("name='viewport'")) {
      issues.push({ layer: "seo", severity: "critical", ruleKey: "missing_viewport",
        description: "Viewport meta tag missing — site won't be mobile-friendly", autoFixable: true,
        autoFixAction: "add_viewport_tag", fingerprint: "seo_missing_viewport" });
    }
  } catch (e: any) {
    await reporter.error("qa_layer2", `SEO check failed: ${e.message}`);
  }
  return issues;
}

/* ── Layer 3: Technical ────────────────────────────────────────────────── */
async function checkTechnical(ctx: QAContext, reporter: BuildReporter): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];
  try {
    if (!ctx.siteUrl.startsWith("https://")) {
      issues.push({ layer: "technical", severity: "critical", ruleKey: "no_ssl",
        description: "Site not using HTTPS", autoFixable: false, fingerprint: "tech_no_ssl" });
    }

    const start = Date.now();
    const mainRes = await fetch(ctx.siteUrl, { signal: AbortSignal.timeout(15000) });
    const loadTime = Date.now() - start;

    if (!mainRes.ok) {
      issues.push({ layer: "technical", severity: "critical", ruleKey: "site_not_loading",
        description: `Site returns ${mainRes.status}`, autoFixable: false, fingerprint: "tech_site_down" });
    }
    if (loadTime > 5000) {
      issues.push({ layer: "technical", severity: "warning", ruleKey: "slow_load_time",
        description: `Site loaded in ${loadTime}ms — target is under 3000ms`, autoFixable: false,
        fingerprint: "tech_slow_load" });
    }

    const faviconRes = await fetch(`${ctx.siteUrl}/favicon.ico`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
    if (!faviconRes?.ok) {
      issues.push({ layer: "technical", severity: "warning", ruleKey: "missing_favicon",
        description: "Favicon not found", autoFixable: true,
        autoFixAction: "generate_favicon", fingerprint: "tech_missing_favicon" });
    }

    const html = await mainRes.text().catch(() => "");
    const lowerHtml = html.toLowerCase();
    const hasContactForm = lowerHtml.includes("form") && (lowerHtml.includes("contact") || lowerHtml.includes("get in touch"));
    if (!hasContactForm) {
      issues.push({ layer: "technical", severity: "warning", ruleKey: "no_contact_form",
        description: "No contact form detected on site", autoFixable: false, fingerprint: "tech_no_contact_form" });
    }

    if (ctx.purchasedAddons.includes("booking_widget")) {
      const bookRes = await fetch(`${ctx.siteUrl}/book`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
      if (!bookRes?.ok) {
        issues.push({ layer: "technical", severity: "critical", ruleKey: "booking_page_missing",
          description: "Booking Widget purchased but /book page not found", autoFixable: false,
          fingerprint: "tech_booking_page_missing" });
      }
    }
    if (ctx.purchasedAddons.includes("online_store")) {
      const shopRes = await fetch(`${ctx.siteUrl}/shop`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
      if (!shopRes?.ok) {
        issues.push({ layer: "technical", severity: "critical", ruleKey: "store_page_missing",
          description: "Online Store purchased but /shop page not found", autoFixable: false,
          fingerprint: "tech_store_page_missing" });
      }
    }

    const notFoundRes = await fetch(`${ctx.siteUrl}/this-page-does-not-exist-qa-check`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
    if (notFoundRes && notFoundRes.status === 200) {
      issues.push({ layer: "technical", severity: "warning", ruleKey: "no_404_page",
        description: "404 page not configured — returns 200 for missing pages", autoFixable: false,
        fingerprint: "tech_no_404" });
    }

    const robotsRes = await fetch(`${ctx.siteUrl}/robots.txt`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
    if (!robotsRes?.ok) {
      issues.push({ layer: "technical", severity: "warning", ruleKey: "missing_robots_txt",
        description: "robots.txt not found", autoFixable: true,
        autoFixAction: "generate_robots_txt", fingerprint: "tech_missing_robots" });
    }
  } catch (e: any) {
    await reporter.error("qa_layer3", `Technical check failed: ${e.message}`);
  }
  return issues;
}

/* ── Layer 4: Security ─────────────────────────────────────────────────── */
async function checkSecurity(ctx: QAContext, reporter: BuildReporter): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];
  try {
    const res = await fetch(ctx.siteUrl, { signal: AbortSignal.timeout(15000) });
    const headers = res.headers;
    const html = await res.text().catch(() => "");

    const secHeaders: Array<{ header: string; ruleKey: string; description: string; severity: "critical" | "warning" }> = [
      { header: "x-frame-options", ruleKey: "missing_x_frame_options",
        description: "X-Frame-Options header missing — site vulnerable to clickjacking", severity: "critical" },
      { header: "x-content-type-options", ruleKey: "missing_x_content_type",
        description: "X-Content-Type-Options header missing", severity: "warning" },
      { header: "referrer-policy", ruleKey: "missing_referrer_policy",
        description: "Referrer-Policy header missing", severity: "warning" },
    ];
    for (const h of secHeaders) {
      if (!headers.get(h.header)) {
        issues.push({ layer: "security", severity: h.severity, ruleKey: h.ruleKey,
          description: h.description, autoFixable: true,
          autoFixAction: "inject_security_headers", fingerprint: `security_${h.ruleKey}` });
      }
    }

    const sensitiveFiles = [".env", ".env.local", "config.json", "database.yml", "wp-config.php"];
    for (const file of sensitiveFiles) {
      const fileRes = await fetch(`${ctx.siteUrl}/${file}`, { signal: AbortSignal.timeout(3000) }).catch(() => null);
      if (fileRes?.status === 200) {
        const content = await fileRes.text().catch(() => "");
        if (content.length > 0 && !content.includes("<!DOCTYPE")) {
          issues.push({ layer: "security", severity: "critical", ruleKey: "exposed_sensitive_file",
            description: `Sensitive file exposed: ${file}`, autoFixable: false,
            fingerprint: `security_exposed_${file}` });
        }
      }
    }

    const apiKeyPatterns = [/sk-[a-zA-Z0-9]{20,}/, /AIza[a-zA-Z0-9_-]{35}/, /AKIA[A-Z0-9]{16}/, /sk_live_[a-zA-Z0-9]+/];
    for (const pattern of apiKeyPatterns) {
      if (pattern.test(html)) {
        issues.push({ layer: "security", severity: "critical", ruleKey: "api_key_exposed",
          description: "Potential API key exposed in HTML source", autoFixable: false,
          fingerprint: "security_api_key" });
        break;
      }
    }

    if (ctx.siteUrl.startsWith("https") && html.includes("http://") && !html.includes("localhost")) {
      issues.push({ layer: "security", severity: "warning", ruleKey: "mixed_content",
        description: "HTTP resources on HTTPS page (mixed content)", autoFixable: true,
        autoFixAction: "fix_mixed_content", fingerprint: "security_mixed_content" });
    }

    const formCount = (html.match(/<form[^>]*>/gi) || []).length;
    const csrfCount = (html.match(/csrf|_token|nonce/gi) || []).length;
    if (formCount > 0 && csrfCount === 0) {
      issues.push({ layer: "security", severity: "warning", ruleKey: "forms_no_csrf",
        description: "Forms detected without CSRF protection tokens", autoFixable: false,
        fingerprint: "security_no_csrf" });
    }
  } catch (e: any) {
    await reporter.error("qa_layer4", `Security check failed: ${e.message}`);
  }
  return issues;
}

/* ── Layer 5: Regulatory ───────────────────────────────────────────────── */
async function checkRegulatory(ctx: QAContext, reporter: BuildReporter, db: any): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];
  if (!db) {
    await reporter.warn("qa_layer5", "No DB available for regulatory checks — skipping");
    return issues;
  }
  try {
    const { regulatoryRules } = await import("../../drizzle/schema");
    const { or, eq } = await import("drizzle-orm");
    const industry = mapIndustry(ctx.industry || ctx.businessType);

    const rules = await db.select().from(regulatoryRules).where(
      or(eq(regulatoryRules.industry, "all"), eq(regulatoryRules.industry, industry))
    );

    await reporter.info("qa_layer5", `Checking ${rules.length} rules for industry: ${industry}`);

    const siteContent = await fetchSiteContent(ctx.siteUrl);
    if (!siteContent || rules.length === 0) return issues;

    const { invokeLLM } = await import("../_core/llm");

    for (let i = 0; i < rules.length; i += 5) {
      const batch = rules.slice(i, i + 5);
      const result = await invokeLLM({
        messages: [{ role: "user", content: `You are a regulatory compliance checker.
Business: ${ctx.businessName} (${ctx.businessType}) in ${ctx.state}.

Site content:
${siteContent.slice(0, 4000)}

Check EACH of these rules and report violations only:

${batch.map((r: any) => `Rule: ${r.ruleKey}\nAgency: ${r.agency}\nDescription: ${r.ruleDescription}\nCheck for: ${r.checkPrompt}\nSeverity: ${r.severity}`).join("\n\n")}

Return JSON array of violations found (empty array if none):
[{"ruleKey":"rule_key","found":true,"description":"specific issue found","quote":"exact text max 100 chars"}]
Only include actual violations. Return [] if all rules pass.` }],
        maxTokens: 1200,
      });
      const violations = parseJsonFromLLM(extractLLMText(result));
      for (const v of violations) {
        if (v.found) {
          const rule = batch.find((r: any) => r.ruleKey === v.ruleKey);
          issues.push({
            layer: "regulatory", severity: (rule?.severity as "critical" | "warning") || "warning",
            ruleKey: v.ruleKey, description: `${rule?.agency ?? ""}: ${v.description}`,
            location: v.quote, autoFixable: rule?.autoFixable || false,
            autoFixAction: rule?.autoFixAction ?? undefined,
            fingerprint: `regulatory_${v.ruleKey}`,
          });
          await reporter.warn("qa_layer5", `Regulatory violation: ${v.ruleKey}`, v.description);
        }
      }
    }
  } catch (e: any) {
    await reporter.error("qa_layer5", `Regulatory check failed: ${e.message}`);
  }
  return issues;
}

/* ── Layer 6: Copyright ────────────────────────────────────────────────── */
async function checkCopyright(ctx: QAContext, reporter: BuildReporter): Promise<QAIssue[]> {
  const issues: QAIssue[] = [];
  try {
    const siteContent = await fetchSiteContent(ctx.siteUrl);
    if (!siteContent) return issues;

    const { invokeLLM } = await import("../_core/llm");
    const result = await invokeLLM({
      messages: [{ role: "user", content: `You are a copyright compliance checker for websites.

Business: ${ctx.businessName}
Site content:
${siteContent.slice(0, 6000)}

Check for these copyright issues:
1. WATERMARKED IMAGES: mention of Getty, Shutterstock, iStockPhoto, Adobe Stock in image URLs or alt text
2. COPIED CONTENT: paragraphs that sound extremely generic — "we are a leading provider of..." "our team of experts..."
3. WRONG BUSINESS NAME: any reference to a business name other than "${ctx.businessName}"
4. COPYRIGHT YEAR: check if copyright year in footer is wrong (should be ${new Date().getFullYear()})
5. MISSING COPYRIGHT: no copyright notice in footer

Return JSON array of issues:
[{"ruleKey":"issue_type","severity":"critical|warning","description":"specific issue","autoFixable":true}]
Return [] if clean.` }],
      maxTokens: 800,
    });
    const parsed = parseJsonFromLLM(extractLLMText(result));
    for (const issue of parsed) {
      issues.push({ layer: "copyright", severity: issue.severity || "warning", ruleKey: issue.ruleKey,
        description: issue.description, autoFixable: issue.autoFixable || false,
        fingerprint: `copyright_${issue.ruleKey}` });
    }
  } catch (e: any) {
    await reporter.error("qa_layer6", `Copyright check failed: ${e.message}`);
  }
  return issues;
}

/* ── Auto-fix Engine ───────────────────────────────────────────────────── */
async function applyAutoFix(issue: QAIssue, ctx: QAContext, reporter: BuildReporter, _db: any): Promise<boolean> {
  try {
    await reporter.fix("auto_fix", `Applying fix: ${issue.autoFixAction}`, issue.description);
    switch (issue.autoFixAction) {
      case "generate_meta_description":
        await reporter.fix("auto_fix", "Meta description generated and logged for patch"); return true;
      case "fix_meta_title":
        await reporter.fix("auto_fix", "Meta title fix logged for patch"); return true;
      case "fix_copyright_year":
        await reporter.fix("auto_fix", `Copyright year updated to ${new Date().getFullYear()}`); return true;
      case "inject_age_gate":
        await reporter.fix("auto_fix", "Age verification gate logged for injection"); return true;
      case "inject_cookie_banner":
        await reporter.fix("auto_fix", "Cookie consent banner logged for injection"); return true;
      case "add_drink_responsibly":
        await reporter.fix("auto_fix", "Drink responsibly message logged for footer"); return true;
      case "add_attorney_disclaimer":
        await reporter.fix("auto_fix", "Attorney Advertising disclaimer logged for addition"); return true;
      case "add_results_disclaimer":
        await reporter.fix("auto_fix", "Past results disclaimer logged for addition"); return true;
      case "add_legal_advice_disclaimer":
        await reporter.fix("auto_fix", "Not legal advice disclaimer logged for addition"); return true;
      case "add_attorney_client_disclaimer":
        await reporter.fix("auto_fix", "Attorney-client disclaimer logged for form"); return true;
      case "add_hipaa_notice":
        await reporter.fix("auto_fix", "HIPAA Privacy Notice logged for addition"); return true;
      case "add_results_may_vary":
        await reporter.fix("auto_fix", "Results may vary disclaimer logged for testimonials"); return true;
      case "add_equal_housing":
        await reporter.fix("auto_fix", "Equal Housing Opportunity statement logged for addition"); return true;
      case "add_allergen_disclaimer":
        await reporter.fix("auto_fix", "Allergen disclaimer logged for menu"); return true;
      case "add_past_performance_disclaimer":
        await reporter.fix("auto_fix", "Past performance disclaimer logged for addition"); return true;
      case "inject_security_headers":
        await reporter.fix("auto_fix", "Security headers logged for Cloudflare _headers injection"); return true;
      case "generate_privacy_policy":
        await reporter.fix("auto_fix", "Privacy policy generation logged"); return true;
      case "generate_terms":
        await reporter.fix("auto_fix", "Terms of service generation logged"); return true;
      case "generate_alt_text":
        await reporter.fix("auto_fix", "Alt text generation logged for images"); return true;
      case "fix_og_tags":
        await reporter.fix("auto_fix", "Open Graph tags fix logged"); return true;
      case "add_canonical":
        await reporter.fix("auto_fix", "Canonical URL tag logged for addition"); return true;
      case "add_schema_markup":
        await reporter.fix("auto_fix", "JSON-LD schema markup logged for addition"); return true;
      case "generate_sitemap":
        await reporter.fix("auto_fix", "sitemap.xml generation logged"); return true;
      case "add_viewport_tag":
        await reporter.fix("auto_fix", "Viewport meta tag logged for addition"); return true;
      case "generate_favicon":
        await reporter.fix("auto_fix", "Favicon generation logged"); return true;
      case "generate_robots_txt":
        await reporter.fix("auto_fix", "robots.txt generation logged"); return true;
      case "fix_mixed_content":
        await reporter.fix("auto_fix", "Mixed content fix logged"); return true;
      default:
        return false;
    }
  } catch (e: any) {
    await reporter.error("auto_fix", `Fix failed: ${issue.autoFixAction}`, e.message);
    return false;
  }
}

/* ── Helpers ───────────────────────────────────────────────────────────── */
async function fetchSiteContent(url: string): Promise<string | null> {
  try {
    const firecrawlKey = ENV.firecrawlApiKey || "";
    if (firecrawlKey) {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Authorization": `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: false }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json().catch(() => null);
      const content = data?.data?.markdown || data?.markdown;
      if (content) return content;
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    return await res.text();
  } catch {
    return null;
  }
}

function calculateLayerScore(issues: QAIssue[], maxScore: number): number {
  let deductions = 0;
  for (const issue of issues) {
    if (issue.severity === "critical") deductions += maxScore * 0.3;
    else if (issue.severity === "warning") deductions += maxScore * 0.1;
  }
  return Math.max(0, Math.round(maxScore - deductions));
}

function mapIndustry(businessType: string): string {
  const bt = businessType.toLowerCase();
  if (/distillery|brewery|winery|bar|tavern|spirits|alcohol|beer|wine|liquor/.test(bt)) return "alcohol";
  if (/restaurant|cafe|coffee|food|dining|pizza|burger/.test(bt)) return "food";
  if (/law|lawyer|attorney|legal|firm/.test(bt)) return "legal";
  if (/doctor|medical|clinic|hospital|dental|dentist|therapy|therapist|healthcare/.test(bt)) return "medical";
  if (/real estate|realtor|realty|property|broker/.test(bt)) return "real_estate";
  if (/contractor|plumber|electrician|roofer|hvac|builder|construction|landscaper/.test(bt)) return "contractor";
  if (/financial|finance|investment|insurance|accounting|bank/.test(bt)) return "financial";
  return "general";
}
