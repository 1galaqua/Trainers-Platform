import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { ProgramForm } from "@/features/programs/components/program-form";
import { requireCoach } from "@/lib/auth";
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
          <p className="mt-1 text-muted-foreground text-sm">{program.name}</p>
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
              exercises: program.exercises.map((ex) => ({
                id: ex.id,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                restSeconds: ex.restSeconds,
                coachNotes: ex.coachNotes,
                youtubeUrl: ex.youtubeUrl,
                instructions: ex.instructions,
              })),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
