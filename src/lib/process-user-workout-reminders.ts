import { notifyUserAboutWorkoutReminder } from "@/lib/workout-reminder-notifications";
import { shouldDeliverWorkoutReminder } from "@/lib/workout-reminder-delivery";
import { reminderNotSentWhere } from "@/lib/user-workout-reminders";
import { prisma } from "@/lib/prisma";

type ProcessDueUserWorkoutRemindersOptions = {
  userId?: string;
};

export async function processDueUserWorkoutReminders(
  options: ProcessDueUserWorkoutRemindersOptions = {},
) {
  const now = new Date();

  const reminders = await prisma.userWorkoutReminder.findMany({
    where: {
      ...reminderNotSentWhere,
      scheduledFor: { lte: now },
      ...(options.userId ? { userId: options.userId } : {}),
    },
    include: {
      workout: true,
    },
    take: options.userId ? 10 : 50,
  });

  let sent = 0;
  let skipped = 0;
  const skipReasons: Record<string, number> = {};

  for (const reminder of reminders) {
    const workout = reminder.workout;
    const decision = shouldDeliverWorkoutReminder({
      workoutCancelledAt: workout.cancelledAt,
      scheduledFor: reminder.scheduledFor,
      now,
    });

    if (!decision.deliver) {
      skipped += 1;
      skipReasons[decision.reason] = (skipReasons[decision.reason] ?? 0) + 1;
      await prisma.userWorkoutReminder.update({
        where: { id: reminder.id },
        data: { sentAt: now },
      });
      continue;
    }

    await notifyUserAboutWorkoutReminder({
      userId: reminder.userId,
      workout,
    });

    await prisma.userWorkoutReminder.update({
      where: { id: reminder.id },
      data: { sentAt: now },
    });

    sent += 1;
  }

  return { processed: reminders.length, sent, skipped, skipReasons };
}
