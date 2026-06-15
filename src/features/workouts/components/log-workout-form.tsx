"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import {
  applyWorkoutLogDraft,
  buildEmptySetLogs,
  buildWorkoutLogDraft,
  clearWorkoutLogDraft,
  getWorkoutDraftTraineeKey,
  hasWorkoutDraftContent,
  loadWorkoutLogDraft,
  saveWorkoutLogDraft,
  type ExerciseLogState,
} from "@/lib/workout-log-draft";
import { isSetLogFilled } from "@/lib/workout-log-metrics";
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

function buildLogsFromExercises(
  exercises: Exercise[],
  prefill: Awaited<ReturnType<typeof getLastWorkoutLogPrefillAction>>,
): ExerciseLogState[] {
  return exercises.map((exercise) => {
    const emptySetLogs = buildEmptySetLogs(exercise.sets, exercise.reps);
    const prev = prefill?.exerciseLogs[exercise.id];

    if (!prev) {
      return {
        exerciseId: exercise.id,
        setLogs: emptySetLogs,
        notes: "",
      };
    }

    const setLogs = emptySetLogs.map((set) => {
      const prevSet = prev.sets.find((item) => item.setNumber === set.setNumber);
      if (!prevSet) return set;

      return {
        ...set,
        weightKg: prevSet.weightKg != null ? String(prevSet.weightKg) : "",
        repsCompleted:
          prevSet.repsCompleted != null ? String(prevSet.repsCompleted) : set.repsCompleted,
      };
    });

    return {
      exerciseId: exercise.id,
      setLogs,
      notes: prev.notes ?? "",
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
  const traineeKey = getWorkoutDraftTraineeKey(traineeId);
  const baselineRef = useRef<{ logs: ExerciseLogState[]; sessionNotes: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(true);
  const [hasPreviousLog, setHasPreviousLog] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [logs, setLogs] = useState<ExerciseLogState[]>(() =>
    buildLogsFromExercises(exercises, null),
  );

  const exerciseKey = exercises.map((exercise) => exercise.id).join(",");

  useEffect(() => {
    let cancelled = false;
    setPrefillLoading(true);
    setDraftRestored(false);

    getLastWorkoutLogPrefillAction(programId, traineeId).then((prefill) => {
      if (cancelled) return;

      const baselineLogs = buildLogsFromExercises(exercises, prefill);
      const baselineSessionNotes = prefill?.sessionNotes ?? "";
      baselineRef.current = { logs: baselineLogs, sessionNotes: baselineSessionNotes };

      const validExerciseIds = new Set(exercises.map((exercise) => exercise.id));
      const draft = loadWorkoutLogDraft(programId, traineeKey, validExerciseIds);

      if (draft) {
        const merged = applyWorkoutLogDraft(baselineLogs, draft, validExerciseIds);
        setLogs(merged.logs);
        setSessionNotes(merged.sessionNotes);
        setDraftRestored(true);
        setHasPreviousLog(false);
      } else {
        setLogs(baselineLogs);
        setSessionNotes(baselineSessionNotes);
        setHasPreviousLog(Boolean(prefill));
      }

      setPrefillLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [programId, traineeId, traineeKey, exerciseKey, exercises]);

  useEffect(() => {
    if (prefillLoading || !baselineRef.current) return;

    const timeout = window.setTimeout(() => {
      const baseline = baselineRef.current;
      if (!baseline) return;

      const draft = buildWorkoutLogDraft(
        programId,
        traineeKey,
        logs,
        baseline.logs,
        sessionNotes,
      );

      if (draft) {
        saveWorkoutLogDraft(draft);
      } else {
        clearWorkoutLogDraft(programId, traineeKey);
      }
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [logs, sessionNotes, prefillLoading, programId, traineeKey]);

  const hasUnsavedChanges =
    !prefillLoading &&
    !loading &&
    baselineRef.current != null &&
    hasWorkoutDraftContent(
      logs,
      baselineRef.current.logs,
      sessionNotes,
      baselineRef.current.sessionNotes,
    );

  useUnsavedChangesWarning(hasUnsavedChanges);

  function updateSetLog(exerciseIndex: number, setIndex: number, field: string, value: string) {
    setLogs((prev) =>
      prev.map((log, index) => {
        if (index !== exerciseIndex) return log;

        return {
          ...log,
          setLogs: log.setLogs.map((set, currentSetIndex) =>
            currentSetIndex === setIndex ? { ...set, [field]: value } : set,
          ),
        };
      }),
    );
  }

  function updateExerciseNotes(exerciseIndex: number, value: string) {
    setLogs((prev) =>
      prev.map((log, index) => (index === exerciseIndex ? { ...log, notes: value } : log)),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("programId", programId);
    if (traineeId) formData.set("traineeId", traineeId);
    const baseline = baselineRef.current;
    formData.set(
      "logs",
      JSON.stringify(
        logs.map((log, exerciseIndex) => {
          const baselineLog = baseline?.logs[exerciseIndex];

          return {
            exerciseId: log.exerciseId,
            notes: log.notes || undefined,
            sets: log.setLogs
              .filter((set, setIndex) => {
                const baselineReps =
                  baselineLog?.setLogs[setIndex]?.repsCompleted ??
                  String(exercises[exerciseIndex]?.reps ?? "");
                return isSetLogFilled(set, baselineReps);
              })
              .map((set) => ({
                setNumber: set.setNumber,
                weightKg: set.weightKg ? Number(set.weightKg) : undefined,
                repsCompleted: set.repsCompleted ? Number(set.repsCompleted) : undefined,
              })),
          };
        }),
      ),
    );

    const result = await submitAction(formData);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    clearWorkoutLogDraft(programId, traineeKey);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {prefillLoading && (
        <p className="text-muted-foreground text-sm">טוען נתונים מהדיווח האחרון...</p>
      )}
      {!prefillLoading && draftRestored && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-muted-foreground text-sm">
          טיוטת הדיווח שוחזרה — ניתן להמשיך מהמקום שבו הפסקת. הטיוטה נשמרת אוטומטית למשך 12
          שעות.
        </p>
      )}
      {!prefillLoading && !draftRestored && hasPreviousLog && (
        <p className="text-muted-foreground text-sm">
          השדות מולאו לפי הדיווח האחרון של תוכנית זו — ניתן לערוך לפני השמירה.
        </p>
      )}
      {!prefillLoading && hasUnsavedChanges && (
        <p className="text-muted-foreground text-xs">
          הנתונים נשמרים אוטומטית בטיוטה עד לשמירת האימון.
        </p>
      )}
      {exercises.map((exercise, exerciseIndex) => (
        <div key={exercise.id} className="space-y-3 rounded-lg border border-border p-4">
          <div>
            <h3 className="font-medium">{exercise.name}</h3>
            <p className="text-muted-foreground text-xs">
              {exercise.sets} סטים × {exercise.reps} חזרות · מנוחה {exercise.restSeconds} שנ׳
            </p>
          </div>

          <div className="space-y-3">
            {logs[exerciseIndex]?.setLogs.map((set, setIndex) => (
              <div
                key={`${exercise.id}-${set.setNumber}`}
                className="grid gap-3 rounded-md border border-border/70 bg-muted/20 p-3 sm:grid-cols-[auto_1fr_1fr]"
              >
                <div className="flex items-center">
                  <span className="font-medium text-sm">סט {set.setNumber}</span>
                </div>
                <div className="space-y-1">
                  <Label>משקל (ק״ג)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min={0}
                    value={set.weightKg}
                    onChange={(e) =>
                      updateSetLog(exerciseIndex, setIndex, "weightKg", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label>חזרות בפועל</Label>
                  <Input
                    type="number"
                    min={0}
                    value={set.repsCompleted}
                    onChange={(e) =>
                      updateSetLog(exerciseIndex, setIndex, "repsCompleted", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <Label>הערות לתרגיל</Label>
            <Textarea
              value={logs[exerciseIndex]?.notes ?? ""}
              onChange={(e) => updateExerciseNotes(exerciseIndex, e.target.value)}
              rows={2}
            />
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
