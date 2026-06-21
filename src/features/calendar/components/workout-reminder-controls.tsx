"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput, TimeInput } from "@/components/ui/date-input";
import { formatWorkoutDateTime } from "@/lib/calendar-range";
import { getIsraelDateAndTimeFromInstant } from "@/lib/calendar-datetime";
import { cn } from "@/lib/utils";
import type { CalendarWorkoutItem } from "@/server/actions/calendar";
import {
  cancelWorkoutReminderAction,
  setWorkoutReminderAction,
} from "@/server/actions/workout-reminders";

type WorkoutReminderControlsProps = {
  workout: CalendarWorkoutItem;
  compact?: boolean;
  className?: string;
};

function reminderKindLabel(kind: NonNullable<CalendarWorkoutItem["userReminder"]>["kind"]) {
  if (kind === "THIRTY_MINUTES") return "חצי שעה לפני";
  if (kind === "ONE_HOUR") return "שעה לפני";
  return "מותאם אישית";
}

export function WorkoutReminderControls({
  workout,
  compact = false,
  className,
}: WorkoutReminderControlsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultCustom = useMemo(() => {
    const fallback = new Date(new Date(workout.startsAt).getTime() - 30 * 60_000);
    return getIsraelDateAndTimeFromInstant(fallback);
  }, [workout.startsAt]);

  const [customDate, setCustomDate] = useState(defaultCustom.date);
  const [customTime, setCustomTime] = useState(defaultCustom.time);

  async function handleSetReminder(
    kind: "THIRTY_MINUTES" | "ONE_HOUR" | "CUSTOM",
  ) {
    setLoading(true);
    setError(null);

    const result = await setWorkoutReminderAction(
      workout.id,
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

    const result = await cancelWorkoutReminderAction(workout.id);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setConfirmingCancel(false);
    router.refresh();
  }

  function dismissCancelConfirm() {
    setConfirmingCancel(false);
    setError(null);
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
            onClick={dismissCancelConfirm}
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
          variant={workout.userReminder ? "secondary" : "outline"}
          size={compact ? "sm" : "default"}
          className={cn(
            compact ? "h-7 w-full min-w-0 shrink px-1.5 text-xs" : "min-w-0 flex-1 shrink",
          )}
          onClick={() => setOpen(true)}
        >
          <Bell className="size-3.5" aria-hidden />
          {workout.userReminder ? "תזכורת פעילה" : "תזכורת"}
        </Button>

        {workout.userReminder && (
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
      {workout.userReminder ? (
        <p className="text-muted-foreground leading-relaxed">
          תזכורת: {reminderKindLabel(workout.userReminder.kind)} ·{" "}
          {formatWorkoutDateTime(new Date(workout.userReminder.scheduledFor))}
        </p>
      ) : (
        <p className="text-muted-foreground leading-relaxed">
          ברירת מחדל: תזכורת חצי שעה לפני האימון. בזמן התזכורת תקבל/י הודעת Push ועדכון
          בעמוד «עדכונים».
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

      <div className="space-y-1">
        <p className="font-medium text-xs">תזכורת מותאמת</p>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          <DateInput
            value={customDate}
            onChange={(event) => setCustomDate(event.target.value)}
            max={getIsraelDateAndTimeFromInstant(new Date(workout.startsAt)).date}
          />
          <TimeInput value={customTime} onChange={(event) => setCustomTime(event.target.value)} />
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

      {workout.userReminder && (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className={compact ? "h-7 w-full text-xs" : "w-full"}
          disabled={loading}
          onClick={() => setConfirmingCancel(true)}
        >
          <BellOff className="size-3.5" aria-hidden />
          בטל תזכורת
        </Button>
      )}

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
