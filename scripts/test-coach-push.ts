import { PrismaClient } from "@prisma/client";
import { sendPushNotification } from "../src/lib/push-vapid";

const databaseUrl =
  process.env.DATABASE_URL ??
  "mongodb://galaqua:123456%3F%21@ac-gmpwnil-shard-00-00.iwqknwa.mongodb.net:27017,ac-gmpwnil-shard-00-01.iwqknwa.mongodb.net:27017,ac-gmpwnil-shard-00-02.iwqknwa.mongodb.net:27017/trainers_platform?ssl=true&replicaSet=atlas-gcas9s-shard-0&authSource=admin&retryWrites=true&w=majority";

const prisma = new PrismaClient({ datasourceUrl: databaseUrl });

async function main() {
  const coach = await prisma.user.findFirst({
    where: { displayName: "גל המאמן" },
    include: { pushSubscriptions: true },
  });

  if (!coach) {
    console.log("Coach not found");
    return;
  }

  console.log("Coach:", coach.id, coach.displayName);
  console.log("VAPID public key set:", Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY));
  console.log("VAPID private key set:", Boolean(process.env.VAPID_PRIVATE_KEY));
  console.log("VAPID subject:", process.env.VAPID_SUBJECT ?? process.env.NEXT_PUBLIC_APP_URL);

  for (const sub of coach.pushSubscriptions) {
    console.log("\nSubscription:", sub.id);
    console.log("Endpoint host:", new URL(sub.endpoint).host);

    const result = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      {
        title: "בדיקת תזכורת",
        body: "אם קיבלת את זה — Push עובד",
        url: "/dashboard/updates",
        tag: "test-reminder",
        unreadCount: 1,
      },
    );

    console.log("Send result:", result);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
