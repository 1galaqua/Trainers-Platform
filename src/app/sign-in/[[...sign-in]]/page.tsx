import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "התחברות",
};

function SetupNotice({ title }: { title: string }) {
  return (
    <div className="mx-auto w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs">
      <h1 className="font-semibold text-lg">{title}</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        יש ליצור אפליקציה ב־Clerk ולהגדיר את{" "}
        <code className="font-mono text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> ואת{" "}
        <code className="font-mono text-xs">CLERK_SECRET_KEY</code> בקובץ{" "}
        <code className="font-mono text-xs">.env.local</code>. מדריך:{" "}
        <a
          className="font-medium text-primary underline underline-offset-4"
          href="https://clerk.com/docs/quickstarts/nextjs"
        >
          Clerk + Next.js
        </a>
        .
      </p>
    </div>
  );
}

export default function SignInPage() {
  const hasKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
  if (!hasKey) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
        <SetupNotice title="יש להגדיר Clerk כדי לאפשר התחברות" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background px-4 py-12">
      <p className="text-muted-foreground text-xs">{siteConfig.name}</p>
      <SignIn />
    </div>
  );
}
