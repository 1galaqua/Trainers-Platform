import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { CoachProgramsList } from "@/features/programs/components/coach-programs-list";
import { requireCoach } from "@/lib/auth";
import { getCoachProgramsAction } from "@/server/actions/programs";

export const metadata = {
  title: `תוכניות אימון | ${siteConfig.shortName}`,
};

export default async function WorkoutsPage() {
  await requireCoach();
  const programs = await getCoachProgramsAction();

  const programItems = programs.map((program) => ({
    id: program.id,
    name: program.name,
    type: program.type,
    isActive: program.isActive,
    traineeId: program.traineeId,
    traineeName: program.trainee.displayName,
    exerciseCount: program._count.exercises,
    sessionCount: program._count.sessions,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">תוכניות אימון</h1>
          <p className="mt-1 text-muted-foreground text-sm">יצירה וניהול תוכניות למתאמנים</p>
        </div>
        <Button render={<Link href="/dashboard/workouts/new" />}>
          <Plus className="size-4" />
          תוכנית חדשה
        </Button>
      </div>

      <CoachProgramsList programs={programItems} />
    </div>
  );
}
