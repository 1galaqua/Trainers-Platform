"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  buildWeeklyWorkoutChartData,
  canNavigateToWeek,
  TRAINEE_WEEKLY_CHART_MAX_DAYS,
} from "@/lib/trainee-weekly-workout-stats";

const CHART_GREEN = "#22c55e";

type TraineeWeeklyWorkoutChartProps = {
  sessionDates: string[];
};

export function TraineeWeeklyWorkoutChart({ sessionDates }: TraineeWeeklyWorkoutChartProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const parsedDates = useMemo(
    () => sessionDates.map((iso) => new Date(iso)),
    [sessionDates],
  );

  const chartData = useMemo(
    () => buildWeeklyWorkoutChartData(parsedDates, weekOffset),
    [parsedDates, weekOffset],
  );

  const canGoBack = canNavigateToWeek(weekOffset);
  const canGoForward = weekOffset > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 text-right">
          <h2 className="font-semibold text-base">דיווחי אימון שבועיים</h2>
          <p className="text-muted-foreground text-sm">{chartData.weekLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!canGoBack}
            onClick={() => setWeekOffset((offset) => offset + 1)}
            aria-label="שבוע קודם"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!canGoForward}
            onClick={() => setWeekOffset((offset) => Math.max(0, offset - 1))}
            aria-label="שבוע הבא"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      {chartData.totalWorkouts === 0 ? (
        <p className="py-12 text-center text-muted-foreground text-sm">
          אין דיווחי אימון בשבוע זה
        </p>
      ) : (
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData.days}
              margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="dayLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "currentColor" }}
              />
              <Tooltip
                formatter={(value) => [value ?? 0, "אימונים"]}
                labelFormatter={(label) => `יום: ${label}`}
              />
              <Bar dataKey="count" fill={CHART_GREEN} radius={[6, 6, 0, 0]} maxBarSize={36}>
                <LabelList dataKey="count" position="top" fontSize={12} fill="currentColor" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-4 text-right text-muted-foreground text-xs">
        ניתן לצפות עד {TRAINEE_WEEKLY_CHART_MAX_DAYS} יום אחורה · {chartData.totalWorkouts} אימונים בשבוע זה
      </p>
    </div>
  );
}
