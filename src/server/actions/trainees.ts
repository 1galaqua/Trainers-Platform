"use server";

import { revalidatePath } from "next/cache";

import { requireCoach } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { prisma } from "@/lib/prisma";
import { getTraineeStatus, getWorkoutsRemaining } from "@/lib/trainee-status";

export type CoachTraineeListItem = {
  id: string;
  displayName: string | null;
  email: string | null;
  activeProgramName: string | null;
  sessionsCount: number;
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
              take: 1,
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
      const sessionsCount = t.workoutSessions.length;
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
        activeProgramName: t.programsAsTrainee[0]?.name ?? null,
        sessionsCount,
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

  if (!traineeId) return { error: "מתאמן לא נמצא" };

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return { error: "אין הרשאה לעדכן מתאמן זה" };

  if (!startRaw || !endRaw) {
    return { error: "יש להזין תאריך התחלה ותאריך סיום" };
  }

  if (!quotaRaw) {
    return { error: "יש להזין מכסת אימונים" };
  }

  const workoutQuota = Number.parseInt(quotaRaw, 10);
  if (Number.isNaN(workoutQuota) || workoutQuota < 1) {
    return { error: "מכסת אימונים חייבת להיות מספר חיובי" };
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
      data: { coachingStartDate, coachingEndDate, workoutQuota },
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

    return {
      coachingStartDate: link.coachingStartDate?.toISOString() ?? null,
      coachingEndDate: link.coachingEndDate?.toISOString() ?? null,
      workoutQuota: link.workoutQuota,
    };
  } catch {
    return null;
  }
}
