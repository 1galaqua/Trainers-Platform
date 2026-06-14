"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireCoach } from "@/lib/auth";
import { getCoachOnboardingTemplateByCoachId } from "@/lib/coach-onboarding-template";
import { linkTraineeToCoach } from "@/lib/coach-trainee";
import { dbActionErrorMessage, isDbConnectionError } from "@/lib/db-errors";
import {
  legacyFieldsFromAnswers,
  parseQuestionFields,
} from "@/lib/onboarding-template";
import { prisma } from "@/lib/prisma";
import {
  buildInviteUrl,
  DEFAULT_TRAINEE_PASSWORD,
  getInviteExpiryDate,
} from "@/lib/trainee-invite";
import { normalizePhone, parseAge, validatePhone } from "@/lib/user-identity";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type InvitePageData =
  | {
      valid: true;
      token: string;
      coachName: string;
      questionnaireFields: ReturnType<typeof parseQuestionFields>;
      agreementText: string;
    }
  | {
      valid: false;
      reason: "not_found" | "used" | "expired";
    };

export async function getInvitePageData(token: string): Promise<InvitePageData> {
  const invite = await prisma.traineeInvite.findUnique({
    where: { token },
    include: {
      coach: { select: { displayName: true, email: true } },
    },
  });

  if (!invite) {
    return { valid: false, reason: "not_found" };
  }

  if (invite.usedAt) {
    return { valid: false, reason: "used" };
  }

  if (invite.expiresAt < new Date()) {
    return { valid: false, reason: "expired" };
  }

  const template = await getCoachOnboardingTemplateByCoachId(invite.coachId);

  return {
    valid: true,
    token,
    coachName: invite.coach.displayName ?? invite.coach.email ?? "המאמן/ית שלך",
    questionnaireFields: template.questionnaireFields,
    agreementText: template.agreementText,
  };
}

export async function createTraineeInviteAction() {
  const coach = await requireCoach();

  try {
    const token = crypto.randomUUID();
    const invite = await prisma.traineeInvite.create({
      data: {
        token,
        coachId: coach.id,
        expiresAt: getInviteExpiryDate(),
      },
    });

    const url = buildInviteUrl(invite.token);
    const coachName = coach.displayName ?? coach.email ?? "המאמן/ית";
    revalidatePath("/dashboard/trainees");

    return { success: true as const, url, token: invite.token, coachName };
  } catch (error) {
    if (isDbConnectionError(error)) {
      return { error: "מסד הנתונים לא זמין" };
    }
    return { error: dbActionErrorMessage(error) };
  }
}

function parseQuestionnaireAnswers(
  formData: FormData,
  fields: ReturnType<typeof parseQuestionFields>,
) {
  const answers: Record<string, string | number | null> = {};

  for (const field of fields) {
    const raw = formData.get(field.key);
    if (field.type === "number") {
      const value = raw === "" || raw == null ? null : Number(raw);
      answers[field.key] = value != null && !Number.isNaN(value) ? value : null;
    } else {
      answers[field.key] = raw == null ? null : String(raw).trim() || null;
    }

    if (field.required && (answers[field.key] == null || answers[field.key] === "")) {
      return { error: `יש למלא את השדה: ${field.label}` };
    }
  }

  return { answers, legacy: legacyFieldsFromAnswers(answers) };
}

export async function completeTraineeInviteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    return { error: "קישור ההזמנה לא תקף" };
  }

  const invite = await prisma.traineeInvite.findUnique({
    where: { token },
  });

  if (!invite) {
    return { error: "קישור ההזמנה לא תקף" };
  }

  if (invite.usedAt) {
    return { error: "קישור ההזמנה כבר נוצל" };
  }

  if (invite.expiresAt < new Date()) {
    return { error: "קישור ההזמנה פג תוקף" };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const displayName = String(formData.get("displayName") ?? "").trim();
  const phoneRaw = String(formData.get("phoneNumber") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const agreed = formData.get("agreed") === "on";
  const signatureDataUrl = String(formData.get("signature") ?? "");

  if (!email || !displayName || !phoneRaw || !ageRaw) {
    return { error: "יש למלא את כל פרטי המשתמש" };
  }

  const phoneError = validatePhone(phoneRaw);
  if (phoneError) return { error: phoneError };

  const age = parseAge(ageRaw);
  if (age == null) return { error: "גיל לא תקין (1–120)" };

  if (!agreed) return { error: "יש לאשר שקראת את ההסכם" };
  if (!signatureDataUrl.startsWith("data:image")) {
    return { error: "יש לחתום דיגיטלית" };
  }

  const template = await getCoachOnboardingTemplateByCoachId(invite.coachId);
  const parsed = parseQuestionnaireAnswers(formData, template.questionnaireFields);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const phoneNumber = normalizePhone(phoneRaw);

  try {
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return { error: "כתובת האימייל כבר רשומה במערכת" };
    }

    const passwordHash = await bcrypt.hash(DEFAULT_TRAINEE_PASSWORD, 10);
    const completedAt = new Date();

    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      null;

    const user = await prisma.user.create({
      data: {
        clerkId: `local_${crypto.randomUUID()}`,
        email,
        passwordHash,
        displayName,
        phoneNumber,
        age,
        role: "TRAINEE",
      },
    });

    await linkTraineeToCoach(user.id, invite.coachId);

    await prisma.questionnaireResponse.create({
      data: {
        traineeId: user.id,
        answers: parsed.answers,
        completedAt,
        ...parsed.legacy,
      },
    });

    await prisma.agreement.create({
      data: {
        traineeId: user.id,
        signatureUrl: signatureDataUrl,
        ipAddress,
        contentVersion: template.updatedAt,
        agreementTextSnapshot: template.agreementText,
        agreedAt: completedAt,
      },
    });

    await prisma.traineeInvite.update({
      where: { id: invite.id },
      data: { usedAt: completedAt },
    });

    revalidatePath("/dashboard/trainees");

    return { success: true as const, email };
  } catch (error) {
    if (isDbConnectionError(error)) {
      return { error: "מסד הנתונים לא זמין" };
    }
    return { error: "שגיאה ביצירת החשבון" };
  }
}
