"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { UserRole } from "@/lib/prisma-client";

import { isClerkConfigured } from "@/config/clerk";
import { dbActionErrorMessage, isDbConnectionError } from "@/lib/db-errors";
import { linkTraineeToCoach } from "@/lib/coach-trainee";
import { DEMO_AUTH, resolveLoginUser, verifyPassword } from "@/lib/demo-auth";
import { validatePassword } from "@/lib/password";
import {
  getDatabaseUrl,
  getServerConfigIssue,
  serverConfigErrorMessage,
} from "@/lib/server-env";
import { normalizePhone, parseAge, validatePhone, phonesMatch, agesMatch } from "@/lib/user-identity";
import { createUserSession, clearSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function loginDemoOffline(email: string, password: string) {
  const demo = DEMO_AUTH[email];
  if (!demo || password !== demo.password) return null;

  await createUserSession({
    userId: demo.clerkId,
    clerkId: demo.clerkId,
    email,
    displayName: demo.displayName,
    role: demo.role,
    isOfflineDemo: true,
  });
  return { success: true as const, offline: true as const };
}

function isDemoCredentials(email: string, password: string) {
  const demo = DEMO_AUTH[email];
  return Boolean(demo && password === demo.password);
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
    return {
      error:
        "DATABASE_URL לא מוגדר — לא ניתן ליצור חשבון. ניתן להשתמש בחשבונות הדמו.",
    };
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

  if (!getDatabaseUrl() && isDemoCredentials(email, password)) {
    try {
      const offline = await loginDemoOffline(email, password);
      if (offline) {
        revalidatePath("/dashboard");
        return offline;
      }
    } catch (error) {
      if (isRedirectError(error)) throw error;
      return { error: serverConfigErrorMessage("missing_session_secret") };
    }
  }

  if (!getDatabaseUrl()) {
    return { error: serverConfigErrorMessage("missing_database_url") };
  }

  try {
    const user = await resolveLoginUser(email);
    if (!user) {
      return { error: "אימייל או סיסמה שגויים" };
    }

    const valid = await verifyPassword(user, password, email);
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

    if (isDbConnectionError(error) && isDemoCredentials(email, password)) {
      try {
        const offline = await loginDemoOffline(email, password);
        if (offline) {
          revalidatePath("/dashboard");
          return offline;
        }
      } catch (sessionError) {
        if (isRedirectError(sessionError)) throw sessionError;
      }
      return {
        error:
          "Atlas חוסם את Vercel. ב-Network Access הוסף 0.0.0.0/0, ואז הרץ npm run db:seed מהמחשב.",
      };
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

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const phoneRaw = String(formData.get("phoneNumber") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!email || !phoneRaw || !ageRaw) {
    return { error: "יש למלא אימייל, גיל ומספר טלפון" };
  }
  if (!password) return { error: "יש להזין סיסמה חדשה" };
  if (password !== confirm) return { error: "הסיסמאות אינן תואמות" };

  const phoneError = validatePhone(phoneRaw);
  if (phoneError) return { error: phoneError };

  const age = parseAge(ageRaw);
  if (age == null) return { error: "גיל לא תקין (1–120)" };

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  const phoneNumber = normalizePhone(phoneRaw);

  try {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true, phoneNumber: true, age: true, passwordHash: true },
    });

    if (
      !user?.passwordHash ||
      !agesMatch(user.age, age) ||
      !phonesMatch(user.phoneNumber, phoneNumber)
    ) {
      return { error: "הפרטים לא תואמים לחשבון. בדוק/י אימייל, גיל וטלפון." };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { success: true };
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
