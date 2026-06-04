"use server";

import { revalidatePath } from "next/cache";

import { requireCoach } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { prisma } from "@/lib/prisma";
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
  questionnaire: {
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
        questionnaire: q
          ? {
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
