import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { MyProgramsPageContent } from "@/features/workouts/components/my-programs-page-content";
import { getCurrentUser, getTraineeOnboardingStatus } from "@/lib/auth";
import { getTraineeProgramsAction } from "@/server/actions/workouts";

export const metadata = {
  title: `התוכניות שלי | ${siteConfig.shortName}`,
};

export default async function MyProgramPage() {
  const user = await getCurrentUser();
  if (user?.role !== "TRAINEE") redirect("/dashboard");

  const onboarding = await getTraineeOnboardingStatus(user.id);
  if (!onboarding.isComplete) {
    if (!onboarding.questionnaireComplete) redirect("/dashboard/onboarding/questionnaire");
    redirect("/dashboard/onboarding/agreement");
  }

  const programs = await getTraineeProgramsAction();

  const programItems = programs.map((program) => ({
    id: program.id,
    name: program.name,
    type: program.type,
    description: program.description,
    coachName: program.coach.displayName,
    sections: program.sections.map((section) => ({
      id: section.id,
      name: section.name,
      sortOrder: section.sortOrder,
      exercises: section.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        restSeconds: exercise.restSeconds,
        instructions: exercise.instructions,
        coachNotes: exercise.coachNotes,
        youtubeUrl: exercise.youtubeUrl,
      })),
    })),
    exercises: program.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      restSeconds: exercise.restSeconds,
      instructions: exercise.instructions,
      coachNotes: exercise.coachNotes,
      youtubeUrl: exercise.youtubeUrl,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">התוכניות שלי</h1>
          <p className="mt-1 text-muted-foreground text-base">
            {programs.length === 0
              ? "תרגילים, הוראות וסרטונים"
              : `${programs.length} תוכניות משויכות — בחר תוכנית לצפייה או לדיווח`}
          </p>
        </div>
        {programs.length > 0 && (
          <Button render={<Link href="/dashboard/workouts/log" />}>דיווח אימון</Button>
        )}
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-base">
            המאמן/ית עדיין לא הקצה לך תוכניות אימון.
          </CardContent>
        </Card>
      ) : (
        <MyProgramsPageContent programs={programItems} />
      )}
    </div>
  );
}
