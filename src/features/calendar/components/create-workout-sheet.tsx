"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput, TimeInput } from "@/components/ui/date-input";
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
import {
  createScheduledWorkoutAction,
  type CalendarTraineeOption,
} from "@/server/actions/calendar";

import { GroupWorkoutTraineeManager } from "./group-workout-trainee-manager";
import { PersonalWorkoutProgramSelect } from "./personal-workout-program-select";
import { PersonalWorkoutTraineePicker } from "./personal-workout-trainee-picker";
import {
  workoutSheetContentClassName,
  workoutSheetScrollClassName,
} from "./workout-sheet-layout";

type WorkoutFormType = "PERSONAL" | "GROUP";

type CreateWorkoutSheetProps = {
  trainees: CalendarTraineeOption[];
};

export function CreateWorkoutSheet({ trainees }: CreateWorkoutSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [workoutType, setWorkoutType] = useState<WorkoutFormType>("PERSONAL");
  const [selectedPersonalTraineeId, setSelectedPersonalTraineeId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedGroupTraineeIds, setSelectedGroupTraineeIds] = useState<string[]>([]);
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function resetFormState() {
    setError(null);
    setWorkoutType("PERSONAL");
    setSelectedPersonalTraineeId(null);
    setSelectedProgramId(null);
    setSelectedGroupTraineeIds([]);
    setMaxParticipants(8);
  }

  function handlePersonalTraineeSelect(traineeId: string | null) {
    setSelectedPersonalTraineeId(traineeId);
    setSelectedProgramId(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetFormState();
    }
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
      <SheetContent side="right" className={workoutSheetContentClassName}>
        <SheetHeader className="shrink-0 border-border border-b px-4 py-4">
          <SheetTitle>אימון חדש</SheetTitle>
          <SheetDescription>קביעת אימון אישי או קבוצתי ביומן</SheetDescription>
        </SheetHeader>

        <div className={workoutSheetScrollClassName}>
          <form onSubmit={handleSubmit} className="min-w-0 space-y-4 px-4 py-4 pb-6">
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
              <>
                <PersonalWorkoutTraineePicker
                  trainees={trainees}
                  selectedTraineeId={selectedPersonalTraineeId}
                  onSelect={handlePersonalTraineeSelect}
                  disabled={trainees.length === 0}
                />
                <PersonalWorkoutProgramSelect
                  traineeId={selectedPersonalTraineeId}
                  selectedProgramId={selectedProgramId}
                  onSelect={setSelectedProgramId}
                  disabled={!selectedPersonalTraineeId}
                />
              </>
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
                <GroupWorkoutTraineeManager
                  trainees={trainees}
                  selectedIds={selectedGroupTraineeIds}
                  onSelectedIdsChange={setSelectedGroupTraineeIds}
                  maxParticipants={maxParticipants}
                />
                <p className="text-muted-foreground text-xs">
                  ניתן לרשום מתאמנים פעילים כבר ביצירת האימון
                </p>
              </>
            )}

            <div className="min-w-0 space-y-3">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="date">תאריך</Label>
                <DateInput
                  id="date"
                  name="date"
                  required
                  min={getIsraelDateString()}
                  defaultValue={getIsraelDateString()}
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="time">שעה</Label>
                <TimeInput id="time" name="time" required defaultValue="09:00" />
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
              disabled={
                loading ||
                (workoutType === "PERSONAL" &&
                  (trainees.length === 0 || !selectedPersonalTraineeId))
              }
            >
              {loading ? "שומר..." : "שמירת אימון"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
