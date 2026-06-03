import bcrypt from "bcryptjs";
import type { User, UserRole } from "@/lib/prisma-client";

import { prisma } from "@/lib/prisma";

export const DEMO_AUTH: Record<
  string,
  { clerkId: string; displayName: string; role: UserRole; password: string }
> = {
  "coach@demo.com": {
    clerkId: "demo_clerk_coach",
    displayName: "יהודה אמסלם",
    role: "COACH",
    password: "demo1234",
  },
  "trainee@demo.com": {
    clerkId: "demo_clerk_trainee",
    displayName: "גל אקוע",
    role: "TRAINEE",
    password: "demo1234",
  },
};

export async function resolveLoginUser(email: string): Promise<User | null> {
  const demo = DEMO_AUTH[email];

  const byEmail = await prisma.user.findFirst({ where: { email } });
  const byClerkId = demo
    ? await prisma.user.findUnique({ where: { clerkId: demo.clerkId } })
    : null;
  const user = byEmail ?? byClerkId;

  if (!demo) return user;

  const passwordHash = await bcrypt.hash(demo.password, 10);

  if (!user) {
    return prisma.user.create({
      data: {
        clerkId: demo.clerkId,
        email,
        passwordHash,
        displayName: demo.displayName,
        role: demo.role,
      },
    });
  }

  if (!user.email || !user.passwordHash) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email ?? email,
        passwordHash: user.passwordHash ?? passwordHash,
        displayName: user.displayName ?? demo.displayName,
      },
    });
  }

  return user;
}

export async function verifyPassword(user: User, password: string, email: string) {
  if (!user.passwordHash) return false;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (valid) return true;

  const demo = DEMO_AUTH[email];
  if (!demo || password !== demo.password) return false;

  const passwordHash = await bcrypt.hash(demo.password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { email: user.email ?? email, passwordHash },
  });
  return true;
}
