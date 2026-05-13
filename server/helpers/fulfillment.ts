export const BLOCKING_STATUSES = new Set(["pending", "in_progress", "blocked"]);
export const NON_BLOCKING_STATUSES = new Set(["completed", "not_applicable"]);

/** Returns true if the item's status should block or require override in adminReleaseLaunch. */
export function isFulfillmentItemBlocking(status: string): boolean {
  if (NON_BLOCKING_STATUSES.has(status)) return false;
  // Unknown/unexpected status is treated as blocking (conservative)
  return true;
}

export function normalizeFulfillmentStatus(
  status: string,
): "pending" | "in_progress" | "blocked" | "completed" | "not_applicable" | "unknown" {
  const valid = ["pending", "in_progress", "blocked", "completed", "not_applicable"];
  return valid.includes(status) ? (status as any) : "unknown";
}

export interface FulfillmentSummary {
  totalItems: number;
  blockingCount: number;
  completedCount: number;
  allClear: boolean;
}

export function calculateProjectFulfillmentSummary(
  items: Array<{ status: string }>,
): FulfillmentSummary {
  const totalItems = items.length;
  const blockingCount = items.filter(i => isFulfillmentItemBlocking(i.status)).length;
  const completedCount = items.filter(i => NON_BLOCKING_STATUSES.has(i.status)).length;
  return { totalItems, blockingCount, completedCount, allClear: blockingCount === 0 };
}
