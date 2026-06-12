"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getEffectiveWorkoutsCompleted } from "@/lib/trainee-status";
import { updateCoachingPeriodAction } from "@/server/actions/trainees";

type CoachingPeriodFormProps = {
  traineeId: string;
  coachingStartDate: string | null;
  coachingEndDate: string | null;
  workoutQuota: number | null;
  workoutsCompleted: number | null;
  loggedSessionsCount?: number;
  compact?: boolean;
};

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function formatDisplayDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CoachingPeriodForm({
  traineeId,
  coachingStartDate,
  coachingEndDate,
  workoutQuota,
  workoutsCompleted,
  loggedSessionsCount = 0,
  compact,
}: CoachingPeriodFormProps) {
  const router = useRouter();
  const effectiveCompleted = getEffectiveWorkoutsCompleted(
    workoutsCompleted,
    loggedSessionsCount,
  );

  const [start, setStart] = useState(toDateInputValue(coachingStartDate));
  const [end, setEnd] = useState(toDateInputValue(coachingEndDate));
  const [quota, setQuota] = useState(workoutQuota != null ? String(workoutQuota) : "");
  const [completed, setCompleted] = useState(String(effectiveCompleted));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("traineeId", traineeId);
    formData.set("coachingStartDate", start);
    formData.set("coachingEndDate", end);
    formData.set("workoutQuota", quota);
    formData.set("workoutsCompleted", completed);

    const result = await updateCoachingPeriodAction(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  const hasPeriod = coachingStartDate && coachingEndDate;
  const remaining =
    workoutQuota != null ? Math.max(0, workoutQuota - effectiveCompleted) : null;
  const showLoggedHint =
    loggedSessionsCount !== effectiveCompleted ||
    workoutsCompleted != null;

  const fieldGridClass = compact
    ? "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    : "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2";

  return (
    <form onSubmit={handleSubmit} className="min-w-0 space-y-3 text-right">
      {hasPeriod && (
        <p className="break-words text-muted-foreground text-sm leading-relaxed">
          ליווי: {formatDisplayDate(coachingStartDate)} — {formatDisplayDate(coachingEndDate)}
          {workoutQuota != null && (
            <>
              {" "}
              · מכסה: {workoutQuota} אימונים
              {remaining != null && ` (נותרו ${remaining})`}
            </>
          )}
        </p>
      )}
      <div className={fieldGridClass}>
        <div className="min-w-0 w-full space-y-1">
          <Label className="block w-full text-right" htmlFor={`start-${traineeId}`}>תאריך התחלה</Label>
          <Input
            id={`start-${traineeId}`}
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            className="input-date-rtl"
          />
        </div>
        <div className="min-w-0 w-full space-y-1">
          <Label className="block w-full text-right" htmlFor={`end-${traineeId}`}>תאריך סיום</Label>
          <Input
            id={`end-${traineeId}`}
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
            className="input-date-rtl"
          />
        </div>
        <div className="min-w-0 w-full space-y-1">
          <Label className="block w-full text-right" htmlFor={`quota-${traineeId}`}>מכסת אימונים</Label>
          <Input
            id={`quota-${traineeId}`}
            type="number"
            min={1}
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
            required
            inputMode="numeric"
            dir="rtl"
            className="text-right"
            placeholder="10"
          />
        </div>
        <div className="min-w-0 w-full space-y-1">
          <Label className="block w-full text-right" htmlFor={`completed-${traineeId}`}>אימונים שבוצעו</Label>
          <Input
            id={`completed-${traineeId}`}
            type="number"
            min={0}
            value={completed}
            onChange={(e) => setCompleted(e.target.value)}
            required
            inputMode="numeric"
            dir="rtl"
            className="text-right"
            placeholder="0"
          />
          {showLoggedHint && (
            <p className="text-muted-foreground text-xs">
              {loggedSessionsCount} דווחו במערכת על ידי המתאמן
            </p>
          )}
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex justify-start">
      <Button
        type="submit"
        size="sm"
        variant={compact ? "outline" : "default"}
        disabled={loading}
        className="w-full sm:w-auto"
      >
        {loading ? "שומר..." : hasPeriod ? "עדכון הגדרות ליווי" : "שמירת הגדרות ליווי"}
      </Button>
      </div>
    </form>
  );
}
