"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/server/actions/auth";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devPreviewUrl, setDevPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDevPreviewUrl(null);

    const result = await forgotPasswordAction(new FormData(e.currentTarget));
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    if (result && "message" in result && result.message) {
      setMessage(result.message);
    }
    if (result && "devPreviewUrl" in result && result.devPreviewUrl) {
      setDevPreviewUrl(result.devPreviewUrl);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">אימייל</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" dir="ltr" />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {devPreviewUrl && (
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
          <span className="font-medium">פיתוח:</span>{" "}
          <a href={devPreviewUrl} className="text-primary underline" dir="ltr">
            קישור איפוס
          </a>
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "שולח..." : "שליחת קישור לאיפוס"}
      </Button>
      <p className="text-center text-muted-foreground text-sm">
        <Link href="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
          חזרה להתחברות
        </Link>
      </p>
    </form>
  );
}
