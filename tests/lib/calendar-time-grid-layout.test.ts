import { describe, expect, it } from "vitest";

import {
  getCalendarGridColumnTemplate,
  getCalendarGridMinWidth,
} from "@/lib/calendar-time-grid";

describe("calendar grid layout", () => {
  it("uses a single flexible column for day view", () => {
    expect(getCalendarGridColumnTemplate(1)).toBe("3.25rem 1fr");
    expect(getCalendarGridMinWidth(1)).toBe("20rem");
  });

  it("uses wider minimum day columns for week view", () => {
    expect(getCalendarGridColumnTemplate(7)).toBe(
      "3.25rem repeat(7, minmax(9rem, 1fr))",
    );
    expect(getCalendarGridMinWidth(7)).toBe("66.25rem");
  });
});
