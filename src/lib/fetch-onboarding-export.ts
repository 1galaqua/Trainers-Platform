import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { CURRENT_ONBOARDING_VERSION_ID } from "@/lib/onboarding-versions";
import {
  DEFAULT_AGREEMENT_TEXT,
  DEFAULT_QUESTIONNAIRE_FIELDS,
  parseQuestionFields,
  type CoachOnboardingTemplateData,
} from "@/lib/onboarding-template";
import type { OnboardingExportData } from "@/lib/onboarding-export-html";
import { prisma } from "@/lib/prisma";

async function ensureCoachTemplate(coachId: string): Promise<CoachOnboardingTemplateData> {
  const existing = await prisma.coachOnboardingTemplate.findUnique({
    where: { coachId },
  });

  if (existing) {
    return {
      questionnaireFields: parseQuestionFields(existing.questionnaireFields),
      agreementText: existing.agreementText,
      updatedAt: existing.updatedAt.toISOString(),
    };
  }

  const created = await prisma.coachOnboardingTemplate.create({
    data: {
      coachId,
      questionnaireFields: DEFAULT_QUESTIONNAIRE_FIELDS,
      agreementText: DEFAULT_AGREEMENT_TEXT,
    },
  });

  return {
    questionnaireFields: parseQuestionFields(created.questionnaireFields),
    agreementText: created.agreementText,
    updatedAt: created.updatedAt.toISOString(),
  };
}

export type OnboardingExportRequest = {
  questionnaireId?: string | null;
  agreementId?: string | null;
  includeQuestionnaire?: boolean;
  includeAgreement?: boolean;
};

export async function fetchTraineeOnboardingExportData(
  coachId: string,
  traineeId: string,
  request: OnboardingExportRequest = {},
): Promise<OnboardingExportData | null> {
  const ownsTrainee = await isCoachOwnerOfTrainee(coachId, traineeId);
  if (!ownsTrainee) return null;

  const includeQuestionnaire = request.includeQuestionnaire !== false;
  const includeAgreement = request.includeAgreement !== false;
  if (!includeQuestionnaire && !includeAgreement) return null;

  const questionnaireId = request.questionnaireId ?? CURRENT_ONBOARDING_VERSION_ID;
  const agreementId = request.agreementId ?? CURRENT_ONBOARDING_VERSION_ID;

  try {
    const [trainee, template] = await Promise.all([
      prisma.user.findUnique({
        where: { id: traineeId },
        select: { displayName: true, email: true },
      }),
      ensureCoachTemplate(coachId),
    ]);

    if (!trainee) return null;

    let questionnaireCompletedAt: string | null = null;
    let answers: Record<string, unknown> | null = null;
    let legacy: OnboardingExportData["legacy"] | null = null;

    if (includeQuestionnaire) {
      const questionnaire =
        questionnaireId === CURRENT_ONBOARDING_VERSION_ID
          ? await prisma.questionnaireResponse.findUnique({ where: { traineeId } })
          : await prisma.questionnaireSubmission.findFirst({
              where: { id: questionnaireId, traineeId },
            });

      if (!questionnaire) return null;

      questionnaireCompletedAt = questionnaire.completedAt.toISOString();
      answers =
        questionnaire.answers && typeof questionnaire.answers === "object"
          ? (questionnaire.answers as Record<string, unknown>)
          : null;
      legacy = {
        age: questionnaire.age,
        heightCm: questionnaire.heightCm,
        weightKg: questionnaire.weightKg,
        goal: questionnaire.goal,
        experience: questionnaire.experience,
        injuries: questionnaire.injuries,
        sessionsPerWeek: questionnaire.sessionsPerWeek,
        equipment: questionnaire.equipment,
      };
    }

    let agreementSignedAt: string | null = null;
    let signatureUrl: string | null = null;
    let agreementText: string | null = null;

    if (includeAgreement) {
      const agreement =
        agreementId === CURRENT_ONBOARDING_VERSION_ID
          ? await prisma.agreement.findUnique({ where: { traineeId } })
          : await prisma.agreementSubmission.findFirst({
              where: { id: agreementId, traineeId },
            });

      if (!agreement) return null;

      agreementSignedAt = agreement.agreedAt.toISOString();
      signatureUrl = agreement.signatureUrl;
      agreementText =
        agreement.agreementTextSnapshot ?? template.agreementText;
    }

    return {
      traineeName: trainee.displayName ?? "מתאמן",
      traineeEmail: trainee.email,
      includeQuestionnaire,
      includeAgreement,
      questionnaireCompletedAt,
      agreementSignedAt,
      signatureUrl,
      agreementText,
      fields: template.questionnaireFields,
      answers,
      legacy,
    };
  } catch {
    return null;
  }
}

/** Resolve export payload from version ids (used by server actions). */
export async function resolveOnboardingExportFromVersions(
  coachId: string,
  traineeId: string,
  questionnaireId: string | null,
  agreementId: string | null,
  includeQuestionnaire: boolean,
  includeAgreement: boolean,
): Promise<OnboardingExportData | null> {
  return fetchTraineeOnboardingExportData(coachId, traineeId, {
    questionnaireId: includeQuestionnaire ? questionnaireId : null,
    agreementId: includeAgreement ? agreementId : null,
    includeQuestionnaire,
    includeAgreement,
  });
}
