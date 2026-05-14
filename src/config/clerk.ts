/**
 * Clerk is fully enabled only when both a publishable key and secret are set.
 * This allows `next build` and local work before wiring `.env.local`.
 */
export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim(),
  );
}
