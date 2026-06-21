import type { Prisma } from "@/lib/prisma-client";

type ExerciseSetLogInput = {
  setNumber: number;
  weightKg?: number;
  repsCompleted?: number;
};

type ExerciseLogInput = {
  exerciseId: string;
  notes?: string;
  sets?: ExerciseSetLogInput[];
};

function normalizeOptionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export function buildWorkoutSessionCreateData(input: {
  programId: string;
  traineeId: string;
  sessionNotes: string | null;
  logs: ExerciseLogInput[];
  loggedByRole: "COACH" | "TRAINEE";
  logKind: "REPORT" | "SAVE";
}): Prisma.WorkoutSessionUncheckedCreateInput {
  const exerciseLogCreates = input.logs
    .map((log) => {
      const setCreates = (log.sets ?? [])
        .map((set) => ({
          setNumber: set.setNumber,
          weightKg: normalizeOptionalNumber(set.weightKg),
          repsCompleted: normalizeOptionalNumber(set.repsCompleted),
        }))
        .filter((set) => set.weightKg != null || set.repsCompleted != null);

      const hasNotes = Boolean(log.notes?.trim());
      if (setCreates.length === 0 && !hasNotes) {
        return null;
      }

      return {
        exerciseId: log.exerciseId,
        notes: log.notes?.trim() || null,
        weightKg: null,
        repsCompleted: null,
        ...(setCreates.length > 0 ? { setLogs: { create: setCreates } } : {}),
      };
    })
    .filter((log): log is NonNullable<typeof log> => log != null);

  return {
    programId: input.programId,
    traineeId: input.traineeId,
    notes: input.sessionNotes,
    loggedByRole: input.loggedByRole,
    logKind: input.logKind,
    ...(exerciseLogCreates.length > 0 ? { logs: { create: exerciseLogCreates } } : {}),
  };
}

export function getNextWorkoutsCompletedValue(input: {
  workoutsCompleted: number | null;
  completedCount: number;
}): number {
  const base =
    input.workoutsCompleted != null
      ? Number(input.workoutsCompleted)
      : input.completedCount;

  if (!Number.isFinite(base)) {
    return input.completedCount + 1;
  }

  return Math.floor(base) + 1;
}
