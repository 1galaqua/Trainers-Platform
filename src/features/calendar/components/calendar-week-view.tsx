"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  addIsraelDays,
  formatIsraelDayHeader,
  getWeekDateStrings,
  getWeekStartDateString,
  getWorkoutIsraelDateKey,
} from "@/lib/calendar-datetime";
import { getCalendarNavigationBounds } from "@/lib/calendar-range";
import type { UserRole } from "@/lib/prisma-client";
import type { CalendarTraineeOption, CalendarWorkoutItem } from "@/server/actions/calendar";

import { CalendarTimeGrid } from "./calendar-time-grid";

type CalendarWeekViewProps = {
  workouts: CalendarWorkoutItem[];
  userRole: UserRole;
  trainees?: CalendarTraineeOption[];
};

export function CalendarWeekView({
  workouts,
  userRole,
  trainees = [],
}: CalendarWeekViewProps) {
  const bounds = useMemo(() => getCalendarNavigationBounds(), []);
  const [weekStart, setWeekStart] = useState(() =>
    getWeekStartDateString(bounds.today),
  );
  const weekDates = useMemo(() => getWeekDateStrings(weekStart), [weekStart]);

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, CalendarWorkoutItem[]>();

    for (const workout of workouts) {
      const key = getWorkoutIsraelDateKey(workout.startsAt);
      const list = map.get(key) ?? [];
      list.push(workout);
      map.set(key, list);
    }

    for (const list of map.values()) {
      list.sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
    }

    return map;
  }, [workouts]);

  const canGoBack = weekStart > bounds.earliestWeekStart;
  const canGoForward = weekStart < bounds.latestWeekStart;
  const isCurrentWeek = weekStart === getWeekStartDateString(bounds.today);

  function shiftWeek(delta: number) {
    setWeekStart((current) => {
      const next = addIsraelDays(current, delta * 7);
      if (delta < 0 && next < bounds.earliestWeekStart) {
        return bounds.earliestWeekStart;
      }
      if (delta > 0 && next > bounds.latestWeekStart) {
        return bounds.latestWeekStart;
      }
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
          onClick={() => shiftWeek(-1)}
          disabled={!canGoBack}
          aria-label="שבוע קודם"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
        <div className="text-center">
          <p className="font-medium text-sm">
            {formatIsraelDayHeader(weekDates[0])} – {formatIsraelDayHeader(weekDates[6])}
          </p>
          {!isCurrentWeek && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => setWeekStart(getWeekStartDateString(bounds.today))}
            >
              חזרה לשבוע הנוכחי
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => shiftWeek(1)}
          disabled={!canGoForward}
          aria-label="שבוע הבא"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
      </div>

      <CalendarTimeGrid
        dates={weekDates}
        workoutsByDate={workoutsByDate}
        userRole={userRole}
        trainees={trainees}
        today={bounds.today}
        historyStart={bounds.historyStart}
      />
    </div>
  );
}
