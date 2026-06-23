"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TimeInput } from "@/components/ui/date-input";
import { cn } from "@/lib/utils";
import { TRACKING_WEEKDAY_LABELS } from "@/lib/tracking-validation";

type TrackingWaterReminderFormProps = {
  reminder: { enabled: boolean; daysOfWeek: number[]; timesLocal: string[] } | null;
  onSave: (formData: FormData) => Promise<{ error?: string; success?: true }>;
  onCancel: () => Promise<{ error?: string; success?: true }>;
};

export function TrackingWaterReminderForm({ reminder, onSave, onCancel }: TrackingWaterReminderFormProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(reminder?.enabled ?? false);
  const [selectedDays, setSelectedDays] = useState<number[]>(reminder?.daysOfWeek ?? [0]);
  const [times, setTimes] = useState<string[]>(
    reminder?.timesLocal?.length ? reminder.timesLocal : ["08:00"],
  );
  const [loading, setLoading] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(reminder?.enabled ?? false);
    setSelectedDays(reminder?.daysOfWeek ?? [0]);
    setTimes(reminder?.timesLocal?.length ? reminder.timesLocal : ["08:00"]);
  }, [reminder]);

  function toggleDay(day: number) {
    setSelectedDays((current) => {
      if (current.includes(day)) {
        return current.length === 1 ? current : current.filter((value) => value !== day);
      }
      return [...current, day].sort((a, b) => a - b);
    });
  }

  function updateTime(index: number, value: string) {
    setTimes((current) => current.map((time, i) => (i === index ? value : time)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("enabled", enabled ? "true" : "false");
    selectedDays.forEach((day) => formData.append("daysOfWeek", String(day)));
    times.filter(Boolean).forEach((time) => formData.append("timesLocal", time));

    const result = await onSave(formData);
    setLoading(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleCancelReminder() {
    setLoading(true);
    setError(null);
    const result = await onCancel();
    setLoading(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    setConfirmingCancel(false);
    setEnabled(false);
    router.refresh();
  }

  if (confirmingCancel) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm">האם לבטל את התזכורת?</p>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="destructive" disabled={loading} onClick={() => void handleCancelReminder()}>
            כן, בטל תזכורת
          </Button>
          <Button type="button" variant="outline" disabled={loading} onClick={() => setConfirmingCancel(false)}>
            לא
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          disabled={loading}
          onChange={(event) => setEnabled(event.target.checked)}
          className="size-4 accent-primary"
        />
        הפעלת תזכורות
      </label>

      {enabled && (
        <>
          <div className="space-y-2">
            <Label>ימים בשבוע</Label>
            <div className="flex flex-wrap gap-2">
              {TRACKING_WEEKDAY_LABELS.map((day) => {
                const isSelected = selectedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    disabled={loading}
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50",
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

          <div className="space-y-2">
            <Label>שעות (עד 3 ביום)</Label>
            <div className="space-y-2">
              {times.map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                  <TimeInput
                    value={time}
                    disabled={loading}
                    onChange={(event) => updateTime(index, event.target.value)}
                    required={enabled}
                  />
                  {times.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={loading}
                      aria-label="הסרת שעה"
                      onClick={() => setTimes((current) => current.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  )}
                </div>
              ))}
              {times.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => setTimes((current) => [...current, "12:00"])}
                >
                  <Plus aria-hidden />
                  הוספת שעה
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              שומר...
            </>
          ) : (
            "שמירת תזכורת"
          )}
        </Button>
        {reminder?.enabled && (
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => setConfirmingCancel(true)}
          >
            <BellOff aria-hidden />
            בטל תזכורת
          </Button>
        )}
      </div>
    </form>
  );
}
