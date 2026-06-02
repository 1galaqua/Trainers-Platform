"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
    const result = await registerAction(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    if (result?.success) {
      router.push("/dashboard");
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
      <div className="space-y-2">
        <Label htmlFor="password">סיסמה</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          dir="ltr"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">סוג משתמש</Label>
        <Select id="role" name="role" defaultValue="TRAINEE">
          <option value="TRAINEE">מתאמן/ית</option>
          <option value="COACH">מאמן/ית</option>
        </Select>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "נרשם..." : "יצירת חשבון"}
      </Button>
      <p className="text-center text-muted-foreground text-sm">
        כבר יש לך חשבון?{" "}
        <Link href="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
          התחברות
        </Link>
      </p>
    </form>
  );
}
