"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

type MarketingAuthCtaProps = {
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
};

const hasClerk = Boolean(
  typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
);

export function MarketingAuthCta({
  size = "sm",
  variant = "default",
}: MarketingAuthCtaProps) {
  if (!hasClerk) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button render={<Link href="/sign-in" />} size={size} variant={variant}>
          התחברות
        </Button>
        <Button render={<Link href="/sign-up" />} size={size} variant="outline">
          הרשמה
        </Button>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="flex flex-wrap items-center gap-2">
          <SignInButton mode="modal">
            <Button size={size} variant={variant}>
              התחברות
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size={size} variant="outline">
              הרשמה
            </Button>
          </SignUpButton>
        </div>
      </SignedOut>
      <SignedIn>
        <Button render={<Link href="/dashboard" />} size={size} variant={variant}>
          מעבר ללוח הבקרה
        </Button>
      </SignedIn>
    </>
  );
}
