"use client";

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

type ProgressChartProps = {
  data: Array<{ date: string; weight: number; volume: number }>;
  mode: "weight" | "volume";
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "numeric", month: "short" });
}

export function ProgressChart({ data, mode }: ProgressChartProps) {
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
  const yLabel = mode === "weight" ? "משקל ממוצע (ק״ג)" : "נפח אימון";

  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="progressAreaGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_GREEN_BRIGHT} stopOpacity={0.5} />
              <stop offset="100%" stopColor={CHART_GREEN_BRIGHT} stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`${value}`, yLabel]}
            labelFormatter={(label) => `תאריך: ${label}`}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={CHART_GREEN}
            strokeWidth={2}
            fill="url(#progressAreaGreen)"
            dot={{
              r: 5,
              fill: CHART_GREEN_BRIGHT,
              stroke: CHART_GREEN,
              strokeWidth: 2,
            }}
            activeDot={{
              r: 7,
              fill: CHART_GREEN_BRIGHT,
              stroke: CHART_GREEN,
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
