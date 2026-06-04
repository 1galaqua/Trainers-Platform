import {
  isOnboardingRedoPending,
  isOnboardingSubmissionSatisfied,
} from "@/lib/onboarding-redo-status";

export function isQuestionnaireSatisfied(
  questionnaire: { completedAt: Date } | null | undefined,
  redoRequestedAt: Date | null | undefined,
): boolean {
  return isOnboardingSubmissionSatisfied(questionnaire, redoRequestedAt);
}

export function isQuestionnaireRedoPending(
  questionnaire: { completedAt: Date } | null | undefined,
  redoRequestedAt: Date | null | undefined,
): boolean {
  return isOnboardingRedoPending(questionnaire, redoRequestedAt);
}

export function isAgreementSatisfied(
  agreement: { agreedAt: Date } | null | undefined,
  redoRequestedAt: Date | null | undefined,
): boolean {
  return isOnboardingSubmissionSatisfied(agreement, redoRequestedAt);
}

export function isAgreementRedoPending(
  agreement: { agreedAt: Date } | null | undefined,
  redoRequestedAt: Date | null | undefined,
): boolean {
  return isOnboardingRedoPending(agreement, redoRequestedAt);
}
