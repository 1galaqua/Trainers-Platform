"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CoachDashboardChartData } from "@/lib/coach-dashboard-stats";

const CHART_GREEN = "#22c55e";
const CHART_RED = "#ef4444";

type CoachTraineeMonthlyChartProps = {
  data: CoachDashboardChartData;
};

export function CoachTraineeMonthlyChart({ data }: CoachTraineeMonthlyChartProps) {
  if (data.months.every((month) => month.active === 0 && month.inactive === 0)) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="space-y-1 text-right">
          <h2 className="font-semibold text-base">סך המתאמנים</h2>
          <p className="text-muted-foreground text-sm">{data.rangeLabel}</p>
        </div>
        <p className="py-12 text-center text-muted-foreground text-sm">
          אין עדיין מתאמנים להצגה — צור/י הזמנה כדי להתחיל
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 space-y-1 text-right">
        <h2 className="font-semibold text-base">סך המתאמנים</h2>
        <p className="text-muted-foreground text-sm">{data.rangeLabel}</p>
      </div>

      <div className="h-72 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.months} margin={{ top: 24, right: 8, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis
              dataKey="monthLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
            />
            <Tooltip
              formatter={(value, name) => [
                value ?? 0,
                name === "active" ? "פעילים" : "לא פעילים",
              ]}
              labelFormatter={(label) => `חודש: ${label}`}
            />
            <Legend
              formatter={(value) => (value === "active" ? "פעילים" : "לא פעילים")}
            />
            <Bar dataKey="active" name="active" fill={CHART_GREEN} radius={[6, 6, 0, 0]} maxBarSize={28}>
              <LabelList dataKey="active" position="top" fontSize={12} fill="currentColor" />
            </Bar>
            <Bar dataKey="inactive" name="inactive" fill={CHART_RED} radius={[6, 6, 0, 0]} maxBarSize={28}>
              <LabelList dataKey="inactive" position="top" fontSize={12} fill="currentColor" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-right text-muted-foreground text-xs">
        סך המתאמנים לפי חודש בשנה האחרונה
      </p>
    </div>
  );
}
