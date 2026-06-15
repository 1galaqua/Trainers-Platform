import type { ExerciseSetLogRecord } from "@/lib/workout-log-metrics";

type ExerciseLogDisplayInput = {
  weightKg: number | null;
  repsCompleted: number | null;
  setLogs: ExerciseSetLogRecord[];
};

export function formatExerciseLogSummary(log: ExerciseLogDisplayInput): string {
  if (log.setLogs.length > 0) {
    const parts = log.setLogs
      .filter((set) => set.weightKg != null || set.repsCompleted != null)
      .map(
        (set) =>
          `סט ${set.setNumber}: ${set.weightKg ?? "—"} ק״ג × ${set.repsCompleted ?? "—"}`,
      );

    if (parts.length > 0) return parts.join(" · ");
  }

  return `${log.weightKg ?? "—"} ק״ג × ${log.repsCompleted ?? "—"} חזרות`;
}
