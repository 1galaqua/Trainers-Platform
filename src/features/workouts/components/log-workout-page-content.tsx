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
import type { ProgramType } from "@/lib/prisma-client";

type ProgramOption = TraineeProgramPickerItem & {
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    restSeconds: number;
  }>;
};

type LogWorkoutPageContentProps = {
  programs: ProgramOption[];
  initialProgramId?: string;
  logBasePath?: string;
  emptyBackHref?: string;
  emptyBackLabel?: string;
  coachTraineeId?: string;
  redirectTo?: string;
  quotaInfo?: WorkoutQuotaInfo | null;
};

function resolveSelectedId(programs: ProgramOption[], preferredId?: string) {
  if (preferredId && programs.some((p) => p.id === preferredId)) return preferredId;
  return programs[0]?.id ?? "";
}

export function LogWorkoutPageContent({
  programs,
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
    resolveSelectedId(programs, initialProgramId),
  );

  const programFromUrl = searchParams.get("program") ?? "";
  const programIdsKey = programs.map((program) => program.id).join(",");
  const programsRef = useRef(programs);
  programsRef.current = programs;

  useEffect(() => {
    setSelectedId(
      resolveSelectedId(programsRef.current, programFromUrl || initialProgramId),
    );
  }, [programFromUrl, initialProgramId, programIdsKey]);

  const selectProgram = useCallback(
    (programId: string) => {
      setSelectedId(programId);
      router.replace(`${logBasePath}?program=${programId}`, { scroll: false });
    },
    [router, logBasePath],
  );

  const program = programs.find((p) => p.id === selectedId) ?? programs[0];

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          אין תוכניות פעילות.{" "}
          <Link href={emptyBackHref} className="text-primary underline">
            {emptyBackLabel}
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!program) return null;

  const pickerPrograms: TraineeProgramPickerItem[] = programs.map(
    ({ id, name, type, exerciseCount, coachName }) => ({
      id,
      name,
      type,
      exerciseCount,
      coachName,
    }),
  );

  return (
    <div className="space-y-6">
      <TraineeProgramPicker
        programs={pickerPrograms}
        selectedId={program.id}
        onSelect={selectProgram}
      />

      <div className="max-w-md space-y-1 sm:hidden">
        <Label htmlFor="log-program-mobile">או בחר מהרשימה</Label>
        <Select
          id="log-program-mobile"
          value={program.id}
          onChange={(e) => selectProgram(e.target.value)}
        >
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({programTypeLabels[p.type]})
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">עדכון ביצוע — {program.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <LogWorkoutForm
            key={program.id}
            programId={program.id}
            exercises={program.exercises}
            traineeId={coachTraineeId}
            submitAction={coachTraineeId ? logCoachTraineeWorkoutAction : undefined}
            redirectTo={redirectTo}
            quotaInfo={quotaInfo}
          />
        </CardContent>
      </Card>
    </div>
  );
}
