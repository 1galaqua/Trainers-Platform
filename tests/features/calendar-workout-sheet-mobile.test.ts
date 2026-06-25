// @vitest-environment happy-dom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DateInput, TimeInput } from "@/components/ui/date-input";
import { GroupWorkoutTraineeManager } from "@/features/calendar/components/group-workout-trainee-manager";
import type { CalendarTraineeOption } from "@/server/actions/calendar";

const mobileViewport = { width: 390, height: 844 };

const activeTrainees: CalendarTraineeOption[] = [
  { id: "1", name: "דני כהן", status: "active" },
  { id: "2", name: "מיכל לוי", status: "active" },
  { id: "3", name: "יואב שמש", status: "inactive" },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DateInput and TimeInput mobile layout", () => {
  it("renders calendar and clock icons on the left without overflowing", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: mobileViewport.width,
    });

    const { container } = render(
      createElement(
        "div",
        { className: "w-[min(100%,24rem)]" },
        createElement(DateInput, {
          id: "date",
          name: "date",
          defaultValue: "2026-06-22",
        }),
        createElement(TimeInput, {
          id: "time",
          name: "time",
          defaultValue: "09:00",
        }),
      ),
    );

    const dateInput = container.querySelector("#date") as HTMLInputElement;
    expect(dateInput).toBeTruthy();
    expect(dateInput.className).toContain("input-date-rtl-field");
    expect(container.querySelector("svg.lucide-calendar-days")).toBeTruthy();

    const dateWrapper = dateInput.closest(".flex");
    expect(dateWrapper).toBeTruthy();

    const iconButton = container.querySelector('button[aria-label="פתיחת בוחר תאריך"]');
    expect(iconButton).toBeTruthy();

    const timeInput = container.querySelector("#time") as HTMLInputElement;
    expect(timeInput.type).toBe("text");
    expect(timeInput.placeholder).toBe("17:30");
    expect(timeInput.className).toContain("input-time-rtl-field");
    expect(container.querySelector("svg.lucide-clock")).toBeTruthy();

    const timeWrapper = timeInput.closest(".grid");
    expect(timeWrapper).toBeTruthy();
  });

  it("opens the native date picker when clicking the calendar icon", async () => {
    const user = userEvent.setup();
    const showPicker = vi.fn();

    const { container } = render(
      createElement(DateInput, {
        id: "date-icon",
        name: "date",
        defaultValue: "2026-06-22",
      }),
    );

    const dateInput = container.querySelector("#date-icon") as HTMLInputElement & {
      showPicker?: () => void;
    };
    dateInput.showPicker = showPicker;

    await user.click(container.querySelector('button[aria-label="פתיחת בוחר תאריך"]')!);

    expect(showPicker).toHaveBeenCalledTimes(1);
  });
});

describe("GroupWorkoutTraineeManager mobile search", () => {
  it("filters trainees by name when typing in the search field", async () => {
    const user = userEvent.setup();
    const onSelectedIdsChange = vi.fn();

    render(
      createElement(
        "div",
        { style: { width: mobileViewport.width } },
        createElement(GroupWorkoutTraineeManager, {
          trainees: activeTrainees,
          selectedIds: [],
          onSelectedIdsChange,
          maxParticipants: 8,
        }),
      ),
    );

    const searchInput = screen.getByPlaceholderText("חיפוש לפי שם...");
    expect(searchInput).toBeTruthy();

    await user.type(searchInput, "דני");

    expect(screen.getByText("דני כהן")).toBeTruthy();
    expect(screen.queryByText("מיכל לוי")).toBeNull();
    expect(screen.queryByText("יואב שמש")).toBeNull();
  });

  it("shows empty state when search has no matches", async () => {
    const user = userEvent.setup();

    render(
      createElement(
        "div",
        { style: { width: mobileViewport.width } },
        createElement(GroupWorkoutTraineeManager, {
          trainees: activeTrainees,
          selectedIds: [],
          onSelectedIdsChange: vi.fn(),
          maxParticipants: 8,
        }),
      ),
    );

    await user.type(screen.getByPlaceholderText("חיפוש לפי שם..."), "xyz");

    expect(screen.getByText("לא נמצאו מתאמנים תואמים")).toBeTruthy();
  });
});
