"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PASSWORD_HINT } from "@/lib/password";
import { resetPasswordAction } from "@/server/actions/auth";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("token", token);

    const result = await resetPasswordAction(formData);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    if (result && "success" in result && result.success) {
      router.push("/sign-in?reset=1");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4">
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
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "שומר..." : "עדכון סיסמה"}
      </Button>
      <p className="text-center text-muted-foreground text-sm">
        <Link href="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
          התחברות
        </Link>
      </p>
    </form>
  );
}
