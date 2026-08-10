export const CALENDAR_TIMEZONE = "Asia/Jerusalem";

/** How far back workouts remain visible in the calendar UI. */
export const CALENDAR_HISTORY_DAYS = 90;

/** Visible hours in the calendar time grid (Israel time). */
export const CALENDAR_GRID_START_HOUR = 6;
export const CALENDAR_GRID_END_HOUR = 24;
export const CALENDAR_HOUR_HEIGHT_PX = 56;

export type CalendarViewMode = "week" | "day";

export const calendarViewLabels: Record<CalendarViewMode, string> = {
  week: "שבועי",
  day: "יומי",
};
