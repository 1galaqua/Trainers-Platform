"use server";

import { revalidatePath } from "next/cache";

import { requireCoach, requireTrainee, requireTraineeOnboarded } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { safeRevalidatePaths } from "@/lib/safe-revalidate";
import { getTraineeQuotaSnapshot, type TraineeQuotaSnapshot } from "@/lib/trainee-quota";
import { computeExerciseLogMetrics } from "@/lib/workout-log-metrics";
import {
  buildWorkoutSessionCreateData,
  getNextWorkoutsCompletedValue,
} from "@/lib/workout-session-create";
import { ensureLegacyProgramSections, programSectionsInclude } from "@/lib/program-sections-persistence";
import { workoutSessionLogInclude } from "@/lib/workout-session-display";
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
  consumeQuota?: boolean;
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

  if (options.coachId && coachLink.coachId !== options.coachId) {
    return { error: "אין הרשאה למתאמן זה" };
  }

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

  if (
    options.consumeQuota &&
    coachLink.workoutQuota != null &&
    remaining <= 0
  ) {
    return {
      error: options.forCoach
        ? "מכסת האימונים של המתאמן הסתיימה"
        : "מכסת האימונים שלך הסתיימה — פנה למאמן/ית",
    };
  }

  try {
    await prisma.workoutSession.create({
      data: buildWorkoutSessionCreateData({
        programId,
        traineeId,
        sessionNotes,
        logs,
        loggedByRole: options.forCoach ? "COACH" : "TRAINEE",
        logKind: options.consumeQuota ? "REPORT" : "SAVE",
      }),
    });

    if (options.consumeQuota && coachLink.workoutQuota != null) {
      const nextCompleted = getNextWorkoutsCompletedValue({
        workoutsCompleted: coachLink.workoutsCompleted,
        completedCount,
      });

      await prisma.coachTrainee.update({
        where: { traineeId },
        data: { workoutsCompleted: nextCompleted },
      });
    }
  } catch (error) {
    console.error("persistWorkoutSession failed", error);
    return { error: "שגיאה בשמירת האימון" };
  }

  return { success: true };
}

type ParsedWorkoutLogFormData =
  | { error: string }
  | {
      programId: string;
      sessionNotes: string | null;
      logs: ExerciseLogInput[];
      consumeQuota: boolean;
    };

function parseWorkoutLogFormData(formData: FormData): ParsedWorkoutLogFormData {
  const programId = String(formData.get("programId") ?? "");
  const sessionNotes = String(formData.get("notes") ?? "").trim() || null;
  const logsJson = String(formData.get("logs") ?? "[]");
  const consumeQuota = String(formData.get("consumeQuota") ?? "false") === "true";

  let logs: ExerciseLogInput[] = [];
  try {
    logs = JSON.parse(logsJson) as ExerciseLogInput[];
  } catch {
    return { error: "נתוני דיווח לא תקינים" };
  }

  if (!programId) return { error: "תוכנית לא נמצאה" };

  return { programId, sessionNotes, logs, consumeQuota };
}

