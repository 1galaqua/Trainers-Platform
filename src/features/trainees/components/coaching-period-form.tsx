"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatCoachingDisplayDate,
  toCoachingDateInputValue,
} from "@/lib/coaching-period-dates";
import { getEffectiveWorkoutsCompleted } from "@/lib/trainee-status";
import { updateCoachingPeriodAction } from "@/server/actions/trainees";

type DateInputFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function DateInputField({ id, label, value, onChange }: DateInputFieldProps) {
  return (
    <div className="min-w-0 w-full space-y-1">
      <Label className="block w-full text-right" htmlFor={id}>
        {label}
      </Label>
      <DateInput
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}

type CoachingPeriodFormProps = {
  traineeId: string;
  coachingStartDate: string | null;
  coachingEndDate: string | null;
  workoutQuota: number | null;
  workoutsCompleted: number | null;
  loggedSessionsCount?: number;
  compact?: boolean;
};

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

  const [start, setStart] = useState(toCoachingDateInputValue(coachingStartDate));
  const [end, setEnd] = useState(toCoachingDateInputValue(coachingEndDate));
  const [quota, setQuota] = useState(workoutQuota != null ? String(workoutQuota) : "");
  const [completed, setCompleted] = useState(String(effectiveCompleted));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStart(toCoachingDateInputValue(coachingStartDate));
    setEnd(toCoachingDateInputValue(coachingEndDate));
  }, [coachingStartDate, coachingEndDate]);

  useEffect(() => {
    setQuota(workoutQuota != null ? String(workoutQuota) : "");
  }, [workoutQuota]);

  useEffect(() => {
    setCompleted(
      String(getEffectiveWorkoutsCompleted(workoutsCompleted, loggedSessionsCount)),
    );
  }, [workoutsCompleted, loggedSessionsCount]);

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
    ? "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2"
    : "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <form onSubmit={handleSubmit} className="min-w-0 space-y-3 text-right">
      {hasPeriod && (
        <p className="break-words text-muted-foreground text-base leading-relaxed">
          ליווי: {formatCoachingDisplayDate(coachingStartDate)} —{" "}
          {formatCoachingDisplayDate(coachingEndDate)}
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
        <DateInputField
          id={`start-${traineeId}`}
          label="תאריך התחלה"
          value={start}
          onChange={setStart}
        />
        <DateInputField
          id={`end-${traineeId}`}
          label="תאריך סיום"
          value={end}
          onChange={setEnd}
        />
        <div className="min-w-0 w-full space-y-1">
          <Label className="block w-full text-right" htmlFor={`quota-${traineeId}`}>
            מכסת אימונים
          </Label>
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
          <Label className="block w-full text-right" htmlFor={`completed-${traineeId}`}>
            אימונים שבוצעו
          </Label>
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
            <p className="text-muted-foreground text-sm">
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
