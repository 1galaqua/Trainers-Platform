"use server";

import { revalidatePath } from "next/cache";

import { requireCoach } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { prisma } from "@/lib/prisma";
import {
  CURRENT_ONBOARDING_VERSION_ID,
  mapAgreementToVersion,
  mapQuestionnaireToVersion,
  type OnboardingAgreementVersion,
  type OnboardingQuestionnaireVersion,
} from "@/lib/onboarding-versions";
import { DEFAULT_AGREEMENT_TEXT } from "@/lib/onboarding-template";
import {
  isAgreementRedoPending,
  isQuestionnaireRedoPending,
} from "@/lib/questionnaire-status";
import { getEffectiveWorkoutsCompleted, getTraineeStatus, getWorkoutsRemaining } from "@/lib/trainee-status";

export type CoachTraineeListItem = {
  id: string;
  displayName: string | null;
  email: string | null;
  activePrograms: { id: string; name: string }[];
  sessionsCount: number;
  loggedSessionsCount: number;
  workoutsCompleted: number | null;
  workoutQuota: number | null;
  workoutsRemaining: number;
  status: "active" | "inactive";
  coachingStartDate: string | null;
  coachingEndDate: string | null;
  hasSignedAgreement: boolean;
  questionnaireRedoPending: boolean;
  agreementRedoPending: boolean;
  questionnaire: {
    answers: Record<string, string | number | null> | null;
    age: number | null;
    heightCm: number | null;
    weightKg: number | null;
    goal: string | null;
    experience: string | null;
    injuries: string | null;
    sessionsPerWeek: number | null;
    equipment: string | null;
    completedAt: string;
  } | null;
};

