"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitQuestionnaireAction } from "@/server/actions/onboarding";

export function QuestionnaireForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitQuestionnaireAction(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard/onboarding/agreement");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="age">גיל</Label>
          <Input id="age" name="age" type="number" min={14} max={100} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="heightCm">גובה (ס״מ)</Label>
          <Input id="heightCm" name="heightCm" type="number" min={100} max={250} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weightKg">משקל (ק״ג)</Label>
          <Input id="weightKg" name="weightKg" type="number" step="0.1" min={30} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sessionsPerWeek">אימונים בשבוע</Label>
          <Input id="sessionsPerWeek" name="sessionsPerWeek" type="number" min={1} max={7} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="goal">מטרת האימון</Label>
        <Textarea id="goal" name="goal" required rows={2} placeholder="לדוגמה: עלייה במסת שריר" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="experience">ניסיון באימונים</Label>
        <Textarea id="experience" name="experience" required rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="injuries">פציעות / מגבלות</Label>
        <Textarea id="injuries" name="injuries" rows={2} placeholder="אין / פרט..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="equipment">ציוד זמין</Label>
        <Textarea id="equipment" name="equipment" required rows={2} placeholder="חדר כושר / בית / משקולות..." />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "שומר..." : "שמירה והמשך"}
      </Button>
    </form>
  );
}
