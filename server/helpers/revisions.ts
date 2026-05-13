export interface RevisionProject {
  revisionsCount?: number | null;
  revisionsRemaining?: number | null;
  maxRevisions?: number | null;
  generationStatus?: string | null;
}

export interface RevisionCheck {
  allowed: boolean;
  reason?: string;
  revisionsUsed: number;
  revisionsMax: number;
  revisionsRemaining: number;
}

export function validateRevisionAvailability(project: RevisionProject): RevisionCheck {
  const used = project.revisionsCount ?? 0;
  const max = project.maxRevisions ?? 3;
  const remaining = project.revisionsRemaining ?? Math.max(0, max - used);

  if (used >= max) {
    return {
      allowed: false,
      reason: "Maximum revisions reached. Please contact support.",
      revisionsUsed: used,
      revisionsMax: max,
      revisionsRemaining: 0,
    };
  }

  return {
    allowed: true,
    revisionsUsed: used,
    revisionsMax: max,
    revisionsRemaining: Math.max(0, remaining),
  };
}

export function computeNewRevisionCounts(project: RevisionProject): {
  newRevisionsCount: number;
  newRevisionsRemaining: number;
} {
  const used = project.revisionsCount ?? 0;
  const max = project.maxRevisions ?? 3;
  const remaining = project.revisionsRemaining ?? Math.max(0, max - used);
  return {
    newRevisionsCount: used + 1,
    newRevisionsRemaining: Math.max(0, remaining - 1),
  };
}
