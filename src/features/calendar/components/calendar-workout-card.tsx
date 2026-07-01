"use client";

import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { programTypeLabels } from "@/lib/program-labels";
import type { ProgramType, UserRole } from "@/lib/prisma-client";
import type { CalendarTraineeOption, CalendarWorkoutItem } from "@/server/actions/calendar";
import { formatIsraelTime } from "@/lib/calendar-datetime";
import { isWorkoutInPast } from "@/lib/calendar-range";
import { workoutDeliveryModeLabels } from "@/lib/workout-delivery";
import { cn } from "@/lib/utils";

import { GroupWorkoutActions } from "./group-workout-actions";
import { GroupWorkoutRegistrants } from "./group-workout-registrants";
import { CoachWorkoutActions } from "./coach-workout-actions";
import { WorkoutCalendarTools } from "./workout-calendar-tools";

type CalendarWorkoutCardProps = {
  workout: CalendarWorkoutItem;
  userRole: UserRole;
  trainees?: CalendarTraineeOption[];
  compact?: boolean;
  inTimeGrid?: boolean;
  className?: string;
};

function workoutTypeLabel(type: CalendarWorkoutItem["type"]) {
  return type === "PERSONAL" ? "אישי" : "קבוצתי";
}

function spotsLabel(workout: CalendarWorkoutItem) {
  if (workout.maxParticipants == null) return null;

  const spotsLeft = workout.maxParticipants - workout.registeredCount;
  if (spotsLeft <= 0) return "מלא";
  return `${spotsLeft} מקומות פנויים`;
}

function isGroupFull(workout: CalendarWorkoutItem) {
  if (workout.maxParticipants == null) return false;
  return workout.registeredCount >= workout.maxParticipants;
}

export function CalendarWorkoutCard({
  workout,
  userRole,
  trainees = [],
  compact = false,
  inTimeGrid = false,
  className,
}: CalendarWorkoutCardProps) {
  const isPersonal = workout.type === "PERSONAL";
  const isGroup = workout.type === "GROUP";
  const spots = isGroup ? spotsLabel(workout) : null;
  const isPast = isWorkoutInPast(workout.startsAt);
  const showFullBadge = userRole === "TRAINEE" && isGroup && isGroupFull(workout) && !workout.isRegistered;

  return (
    <article
      className={cn(
        "rounded-lg border text-sm transition-opacity",
        inTimeGrid ? "p-1.5 text-[11px]" : "p-2.5",
        isPersonal
          ? "border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/40"
          : "border-green-200 bg-green-50/80 dark:border-green-900 dark:bg-green-950/40",
        compact && !inTimeGrid && "p-2 text-xs",
        inTimeGrid && "w-full min-w-0",
        isPast && "opacity-70",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-medium leading-snug">
          {isPersonal
            ? workout.traineeName ?? "אימון אישי"
            : programTypeLabels[workout.workoutKind as ProgramType]}
        </p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {isPast && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              עבר
            </span>
          )}
          {showFullBadge && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              מלא
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              isPersonal
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            )}
          >
            {workoutTypeLabel(workout.type)}
          </span>
        </div>
      </div>
      <p className={cn("text-muted-foreground", inTimeGrid ? "mt-0.5" : "mt-1")}>
        {formatIsraelTime(workout.startsAt)} · {workout.durationMinutes} דק׳ ·{" "}
        {workoutDeliveryModeLabels[workout.deliveryMode]}
      </p>
      {workout.deliveryMode === "ONLINE" && workout.meetingLink && (
        <Button
          render={
            <a
              href={workout.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          variant="default"
          size={compact || inTimeGrid ? "sm" : "default"}
          className={cn(
            "mt-2 w-full min-w-0",
            inTimeGrid && "h-7 text-[11px]",
          )}
        >
          <Link2 className="size-3.5" aria-hidden />
          קישור לאימון
        </Button>
      )}
      {isPersonal && workout.programName && (
        <p className={cn("text-muted-foreground", inTimeGrid ? "mt-0.5" : "mt-1")}>
          {workout.programName}
        </p>
      )}
      {isGroup && (
        <p className={cn("text-muted-foreground", inTimeGrid ? "mt-0.5" : "mt-1")}>
          נרשמו {workout.registeredCount} מתוך {workout.maxParticipants}
          {userRole === "TRAINEE" && spots && !showFullBadge ? ` · ${spots}` : ""}
          {userRole === "TRAINEE" && workout.isRegistered ? " · נרשמת" : ""}
        </p>
      )}
      {workout.notes && !inTimeGrid && (
        <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{workout.notes}</p>
      )}

      {userRole === "COACH" && isGroup && (
        <GroupWorkoutRegistrants
          registrants={workout.registeredTrainees}
          compact={compact || inTimeGrid}
        />
      )}

      {userRole === "COACH" && !isPast && (
        <div className={cn(inTimeGrid ? "pt-1" : undefined, "min-w-0 w-full")}>
          <CoachWorkoutActions
            workout={workout}
            trainees={trainees}
            compact={compact || inTimeGrid}
          />
        </div>
      )}

      {userRole === "TRAINEE" && isGroup && (
        <div className={inTimeGrid ? "pt-1" : undefined}>
          <GroupWorkoutActions workout={workout} compact={compact || inTimeGrid} />
        </div>
      )}

      <WorkoutCalendarTools
        workout={workout}
        userRole={userRole}
        compact={compact || inTimeGrid}
      />
    </article>
  );
}
