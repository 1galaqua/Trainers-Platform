"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  addIsraelDays,
  formatIsraelDayHeader,
  getWorkoutIsraelDateKey,
} from "@/lib/calendar-datetime";
import { getCalendarNavigationBounds } from "@/lib/calendar-range";
import type { UserRole } from "@/lib/prisma-client";
import type { CalendarTraineeOption, CalendarWorkoutItem } from "@/server/actions/calendar";

import { CalendarTimeGrid } from "./calendar-time-grid";

type CalendarDayViewProps = {
  workouts: CalendarWorkoutItem[];
  userRole: UserRole;
  trainees?: CalendarTraineeOption[];
  initialFocusDate?: string;
  scrollToWorkoutId?: string | null;
};

function clampFocusDate(
  dateStr: string,
  bounds: ReturnType<typeof getCalendarNavigationBounds>,
) {
  if (dateStr < bounds.historyStart) return bounds.historyStart;
  if (dateStr > bounds.forwardEnd) return bounds.forwardEnd;
  return dateStr;
}

export function CalendarDayView({
  workouts,
  userRole,
  trainees = [],
  initialFocusDate,
  scrollToWorkoutId = null,
}: CalendarDayViewProps) {
  const bounds = useMemo(() => getCalendarNavigationBounds(), []);
  const [focusDate, setFocusDate] = useState(() =>
    initialFocusDate ? clampFocusDate(initialFocusDate, bounds) : bounds.today,
  );

  useEffect(() => {
    if (initialFocusDate) {
      setFocusDate(clampFocusDate(initialFocusDate, bounds));
    }
  }, [initialFocusDate, bounds]);

  const workoutsByDate = useMemo(() => {
    const dayWorkouts = workouts
      .filter((workout) => getWorkoutIsraelDateKey(workout.startsAt) === focusDate)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    return new Map([[focusDate, dayWorkouts]]);
  }, [focusDate, workouts]);

  const canGoBack = focusDate > bounds.historyStart;
  const canGoForward = focusDate < bounds.forwardEnd;
  const isToday = focusDate === bounds.today;

  function shiftDay(delta: number) {
    setFocusDate((current) => {
      const next = addIsraelDays(current, delta);
      if (next < bounds.historyStart) return bounds.historyStart;
      if (next > bounds.forwardEnd) return bounds.forwardEnd;
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => shiftDay(-1)}
          disabled={!canGoBack}
          aria-label="יום קודם"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
        <div className="text-center">
          <p className="font-medium text-sm">{formatIsraelDayHeader(focusDate)}</p>
          {!isToday && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => setFocusDate(bounds.today)}
            >
              חזרה להיום
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => shiftDay(1)}
          disabled={!canGoForward}
          aria-label="יום הבא"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
      </div>

      <CalendarTimeGrid
        dates={[focusDate]}
        workoutsByDate={workoutsByDate}
        userRole={userRole}
        trainees={trainees}
        today={bounds.today}
        historyStart={bounds.historyStart}
        scrollToWorkoutId={scrollToWorkoutId}
      />
    </div>
  );
}
