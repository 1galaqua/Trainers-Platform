"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIsraelDayLabel } from "@/lib/calendar-datetime";
import { MEASUREMENT_FIELDS } from "@/lib/measurements-validation";
import type { MeasurementsLogItem } from "@/server/actions/measurements";

type MeasurementsTableProps = {
  logs: MeasurementsLogItem[];
};

function formatCm(value: number | null | undefined) {
  if (value == null) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function MeasurementsTable({ logs }: MeasurementsTableProps) {
  const sortedLogs = logs
    .slice()
    .sort((a, b) => a.recordedDay.localeCompare(b.recordedDay));

  if (sortedLogs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-base">
          אין עדיין נתוני היקפים. הזן/י מדידה ראשונה.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">טבלת היקפים (ס&quot;מ)</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 p-0 pb-4">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-border border-b bg-muted/40">
                <th className="sticky right-0 z-10 min-w-[9rem] border-border border-l bg-muted/95 px-3 py-2.5 text-start font-medium backdrop-blur-sm">
                  שדה
                </th>
                {sortedLogs.map((log) => (
                  <th
                    key={log.id}
                    className="min-w-[5.5rem] px-3 py-2.5 text-center font-medium whitespace-nowrap"
                  >
                    {formatIsraelDayLabel(log.recordedDay)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEASUREMENT_FIELDS.map((field) => (
                <tr key={field.key} className="border-border border-b last:border-0">
                  <th
                    scope="row"
                    className="sticky right-0 z-10 border-border border-l bg-background px-3 py-2.5 text-start font-normal text-muted-foreground"
                  >
                    {field.label}
                  </th>
                  {sortedLogs.map((log) => (
                    <td key={`${log.id}-${field.key}`} className="px-3 py-2.5 text-center tabular-nums">
                      {formatCm(log[field.key])}
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
