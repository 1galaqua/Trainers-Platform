import { validateTrackingDate, resolveTrackingRecordedAt } from "@/lib/tracking-validation";

export const STEPS_PROGRESS_ID = "__steps__";
export const STEPS_MIN = 0;
export const STEPS_MAX = 100_000;

export function parseSteps(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return null;
  if (!Number.isInteger(parsed)) return null;
  if (parsed < STEPS_MIN || parsed > STEPS_MAX) return null;
  return parsed;
}

export function validateStepsDate(dateStr: string, now = new Date()) {
  return validateTrackingDate(dateStr, now);
}

export function resolveStepsRecordedAt(dateStr: string, now = new Date()) {
  return resolveTrackingRecordedAt(dateStr, now);
}

export function formatStepsDisplay(steps: number) {
  return steps.toLocaleString("he-IL");
}
