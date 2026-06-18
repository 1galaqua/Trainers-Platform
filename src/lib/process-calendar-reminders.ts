import { notCancelledWhere } from "@/lib/calendar-prisma-filters";
import {
  getCoachTraineeIdsNotRegistered,
  notifyUnregisteredTraineesAboutGroupSpots,
} from "@/lib/calendar-notifications";
import { prisma } from "@/lib/prisma";

export async function processDueCalendarReminders() {
  const now = new Date();

  const jobs = await prisma.scheduledReminderJob.findMany({
    where: {
      sentAt: null,
      scheduledFor: { lte: now },
      reminderType: "ONE_HOUR_BEFORE_SPOTS",
    },
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
    const workout = job.workout;

    if (
      workout.cancelledAt ||
      workout.type !== "GROUP" ||
      workout.maxParticipants == null ||
      workout.startsAt <= now
    ) {
      await prisma.scheduledReminderJob.update({
        where: { id: job.id },
        data: { sentAt: now },
      });
      continue;
    }

    const registeredCount = workout.registrations.length;
    const spotsLeft = workout.maxParticipants - registeredCount;

    if (spotsLeft > 0) {
      const traineeIds = await getCoachTraineeIdsNotRegistered(workout.coachId, workout.id);
      if (traineeIds.length > 0) {
        await notifyUnregisteredTraineesAboutGroupSpots({
          workout,
          maxParticipants: workout.maxParticipants,
          registeredCount,
          traineeIds,
        });
      }
    }

    await prisma.scheduledReminderJob.update({
      where: { id: job.id },
      data: { sentAt: now },
    });
  }

  return { processed: jobs.length };
}
