import webpush from "web-push";

import { siteConfig } from "@/config/site";

let vapidConfigured = false;

export { isPushConfigured } from "@/lib/push-config";

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? null;
}

function ensureVapidConfigured() {
  if (
    !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ||
    !process.env.VAPID_PRIVATE_KEY?.trim()
  ) {
    return false;
  }
  if (vapidConfigured) return true;

  webpush.setVapidDetails(
    `mailto:${siteConfig.url}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim(),
    process.env.VAPID_PRIVATE_KEY!.trim(),
  );
  vapidConfigured = true;
  return true;
}

export type PushMessage = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPushNotification(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  message: PushMessage,
) {
  if (!ensureVapidConfigured()) return { ok: false as const, expired: false };

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        title: message.title,
        body: message.body,
        url: message.url ?? "/dashboard/updates",
        tag: message.tag ?? "app-update",
      }),
    );
    return { ok: true as const, expired: false };
  } catch (error) {
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : null;

    return { ok: false as const, expired: statusCode === 404 || statusCode === 410 };
  }
}
