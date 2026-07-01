import { unstable_cache } from "next/cache";

import { trackingWeekTag } from "@/lib/cache-tags";
import { buildTrackingWeekRawLogs, type TrackingWeekRawLogs } from "@/lib/tracking-week-data";
import { loadWeekLogsPayload } from "@/lib/tracking-week-aggregate";

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
