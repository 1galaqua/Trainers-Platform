"use server";

import { requireUser } from "@/lib/auth";
import { loadUserNotifications, type NotificationItem } from "@/lib/notification-items";
import { revalidateNotifications } from "@/lib/revalidate-tags";
import { notReadWhere } from "@/lib/notification-prisma-filters";
import { getUnreadNotificationCountForUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export type { NotificationItem } from "@/lib/notification-items";

export async function getUserNotificationsAction(): Promise<NotificationItem[]> {
  const user = await requireUser();
  return loadUserNotifications(user.id);
}

export async function getUnreadNotificationCountAction(): Promise<number> {
  const user = await requireUser();
  return getUnreadNotificationCountForUser(user.id);
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();

  await prisma.appNotification.updateMany({
    where: { userId: user.id, ...notReadWhere },
    data: { readAt: new Date() },
  });

  revalidateNotifications(user.id);
}

export async function markNotificationReadAction(notificationId: string) {
  const user = await requireUser();

  await prisma.appNotification.updateMany({
    where: {
      id: notificationId,
      userId: user.id,
      ...notReadWhere,
    },
    data: { readAt: new Date() },
  });

  revalidateNotifications(user.id);
}
