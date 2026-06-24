"use client";

import { CalendarPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCalendarFeedback } from "@/features/calendar/components/calendar-feedback-context";
import { addWorkoutToCalendar } from "@/lib/workout-calendar-export";
import type { CalendarWorkoutItem } from "@/server/actions/calendar";
import { cn } from "@/lib/utils";

type AddToCalendarButtonProps = {
  workout: CalendarWorkoutItem;
  compact?: boolean;
  className?: string;
};

export function AddToCalendarButton({
  workout,
  compact = false,
  className,
}: AddToCalendarButtonProps) {
  const { showSuccess } = useCalendarFeedback();
  const [loading, setLoading] = useState(false);

  async function handleAddToCalendar() {
    setLoading(true);
    try {
      const result = await addWorkoutToCalendar({
        id: workout.id,
        type: workout.type,
        workoutKind: workout.workoutKind,
        startsAt: workout.startsAt,
        durationMinutes: workout.durationMinutes,
        deliveryMode: workout.deliveryMode,
        meetingLink: workout.meetingLink,
        traineeName: workout.traineeName,
        programName: workout.programName,
        notes: workout.notes,
      });
      showSuccess(
        result === "downloaded"
          ? "קובץ היומן הורד"
          : result === "google-calendar"
            ? "נפתח Google Calendar — לחצ/י שמור"
            : result === "shared"
              ? "בחר/י יומן לשמירת האירוע"
              : "פתח/י את היומן כדי לאשר את ההוספה",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      showSuccess("לא ניתן להוסיף ליומן כרגע");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "sm" : "default"}
      className={cn(
        compact ? "h-7 w-full min-w-0 shrink px-1.5 text-xs" : "min-w-0 flex-1 shrink",
        className,
      )}
      onClick={() => void handleAddToCalendar()}
      disabled={loading}
    >
      <CalendarPlus className="size-3.5" aria-hidden />
      {loading ? "מוסיף..." : "הוספה ליומן"}
    </Button>
  );
}
