export type ExerciseSetLogRecord = {
  setNumber: number;
  weightKg: number | null;
  repsCompleted: number | null;
};

export type ExerciseLogMetricsInput = {
  weightKg: number | null;
  repsCompleted: number | null;
  setLogs: ExerciseSetLogRecord[];
  defaultReps: number;
  plannedSets: number;
};

export type ExerciseLogMetrics = {
  averageWeight: number;
  volume: number;
};

export function isSetLogFilled(
  set: { weightKg: string; repsCompleted: string },
  baselineReps: string,
): boolean {
  if (set.weightKg.trim() !== "") return true;
  if (set.repsCompleted.trim() !== "" && set.repsCompleted !== baselineReps) return true;
  return false;
}

export function computeExerciseLogMetrics(input: ExerciseLogMetricsInput): ExerciseLogMetrics {
  if (input.setLogs.length > 0) {
    const filledSets = input.setLogs.filter(
      (set) => set.weightKg != null || set.repsCompleted != null,
    );

    const weights = filledSets
      .map((set) => set.weightKg)
      .filter((weight): weight is number => weight != null);

    const averageWeight =
      weights.length > 0 ? weights.reduce((sum, weight) => sum + weight, 0) / weights.length : 0;

    const volume = filledSets.reduce(
      (sum, set) => sum + (set.weightKg ?? 0) * (set.repsCompleted ?? input.defaultReps),
      0,
    );

    return { averageWeight, volume };
  }

  const weight = input.weightKg ?? 0;
  const reps = input.repsCompleted ?? input.defaultReps;

  return {
    averageWeight: weight,
    volume: weight * reps * input.plannedSets,
  };
}
