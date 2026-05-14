"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

  if (!publishableKey) {
    return children;
  }

  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
