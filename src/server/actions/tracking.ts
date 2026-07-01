"use server";

import { requireCoach, requireTraineeOnboarded, getCurrentUser } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { getCachedCoachTrackingTraineeOptions } from "@/lib/coach-tracking-load";
import { getCachedRemindersForTrainee } from "@/lib/tracking-reminders-load";
import {
  buildDailyTrackingWeekGrid,
  buildMeasurementsTrackingWeekGrid,
  type TrackingWeekGrid,
} from "@/lib/tracking-week-data";
import { getCachedWeekLogsForTrainee } from "@/lib/tracking-week-load";
import {
  canGoForwardWeek,
  formatWeekRangeLabel,
  parseTrackingWeekStart,
} from "@/lib/tracking-week-navigation";
import { addIsraelDays } from "@/lib/calendar-datetime";

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

export type TrackingHubShell = {
  role: "TRAINEE" | "COACH";
  traineeId: string | null;
  traineeName: string | null;
  trainees: TrackingTraineeOption[];
  weekStart: string;
  weekLabel: string;
  canGoForward: boolean;
  canEdit: boolean;
  showGrids: boolean;
};

export type TrackingHubGridsData = {
  dailyGrid: TrackingWeekGrid;
  measurementsGrid: TrackingWeekGrid;
  reminders: TrackingReminderBundle | null;
};

export async function getTrackingHubShellAction(
  traineeIdParam?: string,
  weekParam?: string,
): Promise<TrackingHubShell> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const weekStart = parseTrackingWeekStart(weekParam);
  const weekLabel = formatWeekRangeLabel(weekStart);
  const canGoForward = canGoForwardWeek(weekStart);

  if (user.role === "TRAINEE") {
    const trainee = await requireTraineeOnboarded();

    return {
      role: "TRAINEE",
      traineeId: trainee.id,
      traineeName: trainee.displayName,
      trainees: [],
      weekStart,
      weekLabel,
      canGoForward,
      canEdit: true,
      showGrids: true,
    };
  }

  if (user.role === "COACH") {
    await requireCoach();
    const trainees = await getCachedCoachTrackingTraineeOptions(user.id);

    if (!traineeIdParam) {
      return {
        role: "COACH",
        traineeId: null,
        traineeName: null,
        trainees,
        weekStart,
        weekLabel,
        canGoForward,
        canEdit: false,
        showGrids: false,
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
        weekLabel,
        canGoForward,
        canEdit: false,
        showGrids: false,
      };
    }

    const trainee = trainees.find((item) => item.id === traineeIdParam);

    return {
      role: "COACH",
      traineeId: traineeIdParam,
      traineeName: trainee?.name ?? "מתאמן",
      trainees,
      weekStart,
      weekLabel,
      canGoForward,
      canEdit: true,
      showGrids: true,
    };
  }

  throw new Error("Unauthorized");
}

export async function getTrackingHubGridsAction(
  traineeId: string,
  weekStart: string,
  canEdit: boolean,
  loadReminders: boolean,
): Promise<TrackingHubGridsData> {
  const weekLastDay = addIsraelDays(weekStart, 6);
  const raw = await getCachedWeekLogsForTrainee(traineeId, weekStart, weekLastDay);
  const reminders = loadReminders ? await getCachedRemindersForTrainee(traineeId) : null;

  return {
    dailyGrid: buildDailyTrackingWeekGrid(weekStart, raw, canEdit),
    measurementsGrid: buildMeasurementsTrackingWeekGrid(weekStart, raw, canEdit),
    reminders,
  };
}
