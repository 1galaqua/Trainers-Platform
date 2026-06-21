import { prisma } from "@/lib/prisma";

export const NOTIFICATION_RETENTION_DAYS = 7;

export function getNotificationRetentionCutoff(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - NOTIFICATION_RETENTION_DAYS);
  return cutoff;
}

export async function cleanupOldNotifications(now = new Date()) {
  const cutoff = getNotificationRetentionCutoff(now);

  const result = await prisma.appNotification.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });

  return { deleted: result.count, cutoff: cutoff.toISOString() };
}
