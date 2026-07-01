"use client";

import { formatIsraelTime } from "@/lib/calendar-datetime";
import { isWorkoutInPast } from "@/lib/calendar-range";
import type { CalendarEventItem } from "@/server/actions/calendar-events";
import type { CalendarTraineeOption } from "@/server/actions/calendar";
import type { UserRole } from "@/lib/prisma-client";
import { cn } from "@/lib/utils";

import { CoachEventActions } from "./coach-event-actions";
import { EventCalendarTools } from "./event-calendar-tools";

type CalendarEventCardProps = {
  event: CalendarEventItem;
  userRole: UserRole;
  trainees?: CalendarTraineeOption[];
  compact?: boolean;
  inTimeGrid?: boolean;
  className?: string;
};

export function CalendarEventCard({
  event,
  userRole,
  trainees = [],
  compact = false,
  inTimeGrid = false,
  className,
}: CalendarEventCardProps) {
  const isPast = isWorkoutInPast(event.startsAt);

  return (
    <article
      className={cn(
        "rounded-lg border text-sm transition-opacity",
        "border-orange-200 bg-orange-50/80 dark:border-orange-900 dark:bg-orange-950/40",
        inTimeGrid ? "p-1.5 text-[11px]" : "p-2.5",
        compact && !inTimeGrid && "p-2 text-xs",
        inTimeGrid && "w-full min-w-0",
        isPast && "opacity-70",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-medium leading-snug">{event.title}</p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {isPast && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              עבר
            </span>
          )}
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            אירוע
          </span>
        </div>
      </div>
      <p className={cn("text-muted-foreground", inTimeGrid ? "mt-0.5" : "mt-1")}>
        {formatIsraelTime(event.startsAt)} · {event.durationMinutes} דק׳
      </p>
      {event.traineeName && (
        <p className={cn("text-muted-foreground", inTimeGrid ? "mt-0.5" : "mt-1")}>
          {event.traineeName}
        </p>
      )}
      {event.notes && !inTimeGrid && (
        <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{event.notes}</p>
      )}

      {userRole === "COACH" && !isPast && (
        <div className={cn(inTimeGrid ? "pt-1" : undefined, "min-w-0 w-full")}>
          <CoachEventActions event={event} trainees={trainees} compact={compact || inTimeGrid} />
        </div>
      )}

      <EventCalendarTools
        event={event}
        userRole={userRole}
        compact={compact || inTimeGrid}
      />
    </article>
  );
}
