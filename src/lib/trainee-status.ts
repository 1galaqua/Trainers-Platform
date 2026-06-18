export type TraineeStatus = "active" | "inactive";

export type TraineeStatusInput = {
  coachingStartDate: string | Date | null;
  coachingEndDate: string | Date | null;
  workoutQuota: number | null;
  sessionsCount: number;
  now?: Date;
};

function toDate(value: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isCoachingPeriodActive(
  coachingStartDate: string | Date | null,
  coachingEndDate: string | Date | null,
  now: Date = new Date(),
): boolean {
  const start = toDate(coachingStartDate);
  const end = toDate(coachingEndDate);
  if (!start || !end) return false;

  const today = startOfDay(now);
  return today >= startOfDay(start) && today <= endOfDay(end);
}

export function isCoachingPeriodExpired(
  coachingEndDate: string | Date | null,
  now: Date = new Date(),
): boolean {
  const end = toDate(coachingEndDate);
  if (!end) return false;
  return startOfDay(now) > endOfDay(end);
}

export function getEffectiveWorkoutsCompleted(
  workoutsCompleted: number | null | undefined,
  loggedSessionsCount: number,
): number {
  if (workoutsCompleted != null && workoutsCompleted >= 0) return workoutsCompleted;
  return loggedSessionsCount;
}

export function getSessionsCountAtDate(input: {
  workoutsCompleted: number | null;
  sessionDates: Date[];
  asOf: Date;
}): number {
  const totalLogged = input.sessionDates.length;
  const loggedUpTo = input.sessionDates.filter((date) => date <= input.asOf).length;

  if (input.workoutsCompleted == null) {
    return loggedUpTo;
  }

  const baseline = Math.max(0, input.workoutsCompleted - totalLogged);
  return baseline + loggedUpTo;
}

export function getWorkoutsRemaining(workoutQuota: number | null, completedCount: number): number {
  if (workoutQuota == null || workoutQuota <= 0) return 0;
  return Math.max(0, workoutQuota - completedCount);
}

export function getQuotaBlockMessage(
  workoutQuota: number | null,
  workoutsRemaining: number,
): string | null {
  if (workoutQuota == null) return null;
  if (workoutsRemaining <= 0) {
    return "אין אימונים נותרים במכסה — פנה למאמן/ית";
  }
  return null;
}

export function getTraineeStatus(input: TraineeStatusInput): TraineeStatus {
  const remaining = getWorkoutsRemaining(input.workoutQuota, input.sessionsCount);
  const inPeriod = isCoachingPeriodActive(
    input.coachingStartDate,
    input.coachingEndDate,
    input.now,
  );

  if (remaining > 0 && inPeriod) return "active";
  return "inactive";
}

export type TraineeFilter =
  | "all"
  | "active"
  | "inactive"
  | "in_coaching_period"
  | "coaching_expired"
  | "no_questionnaire"
  | "questionnaire_done"
  | "has_workouts_remaining"
  | "no_workouts_remaining";

const TRAINEE_FILTER_VALUES = new Set<TraineeFilter>([
  "all",
  "active",
  "inactive",
  "in_coaching_period",
  "coaching_expired",
  "no_questionnaire",
  "questionnaire_done",
  "has_workouts_remaining",
  "no_workouts_remaining",
]);

export function parseTraineeFilter(value: string | undefined | null): TraineeFilter {
  if (value && TRAINEE_FILTER_VALUES.has(value as TraineeFilter)) {
    return value as TraineeFilter;
  }
  return "all";
}

export function matchesTraineeFilter(
  filter: TraineeFilter,
  trainee: {
    coachingStartDate: string | null;
    coachingEndDate: string | null;
    workoutQuota: number | null;
    sessionsCount: number;
    questionnaire: unknown | null;
  },
  now: Date = new Date(),
): boolean {
  const remaining = getWorkoutsRemaining(trainee.workoutQuota, trainee.sessionsCount);
  const inPeriod = isCoachingPeriodActive(
    trainee.coachingStartDate,
    trainee.coachingEndDate,
    now,
  );
  const expired = isCoachingPeriodExpired(trainee.coachingEndDate, now);
  const status = getTraineeStatus({
    coachingStartDate: trainee.coachingStartDate,
    coachingEndDate: trainee.coachingEndDate,
    workoutQuota: trainee.workoutQuota,
    sessionsCount: trainee.sessionsCount,
    now,
  });

  switch (filter) {
    case "all":
      return true;
    case "active":
      return status === "active";
    case "inactive":
      return status === "inactive";
    case "in_coaching_period":
      return inPeriod;
    case "coaching_expired":
      return expired;
    case "no_questionnaire":
      return !trainee.questionnaire;
    case "questionnaire_done":
      return Boolean(trainee.questionnaire);
    case "has_workouts_remaining":
      return remaining > 0;
    case "no_workouts_remaining":
      return trainee.workoutQuota != null && remaining === 0;
    default:
      return true;
  }
}
