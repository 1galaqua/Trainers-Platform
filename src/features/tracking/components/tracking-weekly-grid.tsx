"use client";

import { Fragment } from "react";
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

const AVG_COL_WIDTH = "7rem";
const DAY_COL_WIDTH = "5.5rem";
const GRID_LINE = "box-border border-border border-b border-l";
const LABEL_COL_WIDTH = "w-[8rem]";
const LABEL_CELL_CLASS = cn(LABEL_COL_WIDTH, GRID_LINE, "shrink-0");
const HEADER_ROW_HEIGHT = "h-14";
const DATA_ROW_HEIGHT = "h-14";

function dataGridTemplateColumns(dayCount: number) {
  return `${AVG_COL_WIDTH} repeat(${dayCount}, ${DAY_COL_WIDTH})`;
}

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
        "flex h-12 w-full min-w-0 items-center justify-center rounded-md border px-1 text-center text-xs tabular-nums",
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
  const gridCellClass = cn(GRID_LINE, "min-w-0");

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 p-0 pb-4">
        <div className="flex min-w-0 text-sm" dir="rtl">
          <div className={cn("flex shrink-0 flex-col bg-background", LABEL_COL_WIDTH)}>
            <div
              className={cn(
                "flex items-center bg-muted px-3 font-medium",
                LABEL_CELL_CLASS,
                HEADER_ROW_HEIGHT,
              )}
            >
              שדה
            </div>
            {grid.rows.map((row) => (
              <div
                key={row.id}
                className={cn(
                  "flex items-center px-3 py-1 text-start font-normal text-muted-foreground",
                  LABEL_CELL_CLASS,
                  DATA_ROW_HEIGHT,
                )}
              >
                <span className="line-clamp-2 min-w-0 leading-tight">{row.label}</span>
              </div>
            ))}
          </div>

          <div className="tracking-grid-scroll min-w-0 flex-1">
            <div
              className="grid min-w-max"
              style={{ gridTemplateColumns: dataGridTemplateColumns(grid.days.length) }}
            >
              <div
                className={cn(
                  "flex items-center justify-center bg-muted px-1 text-center text-xs leading-tight font-medium",
                  gridCellClass,
                  HEADER_ROW_HEIGHT,
                )}
              >
                ממוצע שבועי
              </div>
              {grid.days.map((day, index) => (
                <div
                  key={day.date}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 bg-muted px-1 py-1 text-center leading-tight",
                    gridCellClass,
                    HEADER_ROW_HEIGHT,
                    day.isToday && "bg-accent",
                    index === grid.days.length - 1 && "border-r",
                  )}
                >
                  <span className="text-xs font-medium whitespace-nowrap">{day.dayName}</span>
                  <span
                    className={cn(
                      "text-[10px] tabular-nums whitespace-nowrap",
                      day.isToday ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {day.dateLabel}
                  </span>
                </div>
              ))}

              {grid.rows.map((row) => (
                <Fragment key={row.id}>
                  <div
                    className={cn(
                      "flex items-center justify-center bg-muted px-2 text-center font-medium tabular-nums",
                      gridCellClass,
                      DATA_ROW_HEIGHT,
                    )}
                  >
                    {row.weeklyAverage.display}
                  </div>
                  {row.cells.map((cell, index) => (
                    <div
                      key={`${row.id}-${cell.date}`}
                      className={cn(
                        "flex items-center p-1",
                        gridCellClass,
                        DATA_ROW_HEIGHT,
                        index === row.cells.length - 1 && "border-r",
                      )}
                    >
                      <GridCellContent
                        cell={cell}
                        showInputs={showInputs}
                        traineeId={traineeId}
                      />
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
