type DatedSubmission = { completedAt?: Date; agreedAt?: Date } | null | undefined;

function submissionDate(submission: DatedSubmission): Date | null {
  if (!submission) return null;
  return submission.completedAt ?? submission.agreedAt ?? null;
}

/** Latest submission is at or after the coach's redo request. */
export function isOnboardingSubmissionSatisfied(
  submission: DatedSubmission,
  redoRequestedAt: Date | null | undefined,
): boolean {
  const date = submissionDate(submission);
  if (!date) return false;
  if (!redoRequestedAt) return true;
  return date >= redoRequestedAt;
}

export function isOnboardingRedoPending(
  submission: DatedSubmission,
  redoRequestedAt: Date | null | undefined,
): boolean {
  const date = submissionDate(submission);
  return Boolean(submission && redoRequestedAt && date && date < redoRequestedAt);
}
