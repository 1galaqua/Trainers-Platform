import { revalidatePath } from "next/cache";

import { formatWorkoutDateTime } from "@/lib/calendar-range";
import { notCancelledWhere } from "@/lib/calendar-prisma-filters";
import { filterUsersWithoutRecentDuplicateNotification } from "@/lib/notification-dedupe";
import { getUnreadNotificationCountsForUsers } from "@/lib/notifications";
import { programTypeLabels } from "@/lib/program-labels";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationsToUsers } from "@/lib/push-send";
import type { ProgramType, ScheduledWorkout, WorkoutDeliveryMode } from "@/lib/prisma-client";
import {
  workoutDeliveryModeLabels,
} from "@/lib/workout-delivery";

type WorkoutNotificationContext = Pick<
  ScheduledWorkout,
  | "id"
  | "coachId"
  | "workoutKind"
  | "startsAt"
  | "durationMinutes"
  | "deliveryMode"
  | "meetingLink"
>;

type NotificationDelivery = {
  type:
    | "PERSONAL_SCHEDULED"
    | "PERSONAL_CANCELLED"
    | "PERSONAL_UPDATED"
    | "GROUP_SPOTS_AVAILABLE"
    | "GROUP_CANCELLED"
    | "GROUP_UPDATED"
    | "GROUP_REGISTRATION"
    | "GROUP_ENROLLED"
    | "GROUP_UNENROLLED"
    | "GROUP_CANCELLATION_BY_TRAINEE";
  title: string;
  body: string;
  workoutId: string;
};

function workoutKindLabel(workoutKind: ProgramType) {
  return programTypeLabels[workoutKind];
}

function formatWorkoutSummary(workout: WorkoutNotificationContext) {
  const when = formatWorkoutDateTime(workout.startsAt);
  const deliveryLabel = workoutDeliveryModeLabels[workout.deliveryMode as WorkoutDeliveryMode];
  const parts = [
    deliveryLabel,
    workoutKindLabel(workout.workoutKind),
    when,
    `${workout.durationMinutes} דק׳`,
  ];

  if (workout.deliveryMode === "ONLINE" && workout.meetingLink) {
    parts.push(workout.meetingLink);
  }

  return parts.join(" · ");
}

function spotsSummary(
  workout: WorkoutNotificationContext,
  maxParticipants: number,
  registeredCount: number,
) {
  const spotsLeft = maxParticipants - registeredCount;
  const summary = formatWorkoutSummary(workout);
  return `${summary} · נותרו ${spotsLeft} מקומות`;
}

export function resolveNotificationRecipients(
  userIds: string[],
  excludeUserIds: string[] = [],
) {
  const excluded = new Set(excludeUserIds);
  return [...new Set(userIds)].filter((userId) => !excluded.has(userId));
}

async function deliverNotificationsToUsers(
  userIds: string[],
  data: NotificationDelivery,
  options?: { excludeUserIds?: string[] },
) {
  const uniqueUserIds = resolveNotificationRecipients(
    userIds,
    options?.excludeUserIds,
  );

  const recipients = await filterUsersWithoutRecentDuplicateNotification(
    uniqueUserIds,
    data.type,
    data.workoutId,
  );

  if (recipients.length === 0) return;

  await prisma.appNotification.createMany({
    data: recipients.map((userId) => ({
      userId,
      type: data.type,
      title: data.title,
      body: data.body,
      payload: { workoutId: data.workoutId },
    })),
  });

  try {
    const unreadCounts = await getUnreadNotificationCountsForUsers(recipients);
    await sendPushNotificationsToUsers(
      recipients,
      {
        title: data.title,
        body: data.body,
        url: "/dashboard/updates",
        tag: `workout-${data.workoutId}`,
      },
      unreadCounts,
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[push] calendar notification delivery failed:", error);
    }
  }

  try {
    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/updates");
  } catch {
    // revalidatePath requires a Next.js request context.
  }
}

async function deliverNotificationToUser(
  userId: string,
  data: NotificationDelivery,
  options?: { excludeUserIds?: string[] },
) {
  await deliverNotificationsToUsers([userId], data, options);
}

export async function notifyTraineeAboutPersonalScheduled(params: {
  workout: WorkoutNotificationContext;
  traineeId: string;
}) {
  if (params.traineeId === params.workout.coachId) {
    return;
  }

  const summary = formatWorkoutSummary(params.workout);

  await deliverNotificationToUser(
    params.traineeId,
    {
      type: "PERSONAL_SCHEDULED",
      title: "נקבע לך אימון",
      body: `נקבע לך אימון אישי: ${summary}`,
      workoutId: params.workout.id,
    },
    { excludeUserIds: [params.workout.coachId] },
  );
}

export async function notifyCoachAboutGroupRegistration(params: {
  workout: WorkoutNotificationContext;
  traineeName: string;
}) {
  const { workout, traineeName } = params;
  const summary = formatWorkoutSummary(workout);

  await deliverNotificationToUser(workout.coachId, {
    type: "GROUP_REGISTRATION",
    title: "נרשם לאימון קבוצתי",
    body: `${traineeName} נרשם/ה לאימון ${summary}`,
    workoutId: workout.id,
  });
}

