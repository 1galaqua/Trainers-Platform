"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RequiredFieldError } from "@/features/onboarding/components/required-field-error";
import { SignaturePad } from "@/features/onboarding/components/signature-pad";
import {
  getMissingQuestionnaireFieldKeys,
  isEmptyFormValue,
  isMissingSignature,
  toFieldErrorMap,
} from "@/lib/onboarding-form-validation";
import type { QuestionField } from "@/lib/onboarding-template";
import {
  digitsOnly,
  ISRAELI_MOBILE_PREFIXES,
  PHONE_SUFFIX_INCOMPLETE_MESSAGE,
} from "@/lib/user-identity";
import { completeTraineeInviteAction } from "@/server/actions/invites";

type TraineeInviteOnboardingFormProps = {
  token: string;
  coachName: string;
  questionnaireFields: QuestionField[];
  agreementText: string;
};

const USER_FIELD_KEYS = ["displayName", "email"] as const;

export function TraineeInviteOnboardingForm({
  token,
  coachName,
  questionnaireFields,
  agreementText,
}: TraineeInviteOnboardingFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, true>>({});
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("050");
  const [phoneSuffix, setPhoneSuffix] = useState("");

  const numberFields = questionnaireFields.filter((f) => f.type === "number");
  const otherFields = questionnaireFields.filter((f) => f.type !== "number");

  function clearFieldError(key: string) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validateForm(form: HTMLFormElement) {
    const formData = new FormData(form);
    const errors: Record<string, true> = {};

    for (const key of USER_FIELD_KEYS) {
      if (isEmptyFormValue(formData.get(key))) {
        errors[key] = true;
      }
    }

    const prefixDigits = digitsOnly(phonePrefix);
    const suffixDigits = digitsOnly(phoneSuffix);

    if (prefixDigits.length !== 3) {
      errors.phonePrefix = true;
    }

    if (suffixDigits.length !== 7) {
      errors.phoneSuffix = true;
    }

    Object.assign(errors, toFieldErrorMap(getMissingQuestionnaireFieldKeys(formData, questionnaireFields)));

    if (!agreed) errors.agreed = true;
    if (isMissingSignature(signature)) errors.signature = true;

    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errors = validateForm(e.currentTarget);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(null);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("token", token);
    formData.set("phonePrefix", digitsOnly(phonePrefix));
    formData.set("phoneSuffix", digitsOnly(phoneSuffix));
    if (agreed) formData.set("agreed", "on");
    formData.set("signature", signature);

    const result = await completeTraineeInviteAction(formData);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    if (result && "success" in result && result.success) {
      router.push(result.redirectTo ?? "/dashboard");
      router.refresh();
      return;
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
            rows={2}
            placeholder={field.placeholder}
            onChange={() => clearFieldError(field.key)}
          />
          <RequiredFieldError show={Boolean(fieldErrors[field.key])} />
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
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
          onChange={() => clearFieldError(field.key)}
        />
        <RequiredFieldError show={Boolean(fieldErrors[field.key])} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">פרטי משתמש</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">שם מלא</Label>
            <Input
              id="displayName"
              name="displayName"
              autoComplete="name"
              onChange={() => clearFieldError("displayName")}
            />
            <RequiredFieldError show={Boolean(fieldErrors.displayName)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              onChange={() => clearFieldError("email")}
            />
            <RequiredFieldError show={Boolean(fieldErrors.email)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneSuffix">טלפון</Label>
            <div className="flex items-center gap-2" dir="ltr">
              <Input
                id="phonePrefix"
                name="phonePrefix"
                list="phone-prefix-options"
                inputMode="numeric"
                autoComplete="tel-area-code"
                maxLength={3}
                value={phonePrefix}
                onChange={(e) => {
                  setPhonePrefix(digitsOnly(e.target.value).slice(0, 3));
                  clearFieldError("phonePrefix");
                }}
                className="w-[4.5rem] text-center"
                placeholder="050"
                aria-label="קידומת טלפון"
              />
              <datalist id="phone-prefix-options">
                {ISRAELI_MOBILE_PREFIXES.map((prefix) => (
                  <option key={prefix} value={prefix} />
                ))}
              </datalist>
              <span className="text-muted-foreground" aria-hidden>
                -
              </span>
              <Input
                id="phoneSuffix"
                name="phoneSuffix"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-local"
                maxLength={7}
                value={phoneSuffix}
                onChange={(e) => {
                  setPhoneSuffix(digitsOnly(e.target.value).slice(0, 7));
                  clearFieldError("phoneSuffix");
                }}
                className="flex-1"
                placeholder="1234567"
                aria-label="מספר טלפון"
              />
            </div>
            {fieldErrors.phonePrefix && <RequiredFieldError show />}
            {fieldErrors.phoneSuffix && (
              <p className="text-destructive text-sm">{PHONE_SUFFIX_INCOMPLETE_MESSAGE}</p>
            )}
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

          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  if (e.target.checked) clearFieldError("agreed");
                }}
                className="mt-1"
              />
              קראתי ואני מסכים/ה לתנאי ההסכם
            </label>
            <RequiredFieldError show={Boolean(fieldErrors.agreed)} />
          </div>

          <div className="space-y-2">
            <Label>חתימה דיגיטלית</Label>
            <SignaturePad
              invalid={Boolean(fieldErrors.signature)}
              onChange={(value) => {
                setSignature(value);
                if (!isMissingSignature(value)) clearFieldError("signature");
              }}
            />
            <RequiredFieldError show={Boolean(fieldErrors.signature)} />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "יוצר חשבון..." : "יצירת חשבון וסיום"}
      </Button>
    </form>
  );
}
