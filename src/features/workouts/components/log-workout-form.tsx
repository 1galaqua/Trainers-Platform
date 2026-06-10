"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
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
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState(
    exercises.map((ex) => ({
      exerciseId: ex.id,
      weightKg: "",
      repsCompleted: String(ex.reps),
      notes: "",
    })),
  );

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
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "שומר..." : "שמירת אימון"}
      </Button>
    </form>
  );
}
