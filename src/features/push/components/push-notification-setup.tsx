"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isPushConfigured } from "@/lib/push-config";

import { usePushNotifications } from "../hooks/use-push-notifications";

const DISMISS_KEY = "push-prompt-dismissed";

export function PushNotificationSetup() {
  const { status, busy, error, enable, isConfigured } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!isConfigured || status === "loading" || status === "unsupported") {
    return null;
  }

  if (status === "enabled" || status === "denied" || dismissed || status !== "prompt") {
    return null;
  }

  async function handleEnable() {
    const ok = await enable();
    if (ok) {
      localStorage.setItem(DISMISS_KEY, "1");
      setDismissed(true);
    }
  }

  function dismissPrompt() {
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
            קבל/י עדכונים על אימונים גם כשהאפליקציה סגורה. ניתן לנהל זאת גם בעמוד «עדכונים».
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => void handleEnable()} disabled={busy}>
            {busy ? "מפעיל..." : "הפעלת התראות"}
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
