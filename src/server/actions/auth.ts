"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { User, UserRole } from "@/lib/prisma-client";

import { isClerkConfigured } from "@/config/clerk";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/auth-email";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { isDbConnectionError } from "@/lib/db-errors";
import { linkTraineeToCoach } from "@/lib/coach-trainee";
import { DEMO_AUTH, resolveLoginUser, verifyPassword } from "@/lib/demo-auth";
import { validatePassword } from "@/lib/password";
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

function isEmailVerified(user: Pick<User, "emailVerifiedAt">) {
  return Boolean(user.emailVerifiedAt);
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

async function startEmailVerification(userId: string, email: string) {
  const sent = await sendVerificationEmail(userId, email);
  if (!sent.ok) {
    return { error: sent.error };
  }
  return {
    success: true as const,
    needsVerification: true as const,
    devPreviewUrl: sent.dev ? sent.previewUrl : undefined,
  };
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

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  if (role !== "COACH" && role !== "TRAINEE") {
    return { error: "תפקיד לא תקין" };
  }

  try {
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      if (!isEmailVerified(existing)) {
        return startEmailVerification(existing.id, email);
      }
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

    return startEmailVerification(user.id, email);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isDbConnectionError(error)) {
      return {
        error:
          "מסד הנתונים לא זמין. בדוק/י את חיבור MongoDB Atlas.",
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

    if (!isEmailVerified(user) && !isDemoCredentials(email, password)) {
      const resent = await sendVerificationEmail(user.id, email);
      return {
        error: "יש לאמת את כתובת האימייל לפני ההתחברות. נשלח אליך מייל אימות מחדש.",
        needsVerification: true,
        devPreviewUrl: resent.ok && resent.dev ? resent.previewUrl : undefined,
      };
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

export async function verifyEmailAction(token: string) {
  if (!token?.trim()) {
    return { error: "קישור אימות לא תקין" };
  }

  try {
    const user = await consumeAuthToken(token.trim(), "EMAIL_VERIFICATION");
    if (!user) {
      return { error: "קישור האימות פג תוקף או אינו תקין" };
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    await createUserSession({
      userId: updated.id,
      clerkId: updated.clerkId,
      email: updated.email ?? "",
      displayName: updated.displayName ?? "",
      role: updated.role,
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "שגיאה באימות האימייל" };
  }
}

export async function resendVerificationAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) return { error: "יש להזין אימייל" };

  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return {
        success: true,
        message: "אם החשבון קיים, נשלח מייל אימות.",
      };
    }
    if (isEmailVerified(user)) {
      return { error: "האימייל כבר אומת. ניתן להתחבר." };
    }

    return startEmailVerification(user.id, email);
  } catch {
    return { error: "שגיאה בשליחת מייל האימות" };
  }
}

export async function forgotPasswordAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) return { error: "יש להזין אימייל" };

  const genericSuccess = {
    success: true as const,
    message: "אם קיים חשבון עם אימייל זה, נשלח קישור לאיפוס סיסמה.",
  };

  try {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true, email: true, passwordHash: true, emailVerifiedAt: true },
    });

    if (!user?.passwordHash || !user.email) {
      return genericSuccess;
    }

    const sent = await sendPasswordResetEmail(user.id, user.email);
    if (!sent.ok) {
      return { error: sent.error };
    }

    return {
      ...genericSuccess,
      devPreviewUrl: sent.dev ? sent.previewUrl : undefined,
    };
  } catch {
    return { error: "שגיאה בשליחת מייל איפוס הסיסמה" };
  }
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "קישור איפוס לא תקין" };
  if (!password) return { error: "יש להזין סיסמה" };
  if (password !== confirm) return { error: "הסיסמאות אינן תואמות" };

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  try {
    const user = await consumeAuthToken(token, "PASSWORD_RESET");
    if (!user) {
      return { error: "קישור האיפוס פג תוקף או אינו תקין" };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { success: true };
  } catch {
    return { error: "שגיאה בעדכון הסיסמה" };
  }
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/");
  redirect("/sign-in");
}
