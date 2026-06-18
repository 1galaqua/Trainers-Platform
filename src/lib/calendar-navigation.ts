export function buildCalendarWorkoutUrl(workoutId: string): string {
  const params = new URLSearchParams({
    view: "day",
    workout: workoutId,
  });
  return `/dashboard/calendar?${params.toString()}`;
}
