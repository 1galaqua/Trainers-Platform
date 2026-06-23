"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { notReadWhere } from "@/lib/notification-prisma-filters";
import { getUnreadNotificationCountForUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import type { AppNotificationType } from "@/lib/prisma-client";

export type NotificationItem = {
  id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  workoutId: string | null;
};

function extractWorkoutId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const workoutId = (payload as { workoutId?: unknown }).workoutId;
  return typeof workoutId === "string" ? workoutId : null;
}

export async function getUserNotificationsAction(): Promise<NotificationItem[]> {
  const user = await requireUser();

  const notifications = await prisma.appNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
    workoutId: extractWorkoutId(notification.payload),
  }));
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

  revalidatePath("/dashboard", "layout");
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

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/updates");
}
