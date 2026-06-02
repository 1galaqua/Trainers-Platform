import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/** מסונכרן עם `src/config/demo.ts` */
const DEMO = {
  trainer: {
    fullName: "יהודה אמסלם",
    clerkId: "demo_clerk_coach",
    email: "coach@demo.com",
    password: "demo1234",
  },
  trainee: {
    fullName: "גל אקוע",
    clerkId: "demo_clerk_trainee",
    email: "trainee@demo.com",
    password: "demo1234",
  },
} as const;

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(DEMO.trainer.password, 10);

  const coach = await prisma.user.upsert({
    where: { clerkId: DEMO.trainer.clerkId },
    create: {
      clerkId: DEMO.trainer.clerkId,
      displayName: DEMO.trainer.fullName,
      email: DEMO.trainer.email,
      passwordHash,
      role: "COACH",
    },
    update: {
      displayName: DEMO.trainer.fullName,
      email: DEMO.trainer.email,
      passwordHash,
      role: "COACH",
    },
  });

  const trainee = await prisma.user.upsert({
    where: { clerkId: DEMO.trainee.clerkId },
    create: {
      clerkId: DEMO.trainee.clerkId,
      displayName: DEMO.trainee.fullName,
      email: DEMO.trainee.email,
      passwordHash,
      role: "TRAINEE",
    },
    update: {
      displayName: DEMO.trainee.fullName,
      email: DEMO.trainee.email,
      passwordHash,
      role: "TRAINEE",
    },
  });

  await prisma.coachTrainee.upsert({
    where: { coachId_traineeId: { coachId: coach.id, traineeId: trainee.id } },
    create: { coachId: coach.id, traineeId: trainee.id },
    update: {},
  });

  const existingProgram = await prisma.trainingProgram.findFirst({
    where: { coachId: coach.id, traineeId: trainee.id },
  });

  if (!existingProgram) {
    await prisma.trainingProgram.create({
      data: {
        coachId: coach.id,
        traineeId: trainee.id,
        name: "תוכנית כוח — שבוע 1",
        type: "STRENGTH",
        description: "תוכנית דemo להתחלה",
        exercises: {
          create: [
            {
              name: "סקוואט",
              sets: 4,
              reps: 8,
              restSeconds: 90,
              coachNotes: "שמור על גב ישר, עומק מלא",
              youtubeUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8",
              instructions: "רגליים ברוחב כתפיים, ברכיים בקו עם אצבעות הרגליים",
              sortOrder: 0,
            },
            {
              name: "לחיצת חזה",
              sets: 3,
              reps: 10,
              restSeconds: 60,
              coachNotes: "כתפיים צמודות לספסל",
              youtubeUrl: "https://www.youtube.com/watch?v=rT7DgCr-1pg",
              instructions: "הורד את המוט בשליטה עד mid-chest",
              sortOrder: 1,
            },
            {
              name: "מתח",
              sets: 3,
              reps: 8,
              restSeconds: 90,
              instructions: "משיכה עד שהסנטר מעל המוט",
              sortOrder: 2,
            },
          ],
        },
      },
    });
  }

  console.log("נתוני דemo נטענו:", DEMO.trainer.fullName, ",", DEMO.trainee.fullName);
  console.log("התחברות דemo:", DEMO.trainer.email, "/", DEMO.trainee.email, "— סיסמה:", DEMO.trainer.password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
