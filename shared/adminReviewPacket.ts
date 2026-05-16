import { SENTINEL_SIGNER_NAMES } from "./contractValidation";

// ── Denial Categories ────────────────────────────────────────────────────────

export type DenialCategory =
  | "text_copy"
  | "design_style"
  | "photo_media"
  | "business_info"
  | "contact_form"
  | "contract_compliance"
  | "other";

export const DENIAL_CATEGORY_LABELS: Record<DenialCategory, string> = {
  text_copy: "Text / Copy",
  design_style: "Design Style",
  photo_media: "Photo / Media",
  business_info: "Business Information",
  contact_form: "Contact Form",
  contract_compliance: "Contract / Compliance",
  other: "Other",
};

export const DENIAL_CATEGORIES = Object.keys(DENIAL_CATEGORY_LABELS) as DenialCategory[];

// ── Input Types ──────────────────────────────────────────────────────────────

export interface AdminReviewPacketInput {
  project: {
    id: number;
    customerId?: number | null;
    businessName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string | null;
    packageTier: string;
    stage: string;
    generationStatus: string;
    source?: string | null;
    userId?: number | null;
    paymentConfirmedAt?: Date | null;
    adminPreviewApprovedAt?: Date | null;
    approvedAt?: Date | null;
    adminReviewNotes?: string | null;
    questionnaire?: unknown;
    elenaConversationHistory?: unknown;
    generatedSiteHtml?: string | null;
    generatedSiteUrl?: string | null;
    previewReadyAt?: Date | null;
    createdAt?: Date | null;
  };
  blueprint: {
    id?: number;
    versionNumber?: number;
    blueprintJson?: unknown;
    adminBlueprintReviewStatus?: string | null;
  } | null;
  agreements: Array<{
    id: number;
    acceptedAt?: Date | null;
    signerName?: string | null;
    userId?: number | null;
    projectId?: number | null;
  }>;
  buildReports: Array<{
    id: number;
    status?: string | null;
    qaScore?: number | null;
    issuesPersistent?: unknown;
    issuesEscalated?: unknown;
    buildLog?: unknown;
    buildCompletedAt?: Date | null;
    createdAt?: Date | null;
  }>;
  customer: {
    status?: string | null;
    leadId?: number | null;
    repId?: number | null;
  } | null;
  hasContract: boolean;
}

// ── Section Types ────────────────────────────────────────────────────────────

export interface AdminReviewSection1 {
  projectId: number;
  customerId: number | null;
  businessName: string;
  packageTier: string;
  stage: string;
  generationStatus: string;
  source: string | null;
  createdAt: Date | null;
}

export interface AdminReviewSection2 {
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  customerStatus: string | null;
  repId: number | null;
}

export interface AdminReviewSection3 {
  hasAcceptedAgreement: boolean;
  hasValidSignerAgreement: boolean;
  signerName: string | null;
  contractReadyForCheckout: boolean;
  contractIssueBlockingCheckout: string | null;
  contractIssueBlockingGeneration: string | null;
  contractIssueBlockingLaunch: string | null;
  paymentConfirmedAt: Date | null;
  hasContract: boolean;
}

export interface AdminReviewSection4 {
  hasElenaConversation: boolean;
  messageCount: number;
  questionnaireSummary: Record<string, unknown>;
  customerTruth: string[];
  doNotSayItems: string[];
}

export interface AdminReviewSection5 {
  hasBlueprintJson: boolean;
  blueprintVersion: number | null;
  adminBlueprintReviewStatus: string | null;
  riskFlags: string[];
  claimsToOmit: string[];
  claimsNeedingAdminReview: string[];
  bannedPhrases: string[];
  templateLane: string | null;
}

export interface AdminReviewSection6 {
  hasHandoffEntry: boolean;
  integrityScore: number | null;
  safeToGenerate: boolean | null;
  warnings: string[];
}

export interface AdminReviewSection7 {
  hasGeneratedSite: boolean;
  pageCount: number;
  pageNames: string[];
  generatedSiteUrl: string | null;
  previewReadyAt: Date | null;
}

