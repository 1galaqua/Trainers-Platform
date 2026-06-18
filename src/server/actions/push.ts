"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function savePushSubscriptionAction(input: PushSubscriptionInput) {
  const user = await requireUser();

  if (!input.endpoint || !input.p256dh || !input.auth) {
    return { error: "מנוי התראות לא תקין" };
  }

  await prisma.pushSubscription.upsert({
    where: {
      userId_endpoint: {
        userId: user.id,
        endpoint: input.endpoint,
      },
    },
    create: {
      userId: user.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    },
    update: {
      p256dh: input.p256dh,
      auth: input.auth,
    },
  });

  return { success: true as const };
}

export async function removePushSubscriptionAction(endpoint: string) {
  const user = await requireUser();

  if (!endpoint) {
    return { error: "מנוי התראות לא תקין" };
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      userId: user.id,
      endpoint,
    },
  });

  return { success: true as const };
}
