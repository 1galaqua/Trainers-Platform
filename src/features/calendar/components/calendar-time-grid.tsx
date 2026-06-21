"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  formatIsraelDayHeader,
  formatIsraelHourLabel,
} from "@/lib/calendar-datetime";
import {
  computeHourHeightsForWorkouts,
  getCalendarGridHeightPx,
  getCalendarGridHours,
  getHourLineOffsets,
  getWorkoutGridPosition,
  mergeHourHeights,
} from "@/lib/calendar-time-grid";
import type { UserRole } from "@/lib/prisma-client";
import type {
  CalendarTraineeOption,
  CalendarWorkoutItem,
} from "@/server/actions/calendar";
import { cn } from "@/lib/utils";

import { CalendarWorkoutCard } from "./calendar-workout-card";

type CalendarTimeGridProps = {
  dates: string[];
  workoutsByDate: Map<string, CalendarWorkoutItem[]>;
  userRole: UserRole;
  trainees?: CalendarTraineeOption[];
  today?: string;
  historyStart?: string;
  scrollToWorkoutId?: string | null;
};

export function CalendarTimeGrid({
  dates,
  workoutsByDate,
  userRole,
  trainees = [],
  today,
  historyStart,
  scrollToWorkoutId = null,
}: CalendarTimeGridProps) {
  const hours = getCalendarGridHours();
  const [contentHeights, setContentHeights] = useState<Record<string, number>>({});

  const datesKey = dates.join(",");

  useLayoutEffect(() => {
    setContentHeights({});
  }, [datesKey, userRole, trainees.length]);

  const handleContentHeight = useCallback((workoutId: string, height: number) => {
    setContentHeights((current) => {
      if (current[workoutId] === height) return current;
      return { ...current, [workoutId]: height };
    });
  }, []);

  const globalHourHeights = useMemo(() => {
    const perDay = dates.map((dateStr) =>
      computeHourHeightsForWorkouts(
        workoutsByDate.get(dateStr) ?? [],
        contentHeights,
      ),
    );
    return mergeHourHeights(perDay);
  }, [dates, workoutsByDate, contentHeights]);

  const gridHeight = getCalendarGridHeightPx(globalHourHeights);
  const hourLineOffsets = getHourLineOffsets(globalHourHeights);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollToWorkoutId) return;
    if (contentHeights[scrollToWorkoutId] == null) return;

    const frame = window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const element = container?.querySelector(
        `[data-workout-id="${CSS.escape(scrollToWorkoutId)}"]`,
      ) as HTMLElement | null;
      if (!element || !container) return;

      const containerTop = container.getBoundingClientRect().top;
      const elementTop = element.getBoundingClientRect().top;
      const targetScrollTop =
        container.scrollTop +
        (elementTop - containerTop) -
        container.clientHeight / 2 +
        element.offsetHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [scrollToWorkoutId, contentHeights, datesKey]);

  const columnTemplate =
    dates.length === 1
      ? "3.25rem 1fr"
      : `3.25rem repeat(${dates.length}, minmax(0, 1fr))`;

  return (
    <div
      ref={scrollContainerRef}
      className="max-h-[min(70dvh,52rem)] overflow-auto overscroll-contain rounded-xl border border-border"
    >
      <div
        className="min-w-full"
        style={{ minWidth: dates.length === 1 ? "20rem" : "56rem" }}
      >
        <div
          className="sticky top-0 z-20 grid border-b border-border bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80"
          style={{ gridTemplateColumns: columnTemplate }}
        >
          <div className="border-l border-border/60" />
          {dates.map((dateStr) => {
            const isToday = today != null && dateStr === today;
            const isBeforeHistory = historyStart != null && dateStr < historyStart;

            return (
              <div
                key={dateStr}
                className={cn(
                  "border-l border-border/60 px-2 py-2 text-center text-xs font-medium",
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                  isBeforeHistory && "opacity-50",
                )}
              >
                {formatIsraelDayHeader(dateStr)}
              </div>
            );
          })}
        </div>

        <div className="grid" style={{ gridTemplateColumns: columnTemplate }}>
          <div
            className="relative border-l border-border/60 bg-muted/20"
            style={{ height: gridHeight }}
          >
            {hours.map((hour, index) => (
              <div
                key={hour}
                className="absolute inset-x-0 flex items-start justify-center pt-0.5 text-[10px] text-muted-foreground"
                style={{ top: hourLineOffsets[index] }}
              >
                {formatIsraelHourLabel(hour)}
              </div>
            ))}
          </div>

          {dates.map((dateStr) => (
            <CalendarTimeGridDayColumn
              key={dateStr}
              workouts={workoutsByDate.get(dateStr) ?? []}
              userRole={userRole}
              trainees={trainees}
              hours={hours}
              hourHeights={globalHourHeights}
              hourLineOffsets={hourLineOffsets}
              gridHeight={gridHeight}
              onContentHeight={handleContentHeight}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type CalendarTimeGridDayColumnProps = {
  workouts: CalendarWorkoutItem[];
  userRole: UserRole;
  trainees: CalendarTraineeOption[];
  hours: number[];
  hourHeights: number[];
  hourLineOffsets: number[];
  gridHeight: number;
  onContentHeight: (workoutId: string, height: number) => void;
};

function CalendarTimeGridDayColumn({
  workouts,
  userRole,
  trainees,
  hours,
  hourHeights,
  hourLineOffsets,
  gridHeight,
  onContentHeight,
}: CalendarTimeGridDayColumnProps) {
  return (
    <div
      className="relative border-l border-border/60 bg-background"
      style={{ height: gridHeight }}
    >
      {hours.map((hour, index) => (
        <div
          key={hour}
          className="pointer-events-none absolute inset-x-0 border-t border-border/35"
          style={{ top: hourLineOffsets[index] }}
        />
      ))}
      <div
        className="pointer-events-none absolute inset-x-0 border-t border-border/35"
        style={{ top: gridHeight }}
      />

      {workouts.map((workout) => {
        const position = getWorkoutGridPosition(
          workout.startsAt,
          workout.durationMinutes,
          hourHeights,
        );
        if (!position) return null;

        return (
          <CalendarTimeGridWorkoutBlock
            key={workout.id}
            workout={workout}
            userRole={userRole}
            trainees={trainees}
            top={position.top}
            minHeight={position.minHeight}
            onContentHeight={onContentHeight}
          />
        );
      })}
    </div>
  );
}

type CalendarTimeGridWorkoutBlockProps = {
  workout: CalendarWorkoutItem;
  userRole: UserRole;
  trainees: CalendarTraineeOption[];
  top: number;
  minHeight: number;
  onContentHeight: (workoutId: string, height: number) => void;
};

function CalendarTimeGridWorkoutBlock({
  workout,
  userRole,
  trainees,
  top,
  minHeight,
  onContentHeight,
}: CalendarTimeGridWorkoutBlockProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const report = () => {
      onContentHeight(workout.id, element.offsetHeight);
    };

    report();
    const observer = new ResizeObserver(report);
    observer.observe(element);

    return () => observer.disconnect();
  }, [workout.id, onContentHeight, userRole, trainees, workout]);

  return (
    <div
      data-calendar-workout
      data-workout-id={workout.id}
      className="absolute right-0.5 left-0.5 z-10 overflow-hidden"
      style={{ top, minHeight }}
    >
      <div ref={contentRef} className="w-full min-w-0">
        <CalendarWorkoutCard
          workout={workout}
          userRole={userRole}
          trainees={trainees}
          compact
          inTimeGrid
        />
      </div>
    </div>
  );
}