export interface AdminReviewSection8 {
  hasBuildReport: boolean;
  buildStatus: string | null;
  qaScore: number | null;
  issuesPersistentCount: number;
  issuesEscalatedCount: number;
  buildCompletedAt: Date | null;
}

export interface AdminReviewSection9 {
  claimsNeedingAdminReview: string[];
  adminReviewRecommended: boolean;
  adminReviewReason: string | null;
  manualAddOnsRequired: string[];
}

export interface AdminReviewSection10 {
  adminPreviewApprovedAt: Date | null;
  approvedAt: Date | null;
  lastDenialCategory: DenialCategory | null;
  lastDenialReason: string | null;
  lastFixInstructions: string | null;
}

export interface AdminReviewPacket {
  section1: AdminReviewSection1;
  section2: AdminReviewSection2;
  section3: AdminReviewSection3;
  section4: AdminReviewSection4;
  section5: AdminReviewSection5;
  section6: AdminReviewSection6;
  section7: AdminReviewSection7;
  section8: AdminReviewSection8;
  section9: AdminReviewSection9;
  section10: AdminReviewSection10;
  blockers: string[];
  canApprove: boolean;
}

export interface AdminFixGuidance {
  category: DenialCategory;
  categoryLabel: string;
  primaryGuidance: string[];
  customerTruthToPreserve: string[];
  contentConstraints: string[];
  rebuildNotes: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function safeBool(v: unknown): boolean {
  return v === true;
}

function safeNum(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

function safeBlueprintStr(bp: unknown, ...path: string[]): string {
  let node: unknown = bp;
  for (const key of path) {
    if (node == null || typeof node !== "object") return "";
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "string" ? node : "";
}

function safeBlueprintArr(bp: unknown, ...path: string[]): string[] {
  let node: unknown = bp;
  for (const key of path) {
    if (node == null || typeof node !== "object") return [];
    node = (node as Record<string, unknown>)[key];
  }
  return Array.isArray(node) ? node.filter((x): x is string => typeof x === "string") : [];
}

function safeBlueprintBool(bp: unknown, ...path: string[]): boolean {
  let node: unknown = bp;
  for (const key of path) {
    if (node == null || typeof node !== "object") return false;
    node = (node as Record<string, unknown>)[key];
  }
  return node === true;
}

function safeBlueprintNum(bp: unknown, ...path: string[]): number | null {
  let node: unknown = bp;
  for (const key of path) {
    if (node == null || typeof node !== "object") return null;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "number" ? node : null;
}

function extractB11Handoff(buildLog: unknown): { integrityScore: number | null; safeToGenerate: boolean | null; warnings: string[] } {
  const steps = safeArr(buildLog);
  for (const step of steps) {
    if (step != null && typeof step === "object") {
      const s = step as Record<string, unknown>;
      if (s.type === "b11_handoff" || s.key === "b11_handoff") {
        const data = (s.data ?? s) as Record<string, unknown>;
        return {
          integrityScore: safeNum(data.integrityScore),
          safeToGenerate: typeof data.safeToGenerate === "boolean" ? data.safeToGenerate : null,
          warnings: Array.isArray(data.warnings) ? data.warnings.filter((x): x is string => typeof x === "string") : [],
        };
      }
    }
  }
  return { integrityScore: null, safeToGenerate: null, warnings: [] };
}

function parseDenialFromAdminReviewNotes(notes: string | null | undefined): {
  category: DenialCategory | null;
  reason: string | null;
  fixInstructions: string | null;
} {
  if (!notes) return { category: null, reason: null, fixInstructions: null };
  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    const category = typeof parsed.category === "string" && DENIAL_CATEGORIES.includes(parsed.category as DenialCategory)
      ? (parsed.category as DenialCategory)
      : null;
    return {
      category,
      reason: typeof parsed.reason === "string" ? parsed.reason : null,
      fixInstructions: typeof parsed.fixInstructions === "string" ? parsed.fixInstructions : null,
    };
  } catch {
    return { category: null, reason: notes, fixInstructions: null };
  }
}

// ── Main Builder ─────────────────────────────────────────────────────────────

export function buildAdminReviewPacket(input: AdminReviewPacketInput): AdminReviewPacket {
  const { project, blueprint, agreements, buildReports, customer, hasContract } = input;
  const bp = blueprint?.blueprintJson ?? null;

  // Section 1 — Project identity
  const section1: AdminReviewSection1 = {
    projectId: project.id,
    customerId: project.customerId ?? null,
    businessName: project.businessName,
    packageTier: project.packageTier,
    stage: project.stage,
    generationStatus: project.generationStatus,
    source: project.source ?? null,
    createdAt: project.createdAt ?? null,
  };

  // Section 2 — Customer
  const section2: AdminReviewSection2 = {
    contactName: project.contactName,
    contactEmail: project.contactEmail,
    contactPhone: project.contactPhone ?? null,
    customerStatus: customer?.status ?? null,
    repId: customer?.repId ?? null,
  };

  // Section 3 — Contract / payment
  const hasAcceptedAgreement = agreements.some(a => !!a.acceptedAt);
  const validAgreement = agreements.find(a => {
    if (!a.acceptedAt) return false;
    const signer = (a.signerName || "").trim();
    if (signer.length < 2) return false;
    return !SENTINEL_SIGNER_NAMES.includes(signer.toLowerCase());
  }) ?? null;
  const hasValidSignerAgreement = !!validAgreement;
  const isSelfService = !!project.userId;
  const isPaid = !!project.paymentConfirmedAt;

  const contractIssueBlockingCheckout = !hasValidSignerAgreement
    ? "No accepted service agreement with valid signer name found."
    : null;
  const contractIssueBlockingGeneration = !hasValidSignerAgreement
    ? "No valid accepted agreement — generation blocked until agreement is on file."
    : null;
  const contractIssueBlockingLaunch = !hasContract
    ? "No active contract found — cannot launch without a paid contract."
    : null;

  const section3: AdminReviewSection3 = {
    hasAcceptedAgreement,
    hasValidSignerAgreement,
    signerName: validAgreement?.signerName ?? null,
    contractReadyForCheckout: hasValidSignerAgreement,
    contractIssueBlockingCheckout,
    contractIssueBlockingGeneration,
    contractIssueBlockingLaunch,
    paymentConfirmedAt: project.paymentConfirmedAt ?? null,
    hasContract,
  };

  // Section 4 — Elena / intake
  const elenaHistory = Array.isArray(project.elenaConversationHistory)
    ? project.elenaConversationHistory
    : [];
  const questObj = (project.questionnaire != null && typeof project.questionnaire === "object")
    ? (project.questionnaire as Record<string, unknown>)
    : {};
  const doNotSayItems = safeBlueprintArr(bp, "identity", "doNotSayList");
  const customerTruth = [
    safeBlueprintStr(bp, "identity", "businessName"),
    safeBlueprintStr(bp, "identity", "locationCity"),
    safeBlueprintStr(bp, "identity", "industryCategory"),
  ].filter(Boolean);

  const section4: AdminReviewSection4 = {
    hasElenaConversation: elenaHistory.length > 0,
    messageCount: elenaHistory.length,
    questionnaireSummary: questObj,
    customerTruth,
    doNotSayItems,
  };

  // Section 5 — Blueprint
  const riskFlags: string[] = [
    ...safeBlueprintArr(bp, "riskCompliance", "unsupportedFeatureAcknowledgments"),
    ...safeBlueprintArr(bp, "generatorInstructions", "reviewFlags"),
  ];
  const claimsToOmit = safeBlueprintArr(bp, "generatorInstructions", "claimsToOmit");
  const claimsNeedingAdminReview = safeBlueprintArr(bp, "generatorInstructions", "claimsNeedingAdminReview");
  const bannedPhrases = safeBlueprintArr(bp, "generatorInstructions", "bannedPhrases");
  const templateLane = safeBlueprintStr(bp, "generatorInstructions", "templateLane") || null;

  const section5: AdminReviewSection5 = {
    hasBlueprintJson: !!bp,
    blueprintVersion: blueprint?.versionNumber ?? null,
    adminBlueprintReviewStatus: blueprint?.adminBlueprintReviewStatus ?? null,
    riskFlags,
    claimsToOmit,
    claimsNeedingAdminReview,
    bannedPhrases,
    templateLane,
  };

  // Section 6 — B11 handoff
  const latestReport = buildReports[0] ?? null;
  const { integrityScore, safeToGenerate, warnings } = latestReport
    ? extractB11Handoff(latestReport.buildLog)
    : { integrityScore: null, safeToGenerate: null, warnings: [] };

  const section6: AdminReviewSection6 = {
    hasHandoffEntry: integrityScore !== null,
    integrityScore,
    safeToGenerate,
    warnings,
  };

  // Section 7 — Generated website
  let pageNames: string[] = [];
  if (project.generatedSiteHtml) {
    try {
      const pages = JSON.parse(project.generatedSiteHtml) as Record<string, unknown>;
      pageNames = Object.keys(pages);
    } catch {
      pageNames = [];
    }
  }

  const section7: AdminReviewSection7 = {
    hasGeneratedSite: !!project.generatedSiteHtml,
    pageCount: pageNames.length,
    pageNames,
    generatedSiteUrl: project.generatedSiteUrl ?? null,
    previewReadyAt: project.previewReadyAt ?? null,
  };

  // Section 8 — Build report
  const issuesPersistentCount = Array.isArray(latestReport?.issuesPersistent)
    ? (latestReport.issuesPersistent as unknown[]).length
    : 0;
  const issuesEscalatedCount = Array.isArray(latestReport?.issuesEscalated)
    ? (latestReport.issuesEscalated as unknown[]).length
    : 0;

  const section8: AdminReviewSection8 = {
    hasBuildReport: !!latestReport,
    buildStatus: latestReport?.status ?? null,
    qaScore: latestReport?.qaScore ?? null,
    issuesPersistentCount,
    issuesEscalatedCount,
    buildCompletedAt: latestReport?.buildCompletedAt ?? null,
  };

  // Section 9 — Claims / risk / add-ons
  const adminReviewRecommended = safeBlueprintBool(bp, "riskCompliance", "adminReviewRecommended");
  const adminReviewReason = safeBlueprintStr(bp, "riskCompliance", "adminReviewReason") || null;
  const manualAddOnsRequired: string[] = [];
  const addOnFit = (bp as any)?.addOnUpsellFit;
  if (addOnFit?.addOnsTeamSetup) {
    for (const a of addOnFit.addOnsTeamSetup) {
      if (a.product) manualAddOnsRequired.push(a.product);
    }
  }

  const section9: AdminReviewSection9 = {
    claimsNeedingAdminReview,
    adminReviewRecommended,
    adminReviewReason,
    manualAddOnsRequired,
  };

  // Section 10 — Approval / revision
  const parsedDenial = parseDenialFromAdminReviewNotes(project.adminReviewNotes);

  const section10: AdminReviewSection10 = {
    adminPreviewApprovedAt: project.adminPreviewApprovedAt ?? null,
    approvedAt: project.approvedAt ?? null,
    lastDenialCategory: parsedDenial.category,
    lastDenialReason: parsedDenial.reason,
    lastFixInstructions: parsedDenial.fixInstructions,
  };

  // ── Blocker detection ──────────────────────────────────────────────────────
  const blockers: string[] = [];

  if (project.generationStatus !== "complete") {
    blockers.push(`Generation not complete (status: ${project.generationStatus})`);
  }
  if (!section7.hasGeneratedSite) {
    blockers.push("No generated site HTML found");
  }
  if (!section8.hasBuildReport) {
    blockers.push("No build report found for this project");
  }
  if ((isSelfService || isPaid) && !hasValidSignerAgreement) {
    blockers.push("No valid accepted service agreement — self-service project requires signed agreement before launch");
  }
  if (contractIssueBlockingLaunch) {
    blockers.push(contractIssueBlockingLaunch);
  }

  return {
    section1,
    section2,
    section3,
    section4,
    section5,
    section6,
    section7,
    section8,
    section9,
    section10,
    blockers,
    canApprove: blockers.length === 0,
  };
}

// ── Fix Guidance Builder ─────────────────────────────────────────────────────

export function buildAdminFixGuidance(
  denial: { category: DenialCategory; reason: string; fixInstructions?: string | null },
  packet: AdminReviewPacket
): AdminFixGuidance {
  const categoryLabel = DENIAL_CATEGORY_LABELS[denial.category] ?? denial.category;

  const primaryGuidance: string[] = [];
  switch (denial.category) {
    case "text_copy":
      primaryGuidance.push("Rewrite copy to use only customer-provided facts");
      primaryGuidance.push("Do not invent credentials, years in business, or team size");
      primaryGuidance.push("Remove any superlatives not backed by customer proof");
      if (denial.fixInstructions) primaryGuidance.push(`Admin notes: ${denial.fixInstructions}`);
      break;
    case "design_style":
      primaryGuidance.push("Adjust template or visual style per admin instruction");
      primaryGuidance.push("Do not change copy or business facts while fixing design");
      if (denial.fixInstructions) primaryGuidance.push(`Admin notes: ${denial.fixInstructions}`);
      break;
    case "photo_media":
      primaryGuidance.push("Replace placeholder images with customer-provided photos");
      primaryGuidance.push("Remove any stock images that misrepresent the business");
      if (denial.fixInstructions) primaryGuidance.push(`Admin notes: ${denial.fixInstructions}`);
      break;
    case "business_info":
      primaryGuidance.push("Correct business name, location, phone, or hours per customer truth");
      primaryGuidance.push("Verify all contact details against accepted agreement or questionnaire");
      if (denial.fixInstructions) primaryGuidance.push(`Admin notes: ${denial.fixInstructions}`);
      break;
    case "contact_form":
      primaryGuidance.push("Fix form endpoint to POST to /api/contact-submit");
      primaryGuidance.push("Ensure businessName is included in the form payload");
      primaryGuidance.push("Remove any return false or Formspree handlers");
      if (denial.fixInstructions) primaryGuidance.push(`Admin notes: ${denial.fixInstructions}`);
      break;
    case "contract_compliance":
      primaryGuidance.push("Resolve contract/agreement issue before re-submitting for admin review");
      primaryGuidance.push("Ensure agreement has been accepted with a valid signer name");
      if (denial.fixInstructions) primaryGuidance.push(`Admin notes: ${denial.fixInstructions}`);
      break;
    case "other":
      if (denial.fixInstructions) {
        primaryGuidance.push(denial.fixInstructions);
      } else {
        primaryGuidance.push(`Admin denial reason: ${denial.reason}`);
      }
      break;
  }

  const customerTruthToPreserve: string[] = [
    ...packet.section4.customerTruth,
    ...packet.section4.doNotSayItems.map(item => `Do NOT say: ${item}`),
  ];

  const contentConstraints: string[] = [
    ...packet.section5.bannedPhrases.map(p => `Banned phrase: ${p}`),
    ...packet.section5.claimsToOmit.map(c => `Omit claim: ${c}`),
    ...packet.section9.claimsNeedingAdminReview.map(c => `Review required: ${c}`),
  ];

  const manualAddOns = packet.section9.manualAddOnsRequired;
  const rebuildNotes = manualAddOns.length > 0
    ? `Manual add-ons requiring team setup after rebuild: ${manualAddOns.join(", ")}`
    : "No manual add-on setup required for this rebuild";

  return {
    category: denial.category,
    categoryLabel,
    primaryGuidance,
    customerTruthToPreserve,
    contentConstraints,
    rebuildNotes,
  };
}
