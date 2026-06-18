import type { AppNotificationType } from "@/lib/prisma-client";
import { prisma } from "@/lib/prisma";

const DEFAULT_DEDUPE_MINUTES = 3;

const DEDUPE_WINDOWS_MINUTES: Partial<Record<AppNotificationType, number>> = {
  GROUP_SPOTS_AVAILABLE: 45,
};

function extractWorkoutId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const workoutId = (payload as { workoutId?: unknown }).workoutId;
  return typeof workoutId === "string" ? workoutId : null;
}

export async function filterUsersWithoutRecentDuplicateNotification(
  userIds: string[],
  type: AppNotificationType,
  workoutId: string,
): Promise<string[]> {
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) return [];

  const windowMinutes = DEDUPE_WINDOWS_MINUTES[type] ?? DEFAULT_DEDUPE_MINUTES;
  const since = new Date(Date.now() - windowMinutes * 60_000);

  const recent = await prisma.appNotification.findMany({
    where: {
      userId: { in: uniqueUserIds },
      type,
      createdAt: { gte: since },
    },
    select: {
      userId: true,
      payload: true,
    },
  });

  const recentlyNotified = new Set(
    recent
      .filter((notification) => extractWorkoutId(notification.payload) === workoutId)
      .map((notification) => notification.userId),
  );

  return uniqueUserIds.filter((userId) => !recentlyNotified.has(userId));
}
