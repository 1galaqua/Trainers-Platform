"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ProgramExercisesBySection,
  type ProgramExerciseView,
} from "@/features/programs/components/program-exercises-by-section";
import {
  TraineeProgramPicker,
  type TraineeProgramPickerItem,
} from "@/features/workouts/components/trainee-program-picker";
import { programTypeLabels } from "@/lib/program-labels";
import type { ProgramType } from "@/lib/prisma-client";

export type MyProgramSectionItem = {
  id: string;
  name: string;
  sortOrder: number;
  exercises: ProgramExerciseView[];
};

export type MyProgramItem = {
  id: string;
  name: string;
  type: ProgramType;
  description: string | null;
  coachName: string | null;
  sections: MyProgramSectionItem[];
  exercises: ProgramExerciseView[];
};

type MyProgramsPageContentProps = {
  programs: MyProgramItem[];
};

export function MyProgramsPageContent({ programs }: MyProgramsPageContentProps) {
  const [selectedId, setSelectedId] = useState(programs[0]?.id ?? "");

  const pickerItems: TraineeProgramPickerItem[] = programs.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    exerciseCount: p.exercises.length,
    coachName: p.coachName,
  }));

  const program = programs.find((p) => p.id === selectedId) ?? programs[0];

  if (!program) return null;

  return (
    <div className="space-y-6">
      <TraineeProgramPicker
        programs={pickerItems}
        selectedId={program.id}
        onSelect={setSelectedId}
        label={programs.length === 1 ? "התוכנית שלך" : "בחר תוכנית לצפייה"}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-medium text-lg">{program.name}</h2>
          <Badge variant="secondary">{programTypeLabels[program.type]}</Badge>
        </div>
        <Button
          render={<Link href={`/dashboard/workouts/log?program=${program.id}`} />}
        >
          דיווח אימון לתוכנית זו
        </Button>
      </div>

      <p className="text-muted-foreground text-base">מאמן/ית: {program.coachName ?? "—"}</p>
      {program.description && (
        <p className="text-muted-foreground text-base">{program.description}</p>
      )}

      <ProgramExercisesBySection
        className="space-y-6"
        sections={program.sections.map((section) => ({
          id: section.id,
          name: section.name,
          sortOrder: section.sortOrder,
          exercises: section.exercises.map((exercise, index) => ({
            ...exercise,
            sortOrder: index,
            sectionId: section.id,
          })),
        }))}
        exercises={program.exercises.map((exercise, index) => ({
          ...exercise,
          sortOrder: index,
          sectionId: null,
        }))}
      />

      {programs.length > 1 && (
        <div className="space-y-3 border-t border-border pt-6">
          <h3 className="font-medium text-sm text-muted-foreground">כל התוכניות שלך</h3>
          <ul className="space-y-2">
            {programs.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-start text-sm transition-colors hover:bg-muted/40"
                >
                  <span>
                    {p.name} · {p.exercises.length} תרגילים
                  </span>
                  <span className="text-primary text-xs">צפייה</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
