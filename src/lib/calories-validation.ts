import { validateTrackingDate, resolveTrackingRecordedAt } from "@/lib/tracking-validation";

export const CALORIES_MIN = 0;
export const CALORIES_MAX = 20_000;

export function parseCalories(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return null;
  if (!Number.isInteger(parsed)) return null;
  if (parsed < CALORIES_MIN || parsed > CALORIES_MAX) return null;
  return parsed;
}

export function validateCaloriesDate(dateStr: string, now = new Date()) {
  return validateTrackingDate(dateStr, now);
}

export function resolveCaloriesRecordedAt(dateStr: string, now = new Date()) {
  return resolveTrackingRecordedAt(dateStr, now);
}

export function formatCaloriesDisplay(calories: number) {
  return `${calories.toLocaleString("he-IL")} קק"ל`;
}
