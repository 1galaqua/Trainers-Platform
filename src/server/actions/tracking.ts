"use server";

import { requireCoach, requireTraineeOnboarded, getCurrentUser } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import {
  buildDailyTrackingWeekGrid,
  buildMeasurementsTrackingWeekGrid,
  buildTrackingWeekRawLogs,
  type TrackingWeekGrid,
} from "@/lib/tracking-week-data";
import {
  canGoForwardWeek,
  formatWeekRangeLabel,
  parseTrackingWeekStart,
} from "@/lib/tracking-week-navigation";
import { addIsraelDays } from "@/lib/calendar-datetime";
import { getCoachTraineeListAction } from "@/server/actions/trainees";
import { prisma } from "@/lib/prisma";

export type TrackingTraineeOption = {
  id: string;
  name: string;
};

export type TrackingReminderBundle = {
  bodyWeight: { enabled: boolean; daysOfWeek: number[]; timeLocal: string } | null;
  sleep: { enabled: boolean; daysOfWeek: number[]; timeLocal: string } | null;
  water: { enabled: boolean; daysOfWeek: number[]; timesLocal: string[] } | null;
  measurements: { enabled: boolean; daysOfWeek: number[]; timeLocal: string } | null;
  steps: { enabled: boolean; daysOfWeek: number[]; timeLocal: string } | null;
  calories: { enabled: boolean; daysOfWeek: number[]; timeLocal: string } | null;
};

export type TrackingHubData = {
  role: "TRAINEE" | "COACH";
  traineeId: string | null;
  traineeName: string | null;
  trainees: TrackingTraineeOption[];
  weekStart: string;
  weekLabel: string;
  canGoForward: boolean;
  canEdit: boolean;
  dailyGrid: TrackingWeekGrid;
  measurementsGrid: TrackingWeekGrid;
  reminders: TrackingReminderBundle | null;
};

