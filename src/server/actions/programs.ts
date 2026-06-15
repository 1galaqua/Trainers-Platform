"use server";

import { revalidatePath } from "next/cache";
import type { ProgramType } from "@/lib/prisma-client";

import { requireCoach } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { prisma } from "@/lib/prisma";

export type ExerciseInput = {
  id?: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  coachNotes?: string;
  youtubeUrl?: string;
  instructions?: string;
};

export async function createTrainingProgramAction(formData: FormData) {
  const coach = await requireCoach();

  const traineeId = String(formData.get("traineeId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "CUSTOM") as ProgramType;
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!traineeId || !name) {
    return { error: "יש לבחור מתאמן ולהזין שם לתוכנית" };
  }

  const exercisesJson = String(formData.get("exercises") ?? "[]");
  let exercises: ExerciseInput[] = [];
  try {
    exercises = JSON.parse(exercisesJson) as ExerciseInput[];
  } catch {
    return { error: "נתוני תרגילים לא תקינים" };
  }

  if (exercises.length === 0) {
    return { error: "יש להוסיף לפחות תרגיל אחד" };
  }

  try {
    const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
    if (!ownsTrainee) {
      return { error: "ניתן לשייך תוכנית רק למתאמנים שלך" };
    }

    const program = await prisma.trainingProgram.create({
      data: {
        coachId: coach.id,
        traineeId,
        name,
        type,
        description,
        exercises: {
          create: exercises.map((ex, index) => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
            coachNotes: ex.coachNotes || null,
            youtubeUrl: ex.youtubeUrl || null,
            instructions: ex.instructions || null,
            sortOrder: index,
          })),
        },
      },
    });

    revalidatePath("/dashboard/workouts");
    revalidatePath("/dashboard/trainees");
    revalidatePath("/dashboard/my-program");
    return { success: true, programId: program.id };
  } catch {
    return { error: "שגיאה ביצירת התוכנית" };
  }
}

export async function updateTrainingProgramAction(formData: FormData) {
  const coach = await requireCoach();

  const programId = String(formData.get("programId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "CUSTOM") as ProgramType;
  const description = String(formData.get("description") ?? "").trim() || null;
  const isActiveRaw = String(formData.get("isActive") ?? "true");
  const isActive = isActiveRaw !== "false";

  if (!programId || !name) {
    return { error: "תוכנית לא נמצאה או חסר שם" };
  }

  const exercisesJson = String(formData.get("exercises") ?? "[]");
  let exercises: ExerciseInput[] = [];
  try {
    exercises = JSON.parse(exercisesJson) as ExerciseInput[];
  } catch {
    return { error: "נתוני תרגילים לא תקינים" };
  }

  if (exercises.length === 0) {
    return { error: "יש להוסיף לפחות תרגיל אחד" };
  }

  try {
    const program = await prisma.trainingProgram.findFirst({
      where: { id: programId, coachId: coach.id },
      include: {
        exercises: { include: { _count: { select: { logs: true } } } },
      },
    });

    if (!program) return { error: "תוכנית לא נמצאה" };

    await prisma.trainingProgram.update({
      where: { id: programId },
      data: { name, type, description, isActive },
    });

    const submittedIds = new Set(
      exercises.map((ex) => ex.id).filter((id): id is string => Boolean(id)),
    );

    for (const existing of program.exercises) {
      if (submittedIds.has(existing.id)) continue;
      if (existing._count.logs > 0) {
        return {
          error: `לא ניתן להסיר את התרגיל "${existing.name}" — קיימים דיווחי אימון`,
        };
      }
      await prisma.programExercise.delete({ where: { id: existing.id } });
    }

    for (const [index, ex] of exercises.entries()) {
      const payload = {
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        restSeconds: ex.restSeconds,
        coachNotes: ex.coachNotes || null,
        youtubeUrl: ex.youtubeUrl || null,
        instructions: ex.instructions || null,
        sortOrder: index,
      };

      if (ex.id) {
        const belongs = program.exercises.some((e) => e.id === ex.id);
        if (!belongs) continue;
        await prisma.programExercise.update({
          where: { id: ex.id },
          data: payload,
        });
      } else {
        await prisma.programExercise.create({
          data: { programId, ...payload },
        });
      }
    }

    revalidatePath("/dashboard/workouts");
    revalidatePath(`/dashboard/workouts/${programId}`);
    revalidatePath(`/dashboard/workouts/${programId}/edit`);
    revalidatePath("/dashboard/trainees");
    revalidatePath("/dashboard/my-program");
    return { success: true, programId };
  } catch {
    return { error: "שגיאה בעדכון התוכנית" };
  }
}

export async function getCoachTraineesAction() {
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
              include: { _count: { select: { sessions: true } } },
            },
            questionnaireResponse: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return links.map((l) => l.trainee);
  } catch {
    return [];
  }
}

export async function getCoachProgramsAction() {
  const coach = await requireCoach();

  try {
    return await prisma.trainingProgram.findMany({
      where: { coachId: coach.id },
      include: {
        trainee: true,
        _count: { select: { exercises: true, sessions: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getProgramByIdAction(programId: string) {
  const coach = await requireCoach();

  try {
    return await prisma.trainingProgram.findFirst({
      where: { id: programId, coachId: coach.id },
      include: {
        trainee: true,
        coach: true,
        exercises: { orderBy: { sortOrder: "asc" } },
        sessions: {
          orderBy: { completedAt: "desc" },
          include: {
            logs: {
              include: {
                exercise: true,
                setLogs: { orderBy: { setNumber: "asc" } },
              },
            },
          },
          take: 10,
        },
      },
    });
  } catch {
    return null;
  }
}
