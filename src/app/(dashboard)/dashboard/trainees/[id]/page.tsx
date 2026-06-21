import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { CoachingPeriodForm } from "@/features/trainees/components/coaching-period-form";
import { DeleteTraineeButton } from "@/features/trainees/components/delete-trainee-button";
import { EditTraineeName } from "@/features/trainees/components/edit-trainee-name";
import { RequestAgreementRedoButton } from "@/features/trainees/components/request-agreement-redo-button";
import { RequestQuestionnaireRedoButton } from "@/features/trainees/components/request-questionnaire-redo-button";
import { TraineeOnboardingSheet } from "@/features/trainees/components/trainee-onboarding-sheet";
import { WorkoutSessionHistoryList } from "@/features/workouts/components/workout-session-history-list";
import { requireCoach } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { isAgreementRedoPending, isQuestionnaireRedoPending } from "@/lib/questionnaire-status";
import { getEffectiveWorkoutsCompleted, getWorkoutsRemaining, getTraineeStatus } from "@/lib/trainee-status";
import { prisma } from "@/lib/prisma";
import { getTraineeCoachingPeriodAction } from "@/server/actions/trainees";
import { getCoachOnboardingTemplateAction } from "@/server/actions/coach-onboarding";
import { getCoachTraineeProgressAction } from "@/server/actions/workouts";
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

  const [sessions, coachingPeriod, template, coachLink] = await Promise.all([
    getCoachTraineeProgressAction(id),
    getTraineeCoachingPeriodAction(id),
    getCoachOnboardingTemplateAction(),
    prisma.coachTrainee.findFirst({
      where: { coachId: coach.id, traineeId: id },
      select: {
        questionnaireRedoRequestedAt: true,
        agreementRedoRequestedAt: true,
      },
    }),
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
        answers:
          trainee.questionnaireResponse.answers &&
          typeof trainee.questionnaireResponse.answers === "object" &&
          !Array.isArray(trainee.questionnaireResponse.answers)
            ? (trainee.questionnaireResponse.answers as Record<string, string | number | null>)
            : null,
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
  const hasSignedAgreement = Boolean(trainee.agreement);
  const questionnaireRedoPending = isQuestionnaireRedoPending(
    trainee.questionnaireResponse,
    coachLink?.questionnaireRedoRequestedAt,
  );
  const agreementRedoPending = isAgreementRedoPending(
    trainee.agreement,
    coachLink?.agreementRedoRequestedAt,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/dashboard/trainees" aria-label="חזרה" />}>
            <ArrowRight className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <TraineeStatusIndicator status={status} />
              <EditTraineeName traineeId={id} displayName={trainee.displayName} />
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              היסטוריית אימונים
              {workoutQuota != null && ` · ${workoutsRemaining} מתוך ${workoutQuota} אימונים נותרו`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {questionnaireRedoPending && (
            <Badge variant="secondary">ממתין למילוי שאלון מחדש</Badge>
          )}
          {agreementRedoPending && (
            <Badge variant="secondary">ממתין לחתימת הסכם מחדש</Badge>
          )}
          {questionnaire && (
            <TraineeOnboardingSheet
              traineeId={id}
              traineeName={name}
              fields={template.questionnaireFields}
              hasQuestionnaire
            />
          )}
          <RequestQuestionnaireRedoButton
            traineeId={id}
            hasQuestionnaire={Boolean(questionnaire)}
            questionnaireRedoPending={questionnaireRedoPending}
          />
          <RequestAgreementRedoButton
            traineeId={id}
            hasAgreement={hasSignedAgreement}
            agreementRedoPending={agreementRedoPending}
          />
          <Button
            variant="outline"
            size="sm"
            render={<Link href="#workout-history" />}
          >
            צפייה בהתקדמות
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/dashboard/workouts/new?traineeId=${id}`} />}
          >
            תוכנית חדשה
          </Button>
          <Button
            variant="default"
            size="sm"
            render={<Link href={`/dashboard/trainees/${id}/log`} />}
          >
            דיווח אימון
          </Button>
        </div>
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

      <div className="flex justify-end">
        <DeleteTraineeButton traineeId={id} traineeName={name} />
      </div>

      <div id="workout-history" className="scroll-mt-6 space-y-4">
        <h2 className="font-medium text-base">אימונים שבוצעו</h2>
        <WorkoutSessionHistoryList sessions={sessions} showDeleteButtons />
      </div>
    </div>
  );
}
