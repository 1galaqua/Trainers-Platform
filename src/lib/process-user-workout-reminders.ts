import { notifyUserAboutWorkoutReminder } from "@/lib/workout-reminder-notifications";
import { shouldDeliverWorkoutReminder } from "@/lib/workout-reminder-delivery";
import { claimUserWorkoutReminder, reminderNotSentWhere } from "@/lib/user-workout-reminders";
import { prisma } from "@/lib/prisma";

function buildDueRemindersWhere(now: Date) {
  return {
    ...reminderNotSentWhere,
    scheduledFor: { lte: now },
  };
}

export async function processDueUserWorkoutReminders() {
  const now = new Date();
  const where = buildDueRemindersWhere(now);

  const dueCount = await prisma.userWorkoutReminder.count({ where });
  if (dueCount === 0) {
    return { processed: 0, sent: 0, skipped: 0, claimed: 0, skipReasons: {} };
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
    take: 50,
  });

  let sent = 0;
  let skipped = 0;
  let claimed = 0;
  const skipReasons: Record<string, number> = {};

  for (const reminder of reminders) {
    const workout = reminder.workout;
    const decision = shouldDeliverWorkoutReminder({
      workoutCancelledAt: workout.cancelledAt,
      scheduledFor: reminder.scheduledFor,
      now,
    });

    const didClaim = await claimUserWorkoutReminder(reminder.id, now);
    if (!didClaim) continue;

    claimed += 1;

    if (!decision.deliver) {
      skipped += 1;
      skipReasons[decision.reason] = (skipReasons[decision.reason] ?? 0) + 1;
      continue;
    }

    try {
      await notifyUserAboutWorkoutReminder({
        userId: reminder.userId,
        workout,
      });
      sent += 1;
    } catch (error) {
      console.error("[workout-reminder] delivery failed after claim:", reminder.id, error);
    }
  }

  return { processed: reminders.length, claimed, sent, skipped, skipReasons };
}
