"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { getTraineeOnboardingStatus, requireTrainee } from "@/lib/auth";
import { revalidatePrograms } from "@/lib/revalidate-tags";
import {
  archiveAgreementIfExists,
  archiveQuestionnaireIfExists,
} from "@/lib/onboarding-archive";
import { getTraineeCoachId } from "@/lib/coach-trainee";
import {
  legacyFieldsFromAnswers,
  parseQuestionFields,
} from "@/lib/onboarding-template";
import { prisma } from "@/lib/prisma";

async function getCoachTemplateForTrainee(traineeId: string) {
  const coachId = await getTraineeCoachId(traineeId);
  if (!coachId) return null;

  const template = await prisma.coachOnboardingTemplate.findUnique({
    where: { coachId },
  });
  if (!template) return null;

  return {
    fields: parseQuestionFields(template.questionnaireFields),
    agreementText: template.agreementText,
    version: template.updatedAt.toISOString(),
  };
}

export async function submitQuestionnaireAction(formData: FormData) {
  const trainee = await requireTrainee();
  const template = await getCoachTemplateForTrainee(trainee.id);

  const fields = template?.fields ?? parseQuestionFields(null);
  const answers: Record<string, string | number | null> = {};

  for (const field of fields) {
    const raw = formData.get(field.key);
    if (field.type === "number") {
      const value = raw === "" || raw == null ? null : Number(raw);
      answers[field.key] = value != null && !Number.isNaN(value) ? value : null;
    } else {
      answers[field.key] = raw == null ? null : String(raw).trim() || null;
    }

    if (answers[field.key] == null || answers[field.key] === "") {
      return { error: `יש למלא את השדה: ${field.label}` };
    }
  }

  const legacy = legacyFieldsFromAnswers(answers);

  try {
    const completedAt = new Date();

    await archiveQuestionnaireIfExists(trainee.id);

    await prisma.questionnaireResponse.upsert({
      where: { traineeId: trainee.id },
      create: {
        traineeId: trainee.id,
        answers,
        completedAt,
        ...legacy,
      },
      update: {
        answers,
        ...legacy,
        completedAt,
      },
    });

    const coachId = await getTraineeCoachId(trainee.id);
    if (coachId) {
      await prisma.coachTrainee.updateMany({
        where: { coachId, traineeId: trainee.id },
        data: { questionnaireRedoRequestedAt: null },
      });
    }

    const status = await getTraineeOnboardingStatus(trainee.id);
    const redirectTo = status.agreementComplete
      ? "/dashboard/my-program"
      : "/dashboard/onboarding/agreement";

    revalidatePrograms(trainee.id);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/onboarding");
    revalidatePath("/dashboard/trainees");
    return { success: true, redirectTo };
  } catch {
    return { error: "שגיאה בשמירת השאלון" };
  }
}

export async function submitAgreementAction(formData: FormData) {
  const trainee = await requireTrainee();
  const template = await getCoachTemplateForTrainee(trainee.id);

  const agreed = formData.get("agreed") === "on";
  const signatureDataUrl = String(formData.get("signature") ?? "");

  if (!agreed) return { error: "יש לאשר שקראת את ההסכם" };
  if (!signatureDataUrl.startsWith("data:image")) {
    return { error: "יש לחתום דיגיטלית" };
  }

  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    null;

  const agreementText = template?.agreementText ?? "";
  const contentVersion = template?.version ?? "1.0";

  try {
    const agreedAt = new Date();

    await archiveAgreementIfExists(trainee.id);

    await prisma.agreement.upsert({
      where: { traineeId: trainee.id },
      create: {
        traineeId: trainee.id,
        signatureUrl: signatureDataUrl,
        ipAddress,
        contentVersion,
        agreementTextSnapshot: agreementText,
        agreedAt,
      },
      update: {
        signatureUrl: signatureDataUrl,
        ipAddress,
        agreedAt,
        contentVersion,
        agreementTextSnapshot: agreementText,
      },
    });

    const coachId = await getTraineeCoachId(trainee.id);
    if (coachId) {
      await prisma.coachTrainee.updateMany({
        where: { coachId, traineeId: trainee.id },
        data: { agreementRedoRequestedAt: null },
      });
    }

    revalidatePrograms(trainee.id);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/onboarding");
    revalidatePath("/dashboard/trainees");
    return { success: true };
  } catch {
    return { error: "שגיאה בשמירת החתימה" };
  }
}
