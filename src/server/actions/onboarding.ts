"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireTrainee } from "@/lib/auth";
import { agreementContent } from "@/lib/program-labels";
import { prisma } from "@/lib/prisma";

export async function submitQuestionnaireAction(formData: FormData) {
  const trainee = await requireTrainee();

  const data = {
    age: Number(formData.get("age")) || null,
    heightCm: Number(formData.get("heightCm")) || null,
    weightKg: Number(formData.get("weightKg")) || null,
    goal: String(formData.get("goal") ?? "").trim() || null,
    experience: String(formData.get("experience") ?? "").trim() || null,
    injuries: String(formData.get("injuries") ?? "").trim() || null,
    sessionsPerWeek: Number(formData.get("sessionsPerWeek")) || null,
    equipment: String(formData.get("equipment") ?? "").trim() || null,
  };

  try {
    await prisma.questionnaireResponse.upsert({
      where: { traineeId: trainee.id },
      create: { traineeId: trainee.id, ...data },
      update: data,
    });

    revalidatePath("/dashboard/onboarding");
    return { success: true };
  } catch {
    return { error: "שגיאה בשמירת השאלון" };
  }
}

export async function submitAgreementAction(formData: FormData) {
  const trainee = await requireTrainee();

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

  try {
    await prisma.agreement.upsert({
      where: { traineeId: trainee.id },
      create: {
        traineeId: trainee.id,
        signatureUrl: signatureDataUrl,
        ipAddress,
        contentVersion: "1.0",
      },
      update: {
        signatureUrl: signatureDataUrl,
        ipAddress,
        agreedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "שגיאה בשמירת החתימה" };
  }
}

export async function getAgreementTextAction() {
  return agreementContent;
}
