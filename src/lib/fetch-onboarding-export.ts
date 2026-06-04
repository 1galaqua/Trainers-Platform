import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
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

export async function fetchTraineeOnboardingExportData(
  coachId: string,
  traineeId: string,
): Promise<OnboardingExportData | null> {
  const ownsTrainee = await isCoachOwnerOfTrainee(coachId, traineeId);
  if (!ownsTrainee) return null;

  try {
    const [trainee, questionnaire, agreement, template] = await Promise.all([
      prisma.user.findUnique({
        where: { id: traineeId },
        select: { displayName: true, email: true },
      }),
      prisma.questionnaireResponse.findUnique({ where: { traineeId } }),
      prisma.agreement.findUnique({ where: { traineeId } }),
      ensureCoachTemplate(coachId),
    ]);

    if (!trainee || !questionnaire || !agreement) return null;

    const answers =
      questionnaire.answers && typeof questionnaire.answers === "object"
        ? (questionnaire.answers as Record<string, unknown>)
        : null;

    const agreementRecord = agreement as {
      agreementTextSnapshot?: string | null;
      signatureUrl: string;
      agreedAt: Date;
    };

    return {
      traineeName: trainee.displayName ?? "מתאמן",
      traineeEmail: trainee.email,
      questionnaireCompletedAt: questionnaire.completedAt.toISOString(),
      agreementSignedAt: agreement.agreedAt.toISOString(),
      signatureUrl: agreement.signatureUrl,
      agreementText: agreementRecord.agreementTextSnapshot ?? template.agreementText,
      fields: template.questionnaireFields,
      answers,
      legacy: {
        age: questionnaire.age,
        heightCm: questionnaire.heightCm,
        weightKg: questionnaire.weightKg,
        goal: questionnaire.goal,
        experience: questionnaire.experience,
        injuries: questionnaire.injuries,
        sessionsPerWeek: questionnaire.sessionsPerWeek,
        equipment: questionnaire.equipment,
      },
    };
  } catch {
    return null;
  }
}
