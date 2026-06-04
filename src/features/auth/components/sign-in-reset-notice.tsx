"use client";

import { useSearchParams } from "next/navigation";

export function SignInResetNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("reset") !== "1") return null;

  return (
    <p className="max-w-sm rounded-lg border border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
      הסיסמה עודכנה בהצלחה. ניתן להתחבר עם הסיסמה החדשה.
    </p>
  );
}
