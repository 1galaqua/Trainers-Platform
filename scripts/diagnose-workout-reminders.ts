import { PrismaClient } from "../src/generated/prisma";

const databaseUrl =
  process.env.DATABASE_URL ??
  "mongodb://galaqua:123456%3F%21@ac-gmpwnil-shard-00-00.iwqknwa.mongodb.net:27017,ac-gmpwnil-shard-00-01.iwqknwa.mongodb.net:27017,ac-gmpwnil-shard-00-02.iwqknwa.mongodb.net:27017/trainers_platform?ssl=true&replicaSet=atlas-gcas9s-shard-0&authSource=admin&retryWrites=true&w=majority";

const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

const reminderNotSentWhere = {
  OR: [{ sentAt: null }, { sentAt: { isSet: false } }],
};

async function main() {
  const now = new Date();

  const [reminders, dueReminders, coaches, pushSubs] = await Promise.all([
    prisma.userWorkoutReminder.findMany({
      orderBy: { scheduledFor: "desc" },
      take: 10,
      include: {
        user: { select: { id: true, displayName: true, email: true, role: true } },
        workout: {
          select: {
            id: true,
            startsAt: true,
            cancelledAt: true,
            type: true,
          },
        },
      },
    }),
    prisma.userWorkoutReminder.findMany({
      where: {
        ...reminderNotSentWhere,
        scheduledFor: { lte: now },
      },
      take: 10,
      include: {
        user: { select: { id: true, displayName: true, email: true, role: true } },
        workout: { select: { startsAt: true, cancelledAt: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "COACH" },
      select: {
        id: true,
        displayName: true,
        email: true,
        _count: { select: { pushSubscriptions: true, workoutReminders: true } },
      },
      take: 5,
    }),
    prisma.pushSubscription.count(),
  ]);

  const workoutReminderNotifications = await prisma.appNotification.findMany({
    where: { type: "WORKOUT_REMINDER" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      userId: true,
      title: true,
      createdAt: true,
    },
  });

  console.log("=== Workout reminder diagnostics ===");
  console.log("Now:", now.toISOString());
  console.log("Push subscriptions total:", pushSubs);
  console.log("\nCoaches:");
  for (const coach of coaches) {
    console.log(
      `  ${coach.displayName ?? coach.email ?? coach.id} — reminders: ${coach._count.workoutReminders}, push subs: ${coach._count.pushSubscriptions}`,
    );
  }

  console.log("\nRecent reminders (up to 10):");
  for (const reminder of reminders) {
    const sent = reminder.sentAt ? "sent" : "pending";
    const due = reminder.scheduledFor <= now ? "DUE" : "future";
    const workoutStarted = reminder.workout.startsAt <= now ? "workout-started" : "workout-future";
    console.log(
      `  [${sent}/${due}/${workoutStarted}] ${reminder.user.role} ${reminder.user.displayName ?? reminder.user.email} — kind ${reminder.kind} — scheduled ${reminder.scheduledFor.toISOString()} — workout ${reminder.workout.startsAt.toISOString()}`,
    );
  }

  console.log("\nDue but not sent (cron should process):", dueReminders.length);
  for (const reminder of dueReminders) {
    console.log(
      `  ${reminder.user.role} ${reminder.user.displayName ?? reminder.user.email} — scheduled ${reminder.scheduledFor.toISOString()} — workout ${reminder.workout.startsAt.toISOString()} — cancelled ${reminder.workout.cancelledAt?.toISOString() ?? "no"}`,
    );
  }

  console.log("\nRecent WORKOUT_REMINDER notifications:", workoutReminderNotifications.length);
  for (const notification of workoutReminderNotifications) {
    console.log(`  ${notification.createdAt.toISOString()} — user ${notification.userId}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
