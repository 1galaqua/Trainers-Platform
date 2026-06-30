import Link from "next/link";
import { ArrowRight, Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { requireCoach } from "@/lib/auth";
import { ProgramExercisesBySection } from "@/features/programs/components/program-exercises-by-section";
import { DeleteProgramButton } from "@/features/programs/components/delete-program-button";
import { WorkoutSessionHistoryList } from "@/features/workouts/components/workout-session-history-list";
import { programTypeLabels } from "@/lib/program-labels";
import { getProgramByIdAction } from "@/server/actions/programs";

export const metadata = {
  title: `תוכנית אימון | ${siteConfig.shortName}`,
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProgramDetailPage({ params }: PageProps) {
  await requireCoach();
  const { id } = await params;
  const program = await getProgramByIdAction(id);

  if (!program) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/dashboard/workouts" aria-label="חזרה" />}>
            <ArrowRight className="size-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-semibold text-2xl tracking-tight">{program.name}</h1>
              <Badge variant="secondary">{programTypeLabels[program.type]}</Badge>
              {!program.isActive && <Badge variant="outline">לא פעילה</Badge>}
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              {program.trainee.displayName ?? "מתאמן"} · {program.exercises.length} תרגילים
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            render={
              <Link
                href={`/dashboard/trainees/${program.traineeId}/log?program=${program.id}`}
              />
            }
          >
            דיווח אימון
          </Button>
          <Button variant="outline" render={<Link href={`/dashboard/workouts/${program.id}/edit`} />}>
            <Pencil className="size-4" />
            עריכה
          </Button>
          <DeleteProgramButton programId={program.id} programName={program.name} />
        </div>
      </div>

      {program.description && (
        <p className="text-muted-foreground text-sm">{program.description}</p>
      )}

      <div className="space-y-4">
        <h2 className="font-medium text-base">תרגילים</h2>
        <ProgramExercisesBySection
        className="space-y-6"
        sections={program.sections.map((section) => ({
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
        }))}
        exercises={program.exercises.map((exercise) => ({
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
        }))}
        />
      </div>

      {program.sessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-medium text-base">אימונים אחרונים שבוצעו</h2>
          <WorkoutSessionHistoryList
            sessions={program.sessions.map((session) => ({
              ...session,
              program: { name: program.name },
            }))}
            showDeleteButtons
            formatDate={(date) =>
              date.toLocaleDateString("he-IL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            }
          />
        </div>
      )}
    </div>
  );
}
