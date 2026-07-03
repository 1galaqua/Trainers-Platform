"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatWaterDisplay, litersToMl, mlToLitersInput, WATER_MAX_ML } from "@/lib/water-validation";
import { getIsraelDateString } from "@/lib/calendar-datetime";
import { upsertWaterLogAction } from "@/server/actions/water";

type WaterLogFormProps = {
  defaultDate?: string;
  defaultAmountMl?: number | null;
};

export function WaterLogForm({
  defaultDate = getIsraelDateString(),
  defaultAmountMl = null,
}: WaterLogFormProps) {
  const router = useRouter();
  const [amountMl, setAmountMl] = useState(defaultAmountMl ?? "");
  const [liters, setLiters] = useState(defaultAmountMl != null ? mlToLitersInput(defaultAmountMl) : "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleMlChange(value: string) {
    setAmountMl(value);
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      setLiters(mlToLitersInput(parsed));
    } else {
      setLiters("");
    }
  }

  function handleLitersChange(value: string) {
    setLiters(value);
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) {
      setAmountMl(litersToMl(parsed));
    } else {
      setAmountMl("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("amountMl", String(amountMl));

    const result = await upsertWaterLogAction(formData);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  const previewMl = Number(amountMl);
  const preview =
    Number.isFinite(previewMl) && previewMl >= 0 ? formatWaterDisplay(previewMl) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="water-amount-ml">כמות (מ&quot;ל)</Label>
          <Input
            id="water-amount-ml"
            name="amountMl"
            type="number"
            min={0}
            max={WATER_MAX_ML}
            step={50}
            required
            disabled={loading}
            value={amountMl}
            onChange={(event) => handleMlChange(event.target.value)}
            placeholder="לדוגמה: 2000"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="water-amount-liters">כמות (ליטרים)</Label>
          <Input
            id="water-amount-liters"
            type="number"
            min={0}
            max={WATER_MAX_ML / 1000}
            step={0.1}
            disabled={loading}
            value={liters}
            onChange={(event) => handleLitersChange(event.target.value)}
            placeholder="לדוגמה: 2"
          />
        </div>
      </div>

      {preview && <p className="text-muted-foreground text-base">{preview}</p>}

      <div className="min-w-0 space-y-2 sm:max-w-xs">
        <Label htmlFor="water-date">תאריך</Label>
        <DateInput
          id="water-date"
          name="date"
          required
          disabled={loading}
          max={getIsraelDateString()}
          defaultValue={defaultDate}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="water-notes">הערות (אופציונלי)</Label>
        <Textarea id="water-notes" name="notes" rows={2} disabled={loading} />
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
          "שמירת שתייה"
        )}
      </Button>
    </form>
  );
}
