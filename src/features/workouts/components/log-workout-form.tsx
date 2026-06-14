"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getLastWorkoutLogPrefillAction,
  logWorkoutAction,
  type LogWorkoutActionResult,
} from "@/server/actions/workouts";

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
};

type ExerciseLogState = {
  exerciseId: string;
  weightKg: string;
  repsCompleted: string;
  notes: string;
};

function buildLogsFromExercises(
  exercises: Exercise[],
  prefill: Awaited<ReturnType<typeof getLastWorkoutLogPrefillAction>>,
): ExerciseLogState[] {
  return exercises.map((ex) => {
    const prev = prefill?.exerciseLogs[ex.id];
    if (prev) {
      return {
        exerciseId: ex.id,
        weightKg: prev.weightKg != null ? String(prev.weightKg) : "",
        repsCompleted:
          prev.repsCompleted != null ? String(prev.repsCompleted) : String(ex.reps),
        notes: prev.notes ?? "",
      };
    }

    return {
      exerciseId: ex.id,
      weightKg: "",
      repsCompleted: String(ex.reps),
      notes: "",
    };
  });
}

type LogWorkoutFormProps = {
  programId: string;
  exercises: Exercise[];
  traineeId?: string;
  submitAction?: (formData: FormData) => Promise<LogWorkoutActionResult>;
  redirectTo?: string;
};

export function LogWorkoutForm({
  programId,
  exercises,
  traineeId,
  submitAction = logWorkoutAction,
  redirectTo = "/dashboard/progress",
}: LogWorkoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(true);
  const [hasPreviousLog, setHasPreviousLog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [logs, setLogs] = useState<ExerciseLogState[]>(() =>
    buildLogsFromExercises(exercises, null),
  );

  const exerciseKey = exercises.map((exercise) => exercise.id).join(",");

  useEffect(() => {
    let cancelled = false;
    setPrefillLoading(true);

    getLastWorkoutLogPrefillAction(programId, traineeId).then((prefill) => {
      if (cancelled) return;

      setLogs(buildLogsFromExercises(exercises, prefill));
      setSessionNotes(prefill?.sessionNotes ?? "");
      setHasPreviousLog(Boolean(prefill));
      setPrefillLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [programId, traineeId, exerciseKey, exercises]);

  function updateLog(index: number, field: string, value: string) {
    setLogs((prev) => prev.map((log, i) => (i === index ? { ...log, [field]: value } : log)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("programId", programId);
    if (traineeId) formData.set("traineeId", traineeId);
    formData.set(
      "logs",
      JSON.stringify(
        logs.map((log) => ({
          exerciseId: log.exerciseId,
          weightKg: log.weightKg ? Number(log.weightKg) : undefined,
          repsCompleted: log.repsCompleted ? Number(log.repsCompleted) : undefined,
          notes: log.notes || undefined,
        })),
      ),
    );

    const result = await submitAction(formData);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {prefillLoading && (
        <p className="text-muted-foreground text-sm">טוען נתונים מהדיווח האחרון...</p>
      )}
      {!prefillLoading && hasPreviousLog && (
        <p className="text-muted-foreground text-sm">
          השדות מולאו לפי הדיווח האחרון של תוכנית זו — ניתן לערוך לפני השמירה.
        </p>
      )}
      {exercises.map((ex, index) => (
        <div key={ex.id} className="space-y-3 rounded-lg border border-border p-4">
          <div>
            <h3 className="font-medium">{ex.name}</h3>
            <p className="text-muted-foreground text-xs">
              {ex.sets} סטים × {ex.reps} חזרות · מנוחה {ex.restSeconds} שנ׳
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>משקל (ק״ג)</Label>
              <Input
                type="number"
                step="0.5"
                min={0}
                value={logs[index].weightKg}
                onChange={(e) => updateLog(index, "weightKg", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label>חזרות בפועל</Label>
              <Input
                type="number"
                min={0}
                value={logs[index].repsCompleted}
                onChange={(e) => updateLog(index, "repsCompleted", e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>הערות</Label>
              <Textarea
                value={logs[index].notes}
                onChange={(e) => updateLog(index, "notes", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="space-y-2">
        <Label htmlFor="notes">הערות כלליות לאימון</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={loading || prefillLoading}>
        {loading ? "שומר..." : "שמירת אימון"}
      </Button>
    </form>
  );
}
