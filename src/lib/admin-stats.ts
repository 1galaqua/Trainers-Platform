import { prisma } from "@/lib/prisma";
import {
  getEffectiveWorkoutsCompleted,
  getTraineeStatus,
  type TraineeStatus,
} from "@/lib/trainee-status";

export type AdminTraineeSummary = {
  id: string;
  displayName: string | null;
  email: string | null;
  status: TraineeStatus;
  workoutsRemaining: number;
};

export type AdminCoachStat = {
  id: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  traineeCount: number;
  activeTraineeCount: number;
  inactiveTraineeCount: number;
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
          coachingStartDate: true,
          coachingEndDate: true,
          workoutQuota: true,
          workoutsCompleted: true,
          trainee: {
            select: {
              id: true,
              displayName: true,
              email: true,
              workoutSessions: {
                select: {
                  id: true,
                  program: { select: { coachId: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { displayName: "asc" },
  });

  return coaches.map((coach) => {
    const trainees = coach.coachedTrainees.map((link) => {
      const loggedSessionsCount = link.trainee.workoutSessions.filter(
        (session) => session.program.coachId === coach.id,
      ).length;
      const sessionsCount = getEffectiveWorkoutsCompleted(
        link.workoutsCompleted,
        loggedSessionsCount,
      );
      const status = getTraineeStatus({
        coachingStartDate: link.coachingStartDate,
        coachingEndDate: link.coachingEndDate,
        workoutQuota: link.workoutQuota,
        sessionsCount,
      });
      const workoutsRemaining =
        link.workoutQuota != null && link.workoutQuota > 0
          ? Math.max(0, link.workoutQuota - sessionsCount)
          : 0;

      return {
        id: link.trainee.id,
        displayName: link.trainee.displayName,
        email: link.trainee.email,
        status,
        workoutsRemaining,
      };
    });

    const activeTraineeCount = trainees.filter((t) => t.status === "active").length;

    return {
      id: coach.id,
      displayName: coach.displayName,
      email: coach.email,
      phoneNumber: coach.phoneNumber,
      traineeCount: trainees.length,
      activeTraineeCount,
      inactiveTraineeCount: trainees.length - activeTraineeCount,
      trainees,
    };
  });
}
