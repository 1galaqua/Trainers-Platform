import {
  getIsraelDateString,
  parseIsraelDateTime,
} from "@/lib/calendar-datetime";

export const BODY_WEIGHT_MIN_KG = 30;
export const BODY_WEIGHT_MAX_KG = 300;
export const BODY_WEIGHT_PROGRESS_ID = "__body_weight__";

export function parseBodyWeightKg(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(parsed)) return null;
  if (parsed < BODY_WEIGHT_MIN_KG || parsed > BODY_WEIGHT_MAX_KG) return null;
  return Math.round(parsed * 10) / 10;
}

export function validateBodyWeightDate(dateStr: string, now = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return "תאריך לא תקין";
  }

  const today = getIsraelDateString(now);
  if (dateStr > today) {
    return "לא ניתן לרשום משקל לתאריך עתידי";
  }

  if (!parseIsraelDateTime(dateStr, "12:00")) {
    return "תאריך לא תקין";
  }

  return null;
}

export function resolveBodyWeightRecordedAt(dateStr: string, now = new Date()): Date | null {
  const today = getIsraelDateString(now);
  if (dateStr === today) {
    return now;
  }

  return parseIsraelDateTime(dateStr, "12:00");
}

export function parseBodyWeightTimeLocal(value: unknown): string | null {
  const time = String(value ?? "").trim();
  if (!/^\d{2}:\d{2}$/.test(time)) return null;

  const [hour, minute] = time.split(":").map(Number);
  if (hour > 23 || minute > 59) return null;

  return time;
}

export function parseBodyWeightDaysOfWeek(values: unknown): number[] | null {
  if (!Array.isArray(values) || values.length === 0) return null;

  const days = [...new Set(values.map((value) => Number(value)).filter((day) => day >= 0 && day <= 6))];
  if (days.length === 0) return null;

  return days.sort((a, b) => a - b);
}

export const BODY_WEIGHT_WEEKDAY_LABELS: { value: number; label: string }[] = [
  { value: 0, label: "א׳" },
  { value: 1, label: "ב׳" },
  { value: 2, label: "ג׳" },
  { value: 3, label: "ד׳" },
  { value: 4, label: "ה׳" },
  { value: 5, label: "ו׳" },
  { value: 6, label: "ש׳" },
];
