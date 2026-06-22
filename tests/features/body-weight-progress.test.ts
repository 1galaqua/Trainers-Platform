// @vitest-environment happy-dom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import {
  buildProgressSeries,
  ProgressPageClient,
} from "@/features/progress/components/progress-page-client";
import {
  CHART_POINT_MIN_WIDTH_PX,
  ProgressChart,
} from "@/features/progress/components/progress-chart";
import { BODY_WEIGHT_PROGRESS_ID } from "@/lib/body-weight-validation";

afterEach(() => {
  cleanup();
});

describe("buildProgressSeries", () => {
  it("places body weight first and hides volume mode in the UI", () => {
    const series = buildProgressSeries(
      [{ id: "ex-1", name: "סקוואט", data: [{ date: "2026-06-01T10:00:00.000Z", weight: 100, volume: 500 }] }],
      [{ date: "2026-06-10T10:00:00.000Z", weight: 78, volume: 78 }],
    );

    expect(series[0]?.id).toBe(BODY_WEIGHT_PROGRESS_ID);
    expect(series[0]?.kind).toBe("body-weight");
    expect(series[1]?.name).toBe("סקוואט");
  });
});

describe("ProgressPageClient body weight chart", () => {
  it("shows body weight series without volume selector", () => {
    render(
      createElement(ProgressPageClient, {
        bodyWeightData: [{ date: "2026-06-10T10:00:00.000Z", weight: 78, volume: 78 }],
        exercises: [],
        defaultSelectedId: BODY_WEIGHT_PROGRESS_ID,
      }),
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.options[0]?.text).toBe("משקל גוף");
    expect(screen.queryByText("גרף נפח (משקל × חזרות × סטים)")).toBeNull();
  });

  it("supports read-only coach view with exercise and body weight options", () => {
    render(
      createElement(ProgressPageClient, {
        readOnly: true,
        bodyWeightData: [{ date: "2026-06-10T10:00:00.000Z", weight: 78, volume: 78 }],
        exercises: [
          {
            id: "ex-1",
            name: "לחיצה",
            data: [{ date: "2026-06-01T10:00:00.000Z", weight: 60, volume: 300 }],
          },
        ],
      }),
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.options.length).toBe(2);
    expect(select.options[0]?.text).toBe("משקל גוף");
    expect(select.options[1]?.text).toBe("לחיצה");
  });
});

describe("ProgressChart mobile layout", () => {
  it("wraps chart in horizontal scroll container for narrow viewports", () => {
    const data = Array.from({ length: 8 }, (_, index) => ({
      date: `2026-06-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
      weight: 70 + index,
      volume: 70 + index,
    }));

    const { container } = render(
      createElement(
        "div",
        { style: { width: 320 } },
        createElement(ProgressChart, { data, mode: "weight", weightLabel: "משקל גוף (ק״ג)" }),
      ),
    );

    const scrollContainer = container.querySelector(".overflow-x-auto");
    expect(scrollContainer).toBeTruthy();

    const chartWrapper = container.querySelector(".h-64") as HTMLElement | null;
    expect(chartWrapper?.style.minWidth).toBe(`${Math.max(280, data.length * CHART_POINT_MIN_WIDTH_PX)}px`);
  });
});

describe("ProgressPageClient mobile controls", () => {
  it("uses full-width chart selectors on small screens", () => {
    const { container } = render(
      createElement(ProgressPageClient, {
        bodyWeightData: [{ date: "2026-06-10T10:00:00.000Z", weight: 78, volume: 78 }],
        exercises: [],
      }),
    );

    const select = container.querySelector("select");
    expect(select?.className).toContain("w-full");
    expect(select?.className).toContain("min-w-0");
  });
});
