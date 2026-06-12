"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachingPeriodForm } from "@/features/trainees/components/coaching-period-form";
import { RequestAgreementRedoButton } from "@/features/trainees/components/request-agreement-redo-button";
import { RequestQuestionnaireRedoButton } from "@/features/trainees/components/request-questionnaire-redo-button";
import { TraineeOnboardingSheet } from "@/features/trainees/components/trainee-onboarding-sheet";
import { TraineeStatusIndicator } from "@/features/trainees/components/trainee-status-indicator";
import type { QuestionField } from "@/lib/onboarding-template";
import type { CoachTraineeListItem } from "@/server/actions/trainees";

type TraineeCardProps = {
  trainee: CoachTraineeListItem;
  questionnaireFields: QuestionField[];
};

export function TraineeCard({ trainee, questionnaireFields }: TraineeCardProps) {
  const name = trainee.displayName ?? "מתאמן";
  const quotaLabel =
    trainee.workoutQuota != null
      ? `${trainee.workoutsRemaining} מתוך ${trainee.workoutQuota} אימונים נותרו`
      : "מכסת אימונים לא הוגדרה";

  return (
    <Card className="relative min-w-0 cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/20">
      <Link
        href={`/dashboard/trainees/${trainee.id}`}
        className="absolute inset-0 z-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`צפייה בהתקדמות של ${name}`}
      />
      <CardHeader className="relative z-[1] pointer-events-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <TraineeStatusIndicator status={trainee.status} />
            <CardTitle className="min-w-0 break-words text-base">{name}</CardTitle>
          </div>
          <div className="pointer-events-auto flex min-w-0 flex-wrap gap-2">
            {trainee.questionnaireRedoPending && (
              <Badge variant="secondary">ממתין למילוי שאלון מחדש</Badge>
            )}
            {trainee.agreementRedoPending && (
              <Badge variant="secondary">ממתין לחתימת הסכם מחדש</Badge>
            )}
            {trainee.questionnaire ? (
              <TraineeOnboardingSheet
                traineeId={trainee.id}
                traineeName={name}
                fields={questionnaireFields}
                hasQuestionnaire
              />
            ) : (
              <Badge variant="outline">ממתין לשאלון</Badge>
            )}
            {trainee.activePrograms.length > 0 && (
              <Badge>{trainee.activePrograms.length} תוכניות</Badge>
            )}
          </div>
        </div>
        <CardDescription className="break-words leading-relaxed">
          {trainee.sessionsCount} אימונים שבוצעו (למכסה)
          {trainee.loggedSessionsCount !== trainee.sessionsCount &&
            ` · ${trainee.loggedSessionsCount} דווחו במערכת`}
          {" · "}
          {quotaLabel}
          {trainee.activePrograms.length > 0
            ? ` · ${trainee.activePrograms.map((p) => p.name).join(" · ")}`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-[1] min-w-0 space-y-4">
        <div className="pointer-events-auto isolate min-w-0 w-full rounded-lg border border-border p-3 sm:p-4">
          <p className="mb-3 text-end font-medium text-sm">תקופת ליווי ומכסת אימונים</p>
          <CoachingPeriodForm
            traineeId={trainee.id}
            coachingStartDate={trainee.coachingStartDate}
            coachingEndDate={trainee.coachingEndDate}
            workoutQuota={trainee.workoutQuota}
            workoutsCompleted={trainee.workoutsCompleted}
            loggedSessionsCount={trainee.loggedSessionsCount}
            compact
          />
        </div>
        <div className="pointer-events-auto grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <RequestQuestionnaireRedoButton
            traineeId={trainee.id}
            hasQuestionnaire={Boolean(trainee.questionnaire)}
            questionnaireRedoPending={trainee.questionnaireRedoPending}
            className="w-full"
          />
          <RequestAgreementRedoButton
            traineeId={trainee.id}
            hasAgreement={trainee.hasSignedAgreement}
            agreementRedoPending={trainee.agreementRedoPending}
            className="w-full"
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            render={<Link href={`/dashboard/trainees/${trainee.id}/log`} />}
          >
            דיווח אימון
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            render={<Link href={`/dashboard/trainees/${trainee.id}`} />}
          >
            צפייה בהתקדמות
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            render={<Link href="/dashboard/workouts/new" />}
          >
            תוכנית חדשה
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
