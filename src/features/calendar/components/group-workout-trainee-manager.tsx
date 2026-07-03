"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  normalizeTraineeNameSearch,
  traineeNameMatchesSearch,
} from "@/lib/trainee-name-search";
import type {
  CalendarRegisteredTrainee,
  CalendarTraineeOption,
} from "@/server/actions/calendar";

type GroupWorkoutTraineeManagerProps = {
  trainees: CalendarTraineeOption[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  maxParticipants: number;
  registeredTrainees?: CalendarRegisteredTrainee[];
};

export function GroupWorkoutTraineeManager({
  trainees,
  selectedIds,
  onSelectedIdsChange,
  maxParticipants,
  registeredTrainees = [],
}: GroupWorkoutTraineeManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearch = normalizeTraineeNameSearch(searchQuery);

  const traineeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const trainee of trainees) {
      map.set(trainee.id, trainee.name);
    }
    for (const registrant of registeredTrainees) {
      map.set(registrant.id, registrant.name);
    }
    return map;
  }, [trainees, registeredTrainees]);

  const selectedTrainees = selectedIds.map((id) => ({
    id,
    name: traineeNameById.get(id) ?? "מתאמן",
  }));

  const activeTrainees = useMemo(
    () => trainees.filter((trainee) => trainee.status === "active"),
    [trainees],
  );

  const availableToAdd = useMemo(() => {
    return activeTrainees
      .filter((trainee) => !selectedIds.includes(trainee.id))
      .filter(
        (trainee) => traineeNameMatchesSearch(trainee.name, searchQuery),
      );
  }, [activeTrainees, selectedIds, searchQuery]);

  const atCapacity = selectedIds.length >= maxParticipants;

  function removeTrainee(traineeId: string) {
    onSelectedIdsChange(selectedIds.filter((id) => id !== traineeId));
  }

  function addTrainee(traineeId: string) {
    if (atCapacity || selectedIds.includes(traineeId)) return;
    onSelectedIdsChange([...selectedIds, traineeId]);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>נרשמו</Label>
          <span className="text-muted-foreground text-sm">
            {selectedIds.length} / {maxParticipants}
          </span>
        </div>
        {selectedTrainees.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-muted-foreground text-base">
            עדיין אין נרשמים
          </p>
        ) : (
          <ul className="space-y-1 rounded-lg border p-2">
            {selectedTrainees.map((trainee) => (
              <li
                key={trainee.id}
                className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-2 text-sm"
              >
                <span className="truncate">{trainee.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`הסרת ${trainee.name} מהאימון`}
                  onClick={() => removeTrainee(trainee.id)}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="group-trainee-search">הוספת מתאמנים</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="group-trainee-search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="חיפוש לפי שם..."
            className="pr-9"
          />
        </div>

        {activeTrainees.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-muted-foreground text-base">
            אין מתאמנים פעילים להוספה
          </p>
        ) : availableToAdd.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-muted-foreground text-base">
            {normalizedSearch ? "לא נמצאו מתאמנים תואמים" : "כל המתאמנים הפעילים כבר נרשמו"}
          </p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
            {availableToAdd.map((trainee) => (
              <li key={trainee.id}>
                <button
                  type="button"
                  disabled={atCapacity}
                  onClick={() => addTrainee(trainee.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                    atCapacity
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-muted/60",
                  )}
                >
                  <span className="truncate text-start">{trainee.name}</span>
                  <UserPlus className="size-4 shrink-0 text-primary" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        {atCapacity && (
          <p className="text-muted-foreground text-sm">האימון מלא — יש להסיר מתאמן כדי להוסיף אחר</p>
        )}
      </div>
    </div>
  );
}
