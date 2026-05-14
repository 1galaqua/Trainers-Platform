/**
 * Typed access to public environment variables used in the client bundle.
 * Server-only secrets must be read from process.env directly in server code.
 */
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
} as const;
