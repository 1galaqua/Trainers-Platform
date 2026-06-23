"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MEASUREMENT_FIELDS } from "@/lib/measurements-validation";
import { getIsraelDateString } from "@/lib/calendar-datetime";
import { upsertMeasurementsLogAction } from "@/server/actions/measurements";

type MeasurementsLogFormProps = {
  traineeId: string;
  defaultDate?: string;
};

export function MeasurementsLogForm({
  traineeId,
  defaultDate = getIsraelDateString(),
}: MeasurementsLogFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);

    const result = await upsertMeasurementsLogAction(traineeId, new FormData(event.currentTarget));
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="min-w-0 space-y-2 sm:max-w-xs">
        <Label htmlFor="measurements-date">תאריך</Label>
        <DateInput
          id="measurements-date"
          name="date"
          required
          disabled={loading}
          max={getIsraelDateString()}
          defaultValue={defaultDate}
        />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        {MEASUREMENT_FIELDS.map((field) => (
          <div key={field.key} className="min-w-0 space-y-2">
            <Label htmlFor={`measurements-${field.key}`}>{field.label} (ס"מ)</Label>
            <Input
              id={`measurements-${field.key}`}
              name={field.key}
              type="number"
              min={20}
              max={250}
              step={0.1}
              disabled={loading}
              placeholder="—"
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="measurements-notes">הערות (אופציונלי)</Label>
        <Textarea id="measurements-notes" name="notes" rows={2} disabled={loading} />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            שומר...
          </>
        ) : saved ? (
          <>
            <Check aria-hidden />
            נשמר!
          </>
        ) : (
          "שמירת היקפים"
        )}
      </Button>
    </form>
  );
}