async function loadWeekLogsForTrainee(traineeId: string, weekStart: string, weekEnd: string) {
  const [bodyWeightLogs, sleepLogs, waterLogs, stepsLogs, caloriesLogs, measurementsLogs] =
    await Promise.all([
    prisma.bodyWeightLog.findMany({
      where: { traineeId, recordedDay: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.sleepLog.findMany({
      where: { traineeId, recordedDay: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.waterLog.findMany({
      where: { traineeId, recordedDay: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.stepsLog.findMany({
      where: { traineeId, recordedDay: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.caloriesLog.findMany({
      where: { traineeId, recordedDay: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.measurementsLog.findMany({
      where: { traineeId, recordedDay: { gte: weekStart, lte: weekEnd } },
    }),
  ]);

  return buildTrackingWeekRawLogs({
    bodyWeightLogs,
    sleepLogs,
    waterLogs,
    stepsLogs,
    caloriesLogs,
    measurementsLogs,
  });
}

async function loadRemindersForTrainee(traineeId: string): Promise<TrackingReminderBundle> {
  const [bodyWeight, sleep, water, measurements, steps, calories] = await Promise.all([
    prisma.bodyWeightReminder.findUnique({ where: { traineeId } }),
    prisma.sleepReminder.findUnique({ where: { traineeId } }),
    prisma.waterReminder.findUnique({ where: { traineeId } }),
    prisma.measurementsReminder.findUnique({ where: { traineeId } }),
    prisma.stepsReminder.findUnique({ where: { traineeId } }),
    prisma.caloriesReminder.findUnique({ where: { traineeId } }),
  ]);

  return {
    bodyWeight: bodyWeight
      ? { enabled: bodyWeight.enabled, daysOfWeek: bodyWeight.daysOfWeek, timeLocal: bodyWeight.timeLocal }
      : null,
    sleep: sleep
      ? { enabled: sleep.enabled, daysOfWeek: sleep.daysOfWeek, timeLocal: sleep.timeLocal }
      : null,
    water: water
      ? {
          enabled: water.enabled,
          daysOfWeek: water.daysOfWeek,
          timesLocal: water.timesLocal.length > 0 ? water.timesLocal : [],
        }
      : null,
    measurements: measurements
      ? {
          enabled: measurements.enabled,
          daysOfWeek: measurements.daysOfWeek,
          timeLocal: measurements.timeLocal,
        }
      : null,
    steps: steps
      ? { enabled: steps.enabled, daysOfWeek: steps.daysOfWeek, timeLocal: steps.timeLocal }
      : null,
    calories: calories
      ? {
          enabled: calories.enabled,
          daysOfWeek: calories.daysOfWeek,
          timeLocal: calories.timeLocal,
        }
      : null,
  };
}

function emptyGrid(weekStart: string): TrackingWeekGrid {
  return buildDailyTrackingWeekGrid(
    weekStart,
    buildTrackingWeekRawLogs({
      bodyWeightLogs: [],
      sleepLogs: [],
      waterLogs: [],
      stepsLogs: [],
      caloriesLogs: [],
      measurementsLogs: [],
    }),
    false,
  );
}

export async function getTrackingHubDataAction(
  traineeIdParam?: string,
  weekParam?: string,
): Promise<TrackingHubData> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const weekStart = parseTrackingWeekStart(weekParam);
  const weekLastDay = addIsraelDays(weekStart, 6);

  if (user.role === "TRAINEE") {
    const trainee = await requireTraineeOnboarded();
    const raw = await loadWeekLogsForTrainee(trainee.id, weekStart, weekLastDay);
    const reminders = await loadRemindersForTrainee(trainee.id);

    return {
      role: "TRAINEE",
      traineeId: trainee.id,
      traineeName: trainee.displayName,
      trainees: [],
      weekStart,
      weekLabel: formatWeekRangeLabel(weekStart),
      canGoForward: canGoForwardWeek(weekStart),
      canEdit: true,
      dailyGrid: buildDailyTrackingWeekGrid(weekStart, raw, true),
      measurementsGrid: buildMeasurementsTrackingWeekGrid(weekStart, raw, true),
      reminders,
    };
  }

  if (user.role === "COACH") {
    await requireCoach();
    const trainees = (await getCoachTraineeListAction()).map((item) => ({
      id: item.id,
      name: item.displayName ?? "מתאמן",
    }));

    if (!traineeIdParam) {
      return {
        role: "COACH",
        traineeId: null,
        traineeName: null,
        trainees,
        weekStart,
        weekLabel: formatWeekRangeLabel(weekStart),
        canGoForward: canGoForwardWeek(weekStart),
        canEdit: false,
        dailyGrid: emptyGrid(weekStart),
        measurementsGrid: buildMeasurementsTrackingWeekGrid(
          weekStart,
          buildTrackingWeekRawLogs({
            bodyWeightLogs: [],
            sleepLogs: [],
            waterLogs: [],
            stepsLogs: [],
            caloriesLogs: [],
            measurementsLogs: [],
          }),
          false,
        ),
        reminders: null,
      };
    }

    const ownsTrainee = await isCoachOwnerOfTrainee(user.id, traineeIdParam);
    if (!ownsTrainee) {
      return {
        role: "COACH",
        traineeId: null,
        traineeName: null,
        trainees,
        weekStart,
        weekLabel: formatWeekRangeLabel(weekStart),
        canGoForward: canGoForwardWeek(weekStart),
        canEdit: false,
        dailyGrid: emptyGrid(weekStart),
        measurementsGrid: buildMeasurementsTrackingWeekGrid(
          weekStart,
          buildTrackingWeekRawLogs({
            bodyWeightLogs: [],
            sleepLogs: [],
            waterLogs: [],
            stepsLogs: [],
            caloriesLogs: [],
            measurementsLogs: [],
          }),
          false,
        ),
        reminders: null,
      };
    }

    const trainee = trainees.find((item) => item.id === traineeIdParam);
    const raw = await loadWeekLogsForTrainee(traineeIdParam, weekStart, weekLastDay);

    return {
      role: "COACH",
      traineeId: traineeIdParam,
      traineeName: trainee?.name ?? "מתאמן",
      trainees,
      weekStart,
      weekLabel: formatWeekRangeLabel(weekStart),
      canGoForward: canGoForwardWeek(weekStart),
      canEdit: true,
      dailyGrid: buildDailyTrackingWeekGrid(weekStart, raw, true),
      measurementsGrid: buildMeasurementsTrackingWeekGrid(weekStart, raw, true),
      reminders: null,
    };
  }

  throw new Error("Unauthorized");
}
