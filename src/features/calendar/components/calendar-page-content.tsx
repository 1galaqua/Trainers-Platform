"use client";

import type { UserRole } from "@/lib/prisma-client";
import type { CalendarTraineeOption } from "@/server/actions/calendar";
import type { CalendarScheduleItem } from "@/server/actions/calendar-types";

import { CalendarScheduleView } from "./calendar-schedule-view";
import { CreateEventSheet } from "./create-event-sheet";
import { CreateWorkoutSheet } from "./create-workout-sheet";
import {
  CalendarFeedbackProvider,
  CalendarSuccessBanner,
  useCalendarFeedback,
} from "./calendar-feedback-context";
import {
  CALENDAR_HISTORY_DAYS,
  calendarViewLabels,
  type CalendarViewMode,
} from "@/lib/calendar-config";
import { getWorkoutIsraelDateKey } from "@/lib/calendar-datetime";
import {
  clampCalendarAnchorDate,
  getCalendarNavigationBounds,
} from "@/lib/calendar-range";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CalendarPageContentProps = {
  userRole: UserRole;
  scheduleItems: CalendarScheduleItem[];
  trainees: CalendarTraineeOption[];
};

export function CalendarPageContent({
  userRole,
  scheduleItems,
  trainees,
}: CalendarPageContentProps) {
  return (
    <CalendarFeedbackProvider>
      <CalendarPageContentInner
        userRole={userRole}
        scheduleItems={scheduleItems}
        trainees={trainees}
      />
    </CalendarFeedbackProvider>
  );
}

function CalendarPageContentInner({
  userRole,
  scheduleItems,
  trainees,
}: CalendarPageContentProps) {
  const { successMessage } = useCalendarFeedback();
  const searchParams = useSearchParams();
  const focusItem = useMemo(() => {
    const workoutId = searchParams.get("workout");
    if (workoutId) {
      return scheduleItems.find((item) => item.id === workoutId) ?? null;
    }

    const eventId = searchParams.get("event");
    if (eventId) {
      return scheduleItems.find((item) => item.id === eventId) ?? null;
    }

    return null;
  }, [searchParams, scheduleItems]);

  const bounds = useMemo(() => getCalendarNavigationBounds(), []);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() =>
    focusItem || searchParams.get("view") === "day" ? "day" : "week",
  );
  const [anchorDate, setAnchorDate] = useState(() => {
    if (focusItem) {
      return clampCalendarAnchorDate(
        getWorkoutIsraelDateKey(focusItem.startsAt),
        bounds,
      );
    }
    return bounds.today;
  });
  const isCoach = userRole === "COACH";

  useEffect(() => {
    if (focusItem || searchParams.get("view") === "day") {
      setViewMode("day");
    }
    if (focusItem) {
      setAnchorDate(
        clampCalendarAnchorDate(
          getWorkoutIsraelDateKey(focusItem.startsAt),
          bounds,
        ),
      );
    }
  }, [focusItem, searchParams, bounds]);

  const scrollToItemId = focusItem?.id ?? null;

  return (
    <div className="space-y-6">
      {successMessage && <CalendarSuccessBanner message={successMessage} />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">יומן</h1>
          <p className="mt-1 text-muted-foreground text-base">
            {isCoach
              ? "תצוגה מלאה של אימונים ואירועים ביומן"
              : "אימונים ואירועים של המאמן שלך"}
          </p>
        </div>
        {isCoach && (
          <div className="flex flex-wrap items-center gap-2">
            <CreateWorkoutSheet trainees={trainees} />
            <CreateEventSheet trainees={trainees} />
          </div>
        )}
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
        <span className="text-muted-foreground text-sm">
          תצוגה {calendarViewLabels[viewMode]} · היסטוריה של {CALENDAR_HISTORY_DAYS} יום
        </span>
      </div>

      <CalendarScheduleView
        viewMode={viewMode}
        anchorDate={anchorDate}
        onAnchorDateChange={setAnchorDate}
        scheduleItems={scheduleItems}
        userRole={userRole}
        trainees={trainees}
        scrollToItemId={scrollToItemId}
      />
    </div>
  );
}
