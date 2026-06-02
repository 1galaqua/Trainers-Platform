import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

import { getSessionSecret } from "@/lib/server-env";

export const SESSION_COOKIE = "tp_session";

export type SessionPayload = {
  userId: string;
};

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const userId = payload.userId;
    if (typeof userId !== "string") return null;
    return { userId };
  } catch {
    return null;
  }
}
