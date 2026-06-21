"use client";

import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadWorkoutICS } from "@/lib/workout-calendar-export";
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
  function handleAddToCalendar() {
    downloadWorkoutICS({
      id: workout.id,
      type: workout.type,
      workoutKind: workout.workoutKind,
      startsAt: workout.startsAt,
      durationMinutes: workout.durationMinutes,
      traineeName: workout.traineeName,
      programName: workout.programName,
      notes: workout.notes,
    });
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
      onClick={handleAddToCalendar}
    >
      <CalendarPlus className="size-3.5" aria-hidden />
      הוספה ליומן
    </Button>
  );
}
