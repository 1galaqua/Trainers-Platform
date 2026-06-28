import { getIsraelDateString } from "@/lib/calendar-datetime";
import { getUnreadNotificationCountForUser } from "@/lib/notifications";
import { revalidateNotifications } from "@/lib/revalidate-tags";
import { prisma } from "@/lib/prisma";
import { sendPushNotificationsToUsers } from "@/lib/push-send";

export async function notifyUserAboutBodyWeightReminder(params: {
  userId: string;
  reminderId: string;
}): Promise<boolean> {
  const today = getIsraelDateString();
  const startOfDay = new Date(`${today}T00:00:00.000Z`);

  const recent = await prisma.appNotification.findFirst({
    where: {
      userId: params.userId,
      type: "BODY_WEIGHT_REMINDER",
      createdAt: { gte: startOfDay },
    },
    select: { id: true },
  });

  if (recent) return false;

  const body = "זמן לעדכן את משקל הגוף שלך";

  await prisma.appNotification.create({
    data: {
      userId: params.userId,
      type: "BODY_WEIGHT_REMINDER",
      title: "תזכורת: עדכון משקל",
      body,
      payload: { reminderId: params.reminderId },
    },
  });

  try {
    const unreadCount = await getUnreadNotificationCountForUser(params.userId);
    const subscriptions = await prisma.pushSubscription.count({
      where: { userId: params.userId },
    });

    if (subscriptions > 0) {
      await sendPushNotificationsToUsers([params.userId], {
        title: "תזכורת: עדכון משקל",
        body,
        url: "/dashboard/tracking",
        tag: `body-weight-reminder-${today}`,
        unreadCount,
      });
    }
  } catch (error) {
    console.error("[push] body weight reminder delivery failed:", error);
  }

  try {
    revalidateNotifications(params.userId);
  } catch {
    // revalidateTag requires a Next.js request context.
  }
  return true;
}
