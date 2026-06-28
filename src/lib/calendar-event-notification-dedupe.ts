import type { AppNotificationType } from "@/lib/prisma-client";
import { prisma } from "@/lib/prisma";

const DEFAULT_DEDUPE_MINUTES = 3;

const DEDUPE_WINDOWS_MINUTES: Partial<Record<AppNotificationType, number>> = {
  EVENT_REMINDER: 3,
};

function extractEventId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const eventId = (payload as { eventId?: unknown }).eventId;
  return typeof eventId === "string" ? eventId : null;
}

export async function filterUsersWithoutRecentDuplicateEventNotification(
  userIds: string[],
  type: AppNotificationType,
  eventId: string,
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
      .filter((notification) => extractEventId(notification.payload) === eventId)
      .map((notification) => notification.userId),
  );

  return uniqueUserIds.filter((userId) => !recentlyNotified.has(userId));
}
