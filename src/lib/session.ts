import { cookies } from "next/headers";

import { getSessionCookieOptions } from "@/lib/session-config";
import {
  SESSION_COOKIE,
  signSessionToken,
  verifySessionToken,
  type SessionData,
} from "@/lib/session-token";

export { SESSION_COOKIE, type SessionData } from "@/lib/session-token";

export async function setUserSession(data: SessionData) {
  const token = await signSessionToken(data);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions());
}

export async function createUserSession(data: SessionData) {
  await setUserSession(data);
}

export async function refreshUserSession(data: SessionData) {
  await setUserSession(data);
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
