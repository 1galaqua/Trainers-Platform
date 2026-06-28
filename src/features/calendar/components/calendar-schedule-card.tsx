"use client";

import type { CalendarTraineeOption } from "@/server/actions/calendar";
import type { CalendarScheduleItem } from "@/server/actions/calendar-types";
import { isCalendarWorkoutItem } from "@/server/actions/calendar-types";
import type { UserRole } from "@/lib/prisma-client";

import { CalendarEventCard } from "./calendar-event-card";
import { CalendarWorkoutCard } from "./calendar-workout-card";

type CalendarScheduleCardProps = {
  item: CalendarScheduleItem;
  userRole: UserRole;
  trainees?: CalendarTraineeOption[];
  compact?: boolean;
  inTimeGrid?: boolean;
  className?: string;
};

export function CalendarScheduleCard({
  item,
  userRole,
  trainees = [],
  compact = false,
  inTimeGrid = false,
  className,
}: CalendarScheduleCardProps) {
  if (isCalendarWorkoutItem(item)) {
    return (
      <CalendarWorkoutCard
        workout={item}
        userRole={userRole}
        trainees={trainees}
        compact={compact}
        inTimeGrid={inTimeGrid}
        className={className}
      />
    );
  }

  return (
    <CalendarEventCard
      event={item}
      userRole={userRole}
      trainees={trainees}
      compact={compact}
      inTimeGrid={inTimeGrid}
      className={className}
    />
  );
}
