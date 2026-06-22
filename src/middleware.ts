import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { isAuthEntryPath, shouldRedirectAuthenticatedUserToDashboard } from "@/lib/auth-redirect";
import { CRON_PUBLIC_PATHS } from "@/lib/cron-public-paths";
import { isClerkConfigured } from "@/config/clerk";
import {
  applySlidingSessionRefresh,
  getSessionFromRequest,
} from "@/lib/session-edge";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forgot-password",
  "/reset-password",
  "/invite(.*)",
  "/api/auth/forgot-password",
  ...CRON_PUBLIC_PATHS,
]);

async function localAuthMiddleware(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (isPublicRoute(req)) {
    if (session && shouldRedirectAuthenticatedUserToDashboard(req.nextUrl.pathname)) {
      const response = NextResponse.redirect(new URL("/dashboard", req.url));
      await applySlidingSessionRefresh(response, session);
      return response;
    }
    return NextResponse.next();
  }

  if (!session) {
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }

  const response = NextResponse.next();
  await applySlidingSessionRefresh(response, session);
  return response;
}

export default isClerkConfigured()
  ? clerkMiddleware(async (auth, req) => {
      if (isPublicRoute(req)) {
        const { userId } = await auth();
        if (userId && shouldRedirectAuthenticatedUserToDashboard(req.nextUrl.pathname)) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return;
      }

      await auth.protect();
    })
  : localAuthMiddleware;

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
