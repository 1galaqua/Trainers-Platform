"use server";

import { revalidatePath } from "next/cache";

import { requireCoach } from "@/lib/auth";
import {
  getCachedCoachDashboardChartData,
} from "@/lib/coach-dashboard-load";
import type { CoachDashboardChartData } from "@/lib/coach-dashboard-stats";
import { revalidateCoachTrainees } from "@/lib/revalidate-tags";
import { prisma } from "@/lib/prisma";

export type { CoachDashboardChartData } from "@/lib/coach-dashboard-stats";

export async function getCoachDashboardChartAction(): Promise<CoachDashboardChartData> {
  const coach = await requireCoach();
  return getCachedCoachDashboardChartData(coach.id);
}

export async function deleteTraineeAction(traineeId: string) {
  const coach = await requireCoach();

  if (!traineeId) {
    return { error: "מתאמן לא נמצא" };
  }

  try {
    const link = await prisma.coachTrainee.findFirst({
      where: { coachId: coach.id, traineeId },
      select: { traineeId: true },
    });

    if (!link) {
      return { error: "מתאמן לא נמצא" };
    }

    const programs = await prisma.trainingProgram.findMany({
      where: { coachId: coach.id, traineeId },
      select: { id: true },
    });

    for (const program of programs) {
      const [sessions, exercises] = await Promise.all([
        prisma.workoutSession.findMany({
          where: { programId: program.id },
          select: { id: true },
        }),
        prisma.programExercise.findMany({
          where: { programId: program.id },
          select: { id: true },
        }),
      ]);

      const sessionIds = sessions.map((session) => session.id);
      const exerciseIds = exercises.map((exercise) => exercise.id);
      const logOrConditions = [];

      if (sessionIds.length > 0) logOrConditions.push({ sessionId: { in: sessionIds } });
      if (exerciseIds.length > 0) logOrConditions.push({ exerciseId: { in: exerciseIds } });

      const exerciseLogs =
        logOrConditions.length > 0
          ? await prisma.exerciseLog.findMany({
              where: { OR: logOrConditions },
              select: { id: true },
            })
          : [];

      const exerciseLogIds = exerciseLogs.map((log) => log.id);

      if (exerciseLogIds.length > 0) {
        await prisma.exerciseSetLog.deleteMany({
          where: { exerciseLogId: { in: exerciseLogIds } },
        });
        await prisma.exerciseLog.deleteMany({
          where: { id: { in: exerciseLogIds } },
        });
      }

      if (sessionIds.length > 0) {
        await prisma.workoutSession.deleteMany({ where: { id: { in: sessionIds } } });
      }

      if (exerciseIds.length > 0) {
        await prisma.programExercise.deleteMany({ where: { id: { in: exerciseIds } } });
      }

      await prisma.trainingProgram.delete({ where: { id: program.id } });
    }

    await prisma.progressPhoto.deleteMany({ where: { traineeId } });
    await prisma.questionnaireSubmission.deleteMany({ where: { traineeId } });
    await prisma.agreementSubmission.deleteMany({ where: { traineeId } });
    await prisma.questionnaireResponse.deleteMany({ where: { traineeId } });
    await prisma.agreement.deleteMany({ where: { traineeId } });
    await prisma.coachTrainee.deleteMany({ where: { coachId: coach.id, traineeId } });
    await prisma.user.deleteMany({ where: { id: traineeId, role: "TRAINEE" } });

    revalidateCoachTrainees(coach.id);
    revalidatePath("/dashboard/trainees");
    revalidatePath("/dashboard/workouts");
    revalidatePath("/dashboard/progress");

    return { success: true as const };
  } catch {
    return { error: "שגיאה במחיקת המתאמן" };
  }
}
