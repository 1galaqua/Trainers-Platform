import { PrismaClient } from "@/lib/prisma-client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

/** Dev hot-reload can keep an old client missing new models (e.g. authToken). */
function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && typeof cached.authToken !== "undefined") {
    return cached;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();
