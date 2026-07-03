"use client";

import { cn } from "@/lib/utils";
import { programTypeLabels } from "@/lib/program-labels";
import type { ProgramType } from "@/lib/prisma-client";

export type TraineeProgramPickerItem = {
  id: string;
  name: string;
  type: ProgramType;
  exerciseCount: number;
  coachName: string | null;
};

type TraineeProgramPickerProps = {
  programs: TraineeProgramPickerItem[];
  selectedId: string;
  onSelect: (programId: string) => void;
  label?: string;
};

export function TraineeProgramPicker({
  programs,
  selectedId,
  onSelect,
  label,
}: TraineeProgramPickerProps) {
  const heading =
    label ?? (programs.length === 1 ? "התוכנית שלך" : "בחר תוכנית לדיווח");

  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">{heading}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {programs.map((program) => {
          const isSelected = program.id === selectedId;

          return (
            <button
              key={program.id}
              type="button"
              onClick={() => onSelect(program.id)}
              className={cn(
                "rounded-lg border p-4 text-start transition-colors",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40 hover:bg-muted/30",
              )}
            >
              <p className="font-medium text-sm">{program.name}</p>
              <p className="mt-1 text-muted-foreground text-sm">
                {programTypeLabels[program.type]}
                {program.coachName ? ` · ${program.coachName}` : ""}
              </p>
              <p className="mt-2 text-muted-foreground text-sm">
                {program.exerciseCount} תרגילים
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
