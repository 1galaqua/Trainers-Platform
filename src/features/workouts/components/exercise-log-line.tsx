import { formatExerciseLogSummary } from "@/lib/format-exercise-log";

type ExerciseLogLineProps = {
  exerciseName: string;
  weightKg: number | null;
  repsCompleted: number | null;
  setLogs: Array<{
    setNumber: number;
    weightKg: number | null;
    repsCompleted: number | null;
  }>;
};

export function ExerciseLogLine({
  exerciseName,
  weightKg,
  repsCompleted,
  setLogs,
}: ExerciseLogLineProps) {
  return (
    <p>
      {exerciseName}: {formatExerciseLogSummary({ weightKg, repsCompleted, setLogs })}
    </p>
  );
}
