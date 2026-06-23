/** Cron API routes that must bypass auth middleware (Vercel cron has no session cookie). */
export const CRON_PUBLIC_PATHS = [
  "/api/cron/calendar-reminders",
  "/api/cron/workout-reminders",
  "/api/cron/group-spots-reminders",
  "/api/cron/body-weight-reminders",
  "/api/cron/sleep-reminders",
  "/api/cron/water-reminders",
  "/api/cron/measurements-reminders",
  "/api/cron/steps-reminders",
  "/api/cron/cleanup-notifications",
] as const;

export function isCronPublicPath(pathname: string) {
  return CRON_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
