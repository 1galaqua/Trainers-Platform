import { formatWorkoutDateTime } from "@/lib/calendar-range";
import { filterUsersWithoutRecentDuplicateNotification } from "@/lib/notification-dedupe";
import { getUnreadNotificationCountForUser } from "@/lib/notifications";
import { programTypeLabels } from "@/lib/program-labels";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationsToUsers } from "@/lib/push-send";
import { safeRevalidatePaths } from "@/lib/safe-revalidate";
import type { ProgramType, ScheduledWorkout } from "@/lib/prisma-client";

type WorkoutReminderContext = Pick<
  ScheduledWorkout,
  "id" | "type" | "workoutKind" | "startsAt" | "durationMinutes"
>;

function buildWorkoutReminderBody(workout: WorkoutReminderContext) {
  const summary = formatWorkoutDateTime(workout.startsAt);
  const kindLabel = programTypeLabels[workout.workoutKind as ProgramType];
  const typeLabel = workout.type === "PERSONAL" ? "אימון אישי" : "אימון קבוצתי";
  return `${typeLabel} · ${kindLabel} · ${summary} · ${workout.durationMinutes} דק׳`;
}

export async function notifyUserAboutWorkoutReminder(params: {
  userId: string;
  workout: WorkoutReminderContext;
}): Promise<boolean> {
  const recipients = await filterUsersWithoutRecentDuplicateNotification(
    [params.userId],
    "WORKOUT_REMINDER",
    params.workout.id,
  );

  if (recipients.length === 0) return false;

  const body = buildWorkoutReminderBody(params.workout);

  await prisma.appNotification.create({
    data: {
      userId: params.userId,
      type: "WORKOUT_REMINDER",
      title: "תזכורת: אימון בקרוב",
      body,
      payload: { workoutId: params.workout.id },
    },
  });

  try {
    const unreadCount = await getUnreadNotificationCountForUser(params.userId);

    const subscriptions = await prisma.pushSubscription.count({
      where: { userId: params.userId },
    });

    if (subscriptions === 0) {
      console.warn("[push] workout reminder skipped — no subscription for user:", params.userId);
    } else {
      await sendPushNotificationsToUsers(
        [params.userId],
        {
          title: "תזכורת: אימון בקרוב",
          body,
          url: "/dashboard/updates",
          tag: `workout-reminder-${params.workout.id}`,
          unreadCount,
        },
      );
    }
  } catch (error) {
    console.error("[push] workout reminder delivery failed:", error);
  }

  safeRevalidatePaths(["/dashboard", "/dashboard/updates"]);
  return true;
}
