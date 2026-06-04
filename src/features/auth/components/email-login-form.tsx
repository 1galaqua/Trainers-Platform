"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { loginAction } from "@/server/actions/auth";

export function EmailLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [devPreviewUrl, setDevPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDevPreviewUrl(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      if ("needsVerification" in result && result.needsVerification) {
        router.push("/verify-email/pending");
      }
      if ("devPreviewUrl" in result && result.devPreviewUrl) {
        setDevPreviewUrl(result.devPreviewUrl);
      }
      return;
    }

    if (result && "success" in result && result.success) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">אימייל</Label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">סיסמה</Label>
          <Link
            href="/forgot-password"
            className="text-primary text-xs underline-offset-4 hover:underline"
          >
            שכחתי סיסמה
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="current-password"
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {devPreviewUrl && (
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
          <span className="font-medium">פיתוח:</span>{" "}
          <a href={devPreviewUrl} className="text-primary underline" dir="ltr">
            קישור אימות
          </a>
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "מתחבר..." : "התחברות"}
      </Button>
      <p className="text-center text-muted-foreground text-sm">
        אין לך חשבון?{" "}
        <Link href="/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
          הרשמה
        </Link>
      </p>
    </form>
  );
}
