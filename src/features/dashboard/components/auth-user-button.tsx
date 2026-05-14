"use client";

import { UserButton } from "@clerk/nextjs";

export function AuthUserButton() {
  const hasKey = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
  );

  if (!hasKey) {
    return (
      <span className="max-w-[12rem] text-end text-muted-foreground text-xs leading-snug">
        הוסיפו מפתחות Clerk בקובץ{" "}
        <code className="font-mono text-[0.65rem]">.env.local</code>
      </span>
    );
  }

  return <UserButton afterSignOutUrl="/" />;
}
