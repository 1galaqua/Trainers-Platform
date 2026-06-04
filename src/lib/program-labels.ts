import type { ProgramType } from "@/lib/prisma-client";
import { DEFAULT_AGREEMENT_TEXT } from "@/lib/onboarding-template";

export const programTypeLabels: Record<ProgramType, string> = {
  STRENGTH: "כוח",
  HYPERTROPHY: "היפרטרופיה (מסה)",
  CUTTING: "חיטוב",
  ENDURANCE: "סיבולת",
  CUSTOM: "מותאם אישית",
};

export function calcVolume(weightKg: number, reps: number, sets: number): number {
  return weightKg * reps * sets;
}

export const agreementContent = DEFAULT_AGREEMENT_TEXT;
