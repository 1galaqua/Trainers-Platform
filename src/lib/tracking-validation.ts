import {
  getIsraelDateString,
  parseIsraelDateTime,
} from "@/lib/calendar-datetime";

export const TRACKING_WEEKDAY_LABELS: { value: number; label: string }[] = [
  { value: 0, label: "א׳" },
  { value: 1, label: "ב׳" },
  { value: 2, label: "ג׳" },
  { value: 3, label: "ד׳" },
  { value: 4, label: "ה׳" },
  { value: 5, label: "ו׳" },
  { value: 6, label: "ש׳" },
];

export function validateTrackingDate(dateStr: string, now = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return "תאריך לא תקין";
  }

  const today = getIsraelDateString(now);
  if (dateStr > today) {
    return "לא ניתן לרשום לתאריך עתידי";
  }

  if (!parseIsraelDateTime(dateStr, "12:00")) {
    return "תאריך לא תקין";
  }

  return null;
}

export function resolveTrackingRecordedAt(dateStr: string, now = new Date()): Date | null {
  const today = getIsraelDateString(now);
  if (dateStr === today) {
    return now;
  }

  return parseIsraelDateTime(dateStr, "12:00");
}

export function parseTrackingTimeLocal(value: unknown): string | null {
  const time = String(value ?? "").trim();
  if (!/^\d{2}:\d{2}$/.test(time)) return null;

  const [hour, minute] = time.split(":").map(Number);
  if (hour > 23 || minute > 59) return null;

  return time;
}

/** Keeps HH:mm draft while typing (24-hour, e.g. 17:30). */
export function sanitizeTimeInputDraft(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** Pads partial input to HH:mm when valid (e.g. 9:30 → 09:30). */
export function normalizeTimeInputValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const match = trimmed.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = match[2] == null || match[2] === "" ? 0 : Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour > 23 || minute > 59) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseTrackingDaysOfWeek(values: unknown): number[] | null {
  if (!Array.isArray(values) || values.length === 0) return null;

  const days = [...new Set(values.map((value) => Number(value)).filter((day) => day >= 0 && day <= 6))];
  if (days.length === 0) return null;

  return days.sort((a, b) => a - b);
}

export function parseWaterTimesLocal(values: unknown): string[] | null {
  const rawValues = Array.isArray(values) ? values : values == null ? [] : [values];
  const times = rawValues
    .map((value) => parseTrackingTimeLocal(value))
    .filter((time): time is string => time != null);
  const unique = [...new Set(times)].slice(0, 3);
  if (unique.length === 0) return null;
  return unique.sort();
}
