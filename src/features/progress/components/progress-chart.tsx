"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_GREEN = "#22c55e";
const CHART_GREEN_BRIGHT = "#4ade80";
const CHART_POINT_MIN_WIDTH_PX = 44;

type ProgressChartProps = {
  data: Array<{ date: string; weight: number; volume: number }>;
  mode: "weight" | "volume";
  weightLabel?: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "short" });
}

export function ProgressChart({ data, mode, weightLabel }: ProgressChartProps) {
  const gradientId = useId().replace(/:/g, "");

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground text-sm">
        אין עדיין נתונים להצגה — דווח על אימון כדי לראות התקדמות
      </p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  const yKey = mode === "weight" ? "weight" : "volume";
  const yLabel = mode === "weight" ? (weightLabel ?? "משקל ממוצע (ק״ג)") : "נפח אימון";
  const chartMinWidth = Math.max(280, chartData.length * CHART_POINT_MIN_WIDTH_PX);

  return (
    <div className="min-w-0 w-full overflow-x-auto overscroll-x-contain" dir="ltr">
      <div className="h-64 w-full" style={{ minWidth: chartMinWidth }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={chartMinWidth}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_GREEN_BRIGHT} stopOpacity={0.5} />
                <stop offset="100%" stopColor={CHART_GREEN_BRIGHT} stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis tick={{ fontSize: 11 }} width={40} />
            <Tooltip
              formatter={(value) => [`${value}`, yLabel]}
              labelFormatter={(label) => `תאריך: ${label}`}
            />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={CHART_GREEN}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={{
                r: 4,
                fill: CHART_GREEN_BRIGHT,
                stroke: CHART_GREEN,
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: CHART_GREEN_BRIGHT,
                stroke: CHART_GREEN,
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export { CHART_POINT_MIN_WIDTH_PX };
