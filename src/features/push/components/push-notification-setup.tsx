"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push-config";
import { subscriptionToPayload, urlBase64ToUint8Array } from "@/lib/push-client";
import {
  removePushSubscriptionAction,
  savePushSubscriptionAction,
} from "@/server/actions/push";

const DISMISS_KEY = "push-prompt-dismissed";

type PushPermissionState = NotificationPermission | "unsupported";

function getInitialPermission(): PushPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

async function syncPushSubscription() {
  const vapidPublicKey = getVapidPublicKey();
  if (!vapidPublicKey) return;

  const registration = await navigator.serviceWorker.register("/push-sw.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const payload = subscriptionToPayload(subscription);
  if (payload) {
    await savePushSubscriptionAction(payload);
  }
}

export function PushNotificationSetup() {
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setPermission(getInitialPermission());
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  useEffect(() => {
    if (!isPushConfigured() || permission !== "granted") return;

    syncPushSubscription().catch(() => {
      // Browser may block silent subscription refresh; user can use the banner.
    });
  }, [permission]);

  if (!isPushConfigured() || permission === "unsupported") {
    return null;
  }

  if (permission === "granted" || dismissed) {
    return null;
  }

  async function enablePush() {
    setLoading(true);
    setError(null);

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        setError("יש לאשר התראות בדפדפן כדי לקבל עדכונים");
        return;
      }

      await syncPushSubscription();
      setDismissed(true);
    } catch {
      setError("לא ניתן להפעיל התראות במכשיר זה");
    } finally {
      setLoading(false);
    }
  }

  async function dismissPrompt() {
    const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      const payload = subscriptionToPayload(subscription);
      if (payload) {
        await removePushSubscriptionAction(payload.endpoint);
        await subscription.unsubscribe();
      }
    }

    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-medium text-sm">
            <Bell className="size-4" aria-hidden />
            הפעלת התראות למכשיר
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            קבל/י עדכונים על אימונים גם כשהאפליקציה סגורה. מומלץ להוסיף את האפליקציה למסך הבית (PWA).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={enablePush} disabled={loading}>
            {loading ? "מפעיל..." : "הפעלת התראות"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={dismissPrompt}>
            <BellOff className="size-4" aria-hidden />
            לא עכשיו
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-destructive text-sm">{error}</p>}
    </div>
  );
}
