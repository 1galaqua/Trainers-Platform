"use server";

import { revalidatePath } from "next/cache";

import { requireCoach, requireTrainee, requireTraineeOnboarded } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { getCachedLogWorkoutPageData, type LogWorkoutPageData } from "@/lib/log-workout-load";
import { loadProgressExerciseCharts } from "@/lib/progress-exercises-load";
import { getCachedTraineePrograms } from "@/lib/programs-load";
import { getCachedTraineeHomeData, getCachedTraineeDetailSessions } from "@/lib/trainee-home-load";
import {
  revalidateCoachTrainees,
  revalidateLogWorkout,
  revalidatePrograms,
  revalidateTraineeDetail,
} from "@/lib/revalidate-tags";
import { getTraineeQuotaSnapshot, type TraineeQuotaSnapshot } from "@/lib/trainee-quota";
import { computeExerciseLogMetrics } from "@/lib/workout-log-metrics";
import {
  buildWorkoutSessionCreateData,
  getNextWorkoutsCompletedValue,
} from "@/lib/workout-session-create";
import {
  applyActiveProgramFilters,
  ensureLegacyProgramSections,
  programSectionsInclude,
} from "@/lib/program-sections-persistence";
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
    select: {
      coachId: true,
      workoutsCompleted: true,
      workoutQuota: true,
      coachingStartDate: true,
      coachingEndDate: true,
      trainee: {
        select: {
          _count: {
            select: {
              workoutSessions: { where: { program: { coachId: program.coachId } } },
            },
          },
        },
      },
    },
  });

  if (!coachLink) return { error: "לא נמצא קשר מאמן-מתאמן" };

  if (options.coachId && coachLink.coachId !== options.coachId) {
    return { error: "אין הרשאה למתאמן זה" };
  }

  const loggedSessionsCount = coachLink.trainee._count.workoutSessions;
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

export type { LogWorkoutPageData };

export async function getLogWorkoutPageDataAction(
  selectedProgramParam?: string,
): Promise<LogWorkoutPageData> {
  const trainee = await requireTraineeOnboarded();

  return getCachedLogWorkoutPageData({
    traineeId: trainee.id,
    selectedProgramParam,
  });
}

export async function getCoachLogWorkoutPageDataAction(
  traineeId: string,
  selectedProgramParam?: string,
): Promise<LogWorkoutPageData> {
  const coach = await requireCoach();

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) {
    return { programSummaries: [], activeProgram: null, quotaInfo: null };
  }

  return getCachedLogWorkoutPageData({
    traineeId,
    coachId: coach.id,
    selectedProgramParam,
  });
}

export async function getTraineeProgramsAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    return await getCachedTraineePrograms({ traineeId: trainee.id });
  } catch {
    return [];
  }
}

export async function getTraineeProgramByIdAction(programId: string) {
  const trainee = await requireTraineeOnboarded();

  try {
    await ensureLegacyProgramSections(programId);

    const program = await prisma.trainingProgram.findFirst({
      where: { id: programId, traineeId: trainee.id, isActive: true },
      include: {
        ...programSectionsInclude,
        coach: true,
      },
    });

    return program ? applyActiveProgramFilters(program) : null;
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

  const coachLink = await prisma.coachTrainee.findUnique({
    where: { traineeId: trainee.id },
    select: { coachId: true },
  });

  revalidateLogWorkout(trainee.id);
  revalidatePrograms(trainee.id);
  revalidateTraineeDetail(trainee.id);
  if (coachLink?.coachId) {
    revalidateCoachTrainees(coachLink.coachId);
  }
  revalidatePath("/dashboard/workouts/log");
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

    return await getCachedTraineePrograms({ traineeId, coachId: coach.id });
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

  revalidateLogWorkout(traineeId);
  revalidatePrograms(traineeId);
  revalidateTraineeDetail(traineeId);
  revalidateCoachTrainees(coach.id);
  revalidatePath(`/dashboard/trainees/${traineeId}/log`);
  return { success: true };
}

export async function getTraineeHomeDataAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    return await getCachedTraineeHomeData(trainee.id);
  } catch {
    return { sessions: [], progressExercises: [] };
  }
}

export async function getWorkoutHistoryAction() {
  const { sessions } = await getTraineeHomeDataAction();
  return sessions;
}

export async function getTraineeProgressExercisesAction() {
  const { progressExercises } = await getTraineeHomeDataAction();
  return progressExercises;
}

export async function getCoachTraineeProgressExercisesAction(traineeId: string) {
  const coach = await requireCoach();
  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return [];

  try {
    return await loadProgressExerciseCharts({ traineeId, coachId: coach.id });
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

    const sessions = await getCachedTraineeDetailSessions(coach.id, traineeId);
    return sessions;
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

    revalidateTraineeDetail(session.traineeId);
    revalidatePrograms(session.traineeId);
    revalidateCoachTrainees(coach.id);
    revalidatePath(`/dashboard/trainees/${session.traineeId}`);
    revalidatePath("/dashboard/workouts");
    revalidatePath(`/dashboard/workouts/${session.programId}`);
    revalidatePath("/dashboard/trainees");
    revalidatePath("/dashboard/progress");

    return { success: true as const };
  } catch {
    return { error: "שגיאה במחיקת דיווח האימון" };
  }
}
