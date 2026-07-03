"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LogWorkoutForm, type WorkoutQuotaInfo } from "@/features/workouts/components/log-workout-form";
import { logCoachTraineeWorkoutAction } from "@/server/actions/workouts";
import {
  TraineeProgramPicker,
  type TraineeProgramPickerItem,
} from "@/features/workouts/components/trainee-program-picker";
import { programTypeLabels } from "@/lib/program-labels";
import type { LogWorkoutProgramSummary } from "@/lib/log-workout-page-data";
import type { LogWorkoutSection } from "@/lib/program-sections";

type ActiveProgram = {
  id: string;
  name: string;
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    restSeconds: number;
  }>;
  sections: LogWorkoutSection[];
};

type LogWorkoutPageContentProps = {
  programSummaries: LogWorkoutProgramSummary[];
  activeProgram: ActiveProgram | null;
  initialProgramId?: string;
  logBasePath?: string;
  emptyBackHref?: string;
  emptyBackLabel?: string;
  coachTraineeId?: string;
  redirectTo?: string;
  quotaInfo?: WorkoutQuotaInfo | null;
};

function resolveSelectedId(summaries: LogWorkoutProgramSummary[], preferredId?: string) {
  if (preferredId && summaries.some((summary) => summary.id === preferredId)) {
    return preferredId;
  }
  return summaries[0]?.id ?? "";
}

export function LogWorkoutPageContent({
  programSummaries,
  activeProgram,
  initialProgramId,
  logBasePath = "/dashboard/workouts/log",
  emptyBackHref = "/dashboard/my-program",
  emptyBackLabel = "חזרה לתוכניות",
  coachTraineeId,
  redirectTo,
  quotaInfo = null,
}: LogWorkoutPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState(() =>
    resolveSelectedId(programSummaries, initialProgramId),
  );

  const programFromUrl = searchParams.get("program") ?? "";
  const summaryIdsKey = programSummaries.map((summary) => summary.id).join(",");
  const summariesRef = useRef(programSummaries);
  summariesRef.current = programSummaries;

  useEffect(() => {
    setSelectedId(resolveSelectedId(summariesRef.current, programFromUrl || initialProgramId));
  }, [programFromUrl, initialProgramId, summaryIdsKey]);

  const selectProgram = useCallback(
    (programId: string) => {
      setSelectedId(programId);
      router.replace(`${logBasePath}?program=${programId}`, { scroll: false });
    },
    [router, logBasePath],
  );

  const pickerPrograms: TraineeProgramPickerItem[] = programSummaries.map(
    ({ id, name, type, exerciseCount, coachName }) => ({
      id,
      name,
      type,
      exerciseCount,
      coachName,
    }),
  );

  const selectedSummary =
    programSummaries.find((summary) => summary.id === selectedId) ?? programSummaries[0];
  const program =
    activeProgram && activeProgram.id === selectedId ? activeProgram : null;

  if (programSummaries.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-base">
          אין תוכניות פעילות.{" "}
          <Link href={emptyBackHref} className="text-primary underline">
            {emptyBackLabel}
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!selectedSummary) return null;

  return (
    <div className="space-y-6">
      <TraineeProgramPicker
        programs={pickerPrograms}
        selectedId={selectedSummary.id}
        onSelect={selectProgram}
      />

      <div className="max-w-md space-y-1 sm:hidden">
        <Label htmlFor="log-program-mobile">או בחר מהרשימה</Label>
        <Select
          id="log-program-mobile"
          value={selectedSummary.id}
          onChange={(e) => selectProgram(e.target.value)}
        >
          {programSummaries.map((summary) => (
            <option key={summary.id} value={summary.id}>
              {summary.name} ({programTypeLabels[summary.type]})
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">עדכון ביצוע — {selectedSummary.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {program ? (
            <LogWorkoutForm
              key={program.id}
              programId={program.id}
              exercises={program.exercises}
              sections={program.sections}
              traineeId={coachTraineeId}
              submitAction={coachTraineeId ? logCoachTraineeWorkoutAction : undefined}
              redirectTo={redirectTo}
              quotaInfo={quotaInfo}
            />
          ) : (
            <p className="text-muted-foreground text-base">טוען תוכנית...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
