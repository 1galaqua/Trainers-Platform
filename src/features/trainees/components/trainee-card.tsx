"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachingPeriodForm } from "@/features/trainees/components/coaching-period-form";
import { QuestionnaireSheet } from "@/features/trainees/components/questionnaire-sheet";
import { TraineeStatusIndicator } from "@/features/trainees/components/trainee-status-indicator";
import type { CoachTraineeListItem } from "@/server/actions/trainees";

type TraineeCardProps = {
  trainee: CoachTraineeListItem;
};

export function TraineeCard({ trainee }: TraineeCardProps) {
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
              <QuestionnaireSheet traineeName={name} questionnaire={trainee.questionnaire} />
            ) : (
              <Badge variant="outline">ממתין לשאלון</Badge>
            )}
            {trainee.activeProgramName && <Badge>תוכנית פעילה</Badge>}
          </div>
        </div>
        <CardDescription>
          {trainee.sessionsCount} אימונים שבוצעו · {quotaLabel}
          {trainee.activeProgramName ? ` · ${trainee.activeProgramName}` : ""}
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
            sessionsCount={trainee.sessionsCount}
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
