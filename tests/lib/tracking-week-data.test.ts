import { describe, expect, it } from "vitest";

import {
  buildDailyTrackingWeekGrid,
  buildMeasurementsTrackingWeekGrid,
  buildTrackingWeekRawLogs,
  computeWeeklyAverageForRow,
  patchTrackingWeekGridCell,
} from "@/lib/tracking-week-data";
import { getWeekStartDateString } from "@/lib/calendar-datetime";

const WEEK_START = "2026-06-21";

describe("buildTrackingWeekRawLogs", () => {
  it("aggregates logs by day", () => {
    const raw = buildTrackingWeekRawLogs({
      bodyWeightLogs: [{ recordedDay: "2026-06-21", weightKg: 80 }],
      sleepLogs: [{ recordedDay: "2026-06-21", sleepStart: "23:00", sleepEnd: "07:00" }],
      waterLogs: [{ recordedDay: "2026-06-22", amountMl: 2000 }],
      stepsLogs: [{ recordedDay: "2026-06-23", steps: 8500 }],
      caloriesLogs: [{ recordedDay: "2026-06-24", calories: 2100 }],
      measurementsLogs: [{ recordedDay: "2026-06-21", chestCm: 100 }],
    });

    expect(raw.bodyWeightByDay.get("2026-06-21")).toBe(80);
    expect(raw.sleepHoursByDay.get("2026-06-21")).toBe(8);
    expect(raw.waterMlByDay.get("2026-06-22")).toBe(2000);
    expect(raw.stepsByDay.get("2026-06-23")).toBe(8500);
    expect(raw.caloriesByDay.get("2026-06-24")).toBe(2100);
    expect(raw.measurementsByDay.get("2026-06-21")?.chestCm).toBe(100);
  });
});

describe("buildDailyTrackingWeekGrid", () => {
  it("builds five daily metric rows with weekly averages", () => {
    const raw = buildTrackingWeekRawLogs({
      bodyWeightLogs: [
        { recordedDay: "2026-06-21", weightKg: 80 },
        { recordedDay: "2026-06-22", weightKg: 82 },
      ],
      sleepLogs: [{ recordedDay: "2026-06-21", sleepStart: "23:00", sleepEnd: "07:00" }],
      waterLogs: [{ recordedDay: "2026-06-21", amountMl: 2000 }],
      stepsLogs: [{ recordedDay: "2026-06-21", steps: 10000 }],
      caloriesLogs: [{ recordedDay: "2026-06-21", calories: 2000 }],
      measurementsLogs: [],
    });

    const grid = buildDailyTrackingWeekGrid(WEEK_START, raw, true);

    expect(grid.days).toHaveLength(7);
    expect(grid.rows).toHaveLength(5);
    expect(grid.rows[0]?.id).toBe("body-weight");
    expect(grid.rows[0]?.weeklyAverage.raw).toBe(81);
    expect(grid.rows[1]?.weeklyAverage.raw).toBe(8);
    expect(grid.rows[2]?.weeklyAverage.raw).toBe(2);
    expect(grid.rows[3]?.weeklyAverage.raw).toBe(10000);
    expect(grid.rows[4]?.id).toBe("calories");
    expect(grid.rows[4]?.weeklyAverage.raw).toBe(2000);
  });

  it("formats water cells in ml and weekly average in liters with decimals", () => {
    const raw = buildTrackingWeekRawLogs({
      bodyWeightLogs: [],
      sleepLogs: [],
      waterLogs: [
        { recordedDay: "2026-06-21", amountMl: 2000 },
        { recordedDay: "2026-06-22", amountMl: 3000 },
      ],
      stepsLogs: [],
      caloriesLogs: [],
      measurementsLogs: [],
    });

    const grid = buildDailyTrackingWeekGrid(WEEK_START, raw, true);
    const waterRow = grid.rows.find((row) => row.id === "water");

    expect(waterRow?.cells[0]?.display).toContain('מ"ל');
    expect(waterRow?.cells[0]?.display).toContain("2");
    expect(waterRow?.cells[1]?.display).toContain("3");
    expect(waterRow?.weeklyAverage.raw).toBe(2.5);
    expect(waterRow?.weeklyAverage.display).toContain("2.5");
    expect(waterRow?.weeklyAverage.display).toContain("ל'");
  });

  it("marks future days as not editable", () => {
    const today = "2026-06-22";
    const weekStart = getWeekStartDateString(today);
    const raw = buildTrackingWeekRawLogs({
      bodyWeightLogs: [],
      sleepLogs: [],
      waterLogs: [],
      stepsLogs: [],
      caloriesLogs: [],
      measurementsLogs: [],
    });

    const grid = buildDailyTrackingWeekGrid(weekStart, raw, true, new Date(`${today}T10:00:00.000Z`));
    const futureCell = grid.rows[0]?.cells.find((cell) => cell.date > today);

    expect(futureCell?.editable).toBe(false);
  });
});

describe("buildMeasurementsTrackingWeekGrid", () => {
  it("builds one row per measurement field", () => {
    const raw = buildTrackingWeekRawLogs({
      bodyWeightLogs: [],
      sleepLogs: [],
      waterLogs: [],
      stepsLogs: [],
      caloriesLogs: [],
      measurementsLogs: [
        { recordedDay: "2026-06-21", chestCm: 100, bellyCm: 90 },
        { recordedDay: "2026-06-22", chestCm: 101 },
      ],
    });

    const grid = buildMeasurementsTrackingWeekGrid(WEEK_START, raw, true);

    expect(grid.rows.length).toBeGreaterThan(10);
    const chestRow = grid.rows.find((row) => row.id === "chestCm");
    const bellyRow = grid.rows.find((row) => row.id === "bellyCm");

    expect(chestRow?.weeklyAverage.raw).toBe(100.5);
    expect(bellyRow?.weeklyAverage.raw).toBe(90);
  });
});

describe("patchTrackingWeekGridCell", () => {
  it("updates a cell and recalculates weekly average", () => {
    const raw = buildTrackingWeekRawLogs({
      bodyWeightLogs: [{ recordedDay: "2026-06-21", weightKg: 80 }],
      sleepLogs: [],
      waterLogs: [],
      stepsLogs: [],
      caloriesLogs: [],
      measurementsLogs: [],
    });
    const grid = buildDailyTrackingWeekGrid(WEEK_START, raw, true);
    const updated = patchTrackingWeekGridCell(grid, "body-weight", "2026-06-22", {
      raw: 82,
      display: '82 ק"ג',
    });
    const row = updated.rows.find((item) => item.id === "body-weight");

    expect(row?.cells[1]?.raw).toBe(82);
    expect(row?.weeklyAverage.raw).toBe(81);
  });
});

describe("computeWeeklyAverageForRow", () => {
  it("averages water row in liters", () => {
    const raw = buildTrackingWeekRawLogs({
      bodyWeightLogs: [],
      sleepLogs: [],
      waterLogs: [
        { recordedDay: "2026-06-21", amountMl: 2000 },
        { recordedDay: "2026-06-22", amountMl: 3000 },
      ],
      stepsLogs: [],
      caloriesLogs: [],
      measurementsLogs: [],
    });
    const grid = buildDailyTrackingWeekGrid(WEEK_START, raw, true);
    const waterRow = grid.rows.find((row) => row.id === "water");
    if (!waterRow) throw new Error("missing water row");

    const average = computeWeeklyAverageForRow("water", waterRow.cells);
    expect(average.raw).toBe(2.5);
    expect(average.display).toContain("2.5");
  });
});
