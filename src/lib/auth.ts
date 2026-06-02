import { auth, currentUser } from "@clerk/nextjs/server";
import type { User, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { isClerkConfigured } from "@/config/clerk";
import { prisma } from "@/lib/prisma";
import { getSession, type SessionData } from "@/lib/session";

export type SessionUser = User;

function userFromSession(session: SessionData): SessionUser {
  return {
    id: session.userId,
    clerkId: session.clerkId,
    displayName: session.displayName || null,
    email: session.email || null,
    passwordHash: null,
    role: session.role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (isClerkConfigured()) {
    const { userId } = await auth();
    if (!userId) return null;

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;
    const displayName =
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
      clerkUser?.username ||
      email;

    try {
      return await prisma.user.upsert({
        where: { clerkId: userId },
        create: {
          clerkId: userId,
          displayName,
          email,
          role: "TRAINEE",
        },
        update: {
          displayName,
          email,
        },
      });
    } catch {
      return null;
    }
  }

  const session = await getSession();
  if (!session) return null;

  if (session.isOfflineDemo) {
    return userFromSession(session);
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (user) return user;
  } catch {
    // DB unavailable — fall back to session if we have profile data
    if (session.email) return userFromSession(session);
  }

  return null;
}

export async function isOfflineDemoSession(): Promise<boolean> {
  const session = await getSession();
  return Boolean(session?.isOfflineDemo);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireRole(role: UserRole): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) redirect("/dashboard");
  return user;
}

export async function requireCoach(): Promise<SessionUser> {
  return requireRole("COACH");
}

export async function requireTrainee(): Promise<SessionUser> {
  return requireRole("TRAINEE");
}

export async function getTraineeOnboardingStatus(traineeId: string) {
  if (await isOfflineDemoSession()) {
    return { questionnaireComplete: true, agreementComplete: true, isComplete: true };
  }

  try {
    const [questionnaire, agreement] = await Promise.all([
      prisma.questionnaireResponse.findUnique({ where: { traineeId } }),
      prisma.agreement.findUnique({ where: { traineeId } }),
    ]);
    return {
      questionnaireComplete: Boolean(questionnaire),
      agreementComplete: Boolean(agreement),
      isComplete: Boolean(questionnaire && agreement),
    };
  } catch {
    return { questionnaireComplete: false, agreementComplete: false, isComplete: false };
  }
}

export async function requireTraineeOnboarded(): Promise<SessionUser> {
  const user = await requireTrainee();
  const status = await getTraineeOnboardingStatus(user.id);

  if (!status.questionnaireComplete) redirect("/dashboard/onboarding/questionnaire");
  if (!status.agreementComplete) redirect("/dashboard/onboarding/agreement");

  return user;
}
