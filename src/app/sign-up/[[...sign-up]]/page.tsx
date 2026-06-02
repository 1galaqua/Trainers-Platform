import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { isClerkConfigured } from "@/config/clerk";
import { EmailRegisterForm } from "@/features/auth/components/email-register-form";
import { getAvailableCoaches } from "@/lib/coach-trainee";

export const metadata: Metadata = {
  title: "הרשמה",
};

export default async function SignUpPage() {
  if (isClerkConfigured()) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background px-4 py-12">
        <p className="text-muted-foreground text-xs">{siteConfig.name}</p>
        <SignUp />
      </div>
    );
  }

  const coaches = await getAvailableCoaches();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-12">
      <div className="space-y-1 text-center">
        <h1 className="font-semibold text-xl">הרשמה</h1>
        <p className="text-muted-foreground text-sm">{siteConfig.name}</p>
      </div>
      <EmailRegisterForm coaches={coaches} />
    </div>
  );
}
