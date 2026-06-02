"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { UserRole } from "@prisma/client";

import { isClerkConfigured } from "@/config/clerk";
import { isDbConnectionError } from "@/lib/db-errors";
import { DEMO_AUTH, resolveLoginUser, verifyPassword } from "@/lib/demo-auth";
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

export async function registerAction(formData: FormData) {
  if (isClerkConfigured()) {
    return { error: "ההרשמה מתבצעת דרך Clerk" };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const role = String(formData.get("role") ?? "TRAINEE") as UserRole;

  if (!email || !password || !displayName) {
    return { error: "יש למלא את כל השדות" };
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
          "מסד הנתונים לא זמין — לא ניתן ליצור חשבון חדש. נסה שוב אחרי חיבור Atlas, או התחבר עם coach@demo.com / trainee@demo.com",
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

    if (isDbConnectionError(error)) {
      const offline = await loginDemoOffline(email, password);
      if (offline) {
        revalidatePath("/dashboard");
        return offline;
      }
      return {
        error:
          "מסד הנתונים לא מחובר. לחשבונות דemo השתמש ב-coach@demo.com או trainee@demo.com עם סיסמה demo1234",
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
