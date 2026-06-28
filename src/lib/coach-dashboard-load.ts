import { unstable_cache } from "next/cache";

import { coachTraineesTag } from "@/lib/cache-tags";
import {
  buildCoachDashboardChartData,
  type CoachDashboardChartData,
  type CoachTraineeSnapshot,
} from "@/lib/coach-dashboard-stats";
import { prisma } from "@/lib/prisma";

type CoachTraineeSnapshotPayload = {
  linkedAt: string;
  coachingStartDate: string | null;
  coachingEndDate: string | null;
  workoutQuota: number | null;
  workoutsCompleted: number | null;
  sessionDates: string[];
};

function toSnapshotPayload(link: {
  createdAt: Date;
  coachingStartDate: Date | null;
  coachingEndDate: Date | null;
  workoutQuota: number | null;
  workoutsCompleted: number | null;
  trainee: {
    workoutSessions: Array<{ completedAt: Date }>;
  };
}): CoachTraineeSnapshotPayload {
  return {
    linkedAt: link.createdAt.toISOString(),
    coachingStartDate: link.coachingStartDate?.toISOString() ?? null,
    coachingEndDate: link.coachingEndDate?.toISOString() ?? null,
    workoutQuota: link.workoutQuota,
    workoutsCompleted: link.workoutsCompleted,
    sessionDates: link.trainee.workoutSessions.map((session) =>
      session.completedAt.toISOString(),
    ),
  };
}

function fromSnapshotPayload(payload: CoachTraineeSnapshotPayload): CoachTraineeSnapshot {
  return {
    linkedAt: new Date(payload.linkedAt),
    coachingStartDate: payload.coachingStartDate ? new Date(payload.coachingStartDate) : null,
    coachingEndDate: payload.coachingEndDate ? new Date(payload.coachingEndDate) : null,
    workoutQuota: payload.workoutQuota,
    workoutsCompleted: payload.workoutsCompleted,
    sessionDates: payload.sessionDates.map((date) => new Date(date)),
  };
}

async function loadCoachDashboardSnapshotPayloads(coachId: string): Promise<CoachTraineeSnapshotPayload[]> {
  const links = await prisma.coachTrainee.findMany({
    where: { coachId },
    include: {
      trainee: {
        include: {
          workoutSessions: {
            where: { program: { coachId } },
            select: { completedAt: true },
          },
        },
      },
    },
  });

  return links.map(toSnapshotPayload);
}

export async function loadCoachDashboardChartData(coachId: string): Promise<CoachDashboardChartData> {
  try {
    const payloads = await loadCoachDashboardSnapshotPayloads(coachId);
    const snapshots = payloads.map(fromSnapshotPayload);
    return buildCoachDashboardChartData(snapshots);
  } catch {
    return buildCoachDashboardChartData([]);
  }
}

export async function getCachedCoachDashboardChartData(
  coachId: string,
): Promise<CoachDashboardChartData> {
  const payloads = await unstable_cache(
    async () => loadCoachDashboardSnapshotPayloads(coachId),
    ["coach-dashboard-chart", coachId],
    { tags: [coachTraineesTag(coachId)] },
  )();

  return buildCoachDashboardChartData(payloads.map(fromSnapshotPayload));
}
