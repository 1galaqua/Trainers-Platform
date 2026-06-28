import { notifyUserAboutCalendarEventReminder } from "@/lib/calendar-event-notifications";
import { shouldDeliverWorkoutReminder } from "@/lib/workout-reminder-delivery";
import {
  claimUserCalendarEventReminder,
} from "@/lib/user-calendar-event-reminders";
import { reminderNotSentWhere } from "@/lib/user-workout-reminders";
import { prisma } from "@/lib/prisma";

function buildDueRemindersWhere(now: Date) {
  return {
    ...reminderNotSentWhere,
    scheduledFor: { lte: now },
  };
}

export async function processDueUserCalendarEventReminders() {
  const now = new Date();
  const where = buildDueRemindersWhere(now);

  const dueCount = await prisma.userCalendarEventReminder.count({ where });
  if (dueCount === 0) {
    return { processed: 0, sent: 0, skipped: 0, claimed: 0, skipReasons: {} };
  }

  const reminders = await prisma.userCalendarEventReminder.findMany({
    where,
    select: {
      id: true,
      userId: true,
      scheduledFor: true,
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          durationMinutes: true,
          cancelledAt: true,
          coachId: true,
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
    const event = reminder.event;
    const decision = shouldDeliverWorkoutReminder({
      workoutCancelledAt: event.cancelledAt,
      scheduledFor: reminder.scheduledFor,
      now,
    });

    const didClaim = await claimUserCalendarEventReminder(reminder.id, now);
    if (!didClaim) continue;

    claimed += 1;

    if (!decision.deliver) {
      skipped += 1;
      skipReasons[decision.reason] = (skipReasons[decision.reason] ?? 0) + 1;
      continue;
    }

    try {
      const delivered = await notifyUserAboutCalendarEventReminder({
        userId: reminder.userId,
        event,
      });
      if (delivered) sent += 1;
    } catch (error) {
      console.error("[calendar-event-reminder] delivery failed after claim:", reminder.id, error);
    }
  }

  return { processed: reminders.length, claimed, sent, skipped, skipReasons };
}
