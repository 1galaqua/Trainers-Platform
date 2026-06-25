import {
  getIsraelDateString,
  parseIsraelDateTime,
} from "@/lib/calendar-datetime";

export function toCoachingDateInputValue(value: string | null): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return getIsraelDateString(new Date(value));
}

export function parseCoachingDateInput(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return parseIsraelDateTime(trimmed, "12:00");
}

export function formatCoachingDisplayDate(value: string | null): string | null {
  if (!value) return null;
  const dateStr = toCoachingDateInputValue(value);
  const parsed = parseIsraelDateTime(dateStr, "12:00");
  if (!parsed) return null;

  return parsed.toLocaleDateString("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function serializeCoachingDateForClient(value: Date | null): string | null {
  if (!value) return null;
  return getIsraelDateString(value);
}
