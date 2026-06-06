"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { UserRole } from "@/lib/prisma-client";

import { isClerkConfigured } from "@/config/clerk";
import { dbActionErrorMessage, isDbConnectionError } from "@/lib/db-errors";
import { linkTraineeToCoach } from "@/lib/coach-trainee";
import { findUserByEmail, verifyUserPassword } from "@/lib/local-auth";
import { validatePassword } from "@/lib/password";
import {
  resetPasswordByIdentity,
  resetPasswordInputFromFormData,
} from "@/lib/reset-password";
import {
  getDatabaseUrl,
  getServerConfigIssue,
  serverConfigErrorMessage,
} from "@/lib/server-env";
import { normalizePhone, parseAge, validatePhone } from "@/lib/user-identity";
import { createUserSession, clearSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function registerAction(formData: FormData) {
  if (isClerkConfigured()) {
    return { error: "ההרשמה מתבצעת דרך Clerk" };
  }

  const configIssue = getServerConfigIssue();
  if (configIssue === "missing_session_secret") {
    return { error: serverConfigErrorMessage(configIssue) };
  }
  if (configIssue === "missing_database_url") {
    return { error: serverConfigErrorMessage(configIssue) };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const phoneRaw = String(formData.get("phoneNumber") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const role = String(formData.get("role") ?? "TRAINEE") as UserRole;
  const coachId = String(formData.get("coachId") ?? "").trim();

  if (!email || !password || !displayName || !phoneRaw || !ageRaw) {
    return { error: "יש למלא את כל השדות" };
  }

  const phoneError = validatePhone(phoneRaw);
  if (phoneError) return { error: phoneError };

  const age = parseAge(ageRaw);
  if (age == null) return { error: "גיל לא תקין (1–120)" };

  const phoneNumber = normalizePhone(phoneRaw);

  if (role === "TRAINEE" && !coachId) {
    return { error: "יש לבחור מאמן/ית" };
  }

  if (role === "COACH" && coachId) {
    return { error: "מאמן/ית לא צריך לבחור מאמן בהרשמה" };
  }

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  if (role !== "COACH" && role !== "TRAINEE") {
    return { error: "תפקיד לא תקין" };
  }

  try {
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return { error: "כתובת האימייל כבר רשומה במערכת" };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        clerkId: `local_${crypto.randomUUID()}`,
        email,
        passwordHash,
        displayName,
        phoneNumber,
        age,
        role,
      },
    });

    if (role === "TRAINEE") {
      try {
        await linkTraineeToCoach(user.id, coachId);
      } catch (linkError) {
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
        if (linkError instanceof Error && linkError.message === "COACH_NOT_FOUND") {
          return { error: "המאמן שנבחר לא נמצא" };
        }
        return { error: "שגיאה בשיוך למאמן" };
      }
    }

    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isDbConnectionError(error)) {
      return {
        error: "מסד הנתונים לא זמין. בדוק/י את חיבור MongoDB Atlas.",
      };
    }
    return { error: "שגיאה ביצירת החשבון" };
  }
}

export async function loginAction(formData: FormData) {
  if (isClerkConfigured()) {
    return { error: "ההתחברות מתבצעת דרך Clerk" };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    return { error: "יש להזין אימייל וסיסמה" };
  }

  const configIssue = getServerConfigIssue();
  if (configIssue === "missing_session_secret") {
    return { error: serverConfigErrorMessage(configIssue) };
  }

  if (!getDatabaseUrl()) {
    return { error: serverConfigErrorMessage("missing_database_url") };
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return { error: "אימייל או סיסמה שגויים" };
    }

    const valid = await verifyUserPassword(user, password);
    if (!valid) {
      return { error: "אימייל או סיסמה שגויים" };
    }

    await createUserSession({
      userId: user.id,
      clerkId: user.clerkId,
      email: user.email ?? email,
      displayName: user.displayName ?? "",
      role: user.role,
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("loginAction error:", error);

    if (error instanceof Error && error.message.includes("SESSION_SECRET")) {
      return { error: serverConfigErrorMessage("missing_session_secret") };
    }

    if (isDbConnectionError(error)) {
      return {
        error:
          "לא ניתן להתחבר ל-MongoDB Atlas. Network Access → Allow Access from Anywhere (0.0.0.0/0).",
      };
    }

    return { error: "שגיאה בהתחברות" };
  }
}

export async function forgotPasswordAction(formData: FormData) {
  if (isClerkConfigured()) {
    return { error: "איפוס סיסמה מתבצע דרך Clerk" };
  }

  const configIssue = getServerConfigIssue();
  if (configIssue === "missing_database_url") {
    return { error: serverConfigErrorMessage(configIssue) };
  }

  try {
    return await resetPasswordByIdentity(resetPasswordInputFromFormData(formData));
  } catch (error) {
    console.error("forgotPasswordAction:", error);
    return { error: dbActionErrorMessage(error) };
  }
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/");
  redirect("/sign-in");
}
