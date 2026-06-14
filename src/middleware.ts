import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { isClerkConfigured } from "@/config/clerk";
import { getSessionFromRequest } from "@/lib/session-edge";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forgot-password",
  "/reset-password",
  "/invite(.*)",
  "/api/auth/forgot-password",
]);

async function localAuthMiddleware(req: NextRequest) {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);
  if (!session) {
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export default isClerkConfigured()
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    })
  : localAuthMiddleware;

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
