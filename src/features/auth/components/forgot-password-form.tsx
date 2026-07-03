"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { RequiredFieldError } from "@/features/onboarding/components/required-field-error";
import { PhonePrefixField } from "@/features/invites/components/phone-prefix-field";
import {
  digitsOnly,
  PHONE_SUFFIX_INCOMPLETE_MESSAGE,
} from "@/lib/user-identity";
import { PASSWORD_HINT } from "@/lib/password";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, true>>({});
  const [loading, setLoading] = useState(false);
  const [phonePrefix, setPhonePrefix] = useState("050");
  const [phoneSuffix, setPhoneSuffix] = useState("");

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

    if (!String(formData.get("displayName") ?? "").trim()) {
      errors.displayName = true;
    }

    if (!String(formData.get("email") ?? "").trim()) {
      errors.email = true;
    }

    if (digitsOnly(phonePrefix).length !== 3) {
      errors.phonePrefix = true;
    }

    if (digitsOnly(phoneSuffix).length !== 7) {
      errors.phoneSuffix = true;
    }

    if (!String(formData.get("password") ?? "")) {
      errors.password = true;
    }

    if (!String(formData.get("confirmPassword") ?? "")) {
      errors.confirmPassword = true;
    }

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

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("phonePrefix", digitsOnly(phonePrefix));
      formData.set("phoneSuffix", digitsOnly(phoneSuffix));

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as { error?: string; success?: boolean };

      if (!response.ok || result.error) {
        setError(result.error ?? "שגיאה בעדכון הסיסמה. נסו שוב.");
        return;
      }

      if (result.success) {
        router.push("/sign-in?reset=1");
        router.refresh();
      }
    } catch {
      setError("שגיאה בעדכון הסיסמה. נסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4" noValidate>
      <p className="text-muted-foreground text-base leading-relaxed">
        לאימות הזהות יש להזין את אותם שם מלא, אימייל ומספר טלפון שבהם נרשמתם, ולבחור סיסמה חדשה.
      </p>
      <div className="space-y-2">
        <Label htmlFor="displayName">שם מלא</Label>
        <Input
          id="displayName"
          name="displayName"
          required
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
          required
          autoComplete="email"
          dir="ltr"
          onChange={() => clearFieldError("email")}
        />
        <RequiredFieldError show={Boolean(fieldErrors.email)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phoneSuffix">מספר טלפון</Label>
        <div className="flex items-center gap-2" dir="ltr">
          <PhonePrefixField
            id="phonePrefix"
            name="phonePrefix"
            value={phonePrefix}
            invalid={Boolean(fieldErrors.phonePrefix)}
            onChange={(value) => {
              setPhonePrefix(value);
              clearFieldError("phonePrefix");
            }}
          />
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
      <div className="space-y-2">
        <Label htmlFor="password">סיסמה חדשה</Label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          maxLength={16}
          autoComplete="new-password"
          onChange={() => clearFieldError("password")}
        />
        <RequiredFieldError show={Boolean(fieldErrors.password)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">אימות סיסמה</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          required
          minLength={8}
          maxLength={16}
          autoComplete="new-password"
          onChange={() => clearFieldError("confirmPassword")}
        />
        <RequiredFieldError show={Boolean(fieldErrors.confirmPassword)} />
        <p className="text-muted-foreground text-sm">{PASSWORD_HINT}</p>
      </div>
      {error && <p className="text-destructive text-sm leading-relaxed">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "מעדכן..." : "עדכון סיסמה"}
      </Button>
      <p className="text-center text-muted-foreground text-base">
        <Link href="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
          חזרה להתחברות
        </Link>
      </p>
    </form>
  );
}
