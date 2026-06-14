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

export type LogWorkoutActionResult = { success: true } | { error: string };

type PersistWorkoutOptions = {
  coachId?: string;
  forCoach?: boolean;
};

async function persistWorkoutSession(
  traineeId: string,
  programId: string,
  sessionNotes: string | null,
  logs: ExerciseLogInput[],
  options: PersistWorkoutOptions = {},
): Promise<LogWorkoutActionResult> {
  const programWhere = options.coachId
    ? { id: programId, traineeId, coachId: options.coachId }
    : { id: programId, traineeId };

  const program = await prisma.trainingProgram.findFirst({ where: programWhere });
  if (!program) return { error: "אין הרשאה לתוכנית זו" };

  const coachLink = await prisma.coachTrainee.findUnique({
    where: { traineeId },
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
    return {
      error: options.forCoach
        ? "תקופת הליווי של המתאמן הסתיימה או טרם החלה — לא ניתן לדווח אימון"
        : "תקופת הליווי הסתיימה או טרם החלה — לא ניתן לדווח אימון",
    };
  }

  if (remaining <= 0) {
    return {
      error: options.forCoach
        ? "מכסת האימונים של המתאמן הסתיימה"
        : "מכסת האימונים שלך הסתיימה — פנה למאמן/ית",
    };
  }

  await prisma.workoutSession.create({
    data: {
      programId,
      traineeId,
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
      where: { traineeId },
      data: { workoutsCompleted: coachLink.workoutsCompleted + 1 },
    });
  }

  return { success: true };
}

type ParsedWorkoutLogFormData =
  | { error: string }
  | { programId: string; sessionNotes: string | null; logs: ExerciseLogInput[] };

function parseWorkoutLogFormData(formData: FormData): ParsedWorkoutLogFormData {
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

  return { programId, sessionNotes, logs };
}

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

export type LastWorkoutLogPrefill = {
  sessionNotes: string | null;
  exerciseLogs: Record<
    string,
    {
      weightKg: number | null;
      repsCompleted: number | null;
      notes: string | null;
    }
  >;
};

export async function getLastWorkoutLogPrefillAction(
  programId: string,
  traineeIdForCoach?: string,
): Promise<LastWorkoutLogPrefill | null> {
  if (!programId) return null;

  try {
    let resolvedTraineeId: string;
    let programWhere: { id: string; traineeId: string; coachId?: string };

    if (traineeIdForCoach) {
      const coach = await requireCoach();
      const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeIdForCoach);
      if (!ownsTrainee) return null;

      resolvedTraineeId = traineeIdForCoach;
      programWhere = { id: programId, traineeId: traineeIdForCoach, coachId: coach.id };
    } else {
      const trainee = await requireTraineeOnboarded();
      resolvedTraineeId = trainee.id;
      programWhere = { id: programId, traineeId: trainee.id };
    }

    const program = await prisma.trainingProgram.findFirst({ where: programWhere });
    if (!program) return null;

    const lastSession = await prisma.workoutSession.findFirst({
      where: { programId, traineeId: resolvedTraineeId },
      orderBy: { completedAt: "desc" },
      include: { logs: true },
    });

    if (!lastSession) return null;

    const exerciseLogs: LastWorkoutLogPrefill["exerciseLogs"] = {};
    for (const log of lastSession.logs) {
      exerciseLogs[log.exerciseId] = {
        weightKg: log.weightKg,
        repsCompleted: log.repsCompleted,
        notes: log.notes,
      };
    }

    return {
      sessionNotes: lastSession.notes,
      exerciseLogs,
    };
  } catch {
    return null;
  }
}

export async function getActiveProgramAction() {
  const programs = await getTraineeProgramsAction();
  return programs[0] ?? null;
}

export async function logWorkoutAction(formData: FormData): Promise<LogWorkoutActionResult> {
  const trainee = await requireTraineeOnboarded();
  const parsed = parseWorkoutLogFormData(formData);
  if ("error" in parsed) return parsed;

  try {
    const result = await persistWorkoutSession(
      trainee.id,
      parsed.programId,
      parsed.sessionNotes,
      parsed.logs,
    );
    if ("error" in result) return result;

    revalidatePath("/dashboard/workouts/log");
    revalidatePath("/dashboard/progress");
    revalidatePath("/dashboard/my-program");
    revalidatePath("/dashboard/trainees");
    return { success: true };
  } catch {
    return { error: "שגיאה בשמירת האימון" };
  }
}

export async function getCoachTraineeProgramsAction(traineeId: string) {
  const coach = await requireCoach();

  try {
    const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
    if (!ownsTrainee) return [];

    return await prisma.trainingProgram.findMany({
      where: { traineeId, coachId: coach.id, isActive: true },
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

export async function logCoachTraineeWorkoutAction(
  formData: FormData,
): Promise<LogWorkoutActionResult> {
  const coach = await requireCoach();
  const traineeId = String(formData.get("traineeId") ?? "");
  if (!traineeId) return { error: "מתאמן לא נמצא" };

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return { error: "אין הרשאה למתאמן זה" };

  const parsed = parseWorkoutLogFormData(formData);
  if ("error" in parsed) return parsed;

  try {
    const result = await persistWorkoutSession(
      traineeId,
      parsed.programId,
      parsed.sessionNotes,
      parsed.logs,
      { coachId: coach.id, forCoach: true },
    );
    if ("error" in result) return result;

    revalidatePath(`/dashboard/trainees/${traineeId}`);
    revalidatePath(`/dashboard/trainees/${traineeId}/log`);
    revalidatePath("/dashboard/trainees");
    revalidatePath("/dashboard/progress");
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
