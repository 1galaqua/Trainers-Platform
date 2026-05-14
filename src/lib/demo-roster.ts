import { demoPeople } from "@/config/demo";
import { prisma } from "@/lib/prisma";

export type DemoRosterUser = {
  displayName: string | null;
  role: "COACH" | "TRAINEE";
  clerkId: string;
};

export async function getDemoRoster(): Promise<{
  source: "database" | "static";
  users: DemoRosterUser[];
}> {
  const staticUsers: DemoRosterUser[] = [
    {
      clerkId: demoPeople.trainer.clerkId,
      displayName: demoPeople.trainer.fullName,
      role: demoPeople.trainer.role,
    },
    {
      clerkId: demoPeople.trainee.clerkId,
      displayName: demoPeople.trainee.fullName,
      role: demoPeople.trainee.role,
    },
  ];

  try {
    const rows = await prisma.user.findMany({
      where: {
        clerkId: {
          in: [demoPeople.trainer.clerkId, demoPeople.trainee.clerkId],
        },
      },
    });

    if (rows.length > 0) {
      const sorted = [...rows].sort((a, b) => {
        if (a.role === b.role) return 0;
        return a.role === "COACH" ? -1 : 1;
      });
      return {
        source: "database",
        users: sorted.map((u) => ({
          displayName: u.displayName,
          role: u.role,
          clerkId: u.clerkId,
        })),
      };
    }
  } catch {
    // מסד לא זמין או עדיין לא הוגדר DATABASE_URL
  }

  return { source: "static", users: staticUsers };
}
