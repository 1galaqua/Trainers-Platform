import { formatWorkoutDateTime } from "@/lib/calendar-range";
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
}) {
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
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[push] workout reminder delivery failed:", error);
    }
  }

  safeRevalidatePaths(["/dashboard", "/dashboard/updates"]);
}
