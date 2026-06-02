"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { ProgressChart } from "@/features/progress/components/progress-chart";

type ExerciseOption = {
  id: string;
  name: string;
  data: Array<{ date: string; weight: number; volume: number }>;
};

type ProgressPageClientProps = {
  exercises: ExerciseOption[];
};

export function ProgressPageClient({ exercises }: ProgressPageClientProps) {
  const [selectedId, setSelectedId] = useState(exercises[0]?.id ?? "");
  const [mode, setMode] = useState<"weight" | "volume">("weight");

  const selected = exercises.find((ex) => ex.id === selectedId) ?? exercises[0];

  if (exercises.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          אין עדיין נתוני התקדמות. דווח על אימון כדי להתחיל.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="max-w-xs"
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </Select>
        <Select
          value={mode}
          onChange={(e) => setMode(e.target.value as "weight" | "volume")}
          className="max-w-xs"
        >
          <option value="weight">גרף משקל</option>
          <option value="volume">גרף נפח (משקל × חזרות × סטים)</option>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{selected?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressChart data={selected?.data ?? []} mode={mode} />
        </CardContent>
      </Card>
    </div>
  );
}
