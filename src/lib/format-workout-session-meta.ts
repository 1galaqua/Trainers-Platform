import type { UserRole, WorkoutLogKind } from "@/lib/prisma-client";

export function formatWorkoutSessionLogMeta(
  logKind: WorkoutLogKind | null | undefined,
  loggedByRole: UserRole | null | undefined,
): string | null {
  if (!logKind || !loggedByRole) return null;

  const action = logKind === "REPORT" ? "דווח" : "נשמר";
  const actor = loggedByRole === "COACH" ? "מאמן/ית" : "מתאמן/ית";

  return `${action} על ידי ${actor}`;
}
