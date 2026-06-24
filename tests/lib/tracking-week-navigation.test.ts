import { describe, expect, it } from "vitest";

import { getWeekStartDateString } from "@/lib/calendar-datetime";
import {
  averageNumbers,
  buildWeekDayHeaders,
  canGoForwardWeek,
  formatWeekRangeLabel,
  getNextWeekStart,
  getPreviousWeekStart,
  parseTrackingWeekStart,
} from "@/lib/tracking-week-navigation";

describe("parseTrackingWeekStart", () => {
  it("defaults to current week when param is missing", () => {
    const now = new Date("2026-06-22T10:00:00.000Z");
    expect(parseTrackingWeekStart(undefined, now)).toBe(getWeekStartDateString("2026-06-22"));
  });

  it("clamps future weeks to current week", () => {
    const now = new Date("2026-06-22T10:00:00.000Z");
    expect(parseTrackingWeekStart("2026-07-01", now)).toBe(getWeekStartDateString("2026-06-22"));
  });

  it("accepts a valid past week", () => {
    const now = new Date("2026-06-22T10:00:00.000Z");
    expect(parseTrackingWeekStart("2026-06-07", now)).toBe(getWeekStartDateString("2026-06-07"));
  });
});

describe("canGoForwardWeek", () => {
  it("allows forward navigation only for past weeks", () => {
    const now = new Date("2026-06-22T10:00:00.000Z");
    const currentWeek = getWeekStartDateString("2026-06-22");
    const previousWeek = getPreviousWeekStart(currentWeek);

    expect(canGoForwardWeek(previousWeek, now)).toBe(true);
    expect(canGoForwardWeek(currentWeek, now)).toBe(false);
  });
});

describe("week navigation helpers", () => {
  it("moves by seven days", () => {
    expect(getPreviousWeekStart("2026-06-21")).toBe("2026-06-14");
    expect(getNextWeekStart("2026-06-21")).toBe("2026-06-28");
  });

  it("formats week range label", () => {
    expect(formatWeekRangeLabel("2026-06-21")).toContain("–");
  });

  it("builds seven day headers", () => {
    const headers = buildWeekDayHeaders("2026-06-21", new Date("2026-06-22T10:00:00.000Z"));
    expect(headers).toHaveLength(7);
    expect(headers.some((day) => day.isToday)).toBe(true);
    expect(headers[0]?.dayName).toBeTruthy();
    expect(headers[0]?.dateLabel).toMatch(/\d+\/\d+/);
  });
});

describe("averageNumbers", () => {
  it("ignores null values", () => {
    expect(averageNumbers([80, null, 82], 1)).toBe(81);
  });

  it("returns null for empty input", () => {
    expect(averageNumbers([null, undefined], 1)).toBeNull();
  });

  it("rounds to zero decimals for steps", () => {
    expect(averageNumbers([9999, 10001], 0)).toBe(10000);
  });
});
