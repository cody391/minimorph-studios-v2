/**
 * B-Card P0 Reopen — Shared Contract Validation for Checkout
 *
 * Used by ALL website package checkout and payment-link routes.
 * Uses the existing customerAgreements system — no parallel contract system.
 * No route may create a Stripe session without passing this validation.
 */

// Placeholder/sentinel signer names that are never valid legal names
export const SENTINEL_SIGNER_NAMES = [
  "customer", "unknown", "test", "testuser", "n/a", "na", "none", "user",
  "client", "signer", "name", "fullname", "full name", "your name",
  "enter name", "legal name", "first last",
];

export interface AgreementForValidation {
  id: number;
  userId: number;
  projectId: number;
  signerName: string;
  termsVersion: string;
  acceptedAt: Date | null;
  contractId: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  packageSnapshot: unknown;
}

export interface ContractValidationResult {
  ready: boolean;
  agreementId: number | null;
  contractId: number | null;
  contractVersion: string | null;
  missingRequirements: string[];
  blockingReason: string | null;
  contractSummary: {
    signerName: string | null;
    acceptedAt: Date | null;
    packageTier: string | null;
    termsVersion: string | null;
    hasIpAddress: boolean;
    hasUserAgent: boolean;
  } | null;
  metadataPayload: Record<string, string>;
}

/**
 * Validates that a customerAgreements row is ready for checkout.
 * Call this before creating any Stripe session for a website package.
 *
 * @param params.agreement - the agreement row loaded from DB (or null/undefined)
 * @param params.expectedUserId - must match agreement.userId
 * @param params.expectedProjectId - must match agreement.projectId
 */
export function validateContractReadyForCheckout(params: {
  agreement: AgreementForValidation | null | undefined;
  expectedUserId: number;
  expectedProjectId: number;
}): ContractValidationResult {
  const { agreement, expectedUserId, expectedProjectId } = params;
  const missing: string[] = [];

  if (!agreement) {
    return {
      ready: false,
      agreementId: null,
      contractId: null,
      contractVersion: null,
      missingRequirements: ["no agreement record found"],
      blockingReason:
        "Legal agreement not found. Customer must accept the service agreement before checkout.",
      contractSummary: null,
      metadataPayload: {},
    };
  }

  // Ownership: agreement must belong to the same user
  if (agreement.userId !== expectedUserId) {
    missing.push("agreement.userId does not match the purchasing user");
  }

  // Ownership: agreement must belong to the same project
  if (agreement.projectId !== expectedProjectId) {
    missing.push("agreement.projectId does not match the checkout project");
  }

  // Acceptance: acceptedAt must exist
  if (!agreement.acceptedAt) {
    missing.push("agreement has no acceptedAt — customer has not completed the acceptance step");
  }

  // Signer name: must be a real legal name, not empty or sentinel
  const rawSigner = (agreement.signerName || "").trim();
  const lowerSigner = rawSigner.toLowerCase();
  if (rawSigner.length < 2) {
    missing.push("signerName is too short — full legal name is required");
  } else if (SENTINEL_SIGNER_NAMES.includes(lowerSigner)) {
    missing.push(`signerName "${rawSigner}" is a placeholder — real legal name is required`);
  } else if (!/[a-zA-Z]{2,}/.test(rawSigner)) {
    missing.push("signerName does not contain real alphabetic name characters");
  }

  const ready = missing.length === 0;
  const snapshot = (agreement.packageSnapshot || {}) as Record<string, unknown>;
  const snapshotTier = (snapshot.packageTier as string) || null;

  const metadataPayload: Record<string, string> = {};
  if (ready) {
    metadataPayload.agreement_id = String(agreement.id);
    metadataPayload.terms_version = agreement.termsVersion || "1.0";
    metadataPayload.agreement_accepted_at = agreement.acceptedAt
      ? agreement.acceptedAt.toISOString()
      : "";
    if (agreement.contractId) {
      metadataPayload.contract_id = String(agreement.contractId);
    }
  }

  return {
    ready,
    agreementId: agreement.id,
    contractId: agreement.contractId,
    contractVersion: agreement.termsVersion || null,
    missingRequirements: missing,
    blockingReason: ready
      ? null
      : `Contract validation failed: ${missing.join("; ")}`,
    contractSummary: {
      signerName: rawSigner || null,
      acceptedAt: agreement.acceptedAt,
      packageTier: snapshotTier,
      termsVersion: agreement.termsVersion,
      hasIpAddress: !!agreement.ipAddress,
      hasUserAgent: !!agreement.userAgent,
    },
    metadataPayload,
  };
}
