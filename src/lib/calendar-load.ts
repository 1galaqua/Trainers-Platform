import { unstable_cache } from "next/cache";

import { calendarWorkoutsTag } from "@/lib/cache-tags";
import { getCalendarVisibleRange } from "@/lib/calendar-range";
import { notCancelledWhere } from "@/lib/calendar-prisma-filters";
import { reminderNotSentWhere } from "@/lib/user-workout-reminders";
import { prisma } from "@/lib/prisma";
import type { CalendarWorkoutItem } from "@/server/actions/calendar";
import type { UserRole } from "@/lib/prisma-client";

async function getCoachIdForUser(userId: string, role: UserRole) {
  if (role === "COACH") return userId;

  const link = await prisma.coachTrainee.findUnique({
    where: { traineeId: userId },
    select: { coachId: true },
  });

  return link?.coachId ?? null;
}

export async function loadCalendarWorkouts(
  userId: string,
  role: UserRole,
): Promise<CalendarWorkoutItem[]> {
  const { start, end } = getCalendarVisibleRange();

  if (role === "ADMIN") return [];

  const coachId = await getCoachIdForUser(userId, role);
  if (!coachId) return [];

  const workouts = await prisma.scheduledWorkout.findMany({
    where: {
      coachId,
      startsAt: { gte: start, lte: end },
      AND: [
        notCancelledWhere,
        ...(role === "TRAINEE"
          ? [
              {
                OR: [
                  { type: "GROUP" as const },
                  { type: "PERSONAL" as const, traineeId: userId },
                ],
              },
            ]
          : []),
      ],
    },
    orderBy: { startsAt: "asc" },
    include: {
      trainee: { select: { displayName: true } },
      program: { select: { name: true } },
      registrations: {
        where: notCancelledWhere,
        select: {
          traineeId: true,
          trainee: {
            select: { id: true, displayName: true, email: true },
          },
        },
      },
    },
  });

  const workoutIds = workouts.map((workout) => workout.id);
  const userReminders = await prisma.userWorkoutReminder.findMany({
    where: {
      userId,
      workoutId: { in: workoutIds },
      ...reminderNotSentWhere,
    },
    select: {
      workoutId: true,
      kind: true,
      scheduledFor: true,
    },
  });

  const reminderByWorkoutId = new Map(
    userReminders.map((reminder) => [reminder.workoutId, reminder]),
  );

  return workouts.map((workout) => {
    const reminder = reminderByWorkoutId.get(workout.id);

    return {
      id: workout.id,
      type: workout.type,
      workoutKind: workout.workoutKind,
      startsAt: workout.startsAt.toISOString(),
      durationMinutes: workout.durationMinutes,
      traineeId: workout.traineeId,
      traineeName: workout.trainee?.displayName ?? null,
      programId: workout.programId,
      programName: workout.program?.name ?? null,
      maxParticipants: workout.maxParticipants,
      registeredCount: workout.registrations.length,
      isRegistered:
        role === "TRAINEE"
          ? workout.registrations.some((registration) => registration.traineeId === userId)
          : false,
      registeredTrainees:
        role === "COACH"
          ? workout.registrations.map((registration) => ({
              id: registration.trainee.id,
              name:
                registration.trainee.displayName ??
                registration.trainee.email ??
                "מתאמן",
            }))
          : [],
      notes: workout.notes,
      deliveryMode: workout.deliveryMode,
      meetingLink: workout.meetingLink,
      userReminder: reminder
        ? {
            kind: reminder.kind,
            scheduledFor: reminder.scheduledFor.toISOString(),
          }
        : null,
    };
  });
}

export async function getCachedCalendarWorkouts(
  userId: string,
  role: UserRole,
): Promise<CalendarWorkoutItem[]> {
  return unstable_cache(
    async () => loadCalendarWorkouts(userId, role),
    ["calendar-workouts", userId, role],
    { tags: [calendarWorkoutsTag(userId)] },
  )();
}
