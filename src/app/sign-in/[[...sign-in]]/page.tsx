import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

import { siteConfig } from "@/config/site";
import { isClerkConfigured } from "@/config/clerk";
import { EmailLoginForm } from "@/features/auth/components/email-login-form";
import { SignInResetNotice } from "@/features/auth/components/sign-in-reset-notice";

export const metadata: Metadata = {
  title: "התחברות",
};

export default function SignInPage() {
  if (isClerkConfigured()) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background px-4 py-12">
        <p className="text-muted-foreground text-xs">{siteConfig.name}</p>
        <SignIn />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-12">
      <div className="space-y-1 text-center">
        <h1 className="font-semibold text-xl">התחברות</h1>
        <p className="text-muted-foreground text-sm">{siteConfig.name}</p>
      </div>
      <Suspense fallback={null}>
        <SignInResetNotice />
      </Suspense>
      <EmailLoginForm />
    </div>
  );
}
