import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "הרשמה",
};

function SetupNotice({ title }: { title: string }) {
  return (
    <div className="mx-auto w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs">
      <h1 className="font-semibold text-lg">{title}</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        יש להגדיר את{" "}
        <code className="font-mono text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> ואת{" "}
        <code className="font-mono text-xs">CLERK_SECRET_KEY</code> בקובץ{" "}
        <code className="font-mono text-xs">.env.local</code>.
      </p>
    </div>
  );
}

export default function SignUpPage() {
  const hasKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
  if (!hasKey) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
        <SetupNotice title="יש להגדיר Clerk כדי לאפשר הרשמה" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background px-4 py-12">
      <p className="text-muted-foreground text-xs">{siteConfig.name}</p>
      <SignUp />
    </div>
  );
}
