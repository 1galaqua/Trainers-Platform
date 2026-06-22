"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

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
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { getIsraelDateAndTimeFromInstant } from "@/lib/calendar-datetime";
import { WORKOUT_DURATION_OPTIONS } from "@/lib/calendar-validation";
import { programTypeLabels } from "@/lib/program-labels";
import { cn } from "@/lib/utils";
import type { ProgramType } from "@/lib/prisma-client";
import {
  updateScheduledWorkoutAction,
  type CalendarTraineeOption,
  type CalendarWorkoutItem,
} from "@/server/actions/calendar";

import { GroupWorkoutTraineeManager } from "./group-workout-trainee-manager";
import { PersonalWorkoutProgramSelect } from "./personal-workout-program-select";
import { PersonalWorkoutTraineePicker } from "./personal-workout-trainee-picker";
import {
  workoutSheetContentClassName,
  workoutSheetScrollClassName,
} from "./workout-sheet-layout";
import { useCalendarFeedback } from "./calendar-feedback-context";

type EditWorkoutSheetProps = {
  workout: CalendarWorkoutItem;
  trainees: CalendarTraineeOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditWorkoutSheet({
  workout,
  trainees,
  open,
  onOpenChange,
}: EditWorkoutSheetProps) {
  const router = useRouter();
  const { showSuccess } = useCalendarFeedback();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTraineeIds, setSelectedTraineeIds] = useState<string[]>([]);
  const [selectedPersonalTraineeId, setSelectedPersonalTraineeId] = useState<string | null>(
    workout.traineeId,
  );
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    workout.programId,
  );
  const [maxParticipants, setMaxParticipants] = useState(workout.maxParticipants ?? 8);
  const { date, time } = getIsraelDateAndTimeFromInstant(new Date(workout.startsAt));
  const isPersonal = workout.type === "PERSONAL";

  useEffect(() => {
    if (!open) return;

    setSelectedTraineeIds(workout.registeredTrainees.map((trainee) => trainee.id));
    setSelectedPersonalTraineeId(workout.traineeId);
    setSelectedProgramId(workout.programId);
    setMaxParticipants(workout.maxParticipants ?? 8);
    setError(null);
  }, [open, workout]);

  function handlePersonalTraineeSelect(traineeId: string | null) {
    setSelectedPersonalTraineeId(traineeId);
    if (traineeId !== workout.traineeId) {
      setSelectedProgramId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("type", workout.type);
      selectedTraineeIds.forEach((traineeId) => {
        formData.append("groupTraineeIds", traineeId);
      });

      const result = await updateScheduledWorkoutAction(workout.id, formData);

      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }

      handleOpenChange(false);
      showSuccess("שינויים בוצעו");
      router.refresh();
    } catch {
      setError("שגיאה בשמירת השינויים. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) setError(null);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className={workoutSheetContentClassName}>
        <SheetHeader className="shrink-0 border-border border-b px-4 py-4">
          <SheetTitle>עריכת אימון</SheetTitle>
          <SheetDescription>
            {isPersonal ? "אימון אישי" : "אימון קבוצתי"}
          </SheetDescription>
        </SheetHeader>

        <div className={workoutSheetScrollClassName}>
          <form onSubmit={handleSubmit} className="min-w-0 space-y-4 px-4 py-4 pb-6">
          {isPersonal ? (
            <>
              <PersonalWorkoutTraineePicker
                trainees={trainees}
                selectedTraineeId={selectedPersonalTraineeId}
                onSelect={handlePersonalTraineeSelect}
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
                <Label htmlFor={`workoutKind-${workout.id}`}>סוג אימון</Label>
                <Select
                  id={`workoutKind-${workout.id}`}
                  name="workoutKind"
                  defaultValue={workout.workoutKind}
                  required
                >
                  {(Object.keys(programTypeLabels) as ProgramType[]).map((type) => (
                    <option key={type} value={type}>
                      {programTypeLabels[type]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`maxParticipants-${workout.id}`}>מקסימום משתתפים</Label>
                <Input
                  id={`maxParticipants-${workout.id}`}
                  name="maxParticipants"
                  type="number"
                  min={Math.max(2, selectedTraineeIds.length)}
                  max={50}
                  value={maxParticipants}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setMaxParticipants(next);
                    if (Number.isInteger(next) && next > 0) {
                      setSelectedTraineeIds((current) =>
                        current.length > next ? current.slice(0, next) : current,
                      );
                    }
                  }}
                  required
                />
              </div>
              <GroupWorkoutTraineeManager
                trainees={trainees}
                selectedIds={selectedTraineeIds}
                onSelectedIdsChange={setSelectedTraineeIds}
                maxParticipants={maxParticipants}
                registeredTrainees={workout.registeredTrainees}
              />
            </>
          )}

          <div className="min-w-0 space-y-3">
            <div className="min-w-0 space-y-2">
              <Label htmlFor={`date-${workout.id}`}>תאריך</Label>
              <DateInput
                id={`date-${workout.id}`}
                name="date"
                required
                defaultValue={date}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor={`time-${workout.id}`}>שעה</Label>
              <TimeInput
                id={`time-${workout.id}`}
                name="time"
                required
                defaultValue={time}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`durationMinutes-${workout.id}`}>משך (דקות)</Label>
            <Select
              id={`durationMinutes-${workout.id}`}
              name="durationMinutes"
              defaultValue={String(workout.durationMinutes)}
              required
            >
              {WORKOUT_DURATION_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} דק׳
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`notes-${workout.id}`}>הערות (אופציונלי)</Label>
            <Textarea
              id={`notes-${workout.id}`}
              name="notes"
              rows={3}
              defaultValue={workout.notes ?? ""}
              placeholder="הערות לאימון"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (isPersonal && !selectedPersonalTraineeId)}
          >
            {loading ? "שומר..." : "שמירת שינויים"}
          </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

type EditWorkoutButtonProps = {
  workout: CalendarWorkoutItem;
  trainees: CalendarTraineeOption[];
  compact?: boolean;
};

export function EditWorkoutButton({ workout, trainees, compact = false }: EditWorkoutButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        className={cn(
          compact ? "h-7 w-full min-w-0 shrink px-1.5 text-xs" : "min-w-0 flex-1 shrink",
        )}
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3.5" aria-hidden />
        עריכה
      </Button>
      <EditWorkoutSheet
        workout={workout}
        trainees={trainees}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
