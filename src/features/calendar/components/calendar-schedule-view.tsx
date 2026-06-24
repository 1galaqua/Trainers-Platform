"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CalendarViewMode } from "@/lib/calendar-config";
import {
  addIsraelDays,
  formatIsraelDayHeader,
  getWeekDateStrings,
  getWeekStartDateString,
  getWorkoutIsraelDateKey,
} from "@/lib/calendar-datetime";
import { clampCalendarAnchorDate, getCalendarNavigationBounds } from "@/lib/calendar-range";
import type { UserRole } from "@/lib/prisma-client";
import type { CalendarTraineeOption, CalendarWorkoutItem } from "@/server/actions/calendar";

import { CalendarTimeGrid } from "./calendar-time-grid";

type CalendarScheduleViewProps = {
  viewMode: CalendarViewMode;
  anchorDate: string;
  onAnchorDateChange: (date: string) => void;
  workouts: CalendarWorkoutItem[];
  userRole: UserRole;
  trainees?: CalendarTraineeOption[];
  scrollToWorkoutId?: string | null;
};

export function CalendarScheduleView({
  viewMode,
  anchorDate,
  onAnchorDateChange,
  workouts,
  userRole,
  trainees = [],
  scrollToWorkoutId = null,
}: CalendarScheduleViewProps) {
  const bounds = useMemo(() => getCalendarNavigationBounds(), []);
  const weekStart = getWeekStartDateString(anchorDate);
  const weekDates = useMemo(() => getWeekDateStrings(weekStart), [weekStart]);
  const dates = viewMode === "week" ? weekDates : [anchorDate];

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

  const isWeekView = viewMode === "week";
  const isToday = anchorDate === bounds.today;
  const isCurrentWeek = weekStart === getWeekStartDateString(bounds.today);

  const canGoBack = isWeekView
    ? weekStart > bounds.earliestWeekStart
    : anchorDate > bounds.historyStart;
  const canGoForward = isWeekView
    ? weekStart < bounds.latestWeekStart
    : anchorDate < bounds.forwardEnd;

  function shiftAnchor(deltaDays: number) {
    onAnchorDateChange(
      clampCalendarAnchorDate(addIsraelDays(anchorDate, deltaDays), bounds),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => shiftAnchor(isWeekView ? -7 : -1)}
          disabled={!canGoBack}
          aria-label={isWeekView ? "שבוע קודם" : "יום קודם"}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
        <div className="text-center">
          <p className="font-medium text-sm">
            {isWeekView
              ? `${formatIsraelDayHeader(weekDates[0])} – ${formatIsraelDayHeader(weekDates[6])}`
              : formatIsraelDayHeader(anchorDate)}
          </p>
          {isWeekView && !isCurrentWeek && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => onAnchorDateChange(bounds.today)}
            >
              חזרה לשבוע הנוכחי
            </Button>
          )}
          {!isWeekView && !isToday && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => onAnchorDateChange(bounds.today)}
            >
              חזרה להיום
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => shiftAnchor(isWeekView ? 7 : 1)}
          disabled={!canGoForward}
          aria-label={isWeekView ? "שבוע הבא" : "יום הבא"}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
      </div>

      <CalendarTimeGrid
        dates={dates}
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
