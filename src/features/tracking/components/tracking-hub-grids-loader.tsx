import { TrackingHubGridsContent } from "@/features/tracking/components/tracking-hub-grids-content";
import { getTrackingHubGridsAction } from "@/server/actions/tracking";

type TrackingHubGridsLoaderProps = {
  traineeId: string;
  weekStart: string;
  canEdit: boolean;
  loadReminders: boolean;
};

export async function TrackingHubGridsLoader({
  traineeId,
  weekStart,
  canEdit,
  loadReminders,
}: TrackingHubGridsLoaderProps) {
  const grids = await getTrackingHubGridsAction(
    traineeId,
    weekStart,
    canEdit,
    loadReminders,
  );

  return (
    <div className="space-y-8">
      <TrackingHubGridsContent
        traineeId={traineeId}
        canEdit={canEdit}
        dailyGrid={grids.dailyGrid}
        measurementsGrid={grids.measurementsGrid}
        reminders={grids.reminders}
      />
    </div>
  );
}
