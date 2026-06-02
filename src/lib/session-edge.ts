import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "tp_session";

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  return new TextEncoder().encode(secret ?? "dev-session-secret-change-me");
}

export type SessionPayload = {
  userId: string;
};

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const userId = payload.userId;
    if (typeof userId !== "string") return null;
    return { userId };
  } catch {
    return null;
  }
}
