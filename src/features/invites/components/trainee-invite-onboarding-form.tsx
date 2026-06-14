"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad } from "@/features/onboarding/components/signature-pad";
import { DEFAULT_TRAINEE_PASSWORD } from "@/lib/trainee-invite";
import type { QuestionField } from "@/lib/onboarding-template";
import { completeTraineeInviteAction } from "@/server/actions/invites";

type TraineeInviteOnboardingFormProps = {
  token: string;
  coachName: string;
  questionnaireFields: QuestionField[];
  agreementText: string;
};

export function TraineeInviteOnboardingForm({
  token,
  coachName,
  questionnaireFields,
  agreementText,
}: TraineeInviteOnboardingFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [completedEmail, setCompletedEmail] = useState<string | null>(null);

  const numberFields = questionnaireFields.filter((f) => f.type === "number");
  const otherFields = questionnaireFields.filter((f) => f.type !== "number");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("token", token);
    if (agreed) formData.set("agreed", "on");
    formData.set("signature", signature);

    const result = await completeTraineeInviteAction(formData);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    if (result && "success" in result && result.success) {
      setCompletedEmail(result.email);
    }
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

  if (completedEmail) {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>החשבון נוצר בהצלחה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            החשבון שלך נוצר ושויך למאמן/ית <strong>{coachName}</strong>.
          </p>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <p>
              <span className="text-muted-foreground">אימייל: </span>
              <span dir="ltr">{completedEmail}</span>
            </p>
            <p>
              <span className="text-muted-foreground">סיסמה: </span>
              <span dir="ltr">{DEFAULT_TRAINEE_PASSWORD}</span>
            </p>
          </div>
          <Button render={<Link href="/sign-in" />} className="w-full">
            התחברות למערכת
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">פרטי משתמש</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">שם מלא</Label>
            <Input id="displayName" name="displayName" required autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="age">גיל</Label>
              <Input
                id="age"
                name="age"
                type="number"
                required
                min={1}
                max={120}
                autoComplete="off"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">טלפון</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                autoComplete="tel"
                dir="ltr"
                placeholder="050-1234567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">שאלון</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {numberFields.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">{numberFields.map(renderField)}</div>
          )}
          {otherFields.map(renderField)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">הסכם שירות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {agreementText}
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
            />
            קראתי ואני מסכים/ה לתנאי ההסכם
          </label>

          <div className="space-y-2">
            <Label>חתימה דיגיטלית</Label>
            <SignaturePad onChange={setSignature} />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !agreed || !signature}
      >
        {loading ? "יוצר חשבון..." : "יצירת חשבון וסיום"}
      </Button>
    </form>
  );
}
