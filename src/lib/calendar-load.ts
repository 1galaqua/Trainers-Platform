import { unstable_cache } from "next/cache";

import { calendarWorkoutsTag } from "@/lib/cache-tags";
import { getCalendarVisibleRange } from "@/lib/calendar-range";
import { notCancelledWhere } from "@/lib/calendar-prisma-filters";
import { reminderNotSentWhere } from "@/lib/user-workout-reminders";
import { prisma } from "@/lib/prisma";
import type { CalendarScheduleItem } from "@/server/actions/calendar-types";
import type { UserRole } from "@/lib/prisma-client";

async function getCoachIdForUser(userId: string, role: UserRole) {
  if (role === "COACH") return userId;

  const link = await prisma.coachTrainee.findUnique({
    where: { traineeId: userId },
    select: { coachId: true },
  });

  return link?.coachId ?? null;
}

export async function loadCalendarSchedule(
  userId: string,
  role: UserRole,
): Promise<CalendarScheduleItem[]> {
  const { start, end } = getCalendarVisibleRange();

  if (role === "ADMIN") return [];

  const coachId = await getCoachIdForUser(userId, role);
  if (!coachId) return [];

  const [workouts, events] = await Promise.all([
    prisma.scheduledWorkout.findMany({
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
    }),
    prisma.calendarEvent.findMany({
      where: {
        coachId,
        startsAt: { gte: start, lte: end },
        AND: [
          notCancelledWhere,
          ...(role === "TRAINEE" ? [{ traineeId: userId }] : []),
        ],
      },
      orderBy: { startsAt: "asc" },
      include: {
        trainee: { select: { displayName: true } },
      },
    }),
  ]);

  const workoutIds = workouts.map((workout) => workout.id);
  const eventIds = events.map((event) => event.id);

  const [workoutReminders, eventReminders] = await Promise.all([
    prisma.userWorkoutReminder.findMany({
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
    }),
    prisma.userCalendarEventReminder.findMany({
      where: {
        userId,
        eventId: { in: eventIds },
        ...reminderNotSentWhere,
      },
      select: {
        eventId: true,
        kind: true,
        scheduledFor: true,
      },
    }),
  ]);

  const workoutReminderById = new Map(
    workoutReminders.map((reminder) => [reminder.workoutId, reminder]),
  );
  const eventReminderById = new Map(
    eventReminders.map((reminder) => [reminder.eventId, reminder]),
  );

  const workoutItems: CalendarScheduleItem[] = workouts.map((workout) => {
    const reminder = workoutReminderById.get(workout.id);

    return {
      kind: "workout",
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

  const eventItems: CalendarScheduleItem[] = events.map((event) => {
    const reminder = eventReminderById.get(event.id);

    return {
      kind: "event",
      id: event.id,
      title: event.title,
      startsAt: event.startsAt.toISOString(),
      durationMinutes: event.durationMinutes,
      traineeId: event.traineeId,
      traineeName: event.trainee?.displayName ?? null,
      notes: event.notes,
      userReminder: reminder
        ? {
            kind: reminder.kind,
            scheduledFor: reminder.scheduledFor.toISOString(),
          }
        : null,
    };
  });

  return [...workoutItems, ...eventItems].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

export async function getCachedCalendarSchedule(
  userId: string,
  role: UserRole,
): Promise<CalendarScheduleItem[]> {
  return unstable_cache(
    async () => loadCalendarSchedule(userId, role),
    ["calendar-schedule", userId, role],
    { tags: [calendarWorkoutsTag(userId)] },
  )();
}

/** @deprecated Use loadCalendarSchedule */
export async function loadCalendarWorkouts(userId: string, role: UserRole) {
  return loadCalendarSchedule(userId, role);
}

/** @deprecated Use getCachedCalendarSchedule */
export async function getCachedCalendarWorkouts(userId: string, role: UserRole) {
  return getCachedCalendarSchedule(userId, role);
}
