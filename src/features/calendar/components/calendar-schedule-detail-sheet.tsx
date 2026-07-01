"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CalendarScheduleCard } from "@/features/calendar/components/calendar-schedule-card";
import {
  workoutSheetContentClassName,
  workoutSheetScrollClassName,
} from "@/features/calendar/components/workout-sheet-layout";
import type { CalendarTraineeOption } from "@/server/actions/calendar";
import type { CalendarScheduleItem } from "@/server/actions/calendar-types";
import { isCalendarWorkoutItem } from "@/server/actions/calendar-types";
import type { UserRole } from "@/lib/prisma-client";
import { formatIsraelTime } from "@/lib/calendar-datetime";

type CalendarScheduleDetailSheetProps = {
  item: CalendarScheduleItem | null;
  userRole: UserRole;
  trainees?: CalendarTraineeOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function sheetTitle(item: CalendarScheduleItem) {
  if (isCalendarWorkoutItem(item)) {
    return item.type === "PERSONAL"
      ? item.traineeName ?? "אימון אישי"
      : "אימון קבוצתי";
  }
  return item.title;
}

function sheetDescription(item: CalendarScheduleItem) {
  const time = formatIsraelTime(item.startsAt);
  if (isCalendarWorkoutItem(item)) {
    return `${time} · ${item.durationMinutes} דק׳`;
  }
  return `${time} · ${item.durationMinutes} דק׳ · אירוע`;
}

export function CalendarScheduleDetailSheet({
  item,
  userRole,
  trainees = [],
  open,
  onOpenChange,
}: CalendarScheduleDetailSheetProps) {
  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={workoutSheetContentClassName}>
        <SheetHeader className="shrink-0 border-border border-b px-4 py-4">
          <SheetTitle>{sheetTitle(item)}</SheetTitle>
          <SheetDescription>{sheetDescription(item)}</SheetDescription>
        </SheetHeader>

        <div className={workoutSheetScrollClassName}>
          <div className="p-4">
            <CalendarScheduleCard
              item={item}
              userRole={userRole}
              trainees={trainees}
              compact
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