export async function getTraineeProgramsAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    const programs = await prisma.trainingProgram.findMany({
      where: { traineeId: trainee.id, isActive: true },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
    });

    await Promise.all(programs.map((program) => ensureLegacyProgramSections(program.id)));

    return await prisma.trainingProgram.findMany({
      where: { traineeId: trainee.id, isActive: true },
      include: {
        ...programSectionsInclude,
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
    await ensureLegacyProgramSections(programId);

    return await prisma.trainingProgram.findFirst({
      where: { id: programId, traineeId: trainee.id, isActive: true },
      include: {
        ...programSectionsInclude,
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

  const result = await persistWorkoutSession(
    trainee.id,
    parsed.programId,
    parsed.sessionNotes,
    parsed.logs,
    { consumeQuota: parsed.consumeQuota },
  );
  if ("error" in result) return result;

  safeRevalidatePaths([
    "/dashboard",
    "/dashboard/workouts/log",
    "/dashboard/progress",
    "/dashboard/my-program",
    "/dashboard/trainees",
  ]);
  return { success: true };
}

export type { TraineeQuotaSnapshot };

export async function getTraineeLogQuotaAction(): Promise<TraineeQuotaSnapshot | null> {
  const trainee = await requireTraineeOnboarded();

  try {
    const link = await prisma.coachTrainee.findUnique({
      where: { traineeId: trainee.id },
      select: { coachId: true },
    });
    if (!link) return null;
    return getTraineeQuotaSnapshot(trainee.id, link.coachId);
  } catch {
    return null;
  }
}

export async function getCoachTraineeLogQuotaAction(
  traineeId: string,
): Promise<TraineeQuotaSnapshot | null> {
  const coach = await requireCoach();

  try {
    const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
    if (!ownsTrainee) return null;
    return getTraineeQuotaSnapshot(traineeId, coach.id);
  } catch {
    return null;
  }
}

export async function getCoachTraineeProgramsAction(traineeId: string) {
  const coach = await requireCoach();

  try {
    const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
    if (!ownsTrainee) return [];

    const programs = await prisma.trainingProgram.findMany({
      where: { traineeId, coachId: coach.id, isActive: true },
      select: { id: true },
    });
    await Promise.all(programs.map((program) => ensureLegacyProgramSections(program.id)));

    return await prisma.trainingProgram.findMany({
      where: { traineeId, coachId: coach.id, isActive: true },
      include: {
        ...programSectionsInclude,
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

  const result = await persistWorkoutSession(
    traineeId,
    parsed.programId,
    parsed.sessionNotes,
    parsed.logs,
    { coachId: coach.id, forCoach: true, consumeQuota: parsed.consumeQuota },
  );
  if ("error" in result) return result;

  safeRevalidatePaths([
    `/dashboard/trainees/${traineeId}`,
    `/dashboard/trainees/${traineeId}/log`,
    "/dashboard/trainees",
    "/dashboard/progress",
    "/dashboard",
  ]);
  return { success: true };
}

export async function getWorkoutHistoryAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    return await prisma.workoutSession.findMany({
      where: { traineeId: trainee.id },
      include: {
        program: true,
        logs: {
          include: workoutSessionLogInclude,
        },
      },
      orderBy: { completedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getTraineeProgressExercisesAction() {
  const programs = await getTraineeProgramsAction();

  return Promise.all(
    programs.flatMap((program) =>
      program.exercises.map(async (ex) => {
        const data = await getExerciseProgressAction(ex.id);
        const label = programs.length > 1 ? `${ex.name} (${program.name})` : ex.name;

        return {
          id: ex.id,
          name: label,
          data: data.map((d) => ({
            date: d.date,
            weight: d.weight,
            volume: d.volume,
          })),
        };
      }),
    ),
  );
}

export async function getCoachTraineeProgressExercisesAction(traineeId: string) {
  const coach = await requireCoach();
  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return [];

  const programs = await getCoachTraineeProgramsAction(traineeId);

  const results = await Promise.all(
    programs.flatMap((program) =>
      program.exercises.map(async (ex) => {
        const logs = await prisma.exerciseLog.findMany({
          where: {
            exerciseId: ex.id,
            session: { traineeId },
          },
          include: {
            session: true,
            exercise: true,
            setLogs: { orderBy: { setNumber: "asc" } },
          },
          orderBy: { session: { completedAt: "asc" } },
        });

        const data = logs.map((log) => {
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
            volume: metrics.volume,
          };
        });

        const label = programs.length > 1 ? `${ex.name} (${program.name})` : ex.name;

        return {
          id: ex.id,
          name: label,
          data,
        };
      }),
    ),
  );

  return results.filter((item) => item.data.length > 0);
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
          include: workoutSessionLogInclude,
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
