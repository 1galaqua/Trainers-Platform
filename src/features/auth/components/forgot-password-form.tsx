"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PASSWORD_HINT } from "@/lib/password";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
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
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <p className="text-muted-foreground text-sm leading-relaxed">
        לאימות הזהות יש להזין את אותם אימייל, גיל ומספר טלפון שבהם נרשמתם, ולבחור סיסמה חדשה.
      </p>
      <div className="space-y-2">
        <Label htmlFor="email">אימייל</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" dir="ltr" />
      </div>
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
        <Label htmlFor="phoneNumber">מספר טלפון</Label>
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
      <div className="space-y-2">
        <Label htmlFor="password">סיסמה חדשה</Label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          maxLength={16}
          autoComplete="new-password"
        />
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
        />
        <p className="text-muted-foreground text-xs">{PASSWORD_HINT}</p>
      </div>
      {error && <p className="text-destructive text-sm leading-relaxed">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "מעדכן..." : "עדכון סיסמה"}
      </Button>
      <p className="text-center text-muted-foreground text-sm">
        <Link href="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
          חזרה להתחברות
        </Link>
      </p>
    </form>
  );
}
