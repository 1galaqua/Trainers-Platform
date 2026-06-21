import { processDueUserWorkoutReminders } from "../src/lib/process-user-workout-reminders";
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await processDueUserWorkoutReminders();
  console.log("Process result:", JSON.stringify(result, null, 2));

  const notifications = await prisma.appNotification.findMany({
    where: { type: "WORKOUT_REMINDER" },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, userId: true, title: true, body: true, createdAt: true },
  });

  console.log("\nWORKOUT_REMINDER notifications:", notifications);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
