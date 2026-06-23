import { validateTrackingDate, resolveTrackingRecordedAt } from "@/lib/tracking-validation";

export const MEASUREMENTS_PROGRESS_ID_PREFIX = "__measurements__";

export const MEASUREMENT_FIELDS = [
  { key: "bellyCm", label: "היקף בטן (קו טבור)", progressId: `${MEASUREMENTS_PROGRESS_ID_PREFIX}belly` },
  { key: "shouldersCm", label: "היקף כתפיים", progressId: `${MEASUREMENTS_PROGRESS_ID_PREFIX}shoulders` },
  { key: "rightArmCm", label: "היקף יד ימין", progressId: `${MEASUREMENTS_PROGRESS_ID_PREFIX}right_arm` },
  { key: "rightForearmCm", label: "היקף אמה ימין", progressId: `${MEASUREMENTS_PROGRESS_ID_PREFIX}right_forearm` },
  { key: "leftArmCm", label: "היקף יד שמאל", progressId: `${MEASUREMENTS_PROGRESS_ID_PREFIX}left_arm` },
  { key: "leftForearmCm", label: "היקף אמה שמאל", progressId: `${MEASUREMENTS_PROGRESS_ID_PREFIX}left_forearm` },
  { key: "rightLegCm", label: "היקף רגל ימין", progressId: `${MEASUREMENTS_PROGRESS_ID_PREFIX}right_leg` },
  { key: "leftLegCm", label: "היקף רגל שמאל", progressId: `${MEASUREMENTS_PROGRESS_ID_PREFIX}left_leg` },
  { key: "chestCm", label: "היקף חזה", progressId: `${MEASUREMENTS_PROGRESS_ID_PREFIX}chest` },
  { key: "rightCalfCm", label: "היקף שוק ימין", progressId: `${MEASUREMENTS_PROGRESS_ID_PREFIX}right_calf` },
  { key: "leftCalfCm", label: "היקף שוק שמאל", progressId: `${MEASUREMENTS_PROGRESS_ID_PREFIX}left_calf` },
] as const;

export type MeasurementFieldKey = (typeof MEASUREMENT_FIELDS)[number]["key"];

export const MEASUREMENT_MIN_CM = 20;
export const MEASUREMENT_MAX_CM = 250;

export function parseMeasurementCm(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed)) return null;
  if (parsed < MEASUREMENT_MIN_CM || parsed > MEASUREMENT_MAX_CM) return null;
  return Math.round(parsed * 10) / 10;
}

export function validateMeasurementsDate(dateStr: string, now = new Date()) {
  return validateTrackingDate(dateStr, now);
}

export function resolveMeasurementsRecordedAt(dateStr: string, now = new Date()) {
  return resolveTrackingRecordedAt(dateStr, now);
}

export function parseMeasurementsForm(formData: FormData) {
  const values: Partial<Record<MeasurementFieldKey, number>> = {};

  for (const field of MEASUREMENT_FIELDS) {
    const raw = formData.get(field.key);
    if (raw == null || String(raw).trim() === "") continue;
    const parsed = parseMeasurementCm(raw);
    if (parsed == null) {
      return { error: `${field.label}: יש להזין ערך בין ${MEASUREMENT_MIN_CM} ל-${MEASUREMENT_MAX_CM} ס"מ` as const };
    }
    values[field.key] = parsed;
  }

  if (Object.keys(values).length === 0) {
    return { error: "יש להזין לפחות היקף אחד" as const };
  }

  return { values };
}
