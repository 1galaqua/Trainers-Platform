"use client";

import type { ProgramType, UserRole } from "@/lib/prisma-client";
import type { CalendarTraineeOption, CalendarWorkoutItem } from "@/server/actions/calendar";

import { CalendarDayView } from "./calendar-day-view";
import { CalendarWeekView } from "./calendar-week-view";
import { CreateWorkoutSheet } from "./create-workout-sheet";
import {
  CalendarFeedbackProvider,
  CalendarSuccessBanner,
  useCalendarFeedback,
} from "./calendar-feedback-context";
import { calendarViewLabels, type CalendarViewMode } from "@/lib/calendar-config";
import { getWorkoutIsraelDateKey } from "@/lib/calendar-datetime";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CalendarPageContentProps = {
  userRole: UserRole;
  workouts: CalendarWorkoutItem[];
  trainees: CalendarTraineeOption[];
};

export function CalendarPageContent({
  userRole,
  workouts,
  trainees,
}: CalendarPageContentProps) {
  return (
    <CalendarFeedbackProvider>
      <CalendarPageContentInner
        userRole={userRole}
        workouts={workouts}
        trainees={trainees}
      />
    </CalendarFeedbackProvider>
  );
}

function CalendarPageContentInner({
  userRole,
  workouts,
  trainees,
}: CalendarPageContentProps) {
  const { successMessage } = useCalendarFeedback();
  const searchParams = useSearchParams();
  const focusWorkout = useMemo(() => {
    const workoutId = searchParams.get("workout");
    if (!workoutId) return null;
    return workouts.find((workout) => workout.id === workoutId) ?? null;
  }, [searchParams, workouts]);

  const [viewMode, setViewMode] = useState<CalendarViewMode>(() =>
    focusWorkout || searchParams.get("view") === "day" ? "day" : "week",
  );
  const isCoach = userRole === "COACH";

  useEffect(() => {
    if (focusWorkout || searchParams.get("view") === "day") {
      setViewMode("day");
    }
  }, [focusWorkout, searchParams]);

  const dayViewFocusDate = focusWorkout
    ? getWorkoutIsraelDateKey(focusWorkout.startsAt)
    : undefined;
  const scrollToWorkoutId = focusWorkout?.id ?? null;

  return (
    <div className="space-y-6">
      {successMessage && <CalendarSuccessBanner message={successMessage} />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">יומן</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {isCoach
              ? "תצוגה מלאה של כל האימונים — אישיים וקבוצתיים"
              : "אימונים אישיים ואימונים קבוצתיים של המאמן שלך"}
          </p>
        </div>
        {isCoach && <CreateWorkoutSheet trainees={trainees} />}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["week", "day"] as const).map((mode) => (
          <Button
            key={mode}
            type="button"
            size="sm"
            variant={viewMode === mode ? "default" : "outline"}
            onClick={() => setViewMode(mode)}
          >
            {calendarViewLabels[mode]}
          </Button>
        ))}
        <span className="text-muted-foreground text-xs">
          תצוגה {calendarViewLabels[viewMode]} · היסטוריה של 30 יום
        </span>
      </div>

      {viewMode === "week" ? (
        <CalendarWeekView workouts={workouts} userRole={userRole} trainees={trainees} />
      ) : (
        <CalendarDayView
          workouts={workouts}
          userRole={userRole}
          trainees={trainees}
          initialFocusDate={dayViewFocusDate}
          scrollToWorkoutId={scrollToWorkoutId}
        />
      )}
    </div>
  );
}
