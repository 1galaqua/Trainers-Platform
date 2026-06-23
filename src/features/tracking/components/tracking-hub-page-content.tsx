"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CoachTrackingTraineePicker } from "@/features/tracking/components/coach-tracking-trainee-picker";
import { TrackingRemindersSection } from "@/features/tracking/components/tracking-reminders-section";
import { TrackingWeekNav } from "@/features/tracking/components/tracking-week-nav";
import { TrackingWeeklyGrid } from "@/features/tracking/components/tracking-weekly-grid";
import type { TrackingHubData } from "@/server/actions/tracking";

type TrackingHubPageContentProps = {
  data: TrackingHubData;
};

export function TrackingHubPageContent({ data }: TrackingHubPageContentProps) {
  const isCoach = data.role === "COACH";
  const hasTraineeSelected = Boolean(data.traineeId);

  return (
    <div className="min-w-0 space-y-8">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-semibold text-2xl tracking-tight">מעקב</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {isCoach
              ? hasTraineeSelected
                ? `מעקב שבועי — ${data.traineeName}`
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
        <CoachTrackingTraineePicker trainees={data.trainees} selectedTraineeId={data.traineeId} />
      )}

      {isCoach && !hasTraineeSelected ? (
        <p className="py-10 text-center text-muted-foreground text-sm">
          בחר/י מתאמן מהרשימה או חפש/י לפי שם
        </p>
      ) : (
        <>
          <TrackingWeekNav
            weekStart={data.weekStart}
            weekLabel={data.weekLabel}
            canGoForward={data.canGoForward}
            traineeId={data.traineeId}
          />

          <TrackingWeeklyGrid
            title="מעקב יומי"
            grid={data.dailyGrid}
            traineeId={data.traineeId}
            canEdit={data.canEdit}
          />

          <TrackingWeeklyGrid
            title="היקפים (ס&quot;מ)"
            grid={data.measurementsGrid}
            traineeId={data.traineeId}
            canEdit={data.canEdit}
          />

          {data.reminders && <TrackingRemindersSection reminders={data.reminders} />}
        </>
      )}
    </div>
  );
}
