import { prisma } from "@/lib/prisma";
import { notReadWhere } from "@/lib/notification-prisma-filters";

export async function getUnreadNotificationCountForUser(userId: string): Promise<number> {
  return prisma.appNotification.count({
    where: { userId, ...notReadWhere },
  });
}

export function formatUnreadBadgeCount(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}
