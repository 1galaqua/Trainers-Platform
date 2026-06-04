"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { PASSWORD_HINT } from "@/lib/password";
import { registerAction } from "@/server/actions/auth";

export type CoachOption = {
  id: string;
  displayName: string | null;
  email: string | null;
};

type EmailRegisterFormProps = {
  coaches: CoachOption[];
};

export function EmailRegisterForm({ coaches }: EmailRegisterFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [devPreviewUrl, setDevPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"TRAINEE" | "COACH">("TRAINEE");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDevPreviewUrl(null);

    const formData = new FormData(e.currentTarget);
    formData.set("role", role);

    const result = await registerAction(formData);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    if (result && "success" in result && result.success) {
      if ("devPreviewUrl" in result && result.devPreviewUrl) {
        sessionStorage.setItem("tp_dev_verify_url", result.devPreviewUrl);
      }
      router.push("/verify-email/pending");
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
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          maxLength={16}
          autoComplete="new-password"
        />
        <p className="text-muted-foreground text-xs">{PASSWORD_HINT}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">סוג משתמש</Label>
        <Select
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as "TRAINEE" | "COACH")}
        >
          <option value="TRAINEE">מתאמן/ית</option>
          <option value="COACH">מאמן/ית</option>
        </Select>
      </div>

      {role === "TRAINEE" && (
        <div className="space-y-2">
          <Label htmlFor="coachId">בחר/י מאמן/ית</Label>
          {coaches.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              אין מאמנים רשומים במערכת. בקש/י מהמאמן/ית להירשם קודם.
            </p>
          ) : (
            <Select id="coachId" name="coachId" required defaultValue="">
              <option value="" disabled>
                בחר/י מאמן/ית
              </option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.displayName ?? coach.email ?? "מאמן/ית"}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
      {devPreviewUrl && (
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
          <a href={devPreviewUrl} className="text-primary underline" dir="ltr">
            קישור אימות (פיתוח)
          </a>
        </p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={loading || (role === "TRAINEE" && coaches.length === 0)}
      >
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
