import { unstable_cache } from "next/cache";

import { serializeCoachingDateForClient } from "@/lib/coaching-period-dates";
import { traineeDetailTag } from "@/lib/cache-tags";
import { loadProgressExerciseCharts, type ProgressExerciseChartItem } from "@/lib/progress-exercises-load";
import { workoutSessionLogInclude } from "@/lib/workout-session-display";
import { prisma } from "@/lib/prisma";

export async function loadTraineeHomeData(traineeId: string) {
  const [sessions, progressExercises] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { traineeId },
      include: {
        program: true,
        logs: {
          include: workoutSessionLogInclude,
        },
      },
      orderBy: { completedAt: "desc" },
    }),
    loadProgressExerciseCharts({ traineeId }),
  ]);

  return { sessions, progressExercises };
}

export type TraineeHomeData = Awaited<ReturnType<typeof loadTraineeHomeData>>;

export async function getCachedTraineeHomeData(traineeId: string): Promise<TraineeHomeData> {
  return unstable_cache(
    async () => loadTraineeHomeData(traineeId),
    ["trainee-home", traineeId],
    { tags: [traineeDetailTag(traineeId)] },
  )();
}

export type TraineeCoachingPeriodData = {
  coachingStartDate: string | null;
  coachingEndDate: string | null;
  workoutQuota: number | null;
  workoutsCompleted: number | null;
  loggedSessionsCount: number;
};

type TraineeDetailWorkoutPayload = {
  coachLink: {
    questionnaireRedoRequestedAt: string | null;
    agreementRedoRequestedAt: string | null;
  };
  coachingPeriod: TraineeCoachingPeriodData;
  sessions: TraineeHomeData["sessions"];
  progressExercises: ProgressExerciseChartItem[];
};

async function loadTraineeDetailWorkoutPayload(
  coachId: string,
  traineeId: string,
): Promise<TraineeDetailWorkoutPayload | null> {
  const link = await prisma.coachTrainee.findFirst({
    where: { coachId, traineeId },
    select: {
      coachingStartDate: true,
      coachingEndDate: true,
      workoutQuota: true,
      workoutsCompleted: true,
      questionnaireRedoRequestedAt: true,
      agreementRedoRequestedAt: true,
    },
  });

  if (!link) return null;

  const [sessions, progressExercises, loggedSessionsCount] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { traineeId, program: { coachId } },
      include: {
        program: true,
        logs: {
          include: workoutSessionLogInclude,
        },
      },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
    loadProgressExerciseCharts({ traineeId, coachId }),
    prisma.workoutSession.count({
      where: { traineeId, program: { coachId } },
    }),
  ]);

  return {
    coachLink: {
      questionnaireRedoRequestedAt: link.questionnaireRedoRequestedAt?.toISOString() ?? null,
      agreementRedoRequestedAt: link.agreementRedoRequestedAt?.toISOString() ?? null,
    },
    coachingPeriod: {
      coachingStartDate: serializeCoachingDateForClient(link.coachingStartDate),
      coachingEndDate: serializeCoachingDateForClient(link.coachingEndDate),
      workoutQuota: link.workoutQuota,
      workoutsCompleted: link.workoutsCompleted,
      loggedSessionsCount,
    },
    sessions,
    progressExercises,
  };
}

export async function loadTraineeDetailCoreData(
  coachId: string,
  traineeId: string,
) {
  const [trainee, workoutData] = await Promise.all([
    prisma.user.findUnique({
      where: { id: traineeId },
      include: { questionnaireResponse: true, agreement: true },
    }),
    getCachedTraineeDetailWorkoutData(coachId, traineeId),
  ]);

  if (!trainee || trainee.role !== "TRAINEE" || !workoutData) {
    return null;
  }

  return {
    trainee,
    coachLink: {
      questionnaireRedoRequestedAt: workoutData.coachLink.questionnaireRedoRequestedAt
        ? new Date(workoutData.coachLink.questionnaireRedoRequestedAt)
        : null,
      agreementRedoRequestedAt: workoutData.coachLink.agreementRedoRequestedAt
        ? new Date(workoutData.coachLink.agreementRedoRequestedAt)
        : null,
    },
    coachingPeriod: workoutData.coachingPeriod,
    sessions: workoutData.sessions,
    progressExercises: workoutData.progressExercises,
  };
}

export type TraineeDetailCoreData = NonNullable<Awaited<ReturnType<typeof loadTraineeDetailCoreData>>>;

async function getCachedTraineeDetailWorkoutData(
  coachId: string,
  traineeId: string,
): Promise<TraineeDetailWorkoutPayload | null> {
  return unstable_cache(
    async () => loadTraineeDetailWorkoutPayload(coachId, traineeId),
    ["trainee-detail-workouts", coachId, traineeId],
    { tags: [traineeDetailTag(traineeId)] },
  )();
}

export async function getCachedTraineeDetailCoreData(
  coachId: string,
  traineeId: string,
): Promise<TraineeDetailCoreData | null> {
  return loadTraineeDetailCoreData(coachId, traineeId);
}

export async function getCachedTraineeDetailSessions(coachId: string, traineeId: string) {
  const data = await getCachedTraineeDetailWorkoutData(coachId, traineeId);
  return data?.sessions ?? [];
}
