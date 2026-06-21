"use client";

import { useEffect } from "react";

import { syncAppBadge } from "@/lib/app-badge";

type AppBadgeSyncProps = {
  unreadCount: number;
};

export function AppBadgeSync({ unreadCount }: AppBadgeSyncProps) {
  useEffect(() => {
    void syncAppBadge(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "SYNC_APP_BADGE" && typeof data.unreadCount === "number") {
        void syncAppBadge(data.unreadCount);
      }
    }

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, []);

  return null;
}
