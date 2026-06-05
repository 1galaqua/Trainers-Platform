"use client";

import { useSearchParams } from "next/navigation";

export function SignInResetNotice() {
  const searchParams = useSearchParams();
  const reset = searchParams.get("reset") === "1";
  const registered = searchParams.get("registered") === "1";

  if (!reset && !registered) return null;

  return (
    <p className="max-w-sm rounded-lg border border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
      {reset && "הסיסמה עודכנה בהצלחה. ניתן להתחבר עם הסיסמה החדשה."}
      {registered && "החשבון נוצר בהצלחה. ניתן להתחבר."}
    </p>
  );
}
