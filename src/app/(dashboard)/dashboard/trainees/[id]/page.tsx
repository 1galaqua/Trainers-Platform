import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { CoachingPeriodForm } from "@/features/trainees/components/coaching-period-form";
import { QuestionnaireSheet } from "@/features/trainees/components/questionnaire-sheet";
import { requireCoach } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { photoCategoryLabels } from "@/lib/program-labels";
import { prisma } from "@/lib/prisma";
import { getTraineeCoachingPeriodAction } from "@/server/actions/trainees";
import { getCoachTraineeProgressAction } from "@/server/actions/workouts";
import { getTraineePhotosAction } from "@/server/actions/photos";
import { getEffectiveWorkoutsCompleted, getWorkoutsRemaining, getTraineeStatus } from "@/lib/trainee-status";
import { TraineeStatusIndicator } from "@/features/trainees/components/trainee-status-indicator";

export const metadata = {
  title: `מתאמן | ${siteConfig.shortName}`,
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TraineeDetailPage({ params }: PageProps) {
  const coach = await requireCoach();
  const { id } = await params;

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, id);
  if (!ownsTrainee) notFound();

  let trainee;
  try {
    trainee = await prisma.user.findUnique({
      where: { id },
      include: { questionnaireResponse: true, agreement: true },
    });
  } catch {
    notFound();
  }

  if (!trainee || trainee.role !== "TRAINEE") notFound();

  const [sessions, photos, coachingPeriod] = await Promise.all([
    getCoachTraineeProgressAction(id),
    getTraineePhotosAction(id),
    getTraineeCoachingPeriodAction(id),
  ]);

  const loggedSessionsCount = coachingPeriod?.loggedSessionsCount ?? 0;
  const workoutQuota = coachingPeriod?.workoutQuota ?? null;
  const effectiveCompleted = getEffectiveWorkoutsCompleted(
    coachingPeriod?.workoutsCompleted ?? null,
    loggedSessionsCount,
  );
  const workoutsRemaining = getWorkoutsRemaining(workoutQuota, effectiveCompleted);
  const status = getTraineeStatus({
    coachingStartDate: coachingPeriod?.coachingStartDate ?? null,
    coachingEndDate: coachingPeriod?.coachingEndDate ?? null,
    workoutQuota,
    sessionsCount: effectiveCompleted,
  });

  const name = trainee.displayName ?? "מתאמן";
  const questionnaire = trainee.questionnaireResponse
    ? {
        age: trainee.questionnaireResponse.age,
        heightCm: trainee.questionnaireResponse.heightCm,
        weightKg: trainee.questionnaireResponse.weightKg,
        goal: trainee.questionnaireResponse.goal,
        experience: trainee.questionnaireResponse.experience,
        injuries: trainee.questionnaireResponse.injuries,
        sessionsPerWeek: trainee.questionnaireResponse.sessionsPerWeek,
        equipment: trainee.questionnaireResponse.equipment,
        completedAt: trainee.questionnaireResponse.completedAt.toISOString(),
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/dashboard/trainees" aria-label="חזרה" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <TraineeStatusIndicator status={status} />
              <h1 className="font-semibold text-2xl tracking-tight">{name}</h1>
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              היסטוריית אימונים ותמונות התקדמות
              {workoutQuota != null && ` · ${workoutsRemaining} מתוך ${workoutQuota} אימונים נותרו`}
            </p>
          </div>
        </div>
        {questionnaire && <QuestionnaireSheet traineeName={name} questionnaire={questionnaire} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">תקופת ליווי ומכסת אימונים</CardTitle>
        </CardHeader>
        <CardContent>
          <CoachingPeriodForm
            traineeId={id}
            coachingStartDate={coachingPeriod?.coachingStartDate ?? null}
            coachingEndDate={coachingPeriod?.coachingEndDate ?? null}
            workoutQuota={workoutQuota}
            workoutsCompleted={coachingPeriod?.workoutsCompleted ?? null}
            loggedSessionsCount={loggedSessionsCount}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-medium text-base">אימונים שבוצעו</h2>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">טרם דווחו אימונים</p>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle className="text-sm">
                  {new Date(session.completedAt).toLocaleDateString("he-IL")} — {session.program.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {session.logs.map((log) => (
                  <p key={log.id}>
                    {log.exercise.name}: {log.weightKg ?? "—"} ק״ג × {log.repsCompleted ?? "—"}
                  </p>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-medium text-base">תמונות התקדמות</h2>
        {photos.length === 0 ? (
          <p className="text-muted-foreground text-sm">אין תמונות</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {photos.map((photo) => (
              <div key={photo.id} className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={photoCategoryLabels[photo.category]}
                  className="aspect-[3/4] w-full rounded-lg border border-border object-cover"
                />
                <p className="text-muted-foreground text-xs">
                  {photoCategoryLabels[photo.category]} ·{" "}
                  {new Date(photo.weekStart).toLocaleDateString("he-IL")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
