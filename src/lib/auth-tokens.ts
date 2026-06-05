import crypto from "crypto";

import type { AuthTokenType } from "@/lib/prisma-client";

import { prisma } from "@/lib/prisma";

const TOKEN_BYTES = 32;

export function generateAuthTokenValue(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashAuthToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function assertAuthTokenDelegate() {
  if (typeof prisma.authToken === "undefined") {
    throw new Error(
      "PRISMA_AUTH_TOKEN_MISSING: הרץ npx prisma generate && npx prisma db push ואז Deploy מחדש ב-Vercel",
    );
  }
}

export async function createAuthToken(
  userId: string,
  type: AuthTokenType,
  expiresInMs: number,
): Promise<string> {
  assertAuthTokenDelegate();

  const token = generateAuthTokenValue();
  const tokenHash = hashAuthToken(token);
  const expiresAt = new Date(Date.now() + expiresInMs);

  await prisma.authToken.deleteMany({ where: { userId, type } });
  await prisma.authToken.create({
    data: { userId, type, tokenHash, expiresAt },
  });

  return token;
}

export async function consumeAuthToken(token: string, type: AuthTokenType) {
  assertAuthTokenDelegate();

  const tokenHash = hashAuthToken(token);
  const record = await prisma.authToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.type !== type) return null;
  if (record.expiresAt < new Date()) {
    await prisma.authToken.delete({ where: { id: record.id } }).catch(() => {});
    return null;
  }

  await prisma.authToken.deleteMany({ where: { userId: record.userId, type } });
  return record.user;
}
