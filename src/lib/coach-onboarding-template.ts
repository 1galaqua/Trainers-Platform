import {
  DEFAULT_AGREEMENT_TEXT,
  DEFAULT_QUESTIONNAIRE_FIELDS,
  parseQuestionFields,
  type CoachOnboardingTemplateData,
} from "@/lib/onboarding-template";
import { prisma } from "@/lib/prisma";

export async function getCoachOnboardingTemplateByCoachId(
  coachId: string,
): Promise<CoachOnboardingTemplateData> {
  const template = await prisma.coachOnboardingTemplate.findUnique({
    where: { coachId },
  });

  if (template) {
    return {
      questionnaireFields: parseQuestionFields(template.questionnaireFields),
      agreementText: template.agreementText,
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  return {
    questionnaireFields: DEFAULT_QUESTIONNAIRE_FIELDS,
    agreementText: DEFAULT_AGREEMENT_TEXT,
    updatedAt: new Date().toISOString(),
  };
}
