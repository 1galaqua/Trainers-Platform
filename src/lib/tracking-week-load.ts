import { unstable_cache } from "next/cache";

import { trackingWeekTag } from "@/lib/cache-tags";
import { buildTrackingWeekRawLogs, type TrackingWeekRawLogs } from "@/lib/tracking-week-data";
import { prisma } from "@/lib/prisma";

type WeekLogsPayload = Parameters<typeof buildTrackingWeekRawLogs>[0];

async function loadWeekLogsPayload(
  traineeId: string,
  weekStart: string,
  weekEnd: string,
): Promise<WeekLogsPayload> {
  const [bodyWeightLogs, sleepLogs, waterLogs, stepsLogs, caloriesLogs, measurementsLogs] =
    await Promise.all([
      prisma.bodyWeightLog.findMany({
        where: { traineeId, recordedDay: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.sleepLog.findMany({
        where: { traineeId, recordedDay: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.waterLog.findMany({
        where: { traineeId, recordedDay: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.stepsLog.findMany({
        where: { traineeId, recordedDay: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.caloriesLog.findMany({
        where: { traineeId, recordedDay: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.measurementsLog.findMany({
        where: { traineeId, recordedDay: { gte: weekStart, lte: weekEnd } },
      }),
    ]);

  return {
    bodyWeightLogs,
    sleepLogs,
    waterLogs,
    stepsLogs,
    caloriesLogs,
    measurementsLogs,
  };
}

export async function getCachedWeekLogsForTrainee(
  traineeId: string,
  weekStart: string,
  weekEnd: string,
): Promise<TrackingWeekRawLogs> {
  const payload = await unstable_cache(
    async () => loadWeekLogsPayload(traineeId, weekStart, weekEnd),
    ["tracking-week-logs", traineeId, weekStart],
    { tags: [trackingWeekTag(traineeId, weekStart)] },
  )();

  return buildTrackingWeekRawLogs(payload);
}
