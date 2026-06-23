"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput, TimeInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getIsraelDateString } from "@/lib/calendar-datetime";
import { upsertSleepLogAction } from "@/server/actions/sleep";

type SleepLogFormProps = {
  defaultDate?: string;
  defaultSleepStart?: string;
  defaultSleepEnd?: string;
};

export function SleepLogForm({
  defaultDate = getIsraelDateString(),
  defaultSleepStart = "22:30",
  defaultSleepEnd = "06:30",
}: SleepLogFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);

    const result = await upsertSleepLogAction(new FormData(event.currentTarget));
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
        <Label htmlFor="sleep-date">תאריך (יום ההתעוררות)</Label>
        <DateInput
          id="sleep-date"
          name="date"
          required
          disabled={loading}
          max={getIsraelDateString()}
          defaultValue={defaultDate}
        />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="sleep-start">שעת התחלה</Label>
          <TimeInput id="sleep-start" name="sleepStart" required disabled={loading} defaultValue={defaultSleepStart} />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="sleep-end">שעת סיום</Label>
          <TimeInput id="sleep-end" name="sleepEnd" required disabled={loading} defaultValue={defaultSleepEnd} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sleep-notes">הערות (אופציונלי)</Label>
        <Textarea id="sleep-notes" name="notes" rows={2} disabled={loading} />
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
          "שמירת שינה"
        )}
      </Button>
    </form>
  );
}
