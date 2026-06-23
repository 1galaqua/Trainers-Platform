import { validateTrackingDate, resolveTrackingRecordedAt } from "@/lib/tracking-validation";
import { parseTrackingTimeLocal } from "@/lib/tracking-validation";

export const SLEEP_PROGRESS_ID = "__sleep__";

export function validateSleepDate(dateStr: string, now = new Date()) {
  return validateTrackingDate(dateStr, now);
}

export function resolveSleepRecordedAt(dateStr: string, now = new Date()) {
  return resolveTrackingRecordedAt(dateStr, now);
}

export function parseSleepTime(value: unknown) {
  return parseTrackingTimeLocal(value);
}

export function computeSleepHours(sleepStart: string, sleepEnd: string): number {
  const [startH, startM] = sleepStart.split(":").map(Number);
  const [endH, endM] = sleepEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return Math.round(((endMinutes - startMinutes) / 60) * 10) / 10;
}

export function formatSleepRange(sleepStart: string, sleepEnd: string) {
  return `${sleepStart} – ${sleepEnd}`;
}

export function sleepHoursToRange(hours: number, sleepEnd = "07:00") {
  const [endH, endM] = sleepEnd.split(":").map(Number);
  const endMinutes = endH * 60 + endM;
  let startMinutes = endMinutes - Math.round(hours * 60);
  if (startMinutes < 0) startMinutes += 24 * 60;

  const startH = Math.floor(startMinutes / 60) % 24;
  const startM = startMinutes % 60;

  return {
    sleepStart: `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
    sleepEnd,
  };
}
