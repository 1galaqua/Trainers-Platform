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
import { createCalendarEventAction } from "@/server/actions/calendar-events";
import type { CalendarTraineeOption } from "@/server/actions/calendar";

import { PersonalWorkoutTraineePicker } from "./personal-workout-trainee-picker";
import {
  workoutSheetContentClassName,
  workoutSheetScrollClassName,
} from "./workout-sheet-layout";

type CreateEventSheetProps = {
  trainees: CalendarTraineeOption[];
};

export function CreateEventSheet({ trainees }: CreateEventSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function resetFormState() {
    setError(null);
    setSelectedTraineeId(null);
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
    const result = await createCalendarEventAction(formData);
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
          <Button type="button" variant="outline">
            <Plus className="size-4" aria-hidden />
            צור אירוע
          </Button>
        }
      />
      <SheetContent side="right" className={workoutSheetContentClassName}>
        <SheetHeader className="shrink-0 border-border border-b px-4 py-4">
          <SheetTitle>צור אירוע</SheetTitle>
          <SheetDescription>קביעת אירוע כללי ביומן</SheetDescription>
        </SheetHeader>

        <div className={workoutSheetScrollClassName}>
          <form onSubmit={handleSubmit} className="min-w-0 space-y-4 px-4 py-4 pb-6">
            <div className="space-y-2">
              <Label htmlFor="title">שם האירוע</Label>
              <Input id="title" name="title" required placeholder="למשל: פגישת התאמה" />
            </div>

            <PersonalWorkoutTraineePicker
              trainees={trainees}
              selectedTraineeId={selectedTraineeId}
              onSelect={setSelectedTraineeId}
              required={false}
            />

            <div className="min-w-0 space-y-3">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="event-date">תאריך</Label>
                <DateInput
                  id="event-date"
                  name="date"
                  required
                  min={getIsraelDateString()}
                  defaultValue={getIsraelDateString()}
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="event-time">שעה</Label>
                <TimeInput id="event-time" name="time" required defaultValue="09:00" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-durationMinutes">משך (דקות)</Label>
              <Select id="event-durationMinutes" name="durationMinutes" defaultValue="60" required>
                {WORKOUT_DURATION_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} דק׳
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-notes">הערות (אופציונלי)</Label>
              <Textarea id="event-notes" name="notes" rows={3} placeholder="הערות לאירוע" />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "שומר..." : "שמירת אירוע"}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
