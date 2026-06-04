"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionField } from "@/lib/onboarding-template";
import { submitQuestionnaireAction } from "@/server/actions/onboarding";

type DynamicQuestionnaireFormProps = {
  fields: QuestionField[];
  isRedo?: boolean;
};

export function DynamicQuestionnaireForm({ fields, isRedo }: DynamicQuestionnaireFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const numberFields = fields.filter((f) => f.type === "number");
  const otherFields = fields.filter((f) => f.type !== "number");

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

    router.push(result.redirectTo ?? "/dashboard/onboarding/agreement");
    router.refresh();
  }

  function renderField(field: QuestionField) {
    if (field.type === "textarea") {
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>{field.label}</Label>
          <Textarea
            id={field.key}
            name={field.key}
            required={field.required}
            rows={2}
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        <Input
          id={field.key}
          name={field.key}
          type={field.type === "number" ? "number" : "text"}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {numberFields.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">{numberFields.map(renderField)}</div>
      )}
      {otherFields.map(renderField)}
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "שומר..." : isRedo ? "שמירת שאלון מעודכן" : "שמירה והמשך"}
      </Button>
    </form>
  );
}
