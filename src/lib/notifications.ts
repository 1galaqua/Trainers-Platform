import { unstable_cache } from "next/cache";
import { cache } from "react";

import { notificationsTag } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { notReadWhere } from "@/lib/notification-prisma-filters";

async function getUnreadNotificationCountUncached(userId: string): Promise<number> {
  return prisma.appNotification.count({
    where: { userId, ...notReadWhere },
  });
}

async function getCachedUnreadNotificationCount(userId: string): Promise<number> {
  return unstable_cache(
    async () => getUnreadNotificationCountUncached(userId),
    ["unread-notifications", userId],
    { tags: [notificationsTag(userId)] },
  )();
}

export const getUnreadNotificationCountForUser = cache(async (userId: string) =>
  getCachedUnreadNotificationCount(userId),
);

export async function getUnreadNotificationCountsForUsers(
  userIds: string[],
): Promise<Map<string, number>> {
  const uniqueUserIds = [...new Set(userIds)];
  const counts = new Map<string, number>();
  for (const userId of uniqueUserIds) {
    counts.set(userId, 0);
  }

  if (uniqueUserIds.length === 0) return counts;

  const unread = await prisma.appNotification.findMany({
    where: { userId: { in: uniqueUserIds }, ...notReadWhere },
    select: { userId: true },
  });

  for (const notification of unread) {
    counts.set(notification.userId, (counts.get(notification.userId) ?? 0) + 1);
  }

  return counts;
}

export function formatUnreadBadgeCount(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}
