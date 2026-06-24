import { getCurrentUser } from "@/lib/auth";
import { notCancelledWhere } from "@/lib/calendar-prisma-filters";
import { prisma } from "@/lib/prisma";
import type { WorkoutCalendarExportInput } from "@/lib/workout-calendar-export";

export async function getWorkoutCalendarExportForUser(
  workoutId: string,
): Promise<WorkoutCalendarExportInput | null> {
  const user = await getCurrentUser();
  if (!user || user.role === "ADMIN") return null;

  const workout = await prisma.scheduledWorkout.findFirst({
    where: { id: workoutId, ...notCancelledWhere },
    include: {
      trainee: { select: { displayName: true } },
      program: { select: { name: true } },
      registrations: {
        where: notCancelledWhere,
        select: { traineeId: true },
      },
    },
  });

  if (!workout) return null;

  if (user.role === "COACH") {
    if (workout.coachId !== user.id) return null;
  } else if (workout.type === "PERSONAL") {
    if (workout.traineeId !== user.id) return null;
  } else if (!workout.registrations.some((registration) => registration.traineeId === user.id)) {
    return null;
  }

  return {
    id: workout.id,
    type: workout.type,
    workoutKind: workout.workoutKind,
    startsAt: workout.startsAt.toISOString(),
    durationMinutes: workout.durationMinutes,
    deliveryMode: workout.deliveryMode,
    meetingLink: workout.meetingLink,
    traineeName: workout.trainee?.displayName ?? null,
    programName: workout.program?.name ?? null,
    notes: workout.notes,
  };
}
