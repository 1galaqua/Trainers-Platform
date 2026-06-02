import { prisma } from "@/lib/prisma";

export async function isCoachOwnerOfTrainee(
  coachId: string,
  traineeId: string,
): Promise<boolean> {
  try {
    const link = await prisma.coachTrainee.findFirst({
      where: { coachId, traineeId },
    });
    return Boolean(link);
  } catch {
    return false;
  }
}

export async function getTraineeCoachId(traineeId: string): Promise<string | null> {
  try {
    const link = await prisma.coachTrainee.findUnique({
      where: { traineeId },
      select: { coachId: true },
    });
    return link?.coachId ?? null;
  } catch {
    return null;
  }
}

export async function linkTraineeToCoach(traineeId: string, coachId: string) {
  const coach = await prisma.user.findFirst({
    where: { id: coachId, role: "COACH" },
  });
  if (!coach) {
    throw new Error("COACH_NOT_FOUND");
  }

  const existing = await prisma.coachTrainee.findUnique({
    where: { traineeId },
  });
  if (existing) {
    if (existing.coachId === coachId) return existing;
    throw new Error("TRAINEE_ALREADY_LINKED");
  }

  return prisma.coachTrainee.create({
    data: { coachId, traineeId },
  });
}

export async function getAvailableCoaches() {
  try {
    return await prisma.user.findMany({
      where: { role: "COACH" },
      select: { id: true, displayName: true, email: true },
      orderBy: { displayName: "asc" },
    });
  } catch {
    return [];
  }
}
