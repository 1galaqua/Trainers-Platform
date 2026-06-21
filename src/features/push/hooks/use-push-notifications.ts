"use client";

import { useCallback, useEffect, useState } from "react";

import { getVapidPublicKey, isPushConfigured } from "@/lib/push-config";
import { subscriptionToPayload, urlBase64ToUint8Array } from "@/lib/push-client";
import {
  getPushSubscriptionStatusAction,
  removePushSubscriptionAction,
  savePushSubscriptionAction,
} from "@/server/actions/push";

import {
  getCurrentPushSubscription,
  isPushSupported,
  isStandaloneDisplayMode,
  registerPushServiceWorker,
} from "../lib/push-support";

export type PushNotificationStatus =
  | "loading"
  | "not-configured"
  | "unsupported"
  | "prompt"
  | "denied"
  | "enabled"
  | "granted-no-subscription";

function getBrowserPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

async function subscribeAndSave() {
  const vapidPublicKey = getVapidPublicKey();
  if (!vapidPublicKey) return false;

  const registration = await registerPushServiceWorker();
  if (!registration) return false;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const payload = subscriptionToPayload(subscription);
  if (!payload) return false;

  const result = await savePushSubscriptionAction(payload);
  return !result.error;
}

async function unsubscribeAndRemove() {
  const subscription = await getCurrentPushSubscription();
  if (subscription) {
    const payload = subscriptionToPayload(subscription);
    if (payload) {
      await removePushSubscriptionAction(payload.endpoint);
    }
    await subscription.unsubscribe();
  }
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushNotificationStatus>("loading");
  const [isStandalone, setIsStandalone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isPushConfigured()) {
      setStatus("not-configured");
      return;
    }

    const permission = getBrowserPermission();
    if (permission === "unsupported") {
      setStatus("unsupported");
      return;
    }

    if (permission === "default") {
      setStatus("prompt");
      return;
    }

    if (permission === "denied") {
      setStatus("denied");
      return;
    }

    try {
      const [subscription, serverStatus] = await Promise.all([
        getCurrentPushSubscription(),
        getPushSubscriptionStatusAction(),
      ]);

      if (subscription && serverStatus.hasSubscription) {
        setStatus("enabled");
        return;
      }

      if (subscription) {
        const payload = subscriptionToPayload(subscription);
        if (payload) {
          await savePushSubscriptionAction(payload);
          setStatus("enabled");
          return;
        }
      }

      setStatus("granted-no-subscription");
    } catch {
      setStatus("granted-no-subscription");
    }
  }, []);

  useEffect(() => {
    setIsStandalone(isStandaloneDisplayMode());
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const permissionResult = await Notification.requestPermission();
      if (permissionResult !== "granted") {
        setError("יש לאשר התראות בדפדפן כדי לקבל עדכונים");
        await refresh();
        return false;
      }

      const saved = await subscribeAndSave();
      if (!saved) {
        setError("לא ניתן להפעיל התראות במכשיר זה");
        await refresh();
        return false;
      }

      await refresh();
      return true;
    } catch {
      setError("לא ניתן להפעיל התראות במכשיר זה");
      await refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      await unsubscribeAndRemove();
      await refresh();
      return true;
    } catch {
      setError("לא ניתן לבטל התראות כרגע");
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const syncIfGranted = useCallback(async () => {
    if (getBrowserPermission() !== "granted" || !isPushConfigured()) return;
    try {
      await subscribeAndSave();
      await refresh();
    } catch {
      // Silent refresh; user can retry from settings.
    }
  }, [refresh]);

  return {
    status,
    isStandalone,
    busy,
    error,
    enable,
    disable,
    refresh,
    syncIfGranted,
    isConfigured: isPushConfigured(),
  };
}
