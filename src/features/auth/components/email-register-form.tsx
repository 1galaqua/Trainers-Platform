"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PASSWORD_HINT } from "@/lib/password";
import { registerAction } from "@/server/actions/auth";

export function EmailRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("role", "COACH");

    const result = await registerAction(formData);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    if (result && "success" in result && result.success) {
      router.push("/sign-in?registered=1");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">שם מלא</Label>
        <Input id="displayName" name="displayName" required autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">אימייל</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" dir="ltr" />
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
      <div className="space-y-2">
        <Label htmlFor="password">סיסמה</Label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          maxLength={16}
          autoComplete="new-password"
        />
        <p className="text-muted-foreground text-sm">{PASSWORD_HINT}</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "נרשם..." : "יצירת חשבון מאמן/ית"}
      </Button>
      <p className="text-center text-muted-foreground text-base">
        מתאמן/ית? בקש/י מהמאמן/ית קישור הזמנה.
      </p>
      <p className="text-center text-muted-foreground text-base">
        כבר יש לך חשבון?{" "}
        <Link href="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
          התחברות
        </Link>
      </p>
    </form>
  );
}
