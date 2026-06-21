export const TRAINEE_WEEKLY_CHART_MAX_DAYS = 60;

const HEBREW_DAYS_SHORT = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"] as const;

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

export type WeeklyWorkoutChartPoint = {
  dayKey: string;
  dayLabel: string;
  count: number;
};

export type WeeklyWorkoutChartData = {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  days: WeeklyWorkoutChartPoint[];
  totalWorkouts: number;
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDayLabel(date: Date): string {
  return `${HEBREW_DAYS_SHORT[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
}

function formatWeekRangeLabel(weekStart: Date, weekEnd: Date): string {
  const startMonth = HEBREW_MONTHS_SHORT[weekStart.getMonth()];
  const endMonth = HEBREW_MONTHS_SHORT[weekEnd.getMonth()];

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${weekStart.getDate()}–${weekEnd.getDate()} ${startMonth} ${weekEnd.getFullYear()}`;
  }

  return `${weekStart.getDate()} ${startMonth} – ${weekEnd.getDate()} ${endMonth} ${weekEnd.getFullYear()}`;
}

export function getEarliestAllowedWeekStart(now = new Date()): Date {
  const earliest = startOfDay(now);
  earliest.setDate(earliest.getDate() - TRAINEE_WEEKLY_CHART_MAX_DAYS);
  return startOfWeek(earliest);
}

export function getWeekStartByOffset(now: Date, weekOffset: number): Date {
  return addDays(startOfWeek(now), -weekOffset * 7);
}

export function canNavigateToWeek(weekOffset: number, now = new Date()): boolean {
  const nextWeekStart = getWeekStartByOffset(now, weekOffset + 1);
  return nextWeekStart >= getEarliestAllowedWeekStart(now);
}

export function buildWeeklyWorkoutChartData(
  sessionDates: Date[],
  weekOffset: number,
  now = new Date(),
): WeeklyWorkoutChartData {
  const weekStart = getWeekStartByOffset(now, weekOffset);
  const weekEnd = addDays(weekStart, 6);

  const days: WeeklyWorkoutChartPoint[] = [];
  let totalWorkouts = 0;

  for (let i = 0; i < 7; i += 1) {
    const day = addDays(weekStart, i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const count = sessionDates.filter((d) => d >= dayStart && d <= dayEnd).length;
    totalWorkouts += count;

    days.push({
      dayKey: dayStart.toISOString(),
      dayLabel: formatDayLabel(day),
      count,
    });
  }

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    weekLabel: formatWeekRangeLabel(weekStart, weekEnd),
    days,
    totalWorkouts,
  };
}
