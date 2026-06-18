import { prisma } from "@/lib/prisma";

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function scheduleGroupWorkoutReminder(workoutId: string, startsAt: Date) {
  const scheduledFor = new Date(startsAt.getTime() - ONE_HOUR_MS);
  if (scheduledFor <= new Date()) return;

  await prisma.scheduledReminderJob.upsert({
    where: {
      workoutId_reminderType: {
        workoutId,
        reminderType: "ONE_HOUR_BEFORE_SPOTS",
      },
    },
    create: {
      workoutId,
      reminderType: "ONE_HOUR_BEFORE_SPOTS",
      scheduledFor,
    },
    update: {
      scheduledFor,
      sentAt: null,
    },
  });
}

export async function cancelGroupWorkoutReminder(workoutId: string) {
  await prisma.scheduledReminderJob.updateMany({
    where: {
      workoutId,
      reminderType: "ONE_HOUR_BEFORE_SPOTS",
      sentAt: null,
    },
    data: {
      sentAt: new Date(),
    },
  });
}
