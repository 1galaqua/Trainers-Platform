"use client";

import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { programTypeLabels } from "@/lib/program-labels";
import type { ProgramType } from "@/lib/prisma-client";
import { getCoachTraineeProgramsForCalendarAction } from "@/server/actions/calendar";

type ProgramOption = {
  id: string;
  name: string;
  type: ProgramType;
};

type PersonalWorkoutProgramSelectProps = {
  traineeId: string | null;
  selectedProgramId: string | null;
  onSelect: (programId: string | null) => void;
  disabled?: boolean;
};

export function PersonalWorkoutProgramSelect({
  traineeId,
  selectedProgramId,
  onSelect,
  disabled = false,
}: PersonalWorkoutProgramSelectProps) {
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!traineeId) {
      setPrograms([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void getCoachTraineeProgramsForCalendarAction(traineeId).then((result) => {
      if (cancelled) return;
      setPrograms(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [traineeId]);

  if (!traineeId) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="programId">תוכנית אימון (אופציונלי)</Label>
      <Select
        id="programId"
        name="programId"
        value={selectedProgramId ?? ""}
        onChange={(event) => onSelect(event.target.value || null)}
        disabled={disabled || loading}
      >
        <option value="">ללא תוכנית ספציפית</option>
        {programs.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name} ({programTypeLabels[program.type]})
          </option>
        ))}
      </Select>
      {loading && (
        <p className="text-muted-foreground text-xs">טוען תוכניות...</p>
      )}
      {!loading && programs.length === 0 && (
        <p className="text-muted-foreground text-xs">אין תוכניות פעילות למתאמן זה</p>
      )}
    </div>
  );
}
