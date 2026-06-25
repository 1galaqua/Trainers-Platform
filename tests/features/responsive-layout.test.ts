// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DateInput } from "@/components/ui/date-input";
import { CoachingPeriodForm } from "@/features/trainees/components/coaching-period-form";
import { TraineeProgramPicker } from "@/features/workouts/components/trainee-program-picker";

const mobileViewport = { width: 390, height: 844 };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/server/actions/trainees", () => ({
  updateCoachingPeriodAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CoachingPeriodForm responsive layout", () => {
  const baseProps = {
    traineeId: "trainee-1",
    coachingStartDate: "2026-06-18",
    coachingEndDate: "2026-06-30",
    workoutQuota: 10,
    workoutsCompleted: 3,
    loggedSessionsCount: 4,
  };

  it("uses a 2-column grid in compact mode for trainee cards", () => {
    const { container } = render(
      createElement(CoachingPeriodForm, { ...baseProps, compact: true }),
    );

    const grid = container.querySelector("form > div.grid");
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(grid?.className).not.toContain("lg:grid-cols-4");
  });

  it("uses a 4-column grid on large screens in detail view", () => {
    const { container } = render(createElement(CoachingPeriodForm, baseProps));

    const grid = container.querySelector("form > div.grid");
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(grid?.className).toContain("lg:grid-cols-4");
  });

  it("renders date fields with calendar icon and compact h-8 height", () => {
    render(createElement(CoachingPeriodForm, { ...baseProps, compact: true }));

    const dateInputs = screen.getAllByLabelText("פתיחת בוחר תאריך");
    expect(dateInputs).toHaveLength(2);

    for (const button of dateInputs) {
      const wrapper = button.parentElement;
      expect(wrapper?.className).toContain("h-8");
      expect(wrapper?.className).toContain("min-w-0");
      expect(button.querySelector("svg.lucide-calendar-days")).toBeTruthy();
    }
  });

  it("keeps submit button full width on mobile and auto on larger screens", () => {
    const { container } = render(
      createElement(CoachingPeriodForm, { ...baseProps, compact: true }),
    );

    const submit = container.querySelector('button[type="submit"]');
    expect(submit?.className).toContain("w-full");
    expect(submit?.className).toContain("sm:w-auto");
  });
});

describe("TraineeProgramPicker responsive layout", () => {
  it("stacks program cards on mobile and uses two columns from sm breakpoint", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: mobileViewport.width,
    });

    const { container } = render(
      createElement(
        "div",
        { style: { width: mobileViewport.width } },
        createElement(TraineeProgramPicker, {
          programs: [
            {
              id: "p1",
              name: "תוכנית A",
              type: "STRENGTH",
              exerciseCount: 5,
              coachName: "מאמן",
            },
            {
              id: "p2",
              name: "תוכנית B",
              type: "HYPERTROPHY",
              exerciseCount: 8,
              coachName: null,
            },
          ],
          selectedId: "p1",
          onSelect: vi.fn(),
        }),
      ),
    );

    const grid = container.querySelector(".grid");
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(grid?.children.length).toBe(2);
  });
});

describe("DateInput responsive layout", () => {
  it("fits narrow containers without horizontal overflow", () => {
    const { container } = render(
      createElement(
        "div",
        { className: "w-[min(100%,16rem)]" },
        createElement(DateInput, {
          id: "narrow-date",
          defaultValue: "2026-06-22",
        }),
      ),
    );

    const wrapper = container.querySelector(".flex.h-8");
    expect(wrapper).toBeTruthy();
    expect(wrapper?.className).toContain("w-full");
    expect(wrapper?.className).toContain("max-w-full");
    expect(wrapper?.className).toContain("min-w-0");
  });
});
describe("System-wide responsive layout contracts", () => {
  it("defines horizontal scroll for tracking grids", () => {
    const globals = readFileSync(resolve("src/styles/globals.css"), "utf8");
    expect(globals).toContain(".tracking-grid-scroll");
    expect(globals).toContain("overflow-x: auto");
  });

  it("locks workout sheets to viewport height on mobile", async () => {
    const { workoutSheetContentClassName, workoutSheetScrollClassName } = await import(
      "@/features/calendar/components/workout-sheet-layout",
    );

    expect(workoutSheetContentClassName).toContain("max-h-[100dvh]");
    expect(workoutSheetScrollClassName).toContain("overflow-y-auto");
    expect(workoutSheetScrollClassName).toContain("overflow-x-hidden");
  });

  it("uses wider minimum columns for week calendar view", async () => {
    const { getCalendarGridMinWidth } = await import("@/lib/calendar-time-grid");
    expect(getCalendarGridMinWidth(7)).toBe("66.25rem");
    expect(getCalendarGridMinWidth(1)).toBe("20rem");
  });

  it("wraps progress charts in horizontal scroll on narrow screens", async () => {
    const { ProgressChart, CHART_POINT_MIN_WIDTH_PX } = await import(
      "@/features/progress/components/progress-chart",
    );

    const data = Array.from({ length: 6 }, (_, index) => ({
      date: `2026-06-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
      weight: 70 + index,
      volume: 70 + index,
    }));

    const { container } = render(
      createElement(
        "div",
        { style: { width: 320 } },
        createElement(ProgressChart, { data, mode: "weight", weightLabel: "משקל (ק״ג)" }),
      ),
    );

    expect(container.querySelector(".overflow-x-auto")).toBeTruthy();
    const chartWrapper = container.querySelector(".h-64") as HTMLElement | null;
    expect(chartWrapper?.style.minWidth).toBe(
      `${Math.max(280, data.length * CHART_POINT_MIN_WIDTH_PX)}px`,
    );
  });
});
