"use server";

import { revalidatePath } from "next/cache";

import { requireCoach, requireTrainee, requireTraineeOnboarded } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { computeExerciseLogMetrics } from "@/lib/workout-log-metrics";
import { prisma } from "@/lib/prisma";
import { getEffectiveWorkoutsCompleted, getWorkoutsRemaining, isCoachingPeriodActive } from "@/lib/trainee-status";

export type ExerciseSetLogInput = {
  setNumber: number;
  weightKg?: number;
  repsCompleted?: number;
};

export type ExerciseLogInput = {
  exerciseId: string;
  notes?: string;
  sets?: ExerciseSetLogInput[];
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
        create: logs
          .filter((log) => {
            const hasFilledSet = (log.sets ?? []).some(
              (set) => set.weightKg != null || set.repsCompleted != null,
            );
            const hasNotes = Boolean(log.notes?.trim());
            return hasFilledSet || hasNotes;
          })
          .map((log) => ({
            exerciseId: log.exerciseId,
            notes: log.notes?.trim() || null,
            weightKg: null,
            repsCompleted: null,
            setLogs: {
              create: (log.sets ?? [])
                .filter((set) => set.weightKg != null || set.repsCompleted != null)
                .map((set) => ({
                  setNumber: set.setNumber,
                  weightKg: set.weightKg ?? null,
                  repsCompleted: set.repsCompleted ?? null,
                })),
            },
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

export type ExerciseLogPrefill = {
  notes: string | null;
  sets: Array<{
    setNumber: number;
    weightKg: number | null;
    repsCompleted: number | null;
  }>;
};

export type LastWorkoutLogPrefill = {
  sessionNotes: string | null;
  exerciseLogs: Record<string, ExerciseLogPrefill>;
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
      include: {
        logs: {
          include: {
            setLogs: { orderBy: { setNumber: "asc" } },
          },
        },
      },
    });

    if (!lastSession) return null;

    const exerciseLogs: LastWorkoutLogPrefill["exerciseLogs"] = {};
    for (const log of lastSession.logs) {
      if (log.setLogs.length > 0) {
        exerciseLogs[log.exerciseId] = {
          notes: log.notes,
          sets: log.setLogs.map((set) => ({
            setNumber: set.setNumber,
            weightKg: set.weightKg,
            repsCompleted: set.repsCompleted,
          })),
        };
        continue;
      }

      exerciseLogs[log.exerciseId] = {
        notes: log.notes,
        sets:
          log.weightKg != null || log.repsCompleted != null
            ? [
                {
                  setNumber: 1,
                  weightKg: log.weightKg,
                  repsCompleted: log.repsCompleted,
                },
              ]
            : [],
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
        logs: {
          include: {
            exercise: true,
            setLogs: { orderBy: { setNumber: "asc" } },
          },
        },
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
        setLogs: { orderBy: { setNumber: "asc" } },
      },
      orderBy: { session: { completedAt: "asc" } },
    });

    return logs.map((log) => {
      const metrics = computeExerciseLogMetrics({
        weightKg: log.weightKg,
        repsCompleted: log.repsCompleted,
        setLogs: log.setLogs,
        defaultReps: log.exercise.reps,
        plannedSets: log.exercise.sets,
      });

      return {
        date: log.session.completedAt.toISOString(),
        weight: metrics.averageWeight,
        reps: log.repsCompleted ?? log.exercise.reps,
        sets: log.exercise.sets,
        volume: metrics.volume,
      };
    });
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
        logs: {
          include: {
            exercise: true,
            setLogs: { orderBy: { setNumber: "asc" } },
          },
        },
      },
      orderBy: { completedAt: "desc" },
      take: 20,
    });
  } catch {
    return [];
  }
}

export async function deleteWorkoutSessionAction(sessionId: string) {
  const coach = await requireCoach();

  if (!sessionId) {
    return { error: "דיווח אימון לא נמצא" };
  }

  try {
    const session = await prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        program: { coachId: coach.id },
      },
      select: { id: true, traineeId: true, programId: true },
    });

    if (!session) {
      return { error: "דיווח אימון לא נמצא" };
    }

    const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, session.traineeId);
    if (!ownsTrainee) {
      return { error: "אין הרשאה למחיקת דיווח זה" };
    }

    const exerciseLogs = await prisma.exerciseLog.findMany({
      where: { sessionId },
      select: { id: true },
    });
    const exerciseLogIds = exerciseLogs.map((log) => log.id);

    if (exerciseLogIds.length > 0) {
      await prisma.exerciseSetLog.deleteMany({
        where: { exerciseLogId: { in: exerciseLogIds } },
      });
      await prisma.exerciseLog.deleteMany({
        where: { id: { in: exerciseLogIds } },
      });
    }

    await prisma.workoutSession.delete({
      where: { id: sessionId },
    });

    const coachLink = await prisma.coachTrainee.findUnique({
      where: { traineeId: session.traineeId },
      select: { workoutsCompleted: true },
    });

    if (coachLink?.workoutsCompleted != null && coachLink.workoutsCompleted > 0) {
      await prisma.coachTrainee.update({
        where: { traineeId: session.traineeId },
        data: { workoutsCompleted: coachLink.workoutsCompleted - 1 },
      });
    }

    revalidatePath("/dashboard/workouts");
    revalidatePath(`/dashboard/workouts/${session.programId}`);
    revalidatePath(`/dashboard/trainees/${session.traineeId}`);
    revalidatePath("/dashboard/trainees");
    revalidatePath("/dashboard/progress");
    revalidatePath("/dashboard");

    return { success: true as const };
  } catch {
    return { error: "שגיאה במחיקת דיווח האימון" };
  }
}
