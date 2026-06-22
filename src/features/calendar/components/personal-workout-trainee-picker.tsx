"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { traineeNameMatchesSearch } from "@/lib/trainee-name-search";
import type { CalendarTraineeOption } from "@/server/actions/calendar";

type PersonalWorkoutTraineePickerProps = {
  trainees: CalendarTraineeOption[];
  selectedTraineeId: string | null;
  onSelect: (traineeId: string | null) => void;
  disabled?: boolean;
};

export function PersonalWorkoutTraineePicker({
  trainees,
  selectedTraineeId,
  onSelect,
  disabled = false,
}: PersonalWorkoutTraineePickerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const selectedTrainee = useMemo(
    () => trainees.find((trainee) => trainee.id === selectedTraineeId) ?? null,
    [trainees, selectedTraineeId],
  );

  const matchingTrainees = useMemo(() => {
    return trainees.filter(
      (trainee) =>
        trainee.id !== selectedTraineeId &&
        traineeNameMatchesSearch(trainee.name, searchQuery),
    );
  }, [trainees, selectedTraineeId, searchQuery]);

  return (
    <div className="space-y-2">
      <Label htmlFor="personal-trainee-search">מתאמן</Label>
      <input type="hidden" name="traineeId" value={selectedTraineeId ?? ""} required={!disabled} />

      {selectedTrainee ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <span className="truncate font-medium">{selectedTrainee.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={`הסרת ${selectedTrainee.name}`}
            disabled={disabled}
            onClick={() => onSelect(null)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed px-3 py-3 text-center text-muted-foreground text-sm">
          {trainees.length === 0 ? "אין מתאמנים משויכים" : "בחר/י מתאמן מהרשימה"}
        </p>
      )}

      {trainees.length > 0 && (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="personal-trainee-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="חיפוש לפי שם..."
              className="pr-9"
              disabled={disabled}
            />
          </div>

          {matchingTrainees.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-4 text-center text-muted-foreground text-sm">
              {searchQuery.trim() ? "לא נמצאו מתאמנים תואמים" : "כל המתאמנים כבר נבחרו"}
            </p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
              {matchingTrainees.map((trainee) => (
                <li key={trainee.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onSelect(trainee.id);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                      "hover:bg-muted/60",
                    )}
                  >
                    <span className="truncate text-start">{trainee.name}</span>
                    <UserPlus className="size-4 shrink-0 text-primary" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
