"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput, TimeInput } from "@/components/ui/date-input";
import { formatWorkoutDateTime } from "@/lib/calendar-range";
import { getIsraelDateAndTimeFromInstant } from "@/lib/calendar-datetime";
import { cn } from "@/lib/utils";
import type { CalendarEventItem } from "@/server/actions/calendar-events";
import {
  cancelCalendarEventReminderAction,
  setCalendarEventReminderAction,
} from "@/server/actions/calendar-event-reminders";

type EventReminderControlsProps = {
  event: CalendarEventItem;
  compact?: boolean;
  className?: string;
};

function reminderKindLabel(kind: NonNullable<CalendarEventItem["userReminder"]>["kind"]) {
  if (kind === "THIRTY_MINUTES") return "חצי שעה לפני";
  if (kind === "ONE_HOUR") return "שעה לפני";
  return "מותאם אישית";
}

export function EventReminderControls({
  event,
  compact = false,
  className,
}: EventReminderControlsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultCustom = useMemo(() => {
    const fallback = new Date(new Date(event.startsAt).getTime() - 30 * 60_000);
    return getIsraelDateAndTimeFromInstant(fallback);
  }, [event.startsAt]);

  const [customDate, setCustomDate] = useState(defaultCustom.date);
  const [customTime, setCustomTime] = useState(defaultCustom.time);

  async function handleSetReminder(kind: "THIRTY_MINUTES" | "ONE_HOUR" | "CUSTOM") {
    setLoading(true);
    setError(null);

    const result = await setCalendarEventReminderAction(
      event.id,
      kind,
      kind === "CUSTOM" ? customDate : undefined,
      kind === "CUSTOM" ? customTime : undefined,
    );

    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setConfirmingCancel(false);
    router.refresh();
  }

  async function handleCancelReminder() {
    setLoading(true);
    setError(null);

    const result = await cancelCalendarEventReminderAction(event.id);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setConfirmingCancel(false);
    router.refresh();
  }

  if (confirmingCancel) {
    return (
      <div
        className={cn(
          "space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2",
          compact ? "text-xs" : "text-sm",
          className,
        )}
      >
        <p className={compact ? "text-xs" : "text-sm"}>האם אתה בטוח?</p>
        {error && <p className="text-destructive text-xs">{error}</p>}
        <div className="flex w-full min-w-0 flex-wrap gap-1">
          <Button
            type="button"
            variant="destructive"
            size={compact ? "sm" : "default"}
            className={compact ? "min-w-0 flex-1 shrink px-1.5 text-xs" : "min-w-0 flex-1 shrink"}
            onClick={() => void handleCancelReminder()}
            disabled={loading}
          >
            {loading ? "מבטל..." : "כן"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "default"}
            className={compact ? "min-w-0 flex-1 shrink px-1.5 text-xs" : "min-w-0 flex-1 shrink"}
            onClick={() => {
              setConfirmingCancel(false);
              setError(null);
            }}
            disabled={loading}
          >
            לא
          </Button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className={cn("flex w-full min-w-0 flex-col gap-1", className)}>
        <Button
          type="button"
          variant={event.userReminder ? "secondary" : "outline"}
          size={compact ? "sm" : "default"}
          className={cn(
            compact ? "h-7 w-full min-w-0 shrink px-1.5 text-xs" : "min-w-0 flex-1 shrink",
          )}
          onClick={() => setOpen(true)}
        >
          <Bell className="size-3.5" aria-hidden />
          {event.userReminder ? "תזכורת פעילה" : "תזכורת"}
        </Button>

        {event.userReminder && (
          <Button
            type="button"
            variant="destructive"
            size={compact ? "sm" : "default"}
            className={cn(
              compact ? "h-7 w-full min-w-0 shrink px-1.5 text-xs" : "min-w-0 flex-1 shrink",
            )}
            onClick={() => setConfirmingCancel(true)}
          >
            <BellOff className="size-3.5" aria-hidden />
            בטל תזכורת
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border border-border bg-background/90 p-2",
        compact ? "text-xs" : "text-sm",
        className,
      )}
    >
      {event.userReminder ? (
        <p className="text-muted-foreground leading-relaxed">
          תזכורת: {reminderKindLabel(event.userReminder.kind)} ·{" "}
          {formatWorkoutDateTime(new Date(event.userReminder.scheduledFor))}
        </p>
      ) : (
        <p className="text-muted-foreground leading-relaxed">
          ברירת מחדל: תזכורת חצי שעה לפני האירוע.
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={compact ? "h-7 px-2 text-xs" : undefined}
          disabled={loading}
          onClick={() => void handleSetReminder("THIRTY_MINUTES")}
        >
          חצי שעה לפני
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={compact ? "h-7 px-2 text-xs" : undefined}
          disabled={loading}
          onClick={() => void handleSetReminder("ONE_HOUR")}
        >
          שעה לפני
        </Button>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-xs">תזכורת מותאמת</p>
        <div className="flex w-full min-w-0 flex-col gap-2">
          <DateInput
            className="w-full"
            value={customDate}
            onChange={(changeEvent) => setCustomDate(changeEvent.target.value)}
            max={getIsraelDateAndTimeFromInstant(new Date(event.startsAt)).date}
          />
          <TimeInput
            className="w-full"
            value={customTime}
            onChange={(changeEvent) => setCustomTime(changeEvent.target.value)}
          />
        </div>
        <Button
          type="button"
          size="sm"
          className={compact ? "h-7 w-full text-xs" : "w-full"}
          disabled={loading}
          onClick={() => void handleSetReminder("CUSTOM")}
        >
          שמירת תזכורת מותאמת
        </Button>
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={compact ? "h-7 w-full text-xs" : "w-full"}
        disabled={loading}
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
      >
        סגירה
      </Button>
    </div>
  );
}
