import { revalidatePath } from "next/cache";

import { getWeekStartDateString } from "@/lib/calendar-datetime";
import { revalidateTrackingWeek, revalidateTraineeDetail } from "@/lib/revalidate-tags";

export function revalidateAfterTrackingMetricSave(
  traineeId: string,
  recordedDay: string,
  options?: { metricPath?: string },
) {
  revalidateTrackingWeek(traineeId, getWeekStartDateString(recordedDay));
  revalidateTraineeDetail(traineeId);
  revalidatePath("/dashboard/tracking");
  revalidatePath(`/dashboard/trainees/${traineeId}`);
  if (options?.metricPath) {
    revalidatePath(options.metricPath);
  }
}
