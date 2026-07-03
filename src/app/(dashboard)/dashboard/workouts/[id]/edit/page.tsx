import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { ProgramForm } from "@/features/programs/components/program-form";
import { requireCoach } from "@/lib/auth";
import {
  buildProgramSectionDisplay,
  sectionsToFormSections,
} from "@/lib/program-sections";
import { getProgramByIdAction } from "@/server/actions/programs";

export const metadata = {
  title: `עריכת תוכנית | ${siteConfig.shortName}`,
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProgramPage({ params }: PageProps) {
  await requireCoach();
  const { id } = await params;
  const program = await getProgramByIdAction(id);

  if (!program) notFound();

  const formSections = sectionsToFormSections(
    buildProgramSectionDisplay(
      program.sections.map((section) => ({
        id: section.id,
        name: section.name,
        sortOrder: section.sortOrder,
        exercises: section.exercises.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          restSeconds: exercise.restSeconds,
          coachNotes: exercise.coachNotes,
          youtubeUrl: exercise.youtubeUrl,
          instructions: exercise.instructions,
          sortOrder: exercise.sortOrder,
          sectionId: exercise.sectionId,
        })),
      })),
      program.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        restSeconds: exercise.restSeconds,
        coachNotes: exercise.coachNotes,
        youtubeUrl: exercise.youtubeUrl,
        instructions: exercise.instructions,
        sortOrder: exercise.sortOrder,
        sectionId: exercise.sectionId,
      })),
    ),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={`/dashboard/workouts/${id}`} aria-label="חזרה" />}
        >
          <ArrowRight className="size-4" />
        </Button>
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">עריכת תוכנית</h1>
          <p className="mt-1 text-muted-foreground text-base">{program.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי התוכנית</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgramForm
            mode="edit"
            initial={{
              programId: program.id,
              traineeId: program.traineeId,
              traineeName: program.trainee.displayName ?? "מתאמן",
              name: program.name,
              type: program.type,
              description: program.description ?? "",
              isActive: program.isActive,
              sections: formSections.map((section) => ({
                id: section.id ?? "",
                name: section.name,
                exercises: section.exercises.map((exercise) => ({
                  id: exercise.id ?? "",
                  name: exercise.name,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  restSeconds: exercise.restSeconds,
                  coachNotes: exercise.coachNotes ?? null,
                  youtubeUrl: exercise.youtubeUrl ?? null,
                  instructions: exercise.instructions ?? null,
                })),
              })),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
