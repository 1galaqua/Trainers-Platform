import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: `סיסמה חדשה | ${siteConfig.shortName}`,
};

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-12">
      <div className="space-y-1 text-center">
        <h1 className="font-semibold text-xl">סיסמה חדשה</h1>
        <p className="text-muted-foreground text-sm">{siteConfig.name}</p>
      </div>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-destructive text-sm">קישור איפוס לא תקין או חסר</p>
      )}
    </div>
  );
}
