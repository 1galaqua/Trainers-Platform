"use client";

import { useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TraineeCard } from "@/features/trainees/components/trainee-card";
import { matchesTraineeFilter, type TraineeFilter } from "@/lib/trainee-status";
import type { CoachTraineeListItem } from "@/server/actions/trainees";

type TraineesListProps = {
  trainees: CoachTraineeListItem[];
};

const filterOptions: { value: TraineeFilter; label: string }[] = [
  { value: "all", label: "כל המתאמנים" },
  { value: "active", label: "פעילים (ירוק)" },
  { value: "inactive", label: "לא פעילים (אדום)" },
  { value: "in_coaching_period", label: "בתקופת ליווי" },
  { value: "coaching_expired", label: "תקופת ליווי פגה" },
  { value: "has_workouts_remaining", label: "נותרו אימונים במכסה" },
  { value: "no_workouts_remaining", label: "מכסת אימונים הסתיימה" },
  { value: "no_questionnaire", label: "לא ענו על השאלון" },
  { value: "questionnaire_done", label: "שאלון הושלם" },
];

export function TraineesList({ trainees }: TraineesListProps) {
  const [filter, setFilter] = useState<TraineeFilter>("all");

  const filtered = useMemo(
    () => trainees.filter((trainee) => matchesTraineeFilter(filter, trainee)),
    [trainees, filter],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] space-y-1">
          <Label htmlFor="trainee-filter">סינון מתאמנים</Label>
          <Select
            id="trainee-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as TraineeFilter)}
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-muted-foreground text-sm">
          {filtered.length} מתוך {trainees.length} מתאמנים
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-border py-8 text-center text-muted-foreground text-sm">
          אין מתאמנים התואמים לסינון שנבחר
        </p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((trainee) => (
            <TraineeCard key={trainee.id} trainee={trainee} />
          ))}
        </div>
      )}
    </div>
  );
}
