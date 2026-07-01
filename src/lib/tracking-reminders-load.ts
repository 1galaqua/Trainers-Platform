import { unstable_cache } from "next/cache";

import { trackingRemindersTag } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import type { TrackingReminderBundle } from "@/server/actions/tracking";

async function loadRemindersForTrainee(traineeId: string): Promise<TrackingReminderBundle> {
  const [bodyWeight, sleep, water, measurements, steps, calories] = await Promise.all([
    prisma.bodyWeightReminder.findUnique({ where: { traineeId } }),
    prisma.sleepReminder.findUnique({ where: { traineeId } }),
    prisma.waterReminder.findUnique({ where: { traineeId } }),
    prisma.measurementsReminder.findUnique({ where: { traineeId } }),
    prisma.stepsReminder.findUnique({ where: { traineeId } }),
    prisma.caloriesReminder.findUnique({ where: { traineeId } }),
  ]);

  return {
    bodyWeight: bodyWeight
      ? { enabled: bodyWeight.enabled, daysOfWeek: bodyWeight.daysOfWeek, timeLocal: bodyWeight.timeLocal }
      : null,
    sleep: sleep
      ? { enabled: sleep.enabled, daysOfWeek: sleep.daysOfWeek, timeLocal: sleep.timeLocal }
      : null,
    water: water
      ? {
          enabled: water.enabled,
          daysOfWeek: water.daysOfWeek,
          timesLocal: water.timesLocal.length > 0 ? water.timesLocal : [],
        }
      : null,
    measurements: measurements
      ? {
          enabled: measurements.enabled,
          daysOfWeek: measurements.daysOfWeek,
          timeLocal: measurements.timeLocal,
        }
      : null,
    steps: steps
      ? { enabled: steps.enabled, daysOfWeek: steps.daysOfWeek, timeLocal: steps.timeLocal }
      : null,
    calories: calories
      ? {
          enabled: calories.enabled,
          daysOfWeek: calories.daysOfWeek,
          timeLocal: calories.timeLocal,
        }
      : null,
  };
}

export async function getCachedRemindersForTrainee(
  traineeId: string,
): Promise<TrackingReminderBundle> {
  return unstable_cache(
    async () => loadRemindersForTrainee(traineeId),
    ["tracking-reminders", traineeId],
    { tags: [trackingRemindersTag(traineeId)] },
  )();
}
