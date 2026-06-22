"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BODY_WEIGHT_MAX_KG, BODY_WEIGHT_MIN_KG } from "@/lib/body-weight-validation";
import { getIsraelDateString } from "@/lib/calendar-datetime";
import { upsertBodyWeightLogAction } from "@/server/actions/body-weight";

type BodyWeightLogFormProps = {
  defaultDate?: string;
  defaultWeightKg?: number | null;
  submitLabel?: string;
};

export function BodyWeightLogForm({
  defaultDate = getIsraelDateString(),
  defaultWeightKg = null,
  submitLabel = "שמירת משקל",
}: BodyWeightLogFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await upsertBodyWeightLogAction(formData);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="body-weight-value">משקל (ק״ג)</Label>
          <Input
            id="body-weight-value"
            name="weightKg"
            type="number"
            min={BODY_WEIGHT_MIN_KG}
            max={BODY_WEIGHT_MAX_KG}
            step={0.1}
            required
            defaultValue={defaultWeightKg ?? undefined}
            placeholder="לדוגמה: 78.5"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="body-weight-date">תאריך</Label>
          <DateInput
            id="body-weight-date"
            name="date"
            required
            max={getIsraelDateString()}
            defaultValue={defaultDate}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body-weight-notes">הערות (אופציונלי)</Label>
        <Textarea id="body-weight-notes" name="notes" rows={2} placeholder="למשל: אחרי אימון" />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
        {loading ? "שומר..." : submitLabel}
      </Button>
    </form>
  );
}
