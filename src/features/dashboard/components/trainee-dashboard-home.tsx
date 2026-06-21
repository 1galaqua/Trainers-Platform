import Link from "next/link";

import { Button } from "@/components/ui/button";
import { TraineeWeeklyWorkoutChart } from "@/features/dashboard/components/trainee-weekly-workout-chart";
import { ProgressPageClient } from "@/features/progress/components/progress-page-client";
import { WorkoutSessionHistoryList } from "@/features/workouts/components/workout-session-history-list";
import {
  getTraineeProgressExercisesAction,
  getWorkoutHistoryAction,
} from "@/server/actions/workouts";

type TraineeDashboardHomeProps = {
  traineeName?: string | null;
};

export async function TraineeDashboardHome({ traineeName }: TraineeDashboardHomeProps) {
  const [sessions, exercises] = await Promise.all([
    getWorkoutHistoryAction(),
    getTraineeProgressExercisesAction(),
  ]);

  const sessionDates = sessions.map((session) => session.completedAt.toISOString());

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">לוח בקרה</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {traineeName ? `שלום, ${traineeName}` : "סיכום אימונים והתקדמות"}
          </p>
        </div>
        <Button render={<Link href="/dashboard/workouts/log" />}>דיווח אימון</Button>
      </div>

      <TraineeWeeklyWorkoutChart sessionDates={sessionDates} />

      <div className="space-y-4">
        <div>
          <h2 className="font-medium text-base">גרפי התקדמות</h2>
          <p className="mt-1 text-muted-foreground text-sm">מעקב משקל ונפח אימון לפי תאריך</p>
        </div>
        <ProgressPageClient exercises={exercises} />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="font-medium text-base">אימונים שבוצעו</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            כל האימונים שנשמרו או דווחו על ידך או על ידי המאמן/ית
          </p>
        </div>
        <WorkoutSessionHistoryList sessions={sessions} />
      </div>
    </div>
  );
}
