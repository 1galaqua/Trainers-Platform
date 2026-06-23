"use server";

import { revalidatePath } from "next/cache";

import { mapMeasurementsLogsToChartSeries } from "@/lib/measurements-chart-data";
import {
  parseMeasurementsForm,
  resolveMeasurementsRecordedAt,
  validateMeasurementsDate,
} from "@/lib/measurements-validation";
import { getCurrentUser, requireCoach, requireTraineeOnboarded } from "@/lib/auth";
import { getTraineeCoachId, isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { getIsraelDateString } from "@/lib/calendar-datetime";
import { prisma } from "@/lib/prisma";

export type MeasurementsLogItem = {
  id: string;
  recordedDay: string;
  recordedAt: string;
  notes: string | null;
  bellyCm: number | null;
  shouldersCm: number | null;
  rightArmCm: number | null;
  rightForearmCm: number | null;
  leftArmCm: number | null;
  leftForearmCm: number | null;
  rightLegCm: number | null;
  leftLegCm: number | null;
  chestCm: number | null;
  rightCalfCm: number | null;
  leftCalfCm: number | null;
};

export type MeasurementsPageData = {
  logs: MeasurementsLogItem[];
  traineeName: string;
};

function mapLog(log: {
  id: string;
  recordedDay: string;
  recordedAt: Date;
  notes: string | null;
  bellyCm: number | null;
  shouldersCm: number | null;
  rightArmCm: number | null;
  rightForearmCm: number | null;
  leftArmCm: number | null;
  leftForearmCm: number | null;
  rightLegCm: number | null;
  leftLegCm: number | null;
  chestCm: number | null;
  rightCalfCm: number | null;
  leftCalfCm: number | null;
}): MeasurementsLogItem {
  return {
    id: log.id,
    recordedDay: log.recordedDay,
    recordedAt: log.recordedAt.toISOString(),
    notes: log.notes,
    bellyCm: log.bellyCm,
    shouldersCm: log.shouldersCm,
    rightArmCm: log.rightArmCm,
    rightForearmCm: log.rightForearmCm,
    leftArmCm: log.leftArmCm,
    leftForearmCm: log.leftForearmCm,
    rightLegCm: log.rightLegCm,
    leftLegCm: log.leftLegCm,
    chestCm: log.chestCm,
    rightCalfCm: log.rightCalfCm,
    leftCalfCm: log.leftCalfCm,
  };
}

const REVALIDATE_PATHS = ["/dashboard/tracking", "/dashboard/measurements", "/dashboard/trainees"] as const;

function revalidateMeasurementsPaths(traineeId: string) {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  revalidatePath(`/dashboard/trainees/${traineeId}`);
}

async function loadMeasurementsLogs(traineeId: string) {
  const logs = await prisma.measurementsLog.findMany({
    where: { traineeId },
    orderBy: { recordedAt: "desc" },
  });
  return logs.map(mapLog);
}

async function authorizeMeasurementsWrite(
  traineeId: string,
): Promise<{ error: string } | { coachId: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "אין הרשאה" };

  if (user.role === "COACH") {
    const ownsTrainee = await isCoachOwnerOfTrainee(user.id, traineeId);
    if (!ownsTrainee) return { error: "מתאמן לא נמצא" };
    return { coachId: user.id };
  }

  if (user.role === "TRAINEE") {
    const trainee = await requireTraineeOnboarded();
    if (trainee.id !== traineeId) return { error: "אין הרשאה" };
    const coachId = await getTraineeCoachId(trainee.id);
    if (!coachId) return { error: "לא נמצא מאמן מקושר" };
    return { coachId };
  }

  return { error: "אין הרשאה" };
}

async function buildChartSeriesForTrainee(traineeId: string) {
  const logs = await prisma.measurementsLog.findMany({
    where: { traineeId },
    orderBy: { recordedAt: "asc" },
  });
  return mapMeasurementsLogsToChartSeries(logs);
}

export async function loadMeasurementsLogsForTrainee(traineeId: string) {
  return loadMeasurementsLogs(traineeId);
}

export async function getTraineeMeasurementsPageDataAction(): Promise<MeasurementsPageData> {
  const trainee = await requireTraineeOnboarded();
  const logs = await loadMeasurementsLogs(trainee.id);

  return {
    logs,
    traineeName: trainee.displayName ?? "מתאמן",
  };
}

export async function getCoachTraineeMeasurementsChartAction(traineeId: string) {
  const coach = await requireCoach();
  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return [];
  return buildChartSeriesForTrainee(traineeId);
}

export async function getTraineeMeasurementsChartAction() {
  const trainee = await requireTraineeOnboarded();
  return buildChartSeriesForTrainee(trainee.id);
}

export async function upsertMeasurementsLogAction(traineeId: string, formData: FormData) {
  const auth = await authorizeMeasurementsWrite(traineeId);
  if ("error" in auth) return { error: auth.error };

  const parsed = parseMeasurementsForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const dateStr = String(formData.get("date") ?? getIsraelDateString()).trim();
  const dateError = validateMeasurementsDate(dateStr);
  if (dateError) return { error: dateError };

  const recordedAt = resolveMeasurementsRecordedAt(dateStr);
  if (!recordedAt) return { error: "תאריך לא תקין" };

  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw.slice(0, 500) : null;

  const data = {
    coachId: auth.coachId,
    recordedAt,
    notes,
    bellyCm: parsed.values.bellyCm ?? null,
    shouldersCm: parsed.values.shouldersCm ?? null,
    rightArmCm: parsed.values.rightArmCm ?? null,
    rightForearmCm: parsed.values.rightForearmCm ?? null,
    leftArmCm: parsed.values.leftArmCm ?? null,
    leftForearmCm: parsed.values.leftForearmCm ?? null,
    rightLegCm: parsed.values.rightLegCm ?? null,
    leftLegCm: parsed.values.leftLegCm ?? null,
    chestCm: parsed.values.chestCm ?? null,
    rightCalfCm: parsed.values.rightCalfCm ?? null,
    leftCalfCm: parsed.values.leftCalfCm ?? null,
  };

  try {
    await prisma.measurementsLog.upsert({
      where: {
        traineeId_recordedDay: { traineeId, recordedDay: dateStr },
      },
      create: {
        traineeId,
        recordedDay: dateStr,
        ...data,
      },
      update: data,
    });
  } catch {
    return { error: "שגיאה בשמירת ההיקפים" };
  }

  revalidateMeasurementsPaths(traineeId);
  return { success: true as const };
}

export async function deleteMeasurementsLogAction(traineeId: string, logId: string) {
  const auth = await authorizeMeasurementsWrite(traineeId);
  if ("error" in auth) return { error: auth.error };
  if (!logId) return { error: "רשומה לא נמצאה" };

  try {
    const existing = await prisma.measurementsLog.findFirst({
      where: { id: logId, traineeId },
      select: { id: true },
    });
    if (!existing) return { error: "רשומה לא נמצאה" };
    await prisma.measurementsLog.delete({ where: { id: logId } });
  } catch {
    return { error: "שגיאה במחיקת הרשומה" };
  }

  revalidateMeasurementsPaths(traineeId);
  return { success: true as const };
}
