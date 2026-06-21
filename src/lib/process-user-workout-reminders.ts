import { notifyUserAboutWorkoutReminder } from "@/lib/workout-reminder-notifications";
import { reminderNotSentWhere } from "@/lib/user-workout-reminders";
import { prisma } from "@/lib/prisma";

export async function processDueUserWorkoutReminders() {
  const now = new Date();

  const reminders = await prisma.userWorkoutReminder.findMany({
    where: {
      ...reminderNotSentWhere,
      scheduledFor: { lte: now },
    },
    include: {
      workout: true,
    },
    take: 50,
  });

  let sent = 0;

  for (const reminder of reminders) {
    const workout = reminder.workout;

    const isCancelled = workout.cancelledAt != null;
    if (isCancelled || workout.startsAt <= now) {
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

  return { processed: reminders.length, sent };
}
