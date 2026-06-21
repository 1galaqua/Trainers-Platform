"use client";

import { isWorkoutInPast } from "@/lib/calendar-range";
import type { CalendarWorkoutItem } from "@/server/actions/calendar";
import type { UserRole } from "@/lib/prisma-client";
import { cn } from "@/lib/utils";

import { AddToCalendarButton } from "./add-to-calendar-button";
import { WorkoutReminderControls } from "./workout-reminder-controls";

export function canUseWorkoutCalendarTools(
  workout: CalendarWorkoutItem,
  userRole: UserRole,
) {
  if (isWorkoutInPast(workout.startsAt)) return false;
  if (userRole === "ADMIN") return false;
  if (userRole === "COACH") return true;
  if (workout.type === "PERSONAL") return true;
  return workout.type === "GROUP" && workout.isRegistered;
}

type WorkoutCalendarToolsProps = {
  workout: CalendarWorkoutItem;
  userRole: UserRole;
  compact?: boolean;
  className?: string;
};

export function WorkoutCalendarTools({
  workout,
  userRole,
  compact = false,
  className,
}: WorkoutCalendarToolsProps) {
  if (!canUseWorkoutCalendarTools(workout, userRole)) {
    return null;
  }

  return (
    <div
      className={cn(
        compact ? "mt-2 space-y-1" : "mt-3 space-y-2",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full min-w-0 gap-1",
          compact ? "flex-col" : "flex-row gap-2",
        )}
      >
        <WorkoutReminderControls workout={workout} compact={compact} />
        <AddToCalendarButton workout={workout} compact={compact} />
      </div>
    </div>
  );
}
