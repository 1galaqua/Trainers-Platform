"use client";

import { isWorkoutInPast } from "@/lib/calendar-range";
import type { CalendarEventItem } from "@/server/actions/calendar-events";
import type { UserRole } from "@/lib/prisma-client";
import { cn } from "@/lib/utils";

import { AddEventToCalendarButton } from "./add-event-to-calendar-button";
import { EventReminderControls } from "./event-reminder-controls";

export function canUseEventCalendarTools(event: CalendarEventItem, userRole: UserRole) {
  if (isWorkoutInPast(event.startsAt)) return false;
  if (userRole === "ADMIN") return false;
  if (userRole === "COACH") return true;
  return event.traineeId != null;
}

type EventCalendarToolsProps = {
  event: CalendarEventItem;
  userRole: UserRole;
  compact?: boolean;
  className?: string;
};

export function EventCalendarTools({
  event,
  userRole,
  compact = false,
  className,
}: EventCalendarToolsProps) {
  if (!canUseEventCalendarTools(event, userRole)) {
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
        <EventReminderControls event={event} compact={compact} />
        <AddEventToCalendarButton event={event} compact={compact} />
      </div>
    </div>
  );
}
