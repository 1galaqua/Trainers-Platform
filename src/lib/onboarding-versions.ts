export const CURRENT_ONBOARDING_VERSION_ID = "current";

export type OnboardingQuestionnaireVersion = {
  id: string;
  completedAt: string;
  isCurrent: boolean;
  answers: Record<string, string | number | null> | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: string | null;
  experience: string | null;
  injuries: string | null;
  sessionsPerWeek: number | null;
  equipment: string | null;
};

export type OnboardingAgreementVersion = {
  id: string;
  agreedAt: string;
  isCurrent: boolean;
  signatureUrl: string;
  agreementText: string;
};

export function formatOnboardingVersionDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function questionnaireVersionLabel(version: OnboardingQuestionnaireVersion, index: number) {
  const date = formatOnboardingVersionDate(version.completedAt);
  if (version.isCurrent) return `שאלון נוכחי (${date})`;
  return `שאלון קודם ${index} (${date})`;
}

export function agreementVersionLabel(version: OnboardingAgreementVersion, index: number) {
  const date = formatOnboardingVersionDate(version.agreedAt);
  if (version.isCurrent) return `הסכם נוכחי (${date})`;
  return `הסכם קודם ${index} (${date})`;
}

function parseAnswers(
  answers: unknown,
): Record<string, string | number | null> | null {
  if (answers && typeof answers === "object" && !Array.isArray(answers)) {
    return answers as Record<string, string | number | null>;
  }
  return null;
}

type QuestionnaireRecord = {
  id?: string;
  answers: unknown;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: string | null;
  experience: string | null;
  injuries: string | null;
  sessionsPerWeek: number | null;
  equipment: string | null;
  completedAt: Date;
};

export function mapQuestionnaireToVersion(
  record: QuestionnaireRecord,
  options: { id: string; isCurrent: boolean },
): OnboardingQuestionnaireVersion {
  return {
    id: options.id,
    isCurrent: options.isCurrent,
    completedAt: record.completedAt.toISOString(),
    answers: parseAnswers(record.answers),
    age: record.age,
    heightCm: record.heightCm,
    weightKg: record.weightKg,
    goal: record.goal,
    experience: record.experience,
    injuries: record.injuries,
    sessionsPerWeek: record.sessionsPerWeek,
    equipment: record.equipment,
  };
}

type AgreementRecord = {
  id?: string;
  agreedAt: Date;
  signatureUrl: string;
  agreementTextSnapshot: string | null;
};

export function mapAgreementToVersion(
  record: AgreementRecord,
  agreementTextFallback: string,
  options: { id: string; isCurrent: boolean },
): OnboardingAgreementVersion {
  return {
    id: options.id,
    isCurrent: options.isCurrent,
    agreedAt: record.agreedAt.toISOString(),
    signatureUrl: record.signatureUrl,
    agreementText: record.agreementTextSnapshot ?? agreementTextFallback,
  };
}
