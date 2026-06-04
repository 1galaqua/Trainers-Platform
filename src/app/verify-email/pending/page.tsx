import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { ResendVerificationForm } from "@/features/auth/components/resend-verification-form";
import { VerifyEmailPendingDevLink } from "@/features/auth/components/verify-email-pending-dev-link";

export const metadata: Metadata = {
  title: `אימות אימייל | ${siteConfig.shortName}`,
};

export default function VerifyEmailPendingPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-12">
      <div className="mx-auto max-w-md space-y-2 text-center">
        <h1 className="font-semibold text-xl">בדוק/י את תיבת האימייל</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          שלחנו קישור לאימות כתובת האימייל. לא ניתן להתחבר לפני השלמת האימות.
        </p>
      </div>
      <VerifyEmailPendingDevLink />
      <ResendVerificationForm />
    </div>
  );
}
