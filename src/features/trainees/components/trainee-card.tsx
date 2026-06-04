"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachingPeriodForm } from "@/features/trainees/components/coaching-period-form";
import { QuestionnaireSheet } from "@/features/trainees/components/questionnaire-sheet";
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
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TraineeStatusIndicator status={trainee.status} />
            <CardTitle className="text-base">{name}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            {trainee.questionnaire ? (
              <QuestionnaireSheet
                traineeId={trainee.id}
                traineeName={name}
                questionnaire={trainee.questionnaire}
                fields={questionnaireFields}
                hasSignedAgreement={trainee.hasSignedAgreement}
              />
            ) : (
              <Badge variant="outline">ממתין לשאלון</Badge>
            )}
            {trainee.activePrograms.length > 0 && (
              <Badge>{trainee.activePrograms.length} תוכניות</Badge>
            )}
          </div>
        </div>
        <CardDescription>
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
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 font-medium text-sm">תקופת ליווי ומכסת אימונים</p>
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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" render={<Link href={`/dashboard/trainees/${trainee.id}`} />}>
            צפייה בהתקדמות
          </Button>
          <Button variant="outline" size="sm" render={<Link href="/dashboard/workouts/new" />}>
            תוכנית חדשה
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
