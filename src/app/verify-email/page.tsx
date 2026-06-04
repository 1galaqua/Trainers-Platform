import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { VerifyEmailHandler } from "@/features/auth/components/verify-email-handler";

export const metadata: Metadata = {
  title: `אימות אימייל | ${siteConfig.shortName}`,
};

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-12">
      <div className="space-y-1 text-center">
        <h1 className="font-semibold text-xl">אימות אימייל</h1>
        <p className="text-muted-foreground text-sm">{siteConfig.name}</p>
      </div>
      <VerifyEmailHandler token={token ?? null} />
    </div>
  );
}
