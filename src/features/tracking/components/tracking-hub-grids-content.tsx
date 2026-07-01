"use client";

import { useCallback, useEffect, useState } from "react";

import { TrackingRemindersSection } from "@/features/tracking/components/tracking-reminders-section";
import { TrackingWeeklyGrid } from "@/features/tracking/components/tracking-weekly-grid";
import {
  patchTrackingWeekGridCell,
  type TrackingWeekCell,
} from "@/lib/tracking-week-data";
import type { TrackingHubGridsData } from "@/server/actions/tracking";

type TrackingHubGridsContentProps = TrackingHubGridsData & {
  traineeId: string;
  canEdit: boolean;
};

export function TrackingHubGridsContent({
  traineeId,
  canEdit,
  dailyGrid: initialDailyGrid,
  measurementsGrid: initialMeasurementsGrid,
  reminders,
}: TrackingHubGridsContentProps) {
  const [dailyGrid, setDailyGrid] = useState(initialDailyGrid);
  const [measurementsGrid, setMeasurementsGrid] = useState(initialMeasurementsGrid);

  useEffect(() => {
    setDailyGrid(initialDailyGrid);
    setMeasurementsGrid(initialMeasurementsGrid);
  }, [initialDailyGrid, initialMeasurementsGrid]);

  const handleDailyCellSaved = useCallback(
    (rowId: string, date: string, updated: TrackingWeekCell) => {
      setDailyGrid((current) =>
        patchTrackingWeekGridCell(current, rowId, date, {
          raw: updated.raw,
          display: updated.display,
          sleepStart: updated.sleepStart,
          sleepEnd: updated.sleepEnd,
        }),
      );
    },
    [],
  );

  const handleMeasurementsCellSaved = useCallback(
    (rowId: string, date: string, updated: TrackingWeekCell) => {
      setMeasurementsGrid((current) =>
        patchTrackingWeekGridCell(current, rowId, date, {
          raw: updated.raw,
          display: updated.display,
        }),
      );
    },
    [],
  );

  return (
    <>
      <TrackingWeeklyGrid
        title="מעקב יומי"
        grid={dailyGrid}
        traineeId={traineeId}
        canEdit={canEdit}
        onCellSaved={handleDailyCellSaved}
      />

      <TrackingWeeklyGrid
        title="היקפים (ס&quot;מ)"
        grid={measurementsGrid}
        traineeId={traineeId}
        canEdit={canEdit}
        onCellSaved={handleMeasurementsCellSaved}
      />

      {reminders && <TrackingRemindersSection reminders={reminders} />}
    </>
  );
}
