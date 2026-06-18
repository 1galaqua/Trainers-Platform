import {
  CALENDAR_GRID_END_HOUR,
  CALENDAR_GRID_START_HOUR,
  CALENDAR_HOUR_HEIGHT_PX,
} from "@/lib/calendar-config";
import { getIsraelHourMinuteFromInstant } from "@/lib/calendar-datetime";
import type { CalendarWorkoutItem } from "@/server/actions/calendar";

export type WorkoutGridPosition = {
  top: number;
  minHeight: number;
};

export function getCalendarGridHours(): number[] {
  return Array.from(
    { length: CALENDAR_GRID_END_HOUR - CALENDAR_GRID_START_HOUR },
    (_, index) => CALENDAR_GRID_START_HOUR + index,
  );
}

export function createBaseHourHeights(): number[] {
  return getCalendarGridHours().map(() => CALENDAR_HOUR_HEIGHT_PX);
}

export function getCalendarGridHeightPx(hourHeights = createBaseHourHeights()): number {
  return hourHeights.reduce((sum, height) => sum + height, 0);
}

export function getHourLineOffsets(hourHeights: number[]): number[] {
  const offsets: number[] = [0];
  for (const height of hourHeights) {
    offsets.push(offsets[offsets.length - 1] + height);
  }
  return offsets;
}

function clampWorkoutToGrid(
  hour: number,
  minute: number,
  durationMinutes: number,
): { startTotalMinutes: number; endTotalMinutes: number } | null {
  const startTotalMinutes = hour * 60 + minute;
  const endTotalMinutes = startTotalMinutes + durationMinutes;
  const gridStartMinutes = CALENDAR_GRID_START_HOUR * 60;
  const gridEndMinutes = CALENDAR_GRID_END_HOUR * 60;

  const visibleStart = Math.max(startTotalMinutes, gridStartMinutes);
  const visibleEnd = Math.min(endTotalMinutes, gridEndMinutes);

  if (visibleEnd <= gridStartMinutes || visibleStart >= gridEndMinutes) {
    return null;
  }

  return { startTotalMinutes: visibleStart, endTotalMinutes: visibleEnd };
}

function getSpanHeightForRange(
  startTotalMinutes: number,
  endTotalMinutes: number,
  hourHeights: number[],
): number {
  let total = 0;

  for (let hour = CALENDAR_GRID_START_HOUR; hour < CALENDAR_GRID_END_HOUR; hour++) {
    const hourStart = hour * 60;
    const hourEnd = (hour + 1) * 60;
    const overlapStart = Math.max(startTotalMinutes, hourStart);
    const overlapEnd = Math.min(endTotalMinutes, hourEnd);

    if (overlapEnd > overlapStart) {
      const hourIndex = hour - CALENDAR_GRID_START_HOUR;
      const fraction = (overlapEnd - overlapStart) / 60;
      total += hourHeights[hourIndex] * fraction;
    }
  }

  return total;
}

function getBaseSpanHeight(startTotalMinutes: number, endTotalMinutes: number): number {
  return getSpanHeightForRange(
    startTotalMinutes,
    endTotalMinutes,
    createBaseHourHeights(),
  );
}

export function computeHourHeightsForWorkouts(
  workouts: CalendarWorkoutItem[],
  contentHeights: Readonly<Record<string, number>>,
): number[] {
  const hourHeights = createBaseHourHeights();

  for (const workout of workouts) {
    const { hour, minute } = getIsraelHourMinuteFromInstant(new Date(workout.startsAt));
    const range = clampWorkoutToGrid(hour, minute, workout.durationMinutes);
    if (!range) continue;

    const contentHeight = contentHeights[workout.id];
    if (!contentHeight) continue;

    const baseSpan = getBaseSpanHeight(range.startTotalMinutes, range.endTotalMinutes);
    if (contentHeight <= baseSpan) continue;

    const scale = contentHeight / baseSpan;

    for (let gridHour = CALENDAR_GRID_START_HOUR; gridHour < CALENDAR_GRID_END_HOUR; gridHour++) {
      const hourStart = gridHour * 60;
      const hourEnd = (gridHour + 1) * 60;
      const overlapStart = Math.max(range.startTotalMinutes, hourStart);
      const overlapEnd = Math.min(range.endTotalMinutes, hourEnd);

      if (overlapEnd <= overlapStart) continue;

      const hourIndex = gridHour - CALENDAR_GRID_START_HOUR;
      hourHeights[hourIndex] = Math.max(
        hourHeights[hourIndex],
        CALENDAR_HOUR_HEIGHT_PX * scale,
      );
    }
  }

  return hourHeights;
}

export function mergeHourHeights(heightsList: number[][]): number[] {
  const merged = createBaseHourHeights();

  for (const heights of heightsList) {
    for (let index = 0; index < merged.length; index++) {
      merged[index] = Math.max(merged[index], heights[index] ?? CALENDAR_HOUR_HEIGHT_PX);
    }
  }

  return merged;
}

export function getWorkoutTopFromHourHeights(
  startsAtIso: string,
  hourHeights: number[],
): number | null {
  const { hour, minute } = getIsraelHourMinuteFromInstant(new Date(startsAtIso));
  const range = clampWorkoutToGrid(hour, minute, 0);
  if (!range) return null;

  const hourIndex = hour - CALENDAR_GRID_START_HOUR;
  if (hourIndex < 0 || hourIndex >= hourHeights.length) return null;

  let top = 0;
  for (let index = 0; index < hourIndex; index++) {
    top += hourHeights[index];
  }

  top += (minute / 60) * hourHeights[hourIndex];
  return top;
}

export function getWorkoutGridPosition(
  startsAtIso: string,
  durationMinutes: number,
  hourHeights: number[] = createBaseHourHeights(),
): WorkoutGridPosition | null {
  const { hour, minute } = getIsraelHourMinuteFromInstant(new Date(startsAtIso));
  const range = clampWorkoutToGrid(hour, minute, durationMinutes);
  if (!range) return null;

  const top = getWorkoutTopFromHourHeights(startsAtIso, hourHeights);
  if (top == null) return null;

  const minHeight = getSpanHeightForRange(
    range.startTotalMinutes,
    range.endTotalMinutes,
    hourHeights,
  );

  return {
    top,
    minHeight: Math.max(minHeight, 28),
  };
}
