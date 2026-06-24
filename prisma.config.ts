import { resolve } from "node:path";

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// prisma.config.ts disables Prisma's automatic .env loading — mirror Next.js order.
loadEnv({ path: resolve(".env") });
loadEnv({ path: resolve(".env.local"), override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
