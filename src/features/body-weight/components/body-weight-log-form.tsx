"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

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
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await upsertBodyWeightLogAction(formData);

      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("שגיאה בשמירת המשקל. נסה/י שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            disabled={loading}
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
            disabled={loading}
            max={getIsraelDateString()}
            defaultValue={defaultDate}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body-weight-notes">הערות (אופציונלי)</Label>
        <Textarea
          id="body-weight-notes"
          name="notes"
          rows={2}
          disabled={loading}
          placeholder="למשל: אחרי אימון"
        />
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
          submitLabel
        )}
      </Button>
    </form>
  );
}
