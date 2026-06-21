"use client";

import { Bell, BellOff, CheckCircle2, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { usePushNotifications } from "../hooks/use-push-notifications";

type PushNotificationSettingsProps = {
  className?: string;
  compact?: boolean;
};

function StatusBadge({
  enabled,
  label,
}: {
  enabled: boolean;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        enabled ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground",
      )}
    >
      {enabled && <CheckCircle2 className="size-3" aria-hidden />}
      {label}
    </span>
  );
}

export function PushNotificationSettings({ className, compact = false }: PushNotificationSettingsProps) {
  const { status, isStandalone, busy, error, enable, disable, isConfigured } = usePushNotifications();

  if (!isConfigured || status === "loading" || status === "unsupported") {
    return null;
  }

  const isEnabled = status === "enabled";
  const showPwaHint = !isStandalone && !compact;

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardContent className={cn("space-y-3", compact ? "py-3" : "py-4")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="flex items-center gap-2 font-medium text-sm">
              {isEnabled ? (
                <Bell className="size-4 text-primary" aria-hidden />
              ) : (
                <BellOff className="size-4 text-muted-foreground" aria-hidden />
              )}
              התראות Push למכשיר
            </p>
            {!compact && (
              <p className="max-w-xl text-muted-foreground text-sm leading-relaxed">
                קבל/י הודעות על אימונים ישירות למסך הנעילה — גם כשהאפליקציה סגורה או שמורה במסך הבית.
              </p>
            )}
          </div>
          <StatusBadge
            enabled={isEnabled}
            label={
              isEnabled
                ? "פעיל"
                : status === "denied"
                  ? "חסום בדפדפן"
                  : "לא פעיל"
            }
          />
        </div>

        {showPwaHint && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-muted-foreground text-xs leading-relaxed">
            <Smartphone className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              לקבלת Push ותג אדום על האייקון: הוסיפ/י את האפליקציה למסך הבית, ואז הפעיל/י התראות מתוך האפליקציה
              (לא מדפדפן רגיל). ב-iPhone נדרש iOS 16.4 ומעלה.
            </p>
          </div>
        )}

        {status === "granted-no-subscription" && (
          <p className="text-muted-foreground text-xs leading-relaxed">
            ההרשאה אושרה אך המנוי לא נשמר. לחצ/י «הפעלת התראות» שוב.
          </p>
        )}

        {isEnabled && isStandalone && (
          <p className="text-muted-foreground text-xs leading-relaxed">
            כשיש עדכונים שלא נקראו, יוצג מספר אדום על אייקון האפליקציה במסך הבית (במכשירים שתומכים בכך).
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!isEnabled && status !== "denied" && (
            <Button type="button" size="sm" onClick={() => void enable()} disabled={busy}>
              {busy ? "מפעיל..." : "הפעלת התראות"}
            </Button>
          )}

          {isEnabled && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void disable()}
              disabled={busy}
            >
              {busy ? "מבטל..." : "ביטול התראות"}
            </Button>
          )}

          {status === "denied" && (
            <p className="text-muted-foreground text-xs leading-relaxed">
              ההתראות חסומות בהגדרות הדפדפן. יש לאפשר התראות עבור האתר ולרענן את העמוד.
            </p>
          )}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}
