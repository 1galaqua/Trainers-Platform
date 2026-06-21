import { notifyUserAboutWorkoutReminder } from "@/lib/workout-reminder-notifications";
import { shouldDeliverWorkoutReminder } from "@/lib/workout-reminder-delivery";
import { reminderNotSentWhere } from "@/lib/user-workout-reminders";
import { prisma } from "@/lib/prisma";

type ProcessDueUserWorkoutRemindersOptions = {
  userId?: string;
};

function buildDueRemindersWhere(now: Date, userId?: string) {
  return {
    ...reminderNotSentWhere,
    scheduledFor: { lte: now },
    ...(userId ? { userId } : {}),
  };
}

export async function processDueUserWorkoutReminders(
  options: ProcessDueUserWorkoutRemindersOptions = {},
) {
  const now = new Date();
  const where = buildDueRemindersWhere(now, options.userId);

  const dueCount = await prisma.userWorkoutReminder.count({ where });
  if (dueCount === 0) {
    return { processed: 0, sent: 0, skipped: 0, skipReasons: {} };
  }

  const reminders = await prisma.userWorkoutReminder.findMany({
    where,
    select: {
      id: true,
      userId: true,
      scheduledFor: true,
      workout: {
        select: {
          id: true,
          type: true,
          workoutKind: true,
          startsAt: true,
          durationMinutes: true,
          cancelledAt: true,
        },
      },
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
