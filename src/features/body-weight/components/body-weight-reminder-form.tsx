"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TimeInput } from "@/components/ui/date-input";
import { cn } from "@/lib/utils";
import {
  BODY_WEIGHT_WEEKDAY_LABELS,
} from "@/lib/body-weight-validation";
import type { BodyWeightReminderSettings } from "@/server/actions/body-weight";
import { upsertBodyWeightReminderAction } from "@/server/actions/body-weight";

type BodyWeightReminderFormProps = {
  reminder: BodyWeightReminderSettings | null;
};

export function BodyWeightReminderForm({ reminder }: BodyWeightReminderFormProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(reminder?.enabled ?? false);
  const [selectedDays, setSelectedDays] = useState<number[]>(reminder?.daysOfWeek ?? [0]);
  const [timeLocal, setTimeLocal] = useState(reminder?.timeLocal ?? "08:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: number) {
    setSelectedDays((current) => {
      if (current.includes(day)) {
        return current.length === 1 ? current : current.filter((value) => value !== day);
      }
      return [...current, day].sort((a, b) => a - b);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("enabled", enabled ? "true" : "false");
    selectedDays.forEach((day) => formData.append("daysOfWeek", String(day)));
    formData.set("timeLocal", timeLocal);

    const result = await upsertBodyWeightReminderAction(formData);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="size-4 accent-primary"
        />
        הפעלת תזכורות לעדכון משקל
      </label>

      {enabled && (
        <>
          <div className="space-y-2">
            <Label>ימים בשבוע</Label>
            <div className="flex flex-wrap gap-2">
              {BODY_WEIGHT_WEEKDAY_LABELS.map((day) => {
                const isSelected = selectedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted/60",
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 w-full space-y-2 sm:max-w-xs">
            <Label htmlFor="body-weight-reminder-time">שעה</Label>
            <TimeInput
              id="body-weight-reminder-time"
              value={timeLocal}
              onChange={(event) => setTimeLocal(event.target.value)}
              required={enabled}
            />
          </div>
        </>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
        {loading ? "שומר..." : "שמירת תזכורות"}
      </Button>
    </form>
  );
}
