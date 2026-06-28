import { WORKOUT_DURATION_OPTIONS } from "@/lib/calendar-validation";
import { notCancelledWhere } from "@/lib/calendar-prisma-filters";
import { prisma } from "@/lib/prisma";

export const SCHEDULE_OVERLAP_ERROR = "לא ניתן לקבוע אימון או אירוע במקביל";

const MAX_WORKOUT_DURATION_MINUTES = Math.max(...WORKOUT_DURATION_OPTIONS);

export function doWorkoutTimesOverlap(
  aStart: Date,
  aDurationMinutes: number,
  bStart: Date,
  bDurationMinutes: number,
): boolean {
  const aEnd = aStart.getTime() + aDurationMinutes * 60_000;
  const bEnd = bStart.getTime() + bDurationMinutes * 60_000;
  return aStart.getTime() < bEnd && bStart.getTime() < aEnd;
}

export async function findOverlappingCoachWorkout(params: {
  coachId: string;
  startsAt: Date;
  durationMinutes: number;
  excludeWorkoutId?: string;
  excludeEventId?: string;
}) {
  const overlappingWorkout = await findOverlappingCoachWorkoutOnly(params);
  if (overlappingWorkout) return overlappingWorkout;

  const overlappingEvent = await findOverlappingCoachEventOnly(params);
  if (overlappingEvent) return overlappingEvent;

  return null;
}

async function findOverlappingCoachWorkoutOnly(params: {
  coachId: string;
  startsAt: Date;
  durationMinutes: number;
  excludeWorkoutId?: string;
}) {
  const endsAt = new Date(
    params.startsAt.getTime() + params.durationMinutes * 60_000,
  );
  const searchFrom = new Date(
    params.startsAt.getTime() - MAX_WORKOUT_DURATION_MINUTES * 60_000,
  );

  const candidates = await prisma.scheduledWorkout.findMany({
    where: {
      coachId: params.coachId,
      ...notCancelledWhere,
      startsAt: {
        gte: searchFrom,
        lt: endsAt,
      },
      ...(params.excludeWorkoutId
        ? { id: { not: params.excludeWorkoutId } }
        : {}),
    },
    select: {
      id: true,
      type: true,
      startsAt: true,
      durationMinutes: true,
    },
  });

  return (
    candidates.find((workout) =>
      doWorkoutTimesOverlap(
        params.startsAt,
        params.durationMinutes,
        workout.startsAt,
        workout.durationMinutes,
      ),
    ) ?? null
  );
}

async function findOverlappingCoachEventOnly(params: {
  coachId: string;
  startsAt: Date;
  durationMinutes: number;
  excludeEventId?: string;
}) {
  const endsAt = new Date(
    params.startsAt.getTime() + params.durationMinutes * 60_000,
  );
  const searchFrom = new Date(
    params.startsAt.getTime() - MAX_WORKOUT_DURATION_MINUTES * 60_000,
  );

  const candidates = await prisma.calendarEvent.findMany({
    where: {
      coachId: params.coachId,
      ...notCancelledWhere,
      startsAt: {
        gte: searchFrom,
        lt: endsAt,
      },
      ...(params.excludeEventId ? { id: { not: params.excludeEventId } } : {}),
    },
    select: {
      id: true,
      startsAt: true,
      durationMinutes: true,
    },
  });

  return (
    candidates.find((event) =>
      doWorkoutTimesOverlap(
        params.startsAt,
        params.durationMinutes,
        event.startsAt,
        event.durationMinutes,
      ),
    ) ?? null
  );
}
