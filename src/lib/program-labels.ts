import type { PhotoCategory, ProgramType } from "@/lib/prisma-client";
import { DEFAULT_AGREEMENT_TEXT } from "@/lib/onboarding-template";

export const programTypeLabels: Record<ProgramType, string> = {
  STRENGTH: "כוח",
  HYPERTROPHY: "היפרטרופיה (מסה)",
  CUTTING: "חיטוב",
  ENDURANCE: "סיבולת",
  CUSTOM: "מותאם אישית",
};

export const photoCategoryLabels: Record<PhotoCategory, string> = {
  FRONT: "חזית",
  SIDE: "צד",
  BACK: "גב",
};

export function calcVolume(weightKg: number, reps: number, sets: number): number {
  return weightKg * reps * sets;
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const agreementContent = DEFAULT_AGREEMENT_TEXT;
