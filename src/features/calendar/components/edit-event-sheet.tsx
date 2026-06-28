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
import { cn } from "@/lib/utils";
import { updateCalendarEventAction } from "@/server/actions/calendar-events";
import type { CalendarEventItem } from "@/server/actions/calendar-events";
import type { CalendarTraineeOption } from "@/server/actions/calendar";

import { PersonalWorkoutTraineePicker } from "./personal-workout-trainee-picker";
import {
  workoutSheetContentClassName,
  workoutSheetScrollClassName,
} from "./workout-sheet-layout";
import { useCalendarFeedback } from "./calendar-feedback-context";

type EditEventSheetProps = {
  event: CalendarEventItem;
  trainees: CalendarTraineeOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditEventSheet({
  event,
  trainees,
  open,
  onOpenChange,
}: EditEventSheetProps) {
  const router = useRouter();
  const { showSuccess } = useCalendarFeedback();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(event.traineeId);
  const { date, time } = getIsraelDateAndTimeFromInstant(new Date(event.startsAt));

  useEffect(() => {
    if (!open) return;
    setSelectedTraineeId(event.traineeId);
    setError(null);
  }, [open, event]);

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(formEvent.currentTarget);
      const result = await updateCalendarEventAction(event.id, formData);

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
          <SheetTitle>עריכת אירוע</SheetTitle>
          <SheetDescription>עדכון פרטי האירוע ביומן</SheetDescription>
        </SheetHeader>

        <div className={workoutSheetScrollClassName}>
          <form onSubmit={handleSubmit} className="min-w-0 space-y-4 px-4 py-4 pb-6">
            <div className="space-y-2">
              <Label htmlFor="edit-event-title">שם האירוע</Label>
              <Input
                id="edit-event-title"
                name="title"
                required
                defaultValue={event.title}
              />
            </div>

            <PersonalWorkoutTraineePicker
              trainees={trainees}
              selectedTraineeId={selectedTraineeId}
              onSelect={setSelectedTraineeId}
              required={false}
            />

            <div className="min-w-0 space-y-3">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="edit-event-date">תאריך</Label>
                <DateInput id="edit-event-date" name="date" required defaultValue={date} />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="edit-event-time">שעה</Label>
                <TimeInput id="edit-event-time" name="time" required defaultValue={time} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-event-durationMinutes">משך (דקות)</Label>
              <Select
                id="edit-event-durationMinutes"
                name="durationMinutes"
                defaultValue={String(event.durationMinutes)}
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
              <Label htmlFor="edit-event-notes">הערות (אופציונלי)</Label>
              <Textarea
                id="edit-event-notes"
                name="notes"
                rows={3}
                defaultValue={event.notes ?? ""}
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "שומר..." : "שמירת שינויים"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

type EditEventButtonProps = {
  event: CalendarEventItem;
  trainees: CalendarTraineeOption[];
  compact?: boolean;
};

export function EditEventButton({ event, trainees, compact = false }: EditEventButtonProps) {
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
      <EditEventSheet
        event={event}
        trainees={trainees}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
