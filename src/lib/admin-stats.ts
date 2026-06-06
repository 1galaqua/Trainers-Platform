import { prisma } from "@/lib/prisma";

export type AdminTraineeSummary = {
  id: string;
  displayName: string | null;
  email: string | null;
};

export type AdminCoachStat = {
  id: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  traineeCount: number;
  trainees: AdminTraineeSummary[];
};

export async function getAdminCoachStats(): Promise<AdminCoachStat[]> {
  const coaches = await prisma.user.findMany({
    where: { role: "COACH" },
    select: {
      id: true,
      displayName: true,
      email: true,
      phoneNumber: true,
      coachedTrainees: {
        select: {
          trainee: {
            select: { id: true, displayName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { displayName: "asc" },
  });

  return coaches.map((coach) => ({
    id: coach.id,
    displayName: coach.displayName,
    email: coach.email,
    phoneNumber: coach.phoneNumber,
    traineeCount: coach.coachedTrainees.length,
    trainees: coach.coachedTrainees.map((link) => link.trainee),
  }));
}
