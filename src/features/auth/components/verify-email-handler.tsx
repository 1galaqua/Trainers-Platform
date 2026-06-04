"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { verifyEmailAction } from "@/server/actions/auth";

type VerifyEmailHandlerProps = {
  token: string | null;
};

export function VerifyEmailHandler({ token }: VerifyEmailHandlerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [error, setError] = useState<string | null>(
    token ? null : "קישור אימות לא תקין",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    verifyEmailAction(token).then((result) => {
      if (cancelled) return;
      if (result && "success" in result && result.success) {
        setStatus("success");
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      setStatus("error");
      setError(
        result && "error" in result && result.error ? result.error : "שגיאה באימות",
      );
    });

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (status === "loading") {
    return <p className="text-muted-foreground text-sm">מאמתים את כתובת האימייל...</p>;
  }

  if (status === "success") {
    return <p className="text-muted-foreground text-sm">האימייל אומת בהצלחה. מעבירים ללוח הבקרה...</p>;
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-destructive text-sm">{error}</p>
      <Button variant="outline" size="sm" render={<Link href="/verify-email/pending" />}>
        שליחת אימייל אימות מחדש
      </Button>
      <Button variant="ghost" size="sm" render={<Link href="/sign-in" />}>
        התחברות
      </Button>
    </div>
  );
}
