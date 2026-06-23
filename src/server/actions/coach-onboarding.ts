"use server";

import { revalidatePath } from "next/cache";

import { requireCoach, requireTrainee } from "@/lib/auth";
import { getTraineeCoachId } from "@/lib/coach-trainee";
import { fetchTraineeOnboardingExportData } from "@/lib/fetch-onboarding-export";
import {
  DEFAULT_AGREEMENT_TEXT,
  DEFAULT_QUESTIONNAIRE_FIELDS,
  parseQuestionFields,
  type CoachOnboardingTemplateData,
  type QuestionField,
} from "@/lib/onboarding-template";
import { prisma } from "@/lib/prisma";

async function ensureCoachTemplate(coachId: string) {
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

export async function getCoachOnboardingTemplateAction(): Promise<CoachOnboardingTemplateData> {
  const coach = await requireCoach();
  try {
    return await ensureCoachTemplate(coach.id);
  } catch {
    return {
      questionnaireFields: DEFAULT_QUESTIONNAIRE_FIELDS,
      agreementText: DEFAULT_AGREEMENT_TEXT,
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function getTraineeOnboardingTemplateAction(): Promise<CoachOnboardingTemplateData> {
  const trainee = await requireTrainee();
  const coachId = await getTraineeCoachId(trainee.id);

  if (!coachId) {
    return {
      questionnaireFields: DEFAULT_QUESTIONNAIRE_FIELDS,
      agreementText: DEFAULT_AGREEMENT_TEXT,
      updatedAt: new Date().toISOString(),
    };
  }

  return ensureCoachTemplate(coachId);
}

export async function updateCoachOnboardingTemplateAction(formData: FormData) {
  const coach = await requireCoach();

  const fieldsJson = String(formData.get("questionnaireFields") ?? "");
  const agreementText = String(formData.get("agreementText") ?? "").trim();

  if (!agreementText) {
    return { error: "יש להזין טקסט להסכם עם חתימה" };
  }

  let fields: QuestionField[];
  try {
    fields = parseQuestionFields(JSON.parse(fieldsJson));
  } catch {
    return { error: "מבנה השאלון לא תקין" };
  }

  if (fields.length === 0) {
    return { error: "יש להשאיר לפחות שאלה אחת בשאלון" };
  }

  try {
    await prisma.coachOnboardingTemplate.upsert({
      where: { coachId: coach.id },
      create: {
        coachId: coach.id,
        questionnaireFields: fields,
        agreementText,
      },
      update: {
        questionnaireFields: fields,
        agreementText,
      },
    });

    revalidatePath("/dashboard/onboarding-template");
    revalidatePath("/dashboard/onboarding/questionnaire");
    revalidatePath("/dashboard/onboarding/agreement");
    return { success: true };
  } catch {
    return { error: "שגיאה בשמירת התבנית" };
  }
}

export async function getTraineeOnboardingExportAction(traineeId: string) {
  const coach = await requireCoach();
  return fetchTraineeOnboardingExportData(coach.id, traineeId);
}
