import { validateTrackingDate, resolveTrackingRecordedAt } from "@/lib/tracking-validation";

export const WATER_PROGRESS_ID = "__water__";
export const WATER_MIN_ML = 0;
export const WATER_MAX_ML = 20000;

export function parseWaterAmountMl(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(parsed)) return null;
  if (!Number.isInteger(parsed)) return null;
  if (parsed < WATER_MIN_ML || parsed > WATER_MAX_ML) return null;
  return parsed;
}

export function validateWaterDate(dateStr: string, now = new Date()) {
  return validateTrackingDate(dateStr, now);
}

export function resolveWaterRecordedAt(dateStr: string, now = new Date()) {
  return resolveTrackingRecordedAt(dateStr, now);
}

export function formatWaterDisplay(amountMl: number) {
  const liters = Math.round((amountMl / 1000) * 100) / 100;
  return `${amountMl.toLocaleString("he-IL")} מ"ל · ${liters.toLocaleString("he-IL")} ליטר`;
}

export function mlToLitersInput(amountMl: number) {
  return Math.round((amountMl / 1000) * 1000) / 1000;
}

export function litersToMl(liters: number) {
  return Math.round(liters * 1000);
}
