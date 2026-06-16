import {
  getEffectiveWorkoutsCompleted,
  getSessionsCountAtDate,
  getTraineeStatus,
} from "@/lib/trainee-status";

export type MonthlyTraineeChartPoint = {
  monthKey: string;
  monthLabel: string;
  active: number;
  inactive: number;
};

export type CoachDashboardChartData = {
  months: MonthlyTraineeChartPoint[];
  rangeLabel: string;
  currentActive: number;
  currentInactive: number;
  currentTotal: number;
};

const HEBREW_MONTHS_SHORT = [
  "ינו",
  "פבר",
  "מרץ",
  "אפר",
  "מאי",
  "יונ",
  "יול",
  "אוג",
  "ספט",
  "אוק",
  "נוב",
  "דצמ",
] as const;

const HEBREW_MONTHS_LONG = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
] as const;

export type CoachTraineeSnapshot = {
  linkedAt: Date;
  coachingStartDate: Date | null;
  coachingEndDate: Date | null;
  workoutQuota: number | null;
  workoutsCompleted: number | null;
  sessionDates: Date[];
};

function endOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
}

function startOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex, 1, 0, 0, 0, 0);
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function buildLast12MonthKeys(now = new Date()) {
  const months: Array<{ monthKey: string; monthLabel: string; end: Date }> = [];

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    months.push({
      monthKey: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
      monthLabel: `${HEBREW_MONTHS_SHORT[monthIndex]} ${year}`,
      end: endOfMonth(year, monthIndex),
    });
  }

  return months;
}

function formatMonthRange(start: Date, end: Date): string {
  const startLabel = `${HEBREW_MONTHS_LONG[start.getMonth()]} ${start.getFullYear()}`;
  const endLabel = `${HEBREW_MONTHS_LONG[end.getMonth()]} ${end.getFullYear()}`;
  return `${startLabel} – ${endLabel}`;
}

function getSessionsCountForSnapshot(
  trainee: CoachTraineeSnapshot,
  asOf: Date,
  today: Date,
): number {
  const totalLogged = trainee.sessionDates.length;

  if (isSameMonth(asOf, today)) {
    return getEffectiveWorkoutsCompleted(trainee.workoutsCompleted, totalLogged);
  }

  return getSessionsCountAtDate({
    workoutsCompleted: trainee.workoutsCompleted,
    sessionDates: trainee.sessionDates,
    asOf,
  });
}

function countTraineesAsOf(trainees: CoachTraineeSnapshot[], asOf: Date, today: Date) {
  let active = 0;
  let inactive = 0;

  for (const trainee of trainees) {
    if (trainee.linkedAt > asOf) continue;

    const sessionsCount = getSessionsCountForSnapshot(trainee, asOf, today);
    const status = getTraineeStatus({
      coachingStartDate: trainee.coachingStartDate,
      coachingEndDate: trainee.coachingEndDate,
      workoutQuota: trainee.workoutQuota,
      sessionsCount,
      now: asOf,
    });

    if (status === "active") active += 1;
    else inactive += 1;
  }

  return { active, inactive };
}

export function buildCoachDashboardChartData(
  trainees: CoachTraineeSnapshot[],
  now = new Date(),
): CoachDashboardChartData {
  const monthKeys = buildLast12MonthKeys(now);
  const months = monthKeys.map((month) => {
    const statusAsOf = isSameMonth(month.end, now) ? now : month.end;
    const counts = countTraineesAsOf(trainees, statusAsOf, now);
    return {
      monthKey: month.monthKey,
      monthLabel: month.monthLabel,
      active: counts.active,
      inactive: counts.inactive,
    };
  });

  const currentCounts = countTraineesAsOf(trainees, now, now);

  const rangeStart = startOfMonth(
    monthKeys[0].end.getFullYear(),
    monthKeys[0].end.getMonth(),
  );
  const rangeEnd = monthKeys[monthKeys.length - 1].end;

  return {
    months,
    rangeLabel: formatMonthRange(rangeStart, rangeEnd),
    currentActive: currentCounts.active,
    currentInactive: currentCounts.inactive,
    currentTotal: currentCounts.active + currentCounts.inactive,
  };
}
