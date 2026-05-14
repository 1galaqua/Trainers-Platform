import { PrismaClient } from "@prisma/client";

/** מסונכרן עם `src/config/demo.ts` */
const DEMO = {
  trainer: {
    fullName: "יהודה אמסלם",
    clerkId: "demo_clerk_coach",
  },
  trainee: {
    fullName: "גל אקוע",
    clerkId: "demo_clerk_trainee",
  },
} as const;

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { clerkId: DEMO.trainer.clerkId },
    create: {
      clerkId: DEMO.trainer.clerkId,
      displayName: DEMO.trainer.fullName,
      role: "COACH",
    },
    update: {
      displayName: DEMO.trainer.fullName,
      role: "COACH",
    },
  });

  await prisma.user.upsert({
    where: { clerkId: DEMO.trainee.clerkId },
    create: {
      clerkId: DEMO.trainee.clerkId,
      displayName: DEMO.trainee.fullName,
      role: "TRAINEE",
    },
    update: {
      displayName: DEMO.trainee.fullName,
      role: "TRAINEE",
    },
  });

  console.log("נתוני דמו נטענו:", DEMO.trainer.fullName, ",", DEMO.trainee.fullName);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
