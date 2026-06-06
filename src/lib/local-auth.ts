import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export async function findUserByEmail(email: string) {
  return prisma.user.findFirst({ where: { email } });
}

export async function verifyUserPassword(
  user: { passwordHash: string | null },
  password: string,
) {
  if (!user.passwordHash) return false;
  return bcrypt.compare(password, user.passwordHash);
}
