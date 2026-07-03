import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CoachTrackingTraineePicker } from "@/features/tracking/components/coach-tracking-trainee-picker";
import type { TrackingHubShell } from "@/server/actions/tracking";

type TrackingHubHeaderProps = {
  shell: TrackingHubShell;
};

export function TrackingHubHeader({ shell }: TrackingHubHeaderProps) {
  const isCoach = shell.role === "COACH";
  const hasTraineeSelected = Boolean(shell.traineeId);

  return (
    <>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-semibold text-2xl tracking-tight">מעקב</h1>
          <p className="mt-1 text-muted-foreground text-base">
            {isCoach
              ? hasTraineeSelected
                ? `מעקב שבועי — ${shell.traineeName}`
                : "בחר/י מתאמן לצפייה ועריכה"
              : "הקלד/י ישירות בקובייה לעדכון ערך"}
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full shrink-0 sm:w-auto"
          render={<Link href="/dashboard" />}
        >
          חזרה ללוח בקרה
        </Button>
      </div>

      {isCoach && (
        <CoachTrackingTraineePicker
          trainees={shell.trainees}
          selectedTraineeId={shell.traineeId}
        />
      )}
    </>
  );
}
