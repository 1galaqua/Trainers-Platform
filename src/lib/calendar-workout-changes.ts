import type { ProgramType, ScheduledWorkoutType } from "@/lib/prisma-client";

export type SignificantChangeResult = {
  hasSignificantChange: boolean;
  spotsOpened: boolean;
};

type WorkoutSnapshot = {
  type: ScheduledWorkoutType;
  startsAt: Date;
  durationMinutes: number;
  workoutKind: ProgramType;
  traineeId: string | null;
  maxParticipants: number | null;
  registeredCount: number;
};

export function detectSignificantWorkoutChanges(
  existing: WorkoutSnapshot,
  updated: Omit<WorkoutSnapshot, "type" | "registeredCount">,
): SignificantChangeResult {
  const timeChanged = existing.startsAt.getTime() !== updated.startsAt.getTime();
  const durationChanged = existing.durationMinutes !== updated.durationMinutes;

  if (existing.type === "PERSONAL") {
    const traineeChanged = existing.traineeId !== updated.traineeId;
    return {
      hasSignificantChange: timeChanged || durationChanged || traineeChanged,
      spotsOpened: false,
    };
  }

  const kindChanged = existing.workoutKind !== updated.workoutKind;
  const oldMax = existing.maxParticipants ?? 0;
  const newMax = updated.maxParticipants ?? 0;
  const maxChanged = oldMax !== newMax;
  const hadNoSpots = existing.registeredCount >= oldMax;
  const hasSpotsNow = existing.registeredCount < newMax;
  const maxAffectsAvailability = maxChanged && hadNoSpots && hasSpotsNow;

  return {
    hasSignificantChange:
      timeChanged || durationChanged || kindChanged || maxAffectsAvailability,
    spotsOpened: maxAffectsAvailability,
  };
}
