import type { CalendarEventItem } from "@/server/actions/calendar-events";
import type { CalendarWorkoutItem } from "@/server/actions/calendar";

export type CalendarScheduleItem = CalendarWorkoutItem | CalendarEventItem;

export function isCalendarWorkoutItem(item: CalendarScheduleItem): item is CalendarWorkoutItem {
  return item.kind === "workout";
}

export function isCalendarEventItem(item: CalendarScheduleItem): item is CalendarEventItem {
  return item.kind === "event";
}

export type CalendarTimedItem = Pick<CalendarScheduleItem, "id" | "startsAt" | "durationMinutes">;