export async function getCoachTraineeListAction(): Promise<CoachTraineeListItem[]> {
  const coach = await requireCoach();

  try {
    const links = await prisma.coachTrainee.findMany({
      where: { coachId: coach.id },
      include: {
        trainee: {
          include: {
            programsAsTrainee: {
              where: { coachId: coach.id, isActive: true },
              orderBy: { updatedAt: "desc" },
              select: { id: true, name: true },
            },
            questionnaireResponse: true,
            agreement: { select: { id: true, agreedAt: true } },
            workoutSessions: {
              where: { program: { coachId: coach.id } },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return links.map((link) => {
      const t = link.trainee;
      const q = t.questionnaireResponse;
      const loggedSessionsCount = t.workoutSessions.length;
      const sessionsCount = getEffectiveWorkoutsCompleted(
        link.workoutsCompleted,
        loggedSessionsCount,
      );
      const workoutsRemaining = getWorkoutsRemaining(link.workoutQuota, sessionsCount);
      const status = getTraineeStatus({
        coachingStartDate: link.coachingStartDate,
        coachingEndDate: link.coachingEndDate,
        workoutQuota: link.workoutQuota,
        sessionsCount,
      });

      return {
        id: t.id,
        displayName: t.displayName,
        email: t.email,
        activePrograms: t.programsAsTrainee.map((p) => ({ id: p.id, name: p.name })),
        sessionsCount,
        loggedSessionsCount,
        workoutsCompleted: link.workoutsCompleted,
        workoutQuota: link.workoutQuota,
        workoutsRemaining,
        status,
        coachingStartDate: link.coachingStartDate?.toISOString() ?? null,
        coachingEndDate: link.coachingEndDate?.toISOString() ?? null,
        hasSignedAgreement: Boolean(t.agreement),
        questionnaireRedoPending: isQuestionnaireRedoPending(
          q,
          link.questionnaireRedoRequestedAt,
        ),
        agreementRedoPending: isAgreementRedoPending(
          t.agreement,
          link.agreementRedoRequestedAt,
        ),
        questionnaire: q
          ? {
              answers:
                q.answers && typeof q.answers === "object" && !Array.isArray(q.answers)
                  ? (q.answers as Record<string, string | number | null>)
                  : null,
              age: q.age,
              heightCm: q.heightCm,
              weightKg: q.weightKg,
              goal: q.goal,
              experience: q.experience,
              injuries: q.injuries,
              sessionsPerWeek: q.sessionsPerWeek,
              equipment: q.equipment,
              completedAt: q.completedAt.toISOString(),
            }
          : null,
      };
    });
  } catch {
    return [];
  }
}

export async function updateCoachingPeriodAction(formData: FormData) {
  const coach = await requireCoach();

  const traineeId = String(formData.get("traineeId") ?? "");
  const startRaw = String(formData.get("coachingStartDate") ?? "").trim();
  const endRaw = String(formData.get("coachingEndDate") ?? "").trim();
  const quotaRaw = String(formData.get("workoutQuota") ?? "").trim();
  const completedRaw = String(formData.get("workoutsCompleted") ?? "").trim();

  if (!traineeId) return { error: "מתאמן לא נמצא" };

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return { error: "אין הרשאה לעדכן מתאמן זה" };

  if (!startRaw || !endRaw) {
    return { error: "יש להזין תאריך התחלה ותאריך סיום" };
  }

  if (!quotaRaw) {
    return { error: "יש להזין מכסת אימונים" };
  }

  if (!completedRaw && completedRaw !== "0") {
    return { error: "יש להזין מספר אימונים שבוצעו" };
  }

  const workoutQuota = Number.parseInt(quotaRaw, 10);
  if (Number.isNaN(workoutQuota) || workoutQuota < 1) {
    return { error: "מכסת אימונים חייבת להיות מספר חיובי" };
  }

  const workoutsCompleted = Number.parseInt(completedRaw, 10);
  if (Number.isNaN(workoutsCompleted) || workoutsCompleted < 0) {
    return { error: "מספר אימונים שבוצעו חייב להיות 0 או יותר" };
  }

  if (workoutsCompleted > workoutQuota) {
    return { error: "אימונים שבוצעו לא יכולים לעלות על המכסה" };
  }

  const coachingStartDate = new Date(startRaw);
  const coachingEndDate = new Date(endRaw);

  if (Number.isNaN(coachingStartDate.getTime()) || Number.isNaN(coachingEndDate.getTime())) {
    return { error: "תאריכים לא תקינים" };
  }

  if (coachingEndDate < coachingStartDate) {
    return { error: "תאריך הסיום חייב להיות אחרי תאריך ההתחלה" };
  }

  try {
    await prisma.coachTrainee.update({
      where: { coachId_traineeId: { coachId: coach.id, traineeId } },
      data: { coachingStartDate, coachingEndDate, workoutQuota, workoutsCompleted },
    });

    revalidatePath("/dashboard/trainees");
    revalidatePath(`/dashboard/trainees/${traineeId}`);
    return { success: true };
  } catch {
    return { error: "שגיאה בשמירת תקופת הליווי" };
  }
}

export async function getTraineeCoachingPeriodAction(traineeId: string) {
  const coach = await requireCoach();

  try {
    const link = await prisma.coachTrainee.findFirst({
      where: { coachId: coach.id, traineeId },
    });
    if (!link) return null;

    const loggedSessionsCount = await prisma.workoutSession.count({
      where: { traineeId, program: { coachId: coach.id } },
    });

    return {
      coachingStartDate: link.coachingStartDate?.toISOString() ?? null,
      coachingEndDate: link.coachingEndDate?.toISOString() ?? null,
      workoutQuota: link.workoutQuota,
      workoutsCompleted: link.workoutsCompleted,
      loggedSessionsCount,
    };
  } catch {
    return null;
  }
}

export async function requestQuestionnaireRedoAction(traineeId: string) {
  const coach = await requireCoach();

  if (!traineeId) return { error: "מתאמן לא נמצא" };

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return { error: "אין הרשאה" };

  try {
    const questionnaire = await prisma.questionnaireResponse.findUnique({
      where: { traineeId },
    });
    if (!questionnaire) {
      return { error: "המתאמן עדיין לא מילא שאלון" };
    }

    const link = await prisma.coachTrainee.findFirst({
      where: { coachId: coach.id, traineeId },
      select: { questionnaireRedoRequestedAt: true },
    });
    if (
      link &&
      isQuestionnaireRedoPending(questionnaire, link.questionnaireRedoRequestedAt)
    ) {
      return { error: "כבר נשלחה בקשה למילוי שאלון מחדש" };
    }

    await prisma.coachTrainee.update({
      where: { coachId_traineeId: { coachId: coach.id, traineeId } },
      data: { questionnaireRedoRequestedAt: new Date() },
    });

    revalidatePath("/dashboard/trainees");
    revalidatePath(`/dashboard/trainees/${traineeId}`);
    return { success: true };
  } catch {
    return { error: "שגיאה בשליחת הבקשה" };
  }
}

export async function requestAgreementRedoAction(traineeId: string) {
  const coach = await requireCoach();

  if (!traineeId) return { error: "מתאמן לא נמצא" };

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return { error: "אין הרשאה" };

  try {
    const agreement = await prisma.agreement.findUnique({
      where: { traineeId },
    });
    if (!agreement) {
      return { error: "המתאמן עדיין לא חתם על ההסכם" };
    }

    const link = await prisma.coachTrainee.findFirst({
      where: { coachId: coach.id, traineeId },
      select: { agreementRedoRequestedAt: true },
    });
    if (link && isAgreementRedoPending(agreement, link.agreementRedoRequestedAt)) {
      return { error: "כבר נשלחה בקשה למילוי הסכם מחדש" };
    }

    await prisma.coachTrainee.update({
      where: { coachId_traineeId: { coachId: coach.id, traineeId } },
      data: { agreementRedoRequestedAt: new Date() },
    });

    revalidatePath("/dashboard/trainees");
    revalidatePath(`/dashboard/trainees/${traineeId}`);
    return { success: true };
  } catch {
    return { error: "שגיאה בשליחת הבקשה" };
  }
}

export type TraineeOnboardingVersions = {
  questionnaires: OnboardingQuestionnaireVersion[];
  agreements: OnboardingAgreementVersion[];
};

export async function getTraineeOnboardingVersionsAction(
  traineeId: string,
): Promise<TraineeOnboardingVersions | null> {
  const coach = await requireCoach();

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return null;

  try {
    const [currentQ, historyQ, currentA, historyA, template] = await Promise.all([
      prisma.questionnaireResponse.findUnique({ where: { traineeId } }),
      prisma.questionnaireSubmission.findMany({
        where: { traineeId },
        orderBy: { completedAt: "desc" },
      }),
      prisma.agreement.findUnique({ where: { traineeId } }),
      prisma.agreementSubmission.findMany({
        where: { traineeId },
        orderBy: { agreedAt: "desc" },
      }),
      prisma.coachOnboardingTemplate.findUnique({
        where: { coachId: coach.id },
        select: { agreementText: true },
      }),
    ]);

    const agreementFallback = template?.agreementText ?? DEFAULT_AGREEMENT_TEXT;

    const questionnaires: OnboardingQuestionnaireVersion[] = [
      ...(currentQ
        ? [
            mapQuestionnaireToVersion(currentQ, {
              id: CURRENT_ONBOARDING_VERSION_ID,
              isCurrent: true,
            }),
          ]
        : []),
      ...historyQ.map((row) =>
        mapQuestionnaireToVersion(row, { id: row.id, isCurrent: false }),
      ),
    ].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );

    const agreements: OnboardingAgreementVersion[] = [
      ...(currentA
        ? [
            mapAgreementToVersion(currentA, agreementFallback, {
              id: CURRENT_ONBOARDING_VERSION_ID,
              isCurrent: true,
            }),
          ]
        : []),
      ...historyA.map((row) =>
        mapAgreementToVersion(row, agreementFallback, { id: row.id, isCurrent: false }),
      ),
    ].sort((a, b) => new Date(b.agreedAt).getTime() - new Date(a.agreedAt).getTime());

    return { questionnaires, agreements };
  } catch {
    return null;
  }
}
