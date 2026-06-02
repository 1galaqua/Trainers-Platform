"use server";

import { revalidatePath } from "next/cache";

import { requireTrainee, requireTraineeOnboarded } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ExerciseLogInput = {
  exerciseId: string;
  weightKg?: number;
  repsCompleted?: number;
  notes?: string;
};

export async function getActiveProgramAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    return await prisma.trainingProgram.findFirst({
      where: { traineeId: trainee.id, isActive: true },
      include: {
        exercises: { orderBy: { sortOrder: "asc" } },
        coach: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return null;
  }
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

    revalidatePath("/dashboard/workouts/log");
    revalidatePath("/dashboard/progress");
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
  try {
    return await prisma.workoutSession.findMany({
      where: { traineeId },
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
