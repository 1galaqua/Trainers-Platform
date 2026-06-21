import type { NextRequest, NextResponse } from "next/server";

import { getSessionCookieOptions } from "@/lib/session-config";
import {
  SESSION_COOKIE,
  signSessionToken,
  verifySessionToken,
  type SessionData,
} from "@/lib/session-token";

export { SESSION_COOKIE, type SessionData } from "@/lib/session-token";

export async function getSessionFromRequest(req: NextRequest): Promise<SessionData | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function applySlidingSessionRefresh(
  response: NextResponse,
  session: SessionData,
) {
  const token = await signSessionToken(session);
  response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
}
