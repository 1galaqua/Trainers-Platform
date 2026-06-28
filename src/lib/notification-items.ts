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
  eventId: string | null;
};

function serializeNotificationDate(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

function extractPayloadId(payload: unknown, key: "workoutId" | "eventId"): string | null {
  if (!payload || typeof payload !== "object") return null;
  const value = (payload as Record<string, unknown>)[key];
  if (typeof value === "string" && value.length > 0) return value;
  if (value != null && typeof value === "object" && "toString" in value) {
    const asString = String(value);
    return asString.length > 0 && asString !== "[object Object]" ? asString : null;
  }
  return null;
}

export async function loadUserNotifications(userId: string): Promise<NotificationItem[]> {
  const notifications = await prisma.appNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    readAt: serializeNotificationDate(notification.readAt),
    createdAt: serializeNotificationDate(notification.createdAt) ?? new Date().toISOString(),
    workoutId: extractPayloadId(notification.payload, "workoutId"),
    eventId: extractPayloadId(notification.payload, "eventId"),
  }));
}
