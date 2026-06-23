"use server";

import { revalidatePath } from "next/cache";

import { authorizeTrackingWrite } from "@/lib/tracking-access";
import {
  parseBodyWeightKg,
  resolveBodyWeightRecordedAt,
  validateBodyWeightDate,
  BODY_WEIGHT_MAX_KG,
  BODY_WEIGHT_MIN_KG,
} from "@/lib/body-weight-validation";
import {
  parseMeasurementCm,
  resolveMeasurementsRecordedAt,
  validateMeasurementsDate,
  type MeasurementFieldKey,
} from "@/lib/measurements-validation";
import {
  parseSteps,
  resolveStepsRecordedAt,
  validateStepsDate,
  STEPS_MAX,
  STEPS_MIN,
} from "@/lib/steps-validation";
import {
  parseSleepTime,
  resolveSleepRecordedAt,
  validateSleepDate,
} from "@/lib/sleep-validation";
import {
  litersToMl,
  parseWaterAmountMl,
  resolveWaterRecordedAt,
  validateWaterDate,
  WATER_MAX_ML,
  WATER_MIN_ML,
} from "@/lib/water-validation";
import { getIsraelDateString } from "@/lib/calendar-datetime";
import { prisma } from "@/lib/prisma";

const REVALIDATE_PATHS = [
  "/dashboard/tracking",
  "/dashboard/body-weight",
  "/dashboard/sleep",
  "/dashboard/water",
  "/dashboard/measurements",
  "/dashboard/trainees",
] as const;

function revalidateTrackingPaths(traineeId: string) {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  revalidatePath(`/dashboard/trainees/${traineeId}`);
}

export async function upsertTrackingBodyWeightAction(traineeId: string, formData: FormData) {
  const auth = await authorizeTrackingWrite(traineeId);
  if ("error" in auth) return { error: auth.error };

  const weightKg = parseBodyWeightKg(formData.get("weightKg"));
  if (weightKg == null) {
    return { error: `יש להזין משקל בין ${BODY_WEIGHT_MIN_KG} ל-${BODY_WEIGHT_MAX_KG} ק״ג` };
  }

  const dateStr = String(formData.get("date") ?? getIsraelDateString()).trim();
  const dateError = validateBodyWeightDate(dateStr);
  if (dateError) return { error: dateError };

  const recordedAt = resolveBodyWeightRecordedAt(dateStr);
  if (!recordedAt) return { error: "תאריך לא תקין" };

  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw.slice(0, 500) : null;

  try {
    await prisma.bodyWeightLog.upsert({
      where: { traineeId_recordedDay: { traineeId, recordedDay: dateStr } },
      create: { traineeId, weightKg, recordedAt, recordedDay: dateStr, notes },
      update: { weightKg, recordedAt, notes },
    });
  } catch {
    return { error: "שגיאה בשמירת המשקל" };
  }

  revalidateTrackingPaths(traineeId);
  return { success: true as const };
}

export async function upsertTrackingSleepAction(traineeId: string, formData: FormData) {
  const auth = await authorizeTrackingWrite(traineeId);
  if ("error" in auth) return { error: auth.error };

  const sleepStart = parseSleepTime(formData.get("sleepStart"));
  const sleepEnd = parseSleepTime(formData.get("sleepEnd"));
  if (!sleepStart || !sleepEnd) return { error: "יש להזין שעות התחלה וסיום תקינות" };

  const dateStr = String(formData.get("date") ?? getIsraelDateString()).trim();
  const dateError = validateSleepDate(dateStr);
  if (dateError) return { error: dateError };

  const recordedAt = resolveSleepRecordedAt(dateStr);
  if (!recordedAt) return { error: "תאריך לא תקין" };

  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw.slice(0, 500) : null;

  try {
    await prisma.sleepLog.upsert({
      where: { traineeId_recordedDay: { traineeId, recordedDay: dateStr } },
      create: { traineeId, sleepStart, sleepEnd, recordedAt, recordedDay: dateStr, notes },
      update: { sleepStart, sleepEnd, recordedAt, notes },
    });
  } catch {
    return { error: "שגיאה בשמירת השינה" };
  }

  revalidateTrackingPaths(traineeId);
  return { success: true as const };
}

export async function upsertTrackingWaterAction(traineeId: string, formData: FormData) {
  const auth = await authorizeTrackingWrite(traineeId);
  if ("error" in auth) return { error: auth.error };

  const litersRaw = formData.get("liters");
  const mlRaw = formData.get("amountMl");
  const amountMl =
    parseWaterAmountMl(mlRaw) ??
    (litersRaw != null && String(litersRaw).trim() !== ""
      ? litersToMl(Number(String(litersRaw).replace(",", ".")))
      : null);

  if (amountMl == null || amountMl < WATER_MIN_ML || amountMl > WATER_MAX_ML) {
    return { error: `יש להזין כמות בין ${WATER_MIN_ML} ל-${WATER_MAX_ML} מ"ל` };
  }

  const dateStr = String(formData.get("date") ?? getIsraelDateString()).trim();
  const dateError = validateWaterDate(dateStr);
  if (dateError) return { error: dateError };

  const recordedAt = resolveWaterRecordedAt(dateStr);
  if (!recordedAt) return { error: "תאריך לא תקין" };

  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw.slice(0, 500) : null;

  try {
    await prisma.waterLog.upsert({
      where: { traineeId_recordedDay: { traineeId, recordedDay: dateStr } },
      create: { traineeId, amountMl, recordedAt, recordedDay: dateStr, notes },
      update: { amountMl, recordedAt, notes },
    });
  } catch {
    return { error: "שגיאה בשמירת השתייה" };
  }

  revalidateTrackingPaths(traineeId);
  return { success: true as const };
}

