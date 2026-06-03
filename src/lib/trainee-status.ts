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

export function getWorkoutsRemaining(workoutQuota: number | null, sessionsCount: number): number {
  if (workoutQuota == null || workoutQuota <= 0) return 0;
  return Math.max(0, workoutQuota - sessionsCount);
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
