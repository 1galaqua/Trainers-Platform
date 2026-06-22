"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { ProgressChart } from "@/features/progress/components/progress-chart";
import { BODY_WEIGHT_PROGRESS_ID } from "@/lib/body-weight-validation";

export type ProgressChartPoint = {
  date: string;
  weight: number;
  volume: number;
};

export type ProgressSeries = {
  id: string;
  name: string;
  kind: "exercise" | "body-weight";
  data: ProgressChartPoint[];
};

type LegacyExerciseOption = {
  id: string;
  name: string;
  data: ProgressChartPoint[];
};

type ProgressPageClientProps = {
  series?: ProgressSeries[];
  exercises?: LegacyExerciseOption[];
  bodyWeightData?: ProgressChartPoint[];
  readOnly?: boolean;
  defaultSelectedId?: string;
  emptyMessage?: string;
};

export function buildProgressSeries(
  exercises: LegacyExerciseOption[],
  bodyWeightData: ProgressChartPoint[] = [],
): ProgressSeries[] {
  const series: ProgressSeries[] = [];

  if (bodyWeightData.length > 0) {
    series.push({
      id: BODY_WEIGHT_PROGRESS_ID,
      name: "משקל גוף",
      kind: "body-weight",
      data: bodyWeightData,
    });
  }

  for (const exercise of exercises) {
    if (exercise.data.length === 0) continue;
    series.push({
      id: exercise.id,
      name: exercise.name,
      kind: "exercise",
      data: exercise.data,
    });
  }

  return series;
}

export function ProgressPageClient({
  series: seriesProp,
  exercises = [],
  bodyWeightData = [],
  readOnly = false,
  defaultSelectedId,
  emptyMessage,
}: ProgressPageClientProps) {
  const series =
    seriesProp ??
    buildProgressSeries(
      exercises,
      bodyWeightData,
    );

  const [selectedId, setSelectedId] = useState(
    defaultSelectedId && series.some((item) => item.id === defaultSelectedId)
      ? defaultSelectedId
      : (series[0]?.id ?? ""),
  );
  const [mode, setMode] = useState<"weight" | "volume">("weight");

  const selected = series.find((item) => item.id === selectedId) ?? series[0];
  const isBodyWeight = selected?.kind === "body-weight";

  if (series.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          {emptyMessage ??
            (readOnly
              ? "אין עדיין נתוני התקדמות להצגה."
              : "אין עדיין נתוני התקדמות. דווח על אימון או עדכן משקל גוף כדי להתחיל.")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="w-full min-w-0 sm:max-w-xs"
        >
          {series.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        {!isBodyWeight && (
          <Select
            value={mode}
            onChange={(event) => setMode(event.target.value as "weight" | "volume")}
            className="w-full min-w-0 sm:max-w-xs"
          >
            <option value="weight">גרף משקל</option>
            <option value="volume">גרף נפח (משקל × חזרות × סטים)</option>
          </Select>
        )}
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">{selected?.name}</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <ProgressChart
            data={selected?.data ?? []}
            mode={isBodyWeight ? "weight" : mode}
            weightLabel={isBodyWeight ? "משקל גוף (ק״ג)" : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
