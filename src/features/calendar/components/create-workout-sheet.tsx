"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { getIsraelDateString } from "@/lib/calendar-datetime";
import { WORKOUT_DURATION_OPTIONS } from "@/lib/calendar-validation";
import { programTypeLabels } from "@/lib/program-labels";
import type { ProgramType } from "@/lib/prisma-client";
import { cn } from "@/lib/utils";
import {
  createScheduledWorkoutAction,
  type CalendarTraineeOption,
} from "@/server/actions/calendar";

type WorkoutFormType = "PERSONAL" | "GROUP";

type CreateWorkoutSheetProps = {
  trainees: CalendarTraineeOption[];
};

export function CreateWorkoutSheet({ trainees }: CreateWorkoutSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [workoutType, setWorkoutType] = useState<WorkoutFormType>("PERSONAL");
  const [selectedGroupTraineeIds, setSelectedGroupTraineeIds] = useState<string[]>([]);
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeTrainees = useMemo(
    () => trainees.filter((trainee) => trainee.status === "active"),
    [trainees],
  );

  function resetFormState() {
    setError(null);
    setWorkoutType("PERSONAL");
    setSelectedGroupTraineeIds([]);
    setMaxParticipants(8);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetFormState();
    }
  }

  function toggleGroupTrainee(traineeId: string) {
    setSelectedGroupTraineeIds((current) => {
      if (current.includes(traineeId)) {
        return current.filter((id) => id !== traineeId);
      }
      if (current.length >= maxParticipants) {
        return current;
      }
      return [...current, traineeId];
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("type", workoutType);
    selectedGroupTraineeIds.forEach((traineeId) => {
      formData.append("groupTraineeIds", traineeId);
    });

    const result = await createScheduledWorkoutAction(formData);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    handleOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button type="button">
            <Plus className="size-4" aria-hidden />
            אימון חדש
          </Button>
        }
      />
      <SheetContent
        side="right"
        className="gap-0 overflow-y-auto p-0 sm:max-w-md [&>button]:top-3 [&>button]:right-auto [&>button]:left-3"
      >
        <SheetHeader className="border-border border-b px-4 py-4">
          <SheetTitle>אימון חדש</SheetTitle>
          <SheetDescription>קביעת אימון אישי או קבוצתי ביומן</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={workoutType === "PERSONAL" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setWorkoutType("PERSONAL")}
            >
              אישי
            </Button>
            <Button
              type="button"
              variant={workoutType === "GROUP" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setWorkoutType("GROUP")}
            >
              קבוצתי
            </Button>
          </div>

          {workoutType === "PERSONAL" ? (
            <div className="space-y-2">
              <Label htmlFor="traineeId">מתאמן</Label>
              <Select
                id="traineeId"
                name="traineeId"
                required
                defaultValue=""
                disabled={trainees.length === 0}
              >
                <option value="" disabled>
                  {trainees.length === 0 ? "אין מתאמנים משויכים" : "בחר/י מתאמן"}
                </option>
                {trainees.map((trainee) => (
                  <option key={trainee.id} value={trainee.id}>
                    {trainee.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="workoutKind">סוג אימון</Label>
                <Select id="workoutKind" name="workoutKind" defaultValue="STRENGTH" required>
                  {(Object.keys(programTypeLabels) as ProgramType[]).map((type) => (
                    <option key={type} value={type}>
                      {programTypeLabels[type]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">מקסימום משתתפים</Label>
                <Input
                  id="maxParticipants"
                  name="maxParticipants"
                  type="number"
                  min={2}
                  max={50}
                  value={maxParticipants}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setMaxParticipants(next);
                    if (Number.isInteger(next) && next > 0) {
                      setSelectedGroupTraineeIds((current) =>
                        current.length > next ? current.slice(0, next) : current,
                      );
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>מתאמנים פעילים (אופציונלי)</Label>
                  <span className="text-muted-foreground text-xs">
                    {selectedGroupTraineeIds.length} / {maxParticipants}
                  </span>
                </div>
                {activeTrainees.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-3 py-4 text-center text-muted-foreground text-sm">
                    אין מתאמנים פעילים לרישום
                  </p>
                ) : (
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
                    {activeTrainees.map((trainee) => {
                      const isSelected = selectedGroupTraineeIds.includes(trainee.id);
                      const isDisabled =
                        !isSelected && selectedGroupTraineeIds.length >= maxParticipants;

                      return (
                        <label
                          key={trainee.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                            isSelected ? "bg-primary/10" : "hover:bg-muted/60",
                            isDisabled && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <input
                            type="checkbox"
                            value={trainee.id}
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => toggleGroupTrainee(trainee.id)}
                            className="size-4 shrink-0 accent-primary"
                          />
                          <span className="truncate">{trainee.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-muted-foreground text-xs">
                  ניתן לרשום מתאמנים פעילים כבר ביצירת האימון
                </p>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">תאריך</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                min={getIsraelDateString()}
                defaultValue={getIsraelDateString()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">שעה</Label>
              <Input id="time" name="time" type="time" required defaultValue="09:00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationMinutes">משך (דקות)</Label>
            <Select id="durationMinutes" name="durationMinutes" defaultValue="60" required>
              {WORKOUT_DURATION_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} דק׳
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות (אופציונלי)</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="הערות לאימון" />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (workoutType === "PERSONAL" && trainees.length === 0)}
          >
            {loading ? "שומר..." : "שמירת אימון"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
