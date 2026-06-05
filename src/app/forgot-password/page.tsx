import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: `שכחתי סיסמה | ${siteConfig.shortName}`,
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-12">
      <div className="space-y-1 text-center">
        <h1 className="font-semibold text-xl">איפוס סיסמה</h1>
        <p className="text-muted-foreground text-sm">
          אימות לפי אימייל, גיל וטלפון — ולאחר מכן סיסמה חדשה
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
