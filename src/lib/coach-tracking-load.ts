import { unstable_cache } from "next/cache";

import { coachTraineesTag } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";

export type CoachTrackingTraineeOption = {
  id: string;
  name: string;
};

async function loadCoachTrackingTraineeOptions(
  coachId: string,
): Promise<CoachTrackingTraineeOption[]> {
  try {
    const links = await prisma.coachTrainee.findMany({
      where: { coachId },
      select: {
        trainee: {
          select: { id: true, displayName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return links.map((link) => ({
      id: link.trainee.id,
      name: link.trainee.displayName ?? "מתאמן",
    }));
  } catch {
    return [];
  }
}

export async function getCachedCoachTrackingTraineeOptions(
  coachId: string,
): Promise<CoachTrackingTraineeOption[]> {
  return unstable_cache(
    async () => loadCoachTrackingTraineeOptions(coachId),
    ["coach-tracking-trainees", coachId],
    { tags: [coachTraineesTag(coachId)] },
  )();
}
