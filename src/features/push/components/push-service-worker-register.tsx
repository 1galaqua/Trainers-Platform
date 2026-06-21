"use client";

import { useEffect } from "react";

import { isPushConfigured } from "@/lib/push-config";

import { usePushNotifications } from "../hooks/use-push-notifications";
import { registerPushServiceWorker } from "../lib/push-support";

export function PushServiceWorkerRegister() {
  const { syncIfGranted } = usePushNotifications();

  useEffect(() => {
    if (!isPushConfigured()) return;

    registerPushServiceWorker()
      .then(() => syncIfGranted())
      .catch(() => {
        // Service worker registration can fail outside secure context.
      });
  }, [syncIfGranted]);

  return null;
}
