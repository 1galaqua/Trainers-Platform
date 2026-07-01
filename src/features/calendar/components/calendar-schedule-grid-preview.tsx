"use client";

import { programTypeLabels } from "@/lib/program-labels";
import type { ProgramType, UserRole } from "@/lib/prisma-client";
import { formatIsraelTime } from "@/lib/calendar-datetime";
import { isWorkoutInPast } from "@/lib/calendar-range";
import { workoutDeliveryModeLabels } from "@/lib/workout-delivery";
import type { CalendarEventItem } from "@/server/actions/calendar-events";
import type { CalendarWorkoutItem } from "@/server/actions/calendar";
import type { CalendarScheduleItem } from "@/server/actions/calendar-types";
import { isCalendarWorkoutItem } from "@/server/actions/calendar-types";
import { cn } from "@/lib/utils";

type CalendarScheduleGridPreviewProps = {
  item: CalendarScheduleItem;
  userRole: UserRole;
  className?: string;
};

function workoutTypeLabel(type: CalendarWorkoutItem["type"]) {
  return type === "PERSONAL" ? "אישי" : "קבוצתי";
}

function workoutPreviewTitle(workout: CalendarWorkoutItem) {
  if (workout.type === "PERSONAL") {
    return workout.traineeName ?? "אימון אישי";
  }
  return programTypeLabels[workout.workoutKind as ProgramType];
}

function workoutPreviewSubtitle(workout: CalendarWorkoutItem, userRole: UserRole) {
  if (workout.type === "PERSONAL" && workout.programName) {
    return workout.programName;
  }

  if (workout.type === "GROUP") {
    const base = `נרשמו ${workout.registeredCount} מתוך ${workout.maxParticipants ?? "—"}`;
    if (userRole === "TRAINEE" && workout.isRegistered) {
      return `${base} · נרשמת`;
    }
    return base;
  }

  return workoutDeliveryModeLabels[workout.deliveryMode];
}

function WorkoutGridPreview({
  workout,
  userRole,
  className,
}: {
  workout: CalendarWorkoutItem;
  userRole: UserRole;
  className?: string;
}) {
  const isPersonal = workout.type === "PERSONAL";
  const isPast = isWorkoutInPast(workout.startsAt);
  const subtitle = workoutPreviewSubtitle(workout, userRole);

  return (
    <article
      className={cn(
        "rounded-lg border p-1.5 text-[11px] leading-snug transition-colors",
        isPersonal
          ? "border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/40"
          : "border-green-200 bg-green-50/80 dark:border-green-900 dark:bg-green-950/40",
        isPast && "opacity-70",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="line-clamp-2 min-w-0 font-medium">{workoutPreviewTitle(workout)}</p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {isPast && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              עבר
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              isPersonal
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            )}
          >
            {workoutTypeLabel(workout.type)}
          </span>
        </div>
      </div>
      <p className="mt-0.5 text-muted-foreground">
        {formatIsraelTime(workout.startsAt)} · {workout.durationMinutes} דק׳
      </p>
      {subtitle && (
        <p className="mt-0.5 line-clamp-2 text-muted-foreground">{subtitle}</p>
      )}
    </article>
  );
}

function EventGridPreview({
  event,
  className,
}: {
  event: CalendarEventItem;
  className?: string;
}) {
  const isPast = isWorkoutInPast(event.startsAt);

  return (
    <article
      className={cn(
        "rounded-lg border border-orange-200 bg-orange-50/80 p-1.5 text-[11px] leading-snug transition-colors dark:border-orange-900 dark:bg-orange-950/40",
        isPast && "opacity-70",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="line-clamp-2 min-w-0 font-medium">{event.title}</p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {isPast && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              עבר
            </span>
          )}
          <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            אירוע
          </span>
        </div>
      </div>
      <p className="mt-0.5 text-muted-foreground">
        {formatIsraelTime(event.startsAt)} · {event.durationMinutes} דק׳
      </p>
      {event.traineeName && (
        <p className="mt-0.5 line-clamp-1 text-muted-foreground">{event.traineeName}</p>
      )}
    </article>
  );
}

export function CalendarScheduleGridPreview({
  item,
  userRole,
  className,
}: CalendarScheduleGridPreviewProps) {
  if (isCalendarWorkoutItem(item)) {
    return <WorkoutGridPreview workout={item} userRole={userRole} className={className} />;
  }

  return <EventGridPreview event={item} className={className} />;
}

export function calendarSchedulePreviewAriaLabel(item: CalendarScheduleItem): string {
  if (isCalendarWorkoutItem(item)) {
    return `פתיחת פרטי אימון ${workoutPreviewTitle(item)}`;
  }
  return `פתיחת פרטי אירוע ${item.title}`;
}
