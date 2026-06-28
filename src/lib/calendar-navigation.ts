export function buildCalendarWorkoutUrl(workoutId: string): string {
  const params = new URLSearchParams({
    view: "day",
    workout: workoutId,
  });
  return `/dashboard/calendar?${params.toString()}`;
}

export function buildCalendarEventUrl(eventId: string): string {
  const params = new URLSearchParams({
    view: "day",
    event: eventId,
  });
  return `/dashboard/calendar?${params.toString()}`;
}
