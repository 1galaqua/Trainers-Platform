import Link from "next/link";

import { Button } from "@/components/ui/button";
import { TraineeWeeklyWorkoutChart } from "@/features/dashboard/components/trainee-weekly-workout-chart";
import { ProgressPageClient } from "@/features/progress/components/progress-page-client";
import { WorkoutSessionHistoryList } from "@/features/workouts/components/workout-session-history-list";
import { getTraineeHomeDataAction } from "@/server/actions/workouts";

type TraineeDashboardHomeProps = {
  traineeName?: string | null;
};

export async function TraineeDashboardHome({ traineeName }: TraineeDashboardHomeProps) {
  const { sessions, progressExercises } = await getTraineeHomeDataAction();

  const sessionDates = sessions.map((session) => new Date(session.completedAt).toISOString());

  return (
    <div className="min-w-0 space-y-8">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-semibold text-2xl tracking-tight">לוח בקרה</h1>
          <p className="mt-1 text-muted-foreground text-base">
            {traineeName ? `שלום, ${traineeName}` : "סיכום אימונים והתקדמות"}
          </p>
        </div>
        <div className="flex w-full min-w-0 items-stretch gap-2 sm:w-auto sm:items-center">
          <Button className="min-w-0 flex-1 sm:flex-none" render={<Link href="/dashboard/workouts/log" />}>
            דיווח אימון
          </Button>
          <Button
            className="min-w-0 flex-1 sm:flex-none"
            variant="outline"
            render={<Link href="/dashboard/tracking" />}
          >
            צפייה במעקב
          </Button>
        </div>
      </div>

      <TraineeWeeklyWorkoutChart sessionDates={sessionDates} />

      <div className="space-y-4">
        <div>
          <h2 className="font-medium text-base">גרפי התקדמות</h2>
          <p className="mt-1 text-muted-foreground text-base">מעקב משקלי אימון ונפח לפי תאריך</p>
        </div>
        <ProgressPageClient
          exercises={progressExercises}
          emptyMessage="אין עדיין נתוני התקדמות. דווח על אימון כדי להתחיל."
        />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="font-medium text-base">אימונים שבוצעו</h2>
          <p className="mt-1 text-muted-foreground text-base">
            כל האימונים שנשמרו או דווחו על ידך או על ידי המאמן/ית
          </p>
        </div>
        <WorkoutSessionHistoryList sessions={sessions} />
      </div>
    </div>
  );
}
