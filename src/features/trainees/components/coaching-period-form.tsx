"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCoachingPeriodAction } from "@/server/actions/trainees";

type CoachingPeriodFormProps = {
  traineeId: string;
  coachingStartDate: string | null;
  coachingEndDate: string | null;
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
  compact,
}: CoachingPeriodFormProps) {
  const router = useRouter();
  const [start, setStart] = useState(toDateInputValue(coachingStartDate));
  const [end, setEnd] = useState(toDateInputValue(coachingEndDate));
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

    const result = await updateCoachingPeriodAction(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  const hasPeriod = coachingStartDate && coachingEndDate;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {hasPeriod && (
        <p className="text-muted-foreground text-sm">
          ליווי: {formatDisplayDate(coachingStartDate)} — {formatDisplayDate(coachingEndDate)}
        </p>
      )}
      <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : ""}`}>
        <div className="space-y-1">
          <Label htmlFor={`start-${traineeId}`}>תאריך התחלה</Label>
          <Input
            id={`start-${traineeId}`}
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            dir="ltr"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`end-${traineeId}`}>תאריך סיום</Label>
          <Input
            id={`end-${traineeId}`}
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
            dir="ltr"
          />
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" size="sm" variant={compact ? "outline" : "default"} disabled={loading}>
        {loading ? "שומר..." : hasPeriod ? "עדכון תקופת ליווי" : "שמירת תקופת ליווי"}
      </Button>
    </form>
  );
}