export async function notifyCoachAboutGroupCancellation(params: {
  workout: WorkoutNotificationContext;
  traineeName: string;
}) {
  const { workout, traineeName } = params;
  const summary = formatWorkoutSummary(workout);

  await deliverNotificationToUser(workout.coachId, {
    type: "GROUP_CANCELLATION_BY_TRAINEE",
    title: "בוטל רישום לאימון קבוצתי",
    body: `${traineeName} ביטל/ה רישום לאימון ${summary}`,
    workoutId: workout.id,
  });
}

export async function notifyTraineeAboutPersonalCancellation(params: {
  workout: WorkoutNotificationContext;
  traineeId: string;
}) {
  if (params.traineeId === params.workout.coachId) {
    return;
  }

  const summary = formatWorkoutSummary(params.workout);

  await deliverNotificationToUser(
    params.traineeId,
    {
      type: "PERSONAL_CANCELLED",
      title: "אימון אישי בוטל",
      body: `האימון האישי בוטל: ${summary}`,
      workoutId: params.workout.id,
    },
    { excludeUserIds: [params.workout.coachId] },
  );
}

export async function notifyTraineeAboutPersonalUpdate(params: {
  workout: WorkoutNotificationContext;
  traineeId: string;
}) {
  if (params.traineeId === params.workout.coachId) {
    return;
  }

  const summary = formatWorkoutSummary(params.workout);

  await deliverNotificationToUser(
    params.traineeId,
    {
      type: "PERSONAL_UPDATED",
      title: "אימון אישי עודכן",
      body: `האימון האישי עודכן: ${summary}`,
      workoutId: params.workout.id,
    },
    { excludeUserIds: [params.workout.coachId] },
  );
}

export async function notifyRegisteredTraineesAboutGroupCancellation(params: {
  workout: WorkoutNotificationContext;
  traineeIds: string[];
}) {
  const summary = formatWorkoutSummary(params.workout);

  await deliverNotificationsToUsers(
    params.traineeIds,
    {
      type: "GROUP_CANCELLED",
      title: "אימון קבוצתי בוטל",
      body: `האימון הקבוצתי בוטל: ${summary}`,
      workoutId: params.workout.id,
    },
    { excludeUserIds: [params.workout.coachId] },
  );
}

export async function notifyRegisteredTraineesAboutGroupUpdate(params: {
  workout: WorkoutNotificationContext;
  traineeIds: string[];
}) {
  const summary = formatWorkoutSummary(params.workout);

  await deliverNotificationsToUsers(
    params.traineeIds,
    {
      type: "GROUP_UPDATED",
      title: "אימון קבוצתי עודכן",
      body: `האימון הקבוצתי עודכן: ${summary}`,
      workoutId: params.workout.id,
    },
    { excludeUserIds: [params.workout.coachId] },
  );
}

export async function notifyTraineesAboutGroupEnrollment(params: {
  workout: WorkoutNotificationContext;
  traineeIds: string[];
}) {
  if (params.traineeIds.length === 0) return;

  const summary = formatWorkoutSummary(params.workout);

  await deliverNotificationsToUsers(
    params.traineeIds,
    {
      type: "GROUP_ENROLLED",
      title: "נרשמת לאימון קבוצתי",
      body: `נרשמת לאימון קבוצתי: ${summary}`,
      workoutId: params.workout.id,
    },
    { excludeUserIds: [params.workout.coachId] },
  );
}

export async function notifyTraineesAboutGroupUnenrollment(params: {
  workout: WorkoutNotificationContext;
  traineeIds: string[];
}) {
  if (params.traineeIds.length === 0) return;

  const summary = formatWorkoutSummary(params.workout);

  await deliverNotificationsToUsers(
    params.traineeIds,
    {
      type: "GROUP_UNENROLLED",
      title: "הוסרת מרישום לאימון קבוצתי",
      body: `הוסרת מרישום לאימון קבוצתי: ${summary}`,
      workoutId: params.workout.id,
    },
    { excludeUserIds: [params.workout.coachId] },
  );
}

export async function notifyUnregisteredTraineesAboutGroupSpots(params: {
  workout: WorkoutNotificationContext;
  maxParticipants: number;
  registeredCount: number;
  traineeIds: string[];
}) {
  const body = spotsSummary(params.workout, params.maxParticipants, params.registeredCount);

  await deliverNotificationsToUsers(
    params.traineeIds,
    {
      type: "GROUP_SPOTS_AVAILABLE",
      title: "מקומות פנויים באימון קבוצתי",
      body,
      workoutId: params.workout.id,
    },
    { excludeUserIds: [params.workout.coachId] },
  );
}

export async function getCoachTraineeIdsNotRegistered(
  coachId: string,
  workoutId: string,
): Promise<string[]> {
  const [links, registrations] = await Promise.all([
    prisma.coachTrainee.findMany({
      where: { coachId },
      select: { traineeId: true },
    }),
    prisma.groupWorkoutRegistration.findMany({
      where: { workoutId, ...notCancelledWhere },
      select: { traineeId: true },
    }),
  ]);

  const registeredIds = new Set(registrations.map((registration) => registration.traineeId));
  return links
    .map((link) => link.traineeId)
    .filter((traineeId) => traineeId !== coachId && !registeredIds.has(traineeId));
}
