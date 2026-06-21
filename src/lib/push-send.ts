import { prisma } from "@/lib/prisma";
import { sendPushNotification, type PushMessage } from "@/lib/push-vapid";

export async function sendPushNotificationsToUsers(
  userIds: string[],
  message: PushMessage,
  unreadCountsByUser?: Map<string, number>,
) {
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: uniqueUserIds } },
  });

  if (subscriptions.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[push] no subscriptions for users:", uniqueUserIds.length);
    }
    return;
  }

  const expiredSubscriptionIds: string[] = [];
  let delivered = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const unreadCount = unreadCountsByUser?.get(subscription.userId) ?? message.unreadCount;

      const result = await sendPushNotification(
        {
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
        {
          ...message,
          unreadCount,
        },
      );

      if (result.ok) {
        delivered += 1;
      } else if (result.expired) {
        expiredSubscriptionIds.push(subscription.id);
      } else if (process.env.NODE_ENV !== "production") {
        console.error("[push] delivery failed for subscription:", subscription.id);
      }
    }),
  );

  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[push] delivered ${delivered}/${subscriptions.length} notifications`,
    );
  }

  if (expiredSubscriptionIds.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: expiredSubscriptionIds } },
    });
  }
}