export async function upsertTrackingStepsAction(traineeId: string, formData: FormData) {
  const auth = await authorizeTrackingWrite(traineeId);
  if ("error" in auth) return { error: auth.error };

  const steps = parseSteps(formData.get("steps"));
  if (steps == null) {
    return { error: `יש להזין צעדים בין ${STEPS_MIN} ל-${STEPS_MAX.toLocaleString("he-IL")}` };
  }

  const dateStr = String(formData.get("date") ?? getIsraelDateString()).trim();
  const dateError = validateStepsDate(dateStr);
  if (dateError) return { error: dateError };

  const recordedAt = resolveStepsRecordedAt(dateStr);
  if (!recordedAt) return { error: "תאריך לא תקין" };

  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw.slice(0, 500) : null;

  try {
    await prisma.stepsLog.upsert({
      where: { traineeId_recordedDay: { traineeId, recordedDay: dateStr } },
      create: { traineeId, steps, recordedAt, recordedDay: dateStr, notes },
      update: { steps, recordedAt, notes },
    });
  } catch {
    return { error: "שגיאה בשמירת הצעדים" };
  }

  revalidateTrackingPaths(traineeId);
  return { success: true as const };
}

export async function upsertTrackingMeasurementFieldAction(
  traineeId: string,
  formData: FormData,
) {
  const auth = await authorizeTrackingWrite(traineeId);
  if ("error" in auth) return { error: auth.error };

  const fieldKey = String(formData.get("fieldKey") ?? "").trim() as MeasurementFieldKey;
  const field = fieldKey ? { key: fieldKey } : null;
  if (!field) return { error: "שדה לא תקין" };

  const rawValue = formData.get("valueCm");
  if (rawValue == null || String(rawValue).trim() === "") {
    return { error: "יש להזין ערך" };
  }

  const valueCm = parseMeasurementCm(rawValue);
  if (valueCm == null) return { error: "ערך היקף לא תקין" };

  const dateStr = String(formData.get("date") ?? getIsraelDateString()).trim();
  const dateError = validateMeasurementsDate(dateStr);
  if (dateError) return { error: dateError };

  const recordedAt = resolveMeasurementsRecordedAt(dateStr);
  if (!recordedAt) return { error: "תאריך לא תקין" };

  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw.slice(0, 500) : null;

  try {
    const existing = await prisma.measurementsLog.findUnique({
      where: { traineeId_recordedDay: { traineeId, recordedDay: dateStr } },
    });

    if (existing) {
      await prisma.measurementsLog.update({
        where: { id: existing.id },
        data: { [fieldKey]: valueCm, recordedAt, notes: notes ?? existing.notes },
      });
    } else {
      await prisma.measurementsLog.create({
        data: {
          traineeId,
          coachId: auth.coachId,
          recordedDay: dateStr,
          recordedAt,
          notes,
          [fieldKey]: valueCm,
        },
      });
    }
  } catch {
    return { error: "שגיאה בשמירת ההיקף" };
  }

  revalidateTrackingPaths(traineeId);
  return { success: true as const };
}

export async function clearTrackingCellAction(
  traineeId: string,
  kind: string,
  dateStr: string,
  fieldKey?: string,
) {
  const auth = await authorizeTrackingWrite(traineeId);
  if ("error" in auth) return { error: auth.error };

  try {
    switch (kind) {
      case "body-weight":
        await prisma.bodyWeightLog.deleteMany({ where: { traineeId, recordedDay: dateStr } });
        break;
      case "sleep":
        await prisma.sleepLog.deleteMany({ where: { traineeId, recordedDay: dateStr } });
        break;
      case "water":
        await prisma.waterLog.deleteMany({ where: { traineeId, recordedDay: dateStr } });
        break;
      case "steps":
        await prisma.stepsLog.deleteMany({ where: { traineeId, recordedDay: dateStr } });
        break;
      case "measurement":
        if (!fieldKey) return { error: "שדה לא תקין" };
        {
          const existing = await prisma.measurementsLog.findUnique({
            where: { traineeId_recordedDay: { traineeId, recordedDay: dateStr } },
          });
          if (existing) {
            await prisma.measurementsLog.update({
              where: { id: existing.id },
              data: { [fieldKey]: null },
            });
          }
        }
        break;
      default:
        return { error: "סוג לא תקין" };
    }
  } catch {
    return { error: "שגיאה במחיקה" };
  }

  revalidateTrackingPaths(traineeId);
  return { success: true as const };
}
