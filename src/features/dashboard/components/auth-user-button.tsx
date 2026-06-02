"use client";

import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
);

export function AuthUserButton() {
  if (hasClerk) {
    return <UserButton afterSignOutUrl="/" />;
  }

  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="sm">
        התנתקות
      </Button>
    </form>
  );
}
