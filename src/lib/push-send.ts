import { prisma } from "@/lib/prisma";
import { sendPushNotification, type PushMessage } from "@/lib/push-vapid";

export async function sendPushNotificationsToUsers(
  userIds: string[],
  message: PushMessage,
) {
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: uniqueUserIds } },
  });

  if (subscriptions.length === 0) return;

  const expiredSubscriptionIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const result = await sendPushNotification(
        {
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
        message,
      );

      if (result.expired) {
        expiredSubscriptionIds.push(subscription.id);
      }
    }),
  );

  if (expiredSubscriptionIds.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: expiredSubscriptionIds } },
    });
  }
}
