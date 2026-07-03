"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionField } from "@/lib/onboarding-template";
import { updateCoachOnboardingTemplateAction } from "@/server/actions/coach-onboarding";

type CoachOnboardingTemplateFormProps = {
  initialFields: QuestionField[];
  initialAgreementText: string;
};

export function CoachOnboardingTemplateForm({
  initialFields,
  initialAgreementText,
}: CoachOnboardingTemplateFormProps) {
  const router = useRouter();
  const [fields, setFields] = useState(initialFields);
  const [agreementText, setAgreementText] = useState(initialAgreementText);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateFieldLabel(index: number, label: string) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, label } : f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("questionnaireFields", JSON.stringify(fields));
    formData.set("agreementText", agreementText);

    const result = await updateCoachOnboardingTemplateAction(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="font-medium text-base">שאלון ראשוני</h2>
          <p className="mt-1 text-muted-foreground text-base">
            ערוך את ניסוח השאלות. המבנה (סוג השדה) נשאר כמו בשאלון ברירת המחדל.
          </p>
        </div>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.key} className="space-y-1 rounded-lg border border-border p-3">
              <p className="text-muted-foreground text-sm">מזהה: {field.key}</p>
              <Label htmlFor={`field-label-${field.key}`}>ניסוח השאלה</Label>
              <Input
                id={`field-label-${field.key}`}
                value={field.label}
                onChange={(e) => updateFieldLabel(index, e.target.value)}
                required
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-medium text-base">הסכם עם חתימה</h2>
          <p className="mt-1 text-muted-foreground text-base">
            הטקסט שיוצג למתאמן לפני החתימה הדיגיטלית
          </p>
        </div>
        <Textarea
          value={agreementText}
          onChange={(e) => setAgreementText(e.target.value)}
          rows={12}
          className="font-mono text-sm leading-relaxed"
          required
        />
      </section>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "שומר..." : "שמירת תבנית השאלון וההסכם"}
      </Button>
    </form>
  );
}
