import { CALENDAR_TIMEZONE } from "@/lib/calendar-config";

type IsraelParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getIsraelParts(date: Date): IsraelParts {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: CALENDAR_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function parseIsraelDateTime(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  const target = { year, month, day, hour, minute };
  const startGuess = Date.UTC(year, month - 1, day, hour - 3, minute);

  for (let ms = startGuess - 3 * 60 * 60_000; ms <= startGuess + 3 * 60 * 60_000; ms += 60_000) {
    const candidate = new Date(ms);
    const parts = getIsraelParts(candidate);

    if (
      parts.year === target.year &&
      parts.month === target.month &&
      parts.day === target.day &&
      parts.hour === target.hour &&
      parts.minute === target.minute
    ) {
      return candidate;
    }
  }

  return null;
}

export function getIsraelDateString(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CALENDAR_TIMEZONE }).format(now);
}

export function getIsraelWeekdayIndex(dateStr: string): number {
  const noon = parseIsraelDateTime(dateStr, "12:00");
  if (!noon) return 0;

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_TIMEZONE,
    weekday: "short",
  }).format(noon);

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return map[weekday] ?? 0;
}

export function addIsraelDays(dateStr: string, days: number): string {
  const noon = parseIsraelDateTime(dateStr, "12:00");
  if (!noon) return dateStr;

  const next = new Date(noon.getTime() + days * 24 * 60 * 60_000);
  return getIsraelDateString(next);
}

export function getWeekStartDateString(dateStr: string): string {
  const weekday = getIsraelWeekdayIndex(dateStr);
  return addIsraelDays(dateStr, -weekday);
}

export function getWeekDateStrings(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addIsraelDays(weekStart, index));
}

export function getWorkoutIsraelDateKey(startsAtIso: string): string {
  return getIsraelDateString(new Date(startsAtIso));
}

export function formatIsraelTime(startsAtIso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: CALENDAR_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startsAtIso));
}

export function formatIsraelDayLabel(dateStr: string): string {
  const noon = parseIsraelDateTime(dateStr, "12:00");
  if (!noon) return dateStr;

  return new Intl.DateTimeFormat("he-IL", {
    timeZone: CALENDAR_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(noon);
}

/** e.g. "יום א׳, 14 יוני" */
export function formatIsraelDayHeader(dateStr: string): string {
  const noon = parseIsraelDateTime(dateStr, "12:00");
  if (!noon) return dateStr;

  const weekday = new Intl.DateTimeFormat("he-IL", {
    timeZone: CALENDAR_TIMEZONE,
    weekday: "short",
  }).format(noon);

  const day = new Intl.DateTimeFormat("he-IL", {
    timeZone: CALENDAR_TIMEZONE,
    day: "numeric",
  }).format(noon);

  const month = new Intl.DateTimeFormat("he-IL", {
    timeZone: CALENDAR_TIMEZONE,
    month: "long",
  }).format(noon);

  const dayName = weekday.startsWith("יום") ? weekday : `יום ${weekday}`;
  return `${dayName}, ${day} ${month}`;
}

export function getIsraelHourMinuteFromInstant(instant: Date): { hour: number; minute: number } {
  const parts = getIsraelParts(instant);
  return { hour: parts.hour, minute: parts.minute };
}

export function formatIsraelHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function formatIsraelDayLabelLong(dateStr: string): string {
  const noon = parseIsraelDateTime(dateStr, "12:00");
  if (!noon) return dateStr;

  return new Intl.DateTimeFormat("he-IL", {
    timeZone: CALENDAR_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(noon);
}

export function isDateOnOrAfterTodayInIsrael(dateStr: string, now = new Date()): boolean {
  return dateStr >= getIsraelDateString(now);
}

export function getIsraelDateAndTimeFromInstant(instant: Date): { date: string; time: string } {
  const date = getIsraelDateString(instant);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: CALENDAR_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(instant);

  return { date, time };
}
