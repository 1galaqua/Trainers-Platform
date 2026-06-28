import { auth, currentUser } from "@clerk/nextjs/server";
import type { User, UserRole } from "@/lib/prisma-client";
import { cache } from "react";
import { redirect } from "next/navigation";

import { isClerkConfigured } from "@/config/clerk";
import { prisma } from "@/lib/prisma";
import {
  isAgreementRedoPending,
  isAgreementSatisfied,
  isQuestionnaireRedoPending,
  isQuestionnaireSatisfied,
} from "@/lib/questionnaire-status";
import { getSession, clearSession, refreshUserSession, type SessionData } from "@/lib/session";

export type SessionUser = User;

function userFromSession(session: SessionData): SessionUser {
  return {
    id: session.userId,
    clerkId: session.clerkId,
    displayName: session.displayName || null,
    email: session.email || null,
    passwordHash: null,
    phoneNumber: null,
    age: null,
    role: session.role,
    sessionVersion: session.sessionVersion,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function resolveLocalSessionUser(session: SessionData): Promise<SessionUser | null> {
  try {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return null;

    if ((user.sessionVersion ?? 0) !== session.sessionVersion) {
      await clearSession();
      return null;
    }

    await refreshUserSession({
      userId: user.id,
      clerkId: user.clerkId,
      email: user.email ?? session.email,
      displayName: user.displayName ?? session.displayName,
      role: user.role,
      sessionVersion: user.sessionVersion ?? 0,
    });

    return user;
  } catch {
    if (session.email) return userFromSession(session);
    return null;
  }
}

function clerkProfileChanged(
  existing: Pick<User, "displayName" | "email">,
  displayName: string | null,
  email: string | null,
) {
  return (
    (displayName != null && existing.displayName !== displayName) ||
    (email != null && existing.email !== email)
  );
}

async function resolveClerkSessionUser(clerkUserId: string): Promise<SessionUser | null> {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;
  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    email;

  try {
    const existing = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!existing) {
      return prisma.user.create({
        data: {
          clerkId: clerkUserId,
          displayName,
          email,
          role: "TRAINEE",
        },
      });
    }

    if (!clerkProfileChanged(existing, displayName, email)) {
      return existing;
    }

    return prisma.user.update({
      where: { id: existing.id },
      data: { displayName, email },
    });
  } catch {
    return null;
  }
}

async function getCurrentUserUncached(): Promise<SessionUser | null> {
  if (isClerkConfigured()) {
    const { userId } = await auth();
    if (!userId) return null;
    return resolveClerkSessionUser(userId);
  }

  const session = await getSession();
  if (!session) return null;

  return resolveLocalSessionUser(session);
}

export const getCurrentUser = cache(getCurrentUserUncached);

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

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole("ADMIN");
}

export async function requireTrainee(): Promise<SessionUser> {
  return requireRole("TRAINEE");
}

async function getTraineeOnboardingStatusUncached(traineeId: string) {
  try {
    const [questionnaire, agreement, coachLink] = await Promise.all([
      prisma.questionnaireResponse.findUnique({ where: { traineeId } }),
      prisma.agreement.findUnique({ where: { traineeId } }),
      prisma.coachTrainee.findUnique({
        where: { traineeId },
        select: {
          questionnaireRedoRequestedAt: true,
          agreementRedoRequestedAt: true,
        },
      }),
    ]);

    const questionnaireRedoRequestedAt = coachLink?.questionnaireRedoRequestedAt ?? null;
    const agreementRedoRequestedAt = coachLink?.agreementRedoRequestedAt ?? null;
    const questionnaireComplete = isQuestionnaireSatisfied(
      questionnaire,
      questionnaireRedoRequestedAt,
    );
    const agreementComplete = isAgreementSatisfied(agreement, agreementRedoRequestedAt);
    const questionnaireRedoPending = isQuestionnaireRedoPending(
      questionnaire,
      questionnaireRedoRequestedAt,
    );
    const agreementRedoPending = isAgreementRedoPending(
      agreement,
      agreementRedoRequestedAt,
    );

    return {
      questionnaireComplete,
      agreementComplete,
      isComplete: questionnaireComplete && agreementComplete,
      questionnaireRedoPending,
      agreementRedoPending,
    };
  } catch {
    return {
      questionnaireComplete: false,
      agreementComplete: false,
      isComplete: false,
      questionnaireRedoPending: false,
      agreementRedoPending: false,
    };
  }
}

export const getTraineeOnboardingStatus = cache(getTraineeOnboardingStatusUncached);

export async function requireTraineeOnboarded(): Promise<SessionUser> {
  const user = await requireTrainee();
  const status = await getTraineeOnboardingStatus(user.id);

  if (!status.questionnaireComplete) redirect("/dashboard/onboarding/questionnaire");
  if (!status.agreementComplete) redirect("/dashboard/onboarding/agreement");

  return user;
}
