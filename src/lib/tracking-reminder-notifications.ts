import { getIsraelDateString } from "@/lib/calendar-datetime";
import { getUnreadNotificationCountForUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationsToUsers } from "@/lib/push-send";
import { safeRevalidatePaths } from "@/lib/safe-revalidate";

const TRACKING_URL = "/dashboard/tracking";

async function wasReminderSentToday(params: {
  userId: string;
  type: string;
  tagSuffix: string;
}) {
  const today = getIsraelDateString();
  const startOfDay = new Date(`${today}T00:00:00.000Z`);

  const recent = await prisma.appNotification.findMany({
    where: {
      userId: params.userId,
      type: params.type as never,
      createdAt: { gte: startOfDay },
    },
    select: { payload: true },
  });

  return recent.some((notification) => {
    const payload = notification.payload as { tag?: string } | null;
    return payload?.tag === params.tagSuffix;
  });
}

async function deliverTrackingReminder(params: {
  userId: string;
  reminderId: string;
  type: string;
  title: string;
  body: string;
  tagSuffix: string;
}) {
  if (await wasReminderSentToday(params)) return false;

  await prisma.appNotification.create({
    data: {
      userId: params.userId,
      type: params.type as never,
      title: params.title,
      body: params.body,
      payload: { reminderId: params.reminderId, tag: params.tagSuffix },
    },
  });

  try {
    const unreadCount = await getUnreadNotificationCountForUser(params.userId);
    const subscriptions = await prisma.pushSubscription.count({
      where: { userId: params.userId },
    });

    if (subscriptions > 0) {
      await sendPushNotificationsToUsers([params.userId], {
        title: params.title,
        body: params.body,
        url: TRACKING_URL,
        tag: params.tagSuffix,
        unreadCount,
      });
    }
  } catch (error) {
    console.error(`[push] ${params.type} delivery failed:`, error);
  }

  safeRevalidatePaths([TRACKING_URL, "/dashboard/updates"]);
  return true;
}

export async function notifyUserAboutSleepReminder(params: {
  userId: string;
  reminderId: string;
}): Promise<boolean> {
  const today = getIsraelDateString();
  return deliverTrackingReminder({
    userId: params.userId,
    reminderId: params.reminderId,
    type: "SLEEP_REMINDER",
    title: "תזכורת: עדכון שינה",
    body: "זמן לעדכן את שעות השינה שלך",
    tagSuffix: `sleep-reminder-${today}`,
  });
}

export async function notifyUserAboutWaterReminder(params: {
  userId: string;
  reminderId: string;
  timeSlot: string;
}): Promise<boolean> {
  const today = getIsraelDateString();
  return deliverTrackingReminder({
    userId: params.userId,
    reminderId: params.reminderId,
    type: "WATER_REMINDER",
    title: "תזכורת: עדכון שתייה",
    body: "זמן לעדכן את צריכת המים שלך",
    tagSuffix: `water-reminder-${today}-${params.timeSlot}`,
  });
}

export async function notifyUserAboutMeasurementsReminder(params: {
  userId: string;
  reminderId: string;
}): Promise<boolean> {
  const today = getIsraelDateString();
  return deliverTrackingReminder({
    userId: params.userId,
    reminderId: params.reminderId,
    type: "MEASUREMENTS_REMINDER",
    title: "תזכורת: עדכון היקפים",
    body: "זמן לעדכן את ההיקפים שלך",
    tagSuffix: `measurements-reminder-${today}`,
  });
}

export async function notifyUserAboutStepsReminder(params: {
  userId: string;
  reminderId: string;
}): Promise<boolean> {
  const today = getIsraelDateString();
  return deliverTrackingReminder({
    userId: params.userId,
    reminderId: params.reminderId,
    type: "STEPS_REMINDER",
    title: "תזכורת: עדכון צעדים",
    body: "זמן לעדכן את מספר הצעדים שלך",
    tagSuffix: `steps-reminder-${today}`,
  });
}
