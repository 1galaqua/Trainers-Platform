import { describe, expect, it } from "vitest";

import { addIsraelDays } from "@/lib/calendar-datetime";
import {
  clampCalendarAnchorDate,
  getCalendarNavigationBounds,
} from "@/lib/calendar-range";

describe("clampCalendarAnchorDate", () => {
  const bounds = getCalendarNavigationBounds(new Date("2026-06-22T12:00:00+03:00"));

  it("returns the date when within bounds", () => {
    expect(clampCalendarAnchorDate(bounds.today, bounds)).toBe(bounds.today);
  });

  it("clamps to history start", () => {
    expect(clampCalendarAnchorDate(addIsraelDays(bounds.historyStart, -1), bounds)).toBe(
      bounds.historyStart,
    );
  });

  it("clamps to forward end", () => {
    expect(clampCalendarAnchorDate(addIsraelDays(bounds.forwardEnd, 1), bounds)).toBe(
      bounds.forwardEnd,
    );
  });
});
