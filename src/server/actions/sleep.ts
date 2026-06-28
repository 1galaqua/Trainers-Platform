"use server";

import { revalidatePath } from "next/cache";

import { mapSleepLogsToChartData, resolveSleepCurrentDisplay } from "@/lib/sleep-chart-data";
import { revalidateAfterTrackingMetricSave } from "@/lib/revalidate-tracking";
import {
  parseSleepTime,
  resolveSleepRecordedAt,
  validateSleepDate,
} from "@/lib/sleep-validation";
import {
  parseTrackingDaysOfWeek,
  parseTrackingTimeLocal,
} from "@/lib/tracking-validation";
import { requireCoach, requireTraineeOnboarded } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { getIsraelDateString } from "@/lib/calendar-datetime";
import { prisma } from "@/lib/prisma";

export type SleepLogItem = {
  id: string;
  recordedDay: string;
  sleepStart: string;
  sleepEnd: string;
  recordedAt: string;
  notes: string | null;
};

export type SleepReminderSettings = {
  enabled: boolean;
  daysOfWeek: number[];
  timeLocal: string;
};

export type SleepPageData = {
  logs: SleepLogItem[];
  chartData: Array<{
    date: string;
    weight: number;
    volume: number;
    notes?: string | null;
    sleepStart?: string;
    sleepEnd?: string;
  }>;
  latestHours: number | null;
  previousHours: number | null;
  latestSleepStart: string | null;
  latestSleepEnd: string | null;
  reminder: SleepReminderSettings | null;
};

function mapLog(log: {
  id: string;
  recordedDay: string;
  sleepStart: string;
  sleepEnd: string;
  recordedAt: Date;
  notes: string | null;
}): SleepLogItem {
  return {
    id: log.id,
    recordedDay: log.recordedDay,
    sleepStart: log.sleepStart,
    sleepEnd: log.sleepEnd,
    recordedAt: log.recordedAt.toISOString(),
    notes: log.notes,
  };
}

function revalidateSleepPaths(traineeId: string, recordedDay: string) {
  revalidateAfterTrackingMetricSave(traineeId, recordedDay, {
    metricPath: "/dashboard/sleep",
  });
}

async function buildChartDataForTrainee(traineeId: string) {
  const logs = await prisma.sleepLog.findMany({
    where: { traineeId },
    orderBy: { recordedAt: "asc" },
  });
  return mapSleepLogsToChartData(logs);
}

export async function getSleepPageDataAction(): Promise<SleepPageData> {
  const trainee = await requireTraineeOnboarded();

  const [logs, reminder, chartData] = await Promise.all([
    prisma.sleepLog.findMany({
      where: { traineeId: trainee.id },
      orderBy: { recordedAt: "desc" },
    }),
    prisma.sleepReminder.findUnique({ where: { traineeId: trainee.id } }),
    buildChartDataForTrainee(trainee.id),
  ]);

  const { latestHours, previousHours, latestSleepStart, latestSleepEnd } =
    resolveSleepCurrentDisplay(logs);

  return {
    logs: logs.map(mapLog),
    chartData,
    latestHours,
    previousHours,
    latestSleepStart,
    latestSleepEnd,
    reminder: reminder
      ? { enabled: reminder.enabled, daysOfWeek: reminder.daysOfWeek, timeLocal: reminder.timeLocal }
      : null,
  };
}

export async function getCoachTraineeSleepChartAction(traineeId: string) {
  const coach = await requireCoach();
  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return [];
  return buildChartDataForTrainee(traineeId);
}

export async function getTraineeSleepChartAction() {
  const trainee = await requireTraineeOnboarded();
  return buildChartDataForTrainee(trainee.id);
}

export async function upsertSleepLogAction(formData: FormData) {
  const trainee = await requireTraineeOnboarded();

  const sleepStart = parseSleepTime(formData.get("sleepStart"));
  const sleepEnd = parseSleepTime(formData.get("sleepEnd"));
  if (!sleepStart || !sleepEnd) {
    return { error: "יש להזין שעות התחלה וסיום תקינות" };
  }

  const dateStr = String(formData.get("date") ?? getIsraelDateString()).trim();
  const dateError = validateSleepDate(dateStr);
  if (dateError) return { error: dateError };

  const recordedAt = resolveSleepRecordedAt(dateStr);
  if (!recordedAt) return { error: "תאריך לא תקין" };

  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw.slice(0, 500) : null;

  try {
    await prisma.sleepLog.upsert({
      where: {
        traineeId_recordedDay: { traineeId: trainee.id, recordedDay: dateStr },
      },
      create: {
        traineeId: trainee.id,
        recordedDay: dateStr,
        sleepStart,
        sleepEnd,
        recordedAt,
        notes,
      },
      update: { sleepStart, sleepEnd, recordedAt, notes },
    });
  } catch {
    return { error: "שגיאה בשמירת השינה" };
  }

  revalidateSleepPaths(trainee.id, dateStr);
  return { success: true as const };
}

export async function deleteSleepLogAction(logId: string) {
  const trainee = await requireTraineeOnboarded();
  if (!logId) return { error: "רשומה לא נמצאה" };

  try {
    const existing = await prisma.sleepLog.findFirst({
      where: { id: logId, traineeId: trainee.id },
      select: { id: true, recordedDay: true },
    });
    if (!existing) return { error: "רשומה לא נמצאה" };
    await prisma.sleepLog.delete({ where: { id: logId } });
    revalidateSleepPaths(trainee.id, existing.recordedDay);
  } catch {
    return { error: "שגיאה במחיקת הרשומה" };
  }

  return { success: true as const };
}

export async function upsertSleepReminderAction(formData: FormData) {
  const trainee = await requireTraineeOnboarded();
  const enabled = formData.get("enabled") === "true" || formData.get("enabled") === "on";
  const daysOfWeek = parseTrackingDaysOfWeek(formData.getAll("daysOfWeek"));
  const timeLocal = parseTrackingTimeLocal(formData.get("timeLocal"));

  if (enabled) {
    if (!daysOfWeek) return { error: "יש לבחור לפחות יום אחד" };
    if (!timeLocal) return { error: "יש לבחור שעה תקינה" };
  }

  try {
    await prisma.sleepReminder.upsert({
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

export async function cancelSleepReminderAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    const existing = await prisma.sleepReminder.findUnique({
      where: { traineeId: trainee.id },
      select: { id: true, enabled: true },
    });
    if (!existing?.enabled) return { error: "אין תזכורת פעילה לביטול" };

    await prisma.sleepReminder.update({
      where: { traineeId: trainee.id },
      data: { enabled: false },
    });
  } catch {
    return { error: "שגיאה בביטול התזכורת" };
  }

  revalidatePath("/dashboard/tracking");
  return { success: true as const };
}
