"use server";

import { revalidatePath } from "next/cache";

import {
  loadBodyWeightChartData,
  loadBodyWeightCurrentDisplay,
} from "@/lib/body-weight-load";
import { revalidateAfterTrackingMetricSave } from "@/lib/revalidate-tracking";
import {
  BODY_WEIGHT_MAX_KG,
  BODY_WEIGHT_MIN_KG,
  parseBodyWeightDaysOfWeek,
  parseBodyWeightKg,
  parseBodyWeightTimeLocal,
  resolveBodyWeightRecordedAt,
  validateBodyWeightDate,
} from "@/lib/body-weight-validation";
import { requireCoach, requireTraineeOnboarded } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { getIsraelDateString } from "@/lib/calendar-datetime";
import { prisma } from "@/lib/prisma";

export type BodyWeightLogItem = {
  id: string;
  weightKg: number;
  recordedAt: string;
  recordedDay: string;
  notes: string | null;
};

export type BodyWeightReminderSettings = {
  enabled: boolean;
  daysOfWeek: number[];
  timeLocal: string;
};

export type BodyWeightPageData = {
  logs: BodyWeightLogItem[];
  chartData: Array<{ date: string; weight: number; volume: number; notes?: string | null }>;
  latestWeightKg: number | null;
  previousWeightKg: number | null;
  reminder: BodyWeightReminderSettings | null;
};

function mapLog(log: {
  id: string;
  weightKg: number;
  recordedAt: Date;
  recordedDay: string;
  notes: string | null;
}): BodyWeightLogItem {
  return {
    id: log.id,
    weightKg: log.weightKg,
    recordedAt: log.recordedAt.toISOString(),
    recordedDay: log.recordedDay,
    notes: log.notes,
  };
}

export async function getBodyWeightPageDataAction(): Promise<BodyWeightPageData> {
  const trainee = await requireTraineeOnboarded();

  const [logs, reminder, chartData, { latestWeightKg, previousWeightKg }] = await Promise.all([
    prisma.bodyWeightLog.findMany({
      where: { traineeId: trainee.id },
      orderBy: { recordedAt: "desc" },
    }),
    prisma.bodyWeightReminder.findUnique({
      where: { traineeId: trainee.id },
    }),
    loadBodyWeightChartData(trainee.id),
    loadBodyWeightCurrentDisplay(trainee.id),
  ]);

  return {
    logs: logs.map(mapLog),
    chartData,
    latestWeightKg,
    previousWeightKg,
    reminder: reminder
      ? {
          enabled: reminder.enabled,
          daysOfWeek: reminder.daysOfWeek,
          timeLocal: reminder.timeLocal,
        }
      : null,
  };
}

export async function getCoachTraineeBodyWeightChartAction(traineeId: string) {
  const coach = await requireCoach();
  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return [];

  return loadBodyWeightChartData(traineeId);
}

export async function getTraineeBodyWeightChartAction() {
  const trainee = await requireTraineeOnboarded();
  return loadBodyWeightChartData(trainee.id);
}

export async function upsertBodyWeightLogAction(formData: FormData) {
  const trainee = await requireTraineeOnboarded();

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
      where: {
        traineeId_recordedDay: {
          traineeId: trainee.id,
          recordedDay: dateStr,
        },
      },
      create: {
        traineeId: trainee.id,
        weightKg,
        recordedAt,
        recordedDay: dateStr,
        notes,
      },
      update: {
        weightKg,
        recordedAt,
        notes,
      },
    });
  } catch {
    return { error: "שגיאה בשמירת המשקל" };
  }

  revalidateAfterTrackingMetricSave(trainee.id, dateStr, {
    metricPath: "/dashboard/body-weight",
  });

  return { success: true as const };
}

export async function deleteBodyWeightLogAction(logId: string) {
  const trainee = await requireTraineeOnboarded();

  if (!logId) return { error: "רשומה לא נמצאה" };

  try {
    const existing = await prisma.bodyWeightLog.findFirst({
      where: { id: logId, traineeId: trainee.id },
      select: { id: true, recordedDay: true },
    });

    if (!existing) return { error: "רשומה לא נמצאה" };

    await prisma.bodyWeightLog.delete({ where: { id: logId } });
    revalidateAfterTrackingMetricSave(trainee.id, existing.recordedDay, {
      metricPath: "/dashboard/body-weight",
    });
  } catch {
    return { error: "שגיאה במחיקת הרשומה" };
  }

  return { success: true as const };
}

export async function upsertBodyWeightReminderAction(formData: FormData) {
  const trainee = await requireTraineeOnboarded();

  const enabled = formData.get("enabled") === "true" || formData.get("enabled") === "on";
  const daysOfWeek = parseBodyWeightDaysOfWeek(formData.getAll("daysOfWeek"));
  const timeLocal = parseBodyWeightTimeLocal(formData.get("timeLocal"));

  if (enabled) {
    if (!daysOfWeek) return { error: "יש לבחור לפחות יום אחד" };
    if (!timeLocal) return { error: "יש לבחור שעה תקינה" };
  }

  try {
    await prisma.bodyWeightReminder.upsert({
      where: { traineeId: trainee.id },
      create: {
        traineeId: trainee.id,
        enabled,
        daysOfWeek: daysOfWeek ?? [],
        timeLocal: timeLocal ?? "08:00",
      },
      update: {
        enabled,
        ...(daysOfWeek ? { daysOfWeek } : {}),
        ...(timeLocal ? { timeLocal } : {}),
      },
    });
  } catch {
    return { error: "שגיאה בשמירת התזכורת" };
  }

  revalidatePath("/dashboard/tracking");
  return { success: true as const };
}

export async function cancelBodyWeightReminderAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    const existing = await prisma.bodyWeightReminder.findUnique({
      where: { traineeId: trainee.id },
      select: { id: true, enabled: true },
    });

    if (!existing?.enabled) {
      return { error: "אין תזכורת פעילה לביטול" };
    }

    await prisma.bodyWeightReminder.update({
      where: { traineeId: trainee.id },
      data: { enabled: false },
    });
  } catch {
    return { error: "שגיאה בביטול התזכורת" };
  }

  revalidatePath("/dashboard/tracking");
  return { success: true as const };
}
