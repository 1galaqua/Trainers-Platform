import { CALENDAR_HISTORY_DAYS, CALENDAR_TIMEZONE } from "@/lib/calendar-config";
import {
  addIsraelDays,
  getIsraelDateString,
  getWeekStartDateString,
} from "@/lib/calendar-datetime";

export const CALENDAR_FORWARD_DAYS = 90;

export function getCalendarVisibleRange(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - CALENDAR_HISTORY_DAYS);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setDate(end.getDate() + CALENDAR_FORWARD_DAYS);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export type CalendarNavigationBounds = ReturnType<typeof getCalendarNavigationBounds>;

export function getCalendarNavigationBounds(now = new Date()) {
  const today = getIsraelDateString(now);
  const historyStart = addIsraelDays(today, -CALENDAR_HISTORY_DAYS);
  const forwardEnd = addIsraelDays(today, CALENDAR_FORWARD_DAYS);

  return {
    today,
    historyStart,
    forwardEnd,
    earliestWeekStart: getWeekStartDateString(historyStart),
    latestWeekStart: getWeekStartDateString(forwardEnd),
  };
}

export function clampCalendarAnchorDate(
  dateStr: string,
  bounds: CalendarNavigationBounds,
) {
  if (dateStr < bounds.historyStart) return bounds.historyStart;
  if (dateStr > bounds.forwardEnd) return bounds.forwardEnd;
  return dateStr;
}

export function isWorkoutInPast(startsAtIso: string, now = new Date()) {
  return new Date(startsAtIso) < now;
}

export function formatWorkoutDateTime(date: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: CALENDAR_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
