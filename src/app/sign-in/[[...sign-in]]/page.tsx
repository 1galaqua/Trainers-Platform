import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { siteConfig } from "@/config/site";
import { isClerkConfigured } from "@/config/clerk";
import { getCurrentUser } from "@/lib/auth";
import { EmailLoginForm } from "@/features/auth/components/email-login-form";
import { SignInResetNotice } from "@/features/auth/components/sign-in-reset-notice";

export const metadata: Metadata = {
  title: "התחברות",
};

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

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
        <EmailLoginForm />
      </Suspense>
    </div>
  );
}
