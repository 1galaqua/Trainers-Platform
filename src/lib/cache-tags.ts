/** Central cache tag builders for Next.js `unstable_cache` / `revalidateTag`. */

export function userTag(userId: string) {
  return `user:${userId}`;
}

export function notificationsTag(userId: string) {
  return `notifications:${userId}`;
}

export function trackingWeekTag(traineeId: string, weekStart: string) {
  return `tracking:${traineeId}:${weekStart}`;
}

export function programsTag(traineeId: string) {
  return `programs:${traineeId}`;
}

export function logWorkoutTag(traineeId: string) {
  return `log-workout:${traineeId}`;
}

export function traineeDetailTag(traineeId: string) {
  return `trainee-detail:${traineeId}`;
}

export function calendarMonthTag(userId: string, monthKey: string) {
  return `calendar:${userId}:${monthKey}`;
}

export function calendarWorkoutsTag(userId: string) {
  return `calendar-workouts:${userId}`;
}

export function coachTraineesTag(coachId: string) {
  return `coach-trainees:${coachId}`;
}
