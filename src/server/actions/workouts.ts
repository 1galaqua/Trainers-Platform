"use server";

import { revalidatePath } from "next/cache";

import { requireCoach, requireTrainee, requireTraineeOnboarded } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { prisma } from "@/lib/prisma";
import { getEffectiveWorkoutsCompleted, getWorkoutsRemaining, isCoachingPeriodActive } from "@/lib/trainee-status";

export type ExerciseLogInput = {
  exerciseId: string;
  weightKg?: number;
  repsCompleted?: number;
  notes?: string;
};

export async function getTraineeProgramsAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    return await prisma.trainingProgram.findMany({
      where: { traineeId: trainee.id, isActive: true },
      include: {
        exercises: { orderBy: { sortOrder: "asc" } },
        coach: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getTraineeProgramByIdAction(programId: string) {
  const trainee = await requireTraineeOnboarded();

  try {
    return await prisma.trainingProgram.findFirst({
      where: { id: programId, traineeId: trainee.id, isActive: true },
      include: {
        exercises: { orderBy: { sortOrder: "asc" } },
        coach: true,
      },
    });
  } catch {
    return null;
  }
}

export async function getActiveProgramAction() {
  const programs = await getTraineeProgramsAction();
  return programs[0] ?? null;
}

export async function logWorkoutAction(formData: FormData) {
  const trainee = await requireTraineeOnboarded();

  const programId = String(formData.get("programId") ?? "");
  const sessionNotes = String(formData.get("notes") ?? "").trim() || null;
  const logsJson = String(formData.get("logs") ?? "[]");

  let logs: ExerciseLogInput[] = [];
  try {
    logs = JSON.parse(logsJson) as ExerciseLogInput[];
  } catch {
    return { error: "נתוני דיווח לא תקינים" };
  }

  if (!programId) return { error: "תוכנית לא נמצאה" };

  try {
    const program = await prisma.trainingProgram.findFirst({
      where: { id: programId, traineeId: trainee.id },
    });
    if (!program) return { error: "אין הרשאה לתוכנית זו" };

    const coachLink = await prisma.coachTrainee.findUnique({
      where: { traineeId: trainee.id },
      include: {
        trainee: {
          include: {
            workoutSessions: {
              where: { program: { coachId: program.coachId } },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!coachLink) return { error: "לא נמצא קשר מאמן-מתאמן" };

    const loggedSessionsCount = coachLink.trainee.workoutSessions.length;
    const completedCount = getEffectiveWorkoutsCompleted(
      coachLink.workoutsCompleted,
      loggedSessionsCount,
    );
    const remaining = getWorkoutsRemaining(coachLink.workoutQuota, completedCount);

    if (!isCoachingPeriodActive(coachLink.coachingStartDate, coachLink.coachingEndDate)) {
      return { error: "תקופת הליווי הסתיימה או טרם החלה — לא ניתן לדווח אימון" };
    }

    if (remaining <= 0) {
      return { error: "מכסת האימונים שלך הסתיימה — פנה למאמן/ית" };
    }

    await prisma.workoutSession.create({
      data: {
        programId,
        traineeId: trainee.id,
        notes: sessionNotes,
        logs: {
          create: logs.map((log) => ({
            exerciseId: log.exerciseId,
            weightKg: log.weightKg ?? null,
            repsCompleted: log.repsCompleted ?? null,
            notes: log.notes || null,
          })),
        },
      },
    });

    if (coachLink.workoutsCompleted != null) {
      await prisma.coachTrainee.update({
        where: { traineeId: trainee.id },
        data: { workoutsCompleted: coachLink.workoutsCompleted + 1 },
      });
    }

    revalidatePath("/dashboard/workouts/log");
    revalidatePath("/dashboard/progress");
    revalidatePath("/dashboard/my-program");
    revalidatePath("/dashboard/trainees");
    return { success: true };
  } catch {
    return { error: "שגיאה בשמירת האימון" };
  }
}

export async function getWorkoutHistoryAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    return await prisma.workoutSession.findMany({
      where: { traineeId: trainee.id },
      include: {
        program: true,
        logs: { include: { exercise: true } },
      },
      orderBy: { completedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getExerciseProgressAction(exerciseId: string) {
  const trainee = await requireTrainee();

  try {
    const logs = await prisma.exerciseLog.findMany({
      where: {
        exerciseId,
        session: { traineeId: trainee.id },
      },
      include: {
        session: true,
        exercise: true,
      },
      orderBy: { session: { completedAt: "asc" } },
    });

    return logs.map((log) => ({
      date: log.session.completedAt.toISOString(),
      weight: log.weightKg ?? 0,
      reps: log.repsCompleted ?? log.exercise.reps,
      sets: log.exercise.sets,
      volume:
        (log.weightKg ?? 0) * (log.repsCompleted ?? log.exercise.reps) * log.exercise.sets,
    }));
  } catch {
    return [];
  }
}

export async function getCoachTraineeProgressAction(traineeId: string) {
  const coach = await requireCoach();

  try {
    const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
    if (!ownsTrainee) return [];

    return await prisma.workoutSession.findMany({
      where: { traineeId, program: { coachId: coach.id } },
      include: {
        program: true,
        logs: { include: { exercise: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 20,
    });
  } catch {
    return [];
  }
}
