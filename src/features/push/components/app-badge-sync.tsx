"use client";

import { useEffect } from "react";

import { syncAppBadge } from "@/lib/app-badge";
import { getUnreadNotificationCountAction } from "@/server/actions/notifications";

type AppBadgeSyncProps = {
  unreadCount: number;
};

const BADGE_POLL_MS = 15_000;

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

  useEffect(() => {
    let cancelled = false;

    async function refreshBadgeFromServer() {
      try {
        const count = await getUnreadNotificationCountAction();
        if (!cancelled) await syncAppBadge(count);
      } catch {
        // ignore badge refresh errors
      }
    }

    void refreshBadgeFromServer();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshBadgeFromServer();
      }
    }, BADGE_POLL_MS);

    function handleAppResume() {
      void refreshBadgeFromServer();
    }

    document.addEventListener("visibilitychange", handleAppResume);
    window.addEventListener("focus", handleAppResume);
    window.addEventListener("pageshow", handleAppResume);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleAppResume);
      window.removeEventListener("focus", handleAppResume);
      window.removeEventListener("pageshow", handleAppResume);
    };
  }, []);

  return null;
}
