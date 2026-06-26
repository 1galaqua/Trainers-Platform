import { prisma } from "@/lib/prisma";
import {
  getEffectiveWorkoutsCompleted,
  getQuotaBlockMessage,
  getWorkoutsRemaining,
} from "@/lib/trainee-status";

export type TraineeQuotaSnapshot = {
  workoutQuota: number | null;
  workoutsRemaining: number;
};

type CoachTraineeQuotaLink = {
  coachId: string;
  workoutsCompleted: number | null;
  workoutQuota: number | null;
  loggedSessionsCount: number;
};

async function getCoachTraineeQuotaLink(
  traineeId: string,
  coachId: string,
): Promise<CoachTraineeQuotaLink | null> {
  const link = await prisma.coachTrainee.findUnique({
    where: { traineeId },
    select: {
      coachId: true,
      workoutsCompleted: true,
      workoutQuota: true,
      trainee: {
        select: {
          _count: {
            select: {
              workoutSessions: { where: { program: { coachId } } },
            },
          },
        },
      },
    },
  });

  if (!link || link.coachId !== coachId) {
    return null;
  }

  return {
    coachId: link.coachId,
    workoutsCompleted: link.workoutsCompleted,
    workoutQuota: link.workoutQuota,
    loggedSessionsCount: link.trainee._count.workoutSessions,
  };
}

export async function getTraineeQuotaSnapshot(
  traineeId: string,
  coachId: string,
): Promise<TraineeQuotaSnapshot | null> {
  const link = await getCoachTraineeQuotaLink(traineeId, coachId);
  if (!link) return null;

  const completedCount = getEffectiveWorkoutsCompleted(
    link.workoutsCompleted,
    link.loggedSessionsCount,
  );

  return {
    workoutQuota: link.workoutQuota,
    workoutsRemaining: getWorkoutsRemaining(link.workoutQuota, completedCount),
  };
}

export async function validateTraineeQuotaAvailability(
  traineeId: string,
  coachId: string,
): Promise<{ error?: string }> {
  const link = await getCoachTraineeQuotaLink(traineeId, coachId);
  if (!link) {
    return { error: "לא נמצא קשר מאמן-מתאמן" };
  }

  const completedCount = getEffectiveWorkoutsCompleted(
    link.workoutsCompleted,
    link.loggedSessionsCount,
  );
  const remaining = getWorkoutsRemaining(link.workoutQuota, completedCount);
  const blockMessage = getQuotaBlockMessage(link.workoutQuota, remaining);

  if (blockMessage) {
    return { error: blockMessage };
  }

  return {};
}

export async function consumeTraineeQuota(
  traineeId: string,
  coachId: string,
): Promise<{ error?: string }> {
  const validation = await validateTraineeQuotaAvailability(traineeId, coachId);
  if (validation.error) {
    return validation;
  }

  const link = await getCoachTraineeQuotaLink(traineeId, coachId);
  if (!link || link.workoutQuota == null) {
    return {};
  }

  const completedCount = getEffectiveWorkoutsCompleted(
    link.workoutsCompleted,
    link.loggedSessionsCount,
  );

  const nextCompleted =
    link.workoutsCompleted != null ? link.workoutsCompleted + 1 : completedCount + 1;

  await prisma.coachTrainee.update({
    where: { traineeId },
    data: { workoutsCompleted: nextCompleted },
  });

  return {};
}

export async function restoreTraineeQuota(traineeId: string, coachId: string) {
  const link = await prisma.coachTrainee.findUnique({
    where: { traineeId },
    select: { coachId: true, workoutsCompleted: true, workoutQuota: true },
  });

  if (!link || link.coachId !== coachId || link.workoutQuota == null) {
    return;
  }

  if (link.workoutsCompleted == null || link.workoutsCompleted <= 0) {
    return;
  }

  await prisma.coachTrainee.update({
    where: { traineeId },
    data: { workoutsCompleted: link.workoutsCompleted - 1 },
  });
}
