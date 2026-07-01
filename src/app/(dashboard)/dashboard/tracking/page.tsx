import { Suspense } from "react";

import { TrackingGridsLoading } from "@/features/tracking/components/tracking-grids-loading";
import { TrackingHubGridsLoader } from "@/features/tracking/components/tracking-hub-grids-loader";
import { TrackingHubHeader } from "@/features/tracking/components/tracking-hub-header";
import { TrackingWeekNav } from "@/features/tracking/components/tracking-week-nav";
import { siteConfig } from "@/config/site";
import { getTrackingHubShellAction } from "@/server/actions/tracking";

export const metadata = {
  title: `מעקב | ${siteConfig.shortName}`,
};

type PageProps = {
  searchParams: Promise<{ traineeId?: string; week?: string }>;
};

export default async function TrackingPage({ searchParams }: PageProps) {
  const { traineeId, week } = await searchParams;
  const shell = await getTrackingHubShellAction(traineeId, week);

  return (
    <div className="min-w-0 space-y-8">
      <TrackingHubHeader shell={shell} />

      {shell.showGrids && shell.traineeId ? (
        <>
          <TrackingWeekNav
            weekStart={shell.weekStart}
            weekLabel={shell.weekLabel}
            canGoForward={shell.canGoForward}
            traineeId={shell.traineeId}
          />

          <Suspense
            key={`${shell.traineeId}:${shell.weekStart}`}
            fallback={<TrackingGridsLoading />}
          >
            <TrackingHubGridsLoader
              traineeId={shell.traineeId}
              weekStart={shell.weekStart}
              canEdit={shell.canEdit}
              loadReminders={shell.role === "TRAINEE"}
            />
          </Suspense>
        </>
      ) : shell.role === "COACH" ? (
        <p className="py-10 text-center text-muted-foreground text-sm">
          בחר/י מתאמן מהרשימה או חפש/י לפי שם
        </p>
      ) : null}
    </div>
  );
}
