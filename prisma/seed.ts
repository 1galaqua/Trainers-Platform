import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const ADMIN = {
  clerkId: "admin_gaqua61",
  email: "gaqua61@gmail.com",
  displayName: "גל אקוע",
  phoneNumber: "0508683459",
  age: 28,
  password: "Gaqua27?!",
} as const;

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN.password, 10);

  const existing = await prisma.user.findFirst({
    where: { email: ADMIN.email },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        displayName: ADMIN.displayName,
        phoneNumber: ADMIN.phoneNumber,
        age: ADMIN.age,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log("משתמש ADMIN עודכן:", ADMIN.email);
  } else {
    await prisma.user.create({
      data: {
        clerkId: ADMIN.clerkId,
        email: ADMIN.email,
        displayName: ADMIN.displayName,
        phoneNumber: ADMIN.phoneNumber,
        age: ADMIN.age,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log("משתמש ADMIN נוצר:", ADMIN.email);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
