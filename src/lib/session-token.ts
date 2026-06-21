import { SignJWT, jwtVerify } from "jose";

import type { UserRole } from "@/lib/prisma-client";

import { SESSION_EXPIRES_IN } from "@/lib/session-config";
import { getSessionSecret } from "@/lib/server-env";

export const SESSION_COOKIE = "tp_session";

export type SessionData = {
  userId: string;
  clerkId: string;
  email: string;
  displayName: string;
  role: UserRole;
  sessionVersion: number;
};

function getSecretKey() {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export function parseSessionPayload(payload: Record<string, unknown>): SessionData | null {
  const userId = payload.userId;
  const clerkId = payload.clerkId;
  const email = payload.email;
  const displayName = payload.displayName;
  const role = payload.role;
  const sessionVersion = payload.sessionVersion;

  if (typeof userId !== "string" || typeof clerkId !== "string") return null;

  return {
    userId,
    clerkId,
    email: typeof email === "string" ? email : "",
    displayName: typeof displayName === "string" ? displayName : "",
    role:
      role === "ADMIN" || role === "COACH" || role === "TRAINEE" ? role : "TRAINEE",
    sessionVersion: typeof sessionVersion === "number" ? sessionVersion : 0,
  };
}

export async function signSessionToken(data: SessionData): Promise<string> {
  return new SignJWT({
    userId: data.userId,
    clerkId: data.clerkId,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    sessionVersion: data.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(SESSION_EXPIRES_IN)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionData | null> {
  if (!getSessionSecret()) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return parseSessionPayload(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}
