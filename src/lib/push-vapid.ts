import webpush from "web-push";

export { isPushConfigured } from "@/lib/push-config";

let vapidConfigured = false;

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? null;
}

export function getVapidSubject(): string {
  const explicit = process.env.VAPID_SUBJECT?.trim();
  if (explicit) return explicit;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      return new URL(appUrl).origin;
    } catch {
      // Fall through to default contact.
    }
  }

  return "mailto:notifications@trainers-platform.local";
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
    getVapidSubject(),
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
  unreadCount?: number;
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
        unreadCount: message.unreadCount ?? 1,
      }),
      {
        TTL: 60 * 60 * 24,
        urgency: "high",
      },
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

    if (process.env.NODE_ENV !== "production") {
      console.error("[push] send failed:", statusCode, error);
    }

    return { ok: false as const, expired: statusCode === 404 || statusCode === 410 };
  }
}
