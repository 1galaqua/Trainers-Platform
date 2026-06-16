"use client";

import { useSearchParams } from "next/navigation";

export function SignInResetNotice() {
  const searchParams = useSearchParams();
  const reset = searchParams.get("reset") === "1";
  const registered = searchParams.get("registered") === "1";

  if (!reset && !registered) return null;

  if (reset) {
    return (
      <p className="max-w-sm rounded-lg border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400">
        הסיסמה עודכנה בהצלחה. ניתן להתחבר עם הסיסמה החדשה.
      </p>
    );
  }

  return (
    <p className="max-w-sm rounded-lg border border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
      {registered && "החשבון נוצר בהצלחה. ניתן להתחבר."}
    </p>
  );
}
