import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "tp_session";

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }
  return new TextEncoder().encode(secret ?? "dev-session-secret-change-me");
}

export type SessionData = {
  userId: string;
  clerkId: string;
  email: string;
  displayName: string;
  role: UserRole;
  isOfflineDemo?: boolean;
};

export async function createUserSession(data: SessionData) {
  const token = await new SignJWT({
    userId: data.userId,
    clerkId: data.clerkId,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    isOfflineDemo: data.isOfflineDemo ?? false,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/** @deprecated use createUserSession */
export async function createSession(userId: string) {
  await createUserSession({
    userId,
    clerkId: userId,
    email: "",
    displayName: "",
    role: "TRAINEE",
  });
}

function parseSessionPayload(payload: Record<string, unknown>): SessionData | null {
  const userId = payload.userId;
  const clerkId = payload.clerkId;
  const email = payload.email;
  const displayName = payload.displayName;
  const role = payload.role;

  if (typeof userId !== "string" || typeof clerkId !== "string") return null;

  return {
    userId,
    clerkId,
    email: typeof email === "string" ? email : "",
    displayName: typeof displayName === "string" ? displayName : "",
    role: role === "COACH" || role === "TRAINEE" ? role : "TRAINEE",
    isOfflineDemo: payload.isOfflineDemo === true,
  };
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return parseSessionPayload(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
