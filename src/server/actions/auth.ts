"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { UserRole } from "@/lib/prisma-client";

import { isClerkConfigured } from "@/config/clerk";
import { isDbConnectionError } from "@/lib/db-errors";
import { linkTraineeToCoach } from "@/lib/coach-trainee";
import { DEMO_AUTH, resolveLoginUser, verifyPassword } from "@/lib/demo-auth";
import {
  getDatabaseUrl,
  getServerConfigIssue,
  serverConfigErrorMessage,
} from "@/lib/server-env";
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
        "DATABASE_URL לא מוגדר ב-Vercel — לא ניתן ליצור חשבון. השתמש ב-coach@demo.com / demo1234 לדdemo.",
    };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const role = String(formData.get("role") ?? "TRAINEE") as UserRole;
  const coachId = String(formData.get("coachId") ?? "").trim();

  if (!email || !password || !displayName) {
    return { error: "יש למלא את כל השדות" };
  }

  if (role === "TRAINEE" && !coachId) {
    return { error: "יש לבחור מאמן/ית" };
  }

  if (role === "COACH" && coachId) {
    return { error: "מאמן/ית לא צריך לבחור מאמן בהרשמה" };
  }

  if (password.length < 6) {
    return { error: "הסיסמה חייבת להכיל לפחות 6 תווים" };
  }

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

    await createUserSession({
      userId: user.id,
      clerkId: user.clerkId,
      email: user.email ?? email,
      displayName: user.displayName ?? displayName,
      role: user.role,
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isDbConnectionError(error)) {
      return {
        error:
          "מסד הנתונים לא זמין. ב-Atlas: Network Access → Allow Access from Anywhere (0.0.0.0/0) ל-Vercel.",
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

  // No DB on Vercel — demo accounts still work
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
          "לא ניתן להתחבר ל-MongoDB Atlas מ-Vercel. Network Access → Allow Access from Anywhere (0.0.0.0/0).",
      };
    }

    return { error: "שגיאה בהתחברות" };
  }
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/");
  redirect("/sign-in");
}
