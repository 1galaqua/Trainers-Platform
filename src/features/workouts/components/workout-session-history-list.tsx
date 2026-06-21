import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteWorkoutSessionButton } from "@/features/workouts/components/delete-workout-session-button";
import { ExerciseLogLine } from "@/features/workouts/components/exercise-log-line";
import { formatWorkoutSessionLogMeta } from "@/lib/format-workout-session-meta";
import type { UserRole, WorkoutLogKind } from "@/lib/prisma-client";

export type WorkoutSessionHistoryItem = {
  id: string;
  completedAt: Date;
  notes: string | null;
  loggedByRole?: UserRole | null;
  logKind?: WorkoutLogKind | null;
  program: { name: string };
  logs: Array<{
    id: string;
    weightKg: number | null;
    repsCompleted: number | null;
    exercise: { name: string };
    setLogs: Array<{
      setNumber: number;
      weightKg: number | null;
      repsCompleted: number | null;
    }>;
  }>;
};

type WorkoutSessionHistoryListProps = {
  sessions: WorkoutSessionHistoryItem[];
  emptyMessage?: string;
  showDeleteButtons?: boolean;
  formatDate?: (date: Date) => string;
};

function defaultFormatDate(date: Date): string {
  return date.toLocaleDateString("he-IL");
}

export function WorkoutSessionHistoryList({
  sessions,
  emptyMessage = "טרם דווחו אימונים",
  showDeleteButtons = false,
  formatDate = defaultFormatDate,
}: WorkoutSessionHistoryListProps) {
  if (sessions.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const sessionLabel = `${formatDate(new Date(session.completedAt))} — ${session.program.name}`;
        const logMeta = formatWorkoutSessionLogMeta(session.logKind, session.loggedByRole);

        return (
          <Card key={session.id}>
            <CardHeader
              className={
                showDeleteButtons
                  ? "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                  : undefined
              }
            >
              <div className="space-y-1">
                <CardTitle className="text-sm">{sessionLabel}</CardTitle>
                {logMeta && (
                  <p className="text-muted-foreground text-xs">{logMeta}</p>
                )}
              </div>
              {showDeleteButtons && (
                <DeleteWorkoutSessionButton
                  sessionId={session.id}
                  sessionLabel={sessionLabel}
                />
              )}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {session.notes?.trim() && (
                <p className="text-muted-foreground text-xs">{session.notes.trim()}</p>
              )}
              {session.logs.length === 0 ? (
                <p className="text-muted-foreground text-xs">ללא פירוט תרגילים</p>
              ) : (
                session.logs.map((log) => (
                  <ExerciseLogLine
                    key={log.id}
                    exerciseName={log.exercise.name}
                    weightKg={log.weightKg}
                    repsCompleted={log.repsCompleted}
                    setLogs={log.setLogs}
                  />
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
