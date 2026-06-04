import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { requireCoach } from "@/lib/auth";
import { ExerciseDetailText } from "@/features/programs/components/exercise-detail-text";
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
            <ArrowLeft className="size-4" />
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
        <Button variant="outline" render={<Link href={`/dashboard/workouts/${program.id}/edit`} />}>
          <Pencil className="size-4" />
          עריכה
        </Button>
      </div>

      {program.description && (
        <p className="text-muted-foreground text-sm">{program.description}</p>
      )}

      <div className="space-y-4">
        <h2 className="font-medium text-base">תרגילים</h2>
        {program.exercises.map((ex, index) => (
          <Card key={ex.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {index + 1}. {ex.name}
              </CardTitle>
              <CardDescription>
                {ex.sets} סטים × {ex.reps} חזרות · מנוחה {ex.restSeconds} שנ׳
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ExerciseDetailText
                instructions={ex.instructions}
                coachNotes={ex.coachNotes}
              />
              {ex.youtubeUrl && (
                <a
                  href={ex.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  צפייה בסרטון YouTube
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {program.sessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-medium text-base">אימונים אחרונים שבוצעו</h2>
          {program.sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle className="text-sm">
                  {new Date(session.completedAt).toLocaleDateString("he-IL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {session.logs.map((log) => (
                  <p key={log.id}>
                    {log.exercise.name}: {log.weightKg ?? "—"} ק״ג × {log.repsCompleted ?? "—"} חזרות
                  </p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
