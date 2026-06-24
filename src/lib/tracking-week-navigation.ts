import {
  addIsraelDays,
  formatIsraelDayLabel,
  formatIsraelTrackingColumnDate,
  formatIsraelTrackingColumnDayName,
  getIsraelDateString,
  getWeekDateStrings,
  getWeekStartDateString,
} from "@/lib/calendar-datetime";

export function parseTrackingWeekStart(weekParam: string | undefined, now = new Date()): string {
  const today = getIsraelDateString(now);
  const currentWeekStart = getWeekStartDateString(today);

  if (!weekParam || !/^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    return currentWeekStart;
  }

  if (weekParam > currentWeekStart) {
    return currentWeekStart;
  }

  return getWeekStartDateString(weekParam);
}

export function canGoForwardWeek(weekStart: string, now = new Date()): boolean {
  const currentWeekStart = getWeekStartDateString(getIsraelDateString(now));
  return weekStart < currentWeekStart;
}

export function getPreviousWeekStart(weekStart: string): string {
  return addIsraelDays(weekStart, -7);
}

export function getNextWeekStart(weekStart: string): string {
  return addIsraelDays(weekStart, 7);
}

export function buildWeekDayHeaders(weekStart: string, now = new Date()) {
  const today = getIsraelDateString(now);
  const dates = getWeekDateStrings(weekStart);

  return dates.map((date) => ({
    date,
    label: formatIsraelDayLabel(date),
    dayName: formatIsraelTrackingColumnDayName(date),
    dateLabel: formatIsraelTrackingColumnDate(date),
    isToday: date === today,
    isFuture: date > today,
  }));
}

export function formatWeekRangeLabel(weekStart: string): string {
  const weekEnd = addIsraelDays(weekStart, 6);
  const startLabel = formatIsraelDayLabel(weekStart);
  const endLabel = formatIsraelDayLabel(weekEnd);
  return `${startLabel} – ${endLabel}`;
}

export function averageNumbers(values: Array<number | null | undefined>, decimals = 1): number | null {
  const filtered = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (filtered.length === 0) return null;
  const sum = filtered.reduce((acc, value) => acc + value, 0);
  const avg = sum / filtered.length;
  if (decimals === 0) return Math.round(avg);
  return Math.round(avg * 10 ** decimals) / 10 ** decimals;
}
