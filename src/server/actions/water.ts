"use server";

import { revalidatePath } from "next/cache";

import { mapWaterLogsToChartData, resolveWaterCurrentDisplay } from "@/lib/water-chart-data";
import {
  parseTrackingDaysOfWeek,
  parseTrackingTimeLocal,
  parseWaterTimesLocal,
} from "@/lib/tracking-validation";
import {
  parseWaterAmountMl,
  resolveWaterRecordedAt,
  validateWaterDate,
  WATER_MAX_ML,
  WATER_MIN_ML,
} from "@/lib/water-validation";
import { requireCoach, requireTraineeOnboarded } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { getIsraelDateString } from "@/lib/calendar-datetime";
import { prisma } from "@/lib/prisma";

export type WaterLogItem = {
  id: string;
  amountMl: number;
  recordedAt: string;
  recordedDay: string;
  notes: string | null;
};

export type WaterReminderSettings = {
  enabled: boolean;
  daysOfWeek: number[];
  timesLocal: string[];
};

export type WaterPageData = {
  logs: WaterLogItem[];
  chartData: Array<{ date: string; weight: number; volume: number; notes?: string | null }>;
  latestAmountMl: number | null;
  previousAmountMl: number | null;
  reminder: WaterReminderSettings | null;
};

function mapLog(log: {
  id: string;
  amountMl: number;
  recordedAt: Date;
  recordedDay: string;
  notes: string | null;
}): WaterLogItem {
  return {
    id: log.id,
    amountMl: log.amountMl,
    recordedAt: log.recordedAt.toISOString(),
    recordedDay: log.recordedDay,
    notes: log.notes,
  };
}

const REVALIDATE_PATHS = [
  "/dashboard/water",
  "/dashboard/tracking",
  "/dashboard",
  "/dashboard/trainees",
] as const;

function revalidateWaterPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

async function buildChartDataForTrainee(traineeId: string) {
  const logs = await prisma.waterLog.findMany({
    where: { traineeId },
    orderBy: { recordedAt: "asc" },
  });
  return mapWaterLogsToChartData(logs);
}

export async function getWaterPageDataAction(): Promise<WaterPageData> {
  const trainee = await requireTraineeOnboarded();

  const [logs, reminder, chartData] = await Promise.all([
    prisma.waterLog.findMany({
      where: { traineeId: trainee.id },
      orderBy: { recordedAt: "desc" },
    }),
    prisma.waterReminder.findUnique({ where: { traineeId: trainee.id } }),
    buildChartDataForTrainee(trainee.id),
  ]);

  const { latestAmountMl, previousAmountMl } = resolveWaterCurrentDisplay(logs);

  return {
    logs: logs.map(mapLog),
    chartData,
    latestAmountMl,
    previousAmountMl,
    reminder: reminder
      ? {
          enabled: reminder.enabled,
          daysOfWeek: reminder.daysOfWeek,
          timesLocal: reminder.timesLocal ?? [],
        }
      : null,
  };
}

export async function getCoachTraineeWaterChartAction(traineeId: string) {
  const coach = await requireCoach();
  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return [];
  return buildChartDataForTrainee(traineeId);
}

export async function getTraineeWaterChartAction() {
  const trainee = await requireTraineeOnboarded();
  return buildChartDataForTrainee(trainee.id);
}

export async function upsertWaterLogAction(formData: FormData) {
  const trainee = await requireTraineeOnboarded();

  const amountMl = parseWaterAmountMl(formData.get("amountMl"));
  if (amountMl == null) {
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
      where: {
        traineeId_recordedDay: { traineeId: trainee.id, recordedDay: dateStr },
      },
      create: {
        traineeId: trainee.id,
        amountMl,
        recordedAt,
        recordedDay: dateStr,
        notes,
      },
      update: { amountMl, recordedAt, notes },
    });
  } catch {
    return { error: "שגיאה בשמירת השתייה" };
  }

  revalidateWaterPaths();
  return { success: true as const };
}

export async function deleteWaterLogAction(logId: string) {
  const trainee = await requireTraineeOnboarded();
  if (!logId) return { error: "רשומה לא נמצאה" };

  try {
    const existing = await prisma.waterLog.findFirst({
      where: { id: logId, traineeId: trainee.id },
      select: { id: true },
    });
    if (!existing) return { error: "רשומה לא נמצאה" };
    await prisma.waterLog.delete({ where: { id: logId } });
  } catch {
    return { error: "שגיאה במחיקת הרשומה" };
  }

  revalidateWaterPaths();
  return { success: true as const };
}

export async function upsertWaterReminderAction(formData: FormData) {
  const trainee = await requireTraineeOnboarded();
  const enabled = formData.get("enabled") === "true" || formData.get("enabled") === "on";
  const daysOfWeek = parseTrackingDaysOfWeek(formData.getAll("daysOfWeek"));
  const timesLocal = parseWaterTimesLocal(formData.getAll("timesLocal"));

  if (enabled) {
    if (!daysOfWeek) return { error: "יש לבחור לפחות יום אחד" };
    if (!timesLocal) return { error: "יש לבחור לפחות שעה אחת (עד 3)" };
  }

  try {
    await prisma.waterReminder.upsert({
      where: { traineeId: trainee.id },
      create: {
        traineeId: trainee.id,
        enabled,
        daysOfWeek: daysOfWeek ?? [],
        timesLocal: timesLocal ?? [],
        lastSentSlots: {},
      },
      update: {
        enabled,
        ...(daysOfWeek ? { daysOfWeek } : {}),
        ...(timesLocal ? { timesLocal } : {}),
      },
    });
  } catch {
    return { error: "שגיאה בשמירת התזכורת" };
  }

  revalidatePath("/dashboard/tracking");
  return { success: true as const };
}

export async function cancelWaterReminderAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    const existing = await prisma.waterReminder.findUnique({
      where: { traineeId: trainee.id },
      select: { id: true, enabled: true },
    });
    if (!existing?.enabled) return { error: "אין תזכורת פעילה לביטול" };

    await prisma.waterReminder.update({
      where: { traineeId: trainee.id },
      data: { enabled: false },
    });
  } catch {
    return { error: "שגיאה בביטול התזכורת" };
  }

  revalidatePath("/dashboard/tracking");
  return { success: true as const };
}
