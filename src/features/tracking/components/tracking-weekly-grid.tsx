"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrackingGridCell } from "@/features/tracking/components/tracking-grid-cell";
import type { TrackingWeekGrid } from "@/lib/tracking-week-data";

type TrackingWeeklyGridProps = {
  title: string;
  grid: TrackingWeekGrid;
  traineeId?: string | null;
  canEdit?: boolean;
};

export function TrackingWeeklyGrid({
  title,
  grid,
  traineeId,
  canEdit = false,
}: TrackingWeeklyGridProps) {
  const showInputs = canEdit && Boolean(traineeId);

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 p-0 pb-4">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-max text-sm" dir="rtl">
            <thead>
              <tr className="border-border border-b bg-muted/40">
                <th className="sticky right-0 z-10 min-w-[8rem] border-border border-l bg-muted/95 px-3 py-2.5 text-start font-medium backdrop-blur-sm">
                  שדה
                </th>
                <th className="min-w-[5.5rem] px-2 py-2.5 text-center font-medium whitespace-nowrap">
                  ממוצע שבועי
                </th>
                {grid.days.map((day) => (
                  <th
                    key={day.date}
                    className={cn(
                      "min-w-[5.5rem] px-2 py-2.5 text-center font-medium whitespace-nowrap",
                      day.isToday && "bg-primary/5",
                    )}
                  >
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.rows.map((row) => (
                <tr key={row.id} className="border-border border-b last:border-0">
                  <th
                    scope="row"
                    className="sticky right-0 z-10 border-border border-l bg-background px-3 py-2 text-start font-normal text-muted-foreground"
                  >
                    {row.label}
                  </th>
                  <td className="bg-muted/20 px-2 py-2 text-center font-medium tabular-nums">
                    {row.weeklyAverage.display}
                  </td>
                  {row.cells.map((cell) => (
                    <td key={`${row.id}-${cell.date}`} className="p-1">
                      {showInputs && traineeId ? (
                        <TrackingGridCell traineeId={traineeId} cell={cell} />
                      ) : (
                        <span
                          className={cn(
                            "flex h-12 w-full min-w-[5rem] items-center justify-center rounded-md border px-1 text-center text-xs tabular-nums",
                            cell.raw != null
                              ? "border-green-500/30 bg-green-500/10"
                              : "border-border bg-muted/30 text-muted-foreground",
                            !cell.editable && "opacity-60",
                          )}
                        >
                          {cell.display}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
