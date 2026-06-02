"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  const yLabel = mode === "weight" ? "משקל (ק״ג)" : "נפח אימון";

  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`${value}`, yLabel]}
            labelFormatter={(label) => `תאריך: ${label}`}
          />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
