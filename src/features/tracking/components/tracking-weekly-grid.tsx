"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrackingGridCell } from "@/features/tracking/components/tracking-grid-cell";
import type { TrackingWeekCell, TrackingWeekGrid } from "@/lib/tracking-week-data";

type TrackingWeeklyGridProps = {
  title: string;
  grid: TrackingWeekGrid;
  traineeId?: string | null;
  canEdit?: boolean;
};

const DATA_COL_WIDTH = "min-w-[5.5rem]";
const LABEL_COL_WIDTH = "w-[8rem]";

function GridCellContent({
  cell,
  showInputs,
  traineeId,
}: {
  cell: TrackingWeekCell;
  showInputs: boolean;
  traineeId: string | null | undefined;
}) {
  if (showInputs && traineeId) {
    return <TrackingGridCell traineeId={traineeId} cell={cell} />;
  }

  return (
    <span
      className={cn(
        "flex h-12 w-full min-w-[5rem] items-center justify-center rounded-md border px-1 text-center text-xs tabular-nums",
        cell.raw != null ? "tracking-grid-cell-filled" : "tracking-grid-cell-empty",
        !cell.editable && "opacity-60",
      )}
    >
      {cell.display}
    </span>
  );
}

export function TrackingWeeklyGrid({
  title,
  grid,
  traineeId,
  canEdit = false,
}: TrackingWeeklyGridProps) {
  const showInputs = canEdit && Boolean(traineeId);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 p-0 pb-4">
        <div className="flex min-w-0 text-sm" dir="rtl">
          <div
            className={cn(
              "flex shrink-0 flex-col border-border border-l bg-background",
              LABEL_COL_WIDTH,
            )}
          >
            <div className="flex min-h-11 items-center border-border border-b bg-muted px-3 font-medium">
              שדה
            </div>
            {grid.rows.map((row) => (
              <div
                key={row.id}
                className="flex min-h-14 items-center border-border border-b px-3 text-start font-normal text-muted-foreground last:border-0"
              >
                {row.label}
              </div>
            ))}
          </div>

          <div className="tracking-grid-scroll min-w-0 flex-1">
            <div className="min-w-max">
              <div className="flex min-h-11 border-border border-b bg-muted">
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center bg-muted px-2 text-center font-medium whitespace-nowrap",
                    DATA_COL_WIDTH,
                  )}
                >
                  ממוצע שבועי
                </div>
                {grid.days.map((day) => (
                  <div
                    key={day.date}
                    className={cn(
                      "flex shrink-0 items-center justify-center bg-muted px-2 text-center font-medium whitespace-nowrap",
                      DATA_COL_WIDTH,
                      day.isToday && "bg-accent",
                    )}
                  >
                    {day.label}
                  </div>
                ))}
              </div>

              {grid.rows.map((row) => (
                <div
                  key={row.id}
                  className="flex min-h-14 border-border border-b last:border-0"
                >
                  <div
                    className={cn(
                      "flex shrink-0 items-center justify-center bg-muted px-2 text-center font-medium tabular-nums",
                      DATA_COL_WIDTH,
                    )}
                  >
                    {row.weeklyAverage.display}
                  </div>
                  {row.cells.map((cell) => (
                    <div
                      key={`${row.id}-${cell.date}`}
                      className={cn("flex shrink-0 items-center p-1", DATA_COL_WIDTH)}
                    >
                      <GridCellContent
                        cell={cell}
                        showInputs={showInputs}
                        traineeId={traineeId}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
