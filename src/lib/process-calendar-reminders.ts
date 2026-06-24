import { jobNotSentWhere, notCancelledWhere } from "@/lib/calendar-prisma-filters";
import { prisma } from "@/lib/prisma";

/** Spots reminders to unregistered trainees were removed; mark legacy jobs as handled. */
export async function processDueCalendarReminders() {
  const now = new Date();

  const jobWhere = {
    ...jobNotSentWhere,
    scheduledFor: { lte: now },
    reminderType: "ONE_HOUR_BEFORE_SPOTS" as const,
  };

  const dueCount = await prisma.scheduledReminderJob.count({ where: jobWhere });
  if (dueCount === 0) {
    return { processed: 0 };
  }

  const jobs = await prisma.scheduledReminderJob.findMany({
    where: jobWhere,
    include: {
      workout: {
        include: {
          registrations: {
            where: notCancelledWhere,
            select: { traineeId: true },
          },
        },
      },
    },
    take: 50,
  });

  for (const job of jobs) {
    await prisma.scheduledReminderJob.update({
      where: { id: job.id },
      data: { sentAt: now },
    });
  }

  return { processed: jobs.length };
}
