"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  formatIsraelDayHeader,
  formatIsraelHourLabel,
} from "@/lib/calendar-datetime";
import {
  computeHourHeightsForWorkouts,
  getCalendarGridColumnTemplate,
  getCalendarGridHeightPx,
  getCalendarGridHours,
  getCalendarGridMinWidth,
  getHourLineOffsets,
  getWorkoutGridPosition,
  mergeHourHeights,
} from "@/lib/calendar-time-grid";
import type { UserRole } from "@/lib/prisma-client";
import type { CalendarTraineeOption } from "@/server/actions/calendar";
import type { CalendarScheduleItem } from "@/server/actions/calendar-types";
import { cn } from "@/lib/utils";

import { CalendarScheduleDetailSheet } from "./calendar-schedule-detail-sheet";
import {
  CalendarScheduleGridPreview,
  calendarSchedulePreviewAriaLabel,
} from "./calendar-schedule-grid-preview";

type CalendarTimeGridProps = {
  dates: string[];
  itemsByDate: Map<string, CalendarScheduleItem[]>;
  userRole: UserRole;
  trainees?: CalendarTraineeOption[];
  today?: string;
  historyStart?: string;
  scrollToItemId?: string | null;
};

export function CalendarTimeGrid({
  dates,
  itemsByDate,
  userRole,
  trainees = [],
  today,
  historyStart,
  scrollToItemId = null,
}: CalendarTimeGridProps) {
  const hours = getCalendarGridHours();
  const [contentHeights, setContentHeights] = useState<Record<string, number>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    for (const dateStr of dates) {
      const match = (itemsByDate.get(dateStr) ?? []).find((item) => item.id === selectedItemId);
      if (match) return match;
    }
    return null;
  }, [selectedItemId, dates, itemsByDate]);

  useEffect(() => {
    if (scrollToItemId) {
      setSelectedItemId(scrollToItemId);
    }
  }, [scrollToItemId]);

  const datesKey = dates.join(",");

  const visibleItemIdsKey = useMemo(() => {
    return dates
      .flatMap((dateStr) => (itemsByDate.get(dateStr) ?? []).map((item) => item.id))
      .sort()
      .join(",");
  }, [dates, itemsByDate]);

  useLayoutEffect(() => {
    setContentHeights((current) => {
      if (visibleItemIdsKey.length === 0) {
        return Object.keys(current).length === 0 ? current : {};
      }

      const visibleIds = new Set(visibleItemIdsKey.split(","));
      const next: Record<string, number> = {};
      let changed = false;

      for (const [itemId, height] of Object.entries(current)) {
        if (visibleIds.has(itemId)) {
          next[itemId] = height;
        } else {
          changed = true;
        }
      }

      if (!changed && Object.keys(current).length === Object.keys(next).length) {
        return current;
      }

      return next;
    });
  }, [visibleItemIdsKey]);

  const handleContentHeight = useCallback((itemId: string, height: number) => {
    setContentHeights((current) => {
      if (current[itemId] === height) return current;
      return { ...current, [itemId]: height };
    });
  }, []);

  const globalHourHeights = useMemo(() => {
    const perDay = dates.map((dateStr) =>
      computeHourHeightsForWorkouts(
        itemsByDate.get(dateStr) ?? [],
        contentHeights,
      ),
    );
    return mergeHourHeights(perDay);
  }, [dates, itemsByDate, contentHeights]);

  const gridHeight = getCalendarGridHeightPx(globalHourHeights);
  const hourLineOffsets = getHourLineOffsets(globalHourHeights);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollToItemId) return;
    if (contentHeights[scrollToItemId] == null) return;

    const frame = window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const element = container?.querySelector(
        `[data-schedule-item-id="${CSS.escape(scrollToItemId)}"]`,
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
  }, [scrollToItemId, contentHeights, datesKey]);

  const columnTemplate = getCalendarGridColumnTemplate(dates.length);
  const gridMinWidth = getCalendarGridMinWidth(dates.length);

  return (
    <div
      ref={scrollContainerRef}
      className="max-h-[min(70dvh,52rem)] overflow-auto overscroll-contain rounded-xl border border-border"
    >
      <div
        className="min-w-full"
        style={{ minWidth: gridMinWidth }}
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
              items={itemsByDate.get(dateStr) ?? []}
              userRole={userRole}
              trainees={trainees}
              hours={hours}
              hourHeights={globalHourHeights}
              hourLineOffsets={hourLineOffsets}
              gridHeight={gridHeight}
              onContentHeight={handleContentHeight}
              onSelectItem={setSelectedItemId}
            />
          ))}
        </div>
      </div>

      <CalendarScheduleDetailSheet
        item={selectedItem}
        userRole={userRole}
        trainees={trainees}
        open={selectedItem != null}
        onOpenChange={(open) => {
          if (!open) setSelectedItemId(null);
        }}
      />
    </div>
  );
}

type CalendarTimeGridDayColumnProps = {
  items: CalendarScheduleItem[];
  userRole: UserRole;
  trainees: CalendarTraineeOption[];
  hours: number[];
  hourHeights: number[];
  hourLineOffsets: number[];
  gridHeight: number;
  onContentHeight: (itemId: string, height: number) => void;
  onSelectItem: (itemId: string) => void;
};

function CalendarTimeGridDayColumn({
  items,
  userRole,
  trainees,
  hours,
  hourHeights,
  hourLineOffsets,
  gridHeight,
  onContentHeight,
  onSelectItem,
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

      {items.map((item) => {
        const position = getWorkoutGridPosition(
          item.startsAt,
          item.durationMinutes,
          hourHeights,
        );
        if (!position) return null;

        return (
          <CalendarTimeGridScheduleBlock
            key={item.id}
            item={item}
            userRole={userRole}
            trainees={trainees}
            top={position.top}
            minHeight={position.minHeight}
            onContentHeight={onContentHeight}
            onSelect={() => onSelectItem(item.id)}
          />
        );
      })}
    </div>
  );
}

type CalendarTimeGridScheduleBlockProps = {
  item: CalendarScheduleItem;
  userRole: UserRole;
  trainees: CalendarTraineeOption[];
  top: number;
  minHeight: number;
  onContentHeight: (itemId: string, height: number) => void;
  onSelect: () => void;
};

function CalendarTimeGridScheduleBlock({
  item,
  userRole,
  top,
  minHeight,
  onContentHeight,
  onSelect,
}: CalendarTimeGridScheduleBlockProps) {
  const contentRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const report = () => {
      onContentHeight(item.id, element.offsetHeight);
    };

    report();
    const observer = new ResizeObserver(report);
    observer.observe(element);

    return () => observer.disconnect();
  }, [item.id, onContentHeight, userRole, item]);

  return (
    <div
      data-calendar-schedule-item
      data-schedule-item-id={item.id}
      className="absolute right-0.5 left-0.5 z-10 overflow-hidden"
      style={{ top, minHeight }}
    >
      <button
        type="button"
        ref={contentRef}
        onClick={onSelect}
        aria-label={calendarSchedulePreviewAriaLabel(item)}
        className="w-full min-w-0 cursor-pointer rounded-lg text-start outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CalendarScheduleGridPreview item={item} userRole={userRole} className="h-full w-full" />
      </button>
    </div>
  );
}
