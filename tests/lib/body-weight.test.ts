import { describe, expect, it } from "vitest";

import {
  appendQuestionnaireStartingWeight,
  mapBodyWeightLogsToChartData,
  resolveBodyWeightCurrentDisplay,
} from "@/lib/body-weight-chart-data";
import {
  BODY_WEIGHT_PROGRESS_ID,
  parseBodyWeightDaysOfWeek,
  parseBodyWeightKg,
  parseBodyWeightTimeLocal,
  resolveBodyWeightRecordedAt,
  validateBodyWeightDate,
} from "@/lib/body-weight-validation";
import { buildProgressSeries } from "@/features/progress/components/progress-page-client";

describe("parseBodyWeightKg", () => {
  it("accepts valid weights", () => {
    expect(parseBodyWeightKg("78.5")).toBe(78.5);
    expect(parseBodyWeightKg(80)).toBe(80);
  });

  it("rejects out-of-range weights", () => {
    expect(parseBodyWeightKg("10")).toBeNull();
    expect(parseBodyWeightKg("400")).toBeNull();
  });
});

describe("validateBodyWeightDate", () => {
  it("rejects future dates in Israel timezone", () => {
    expect(
      validateBodyWeightDate("2099-01-01", new Date("2026-06-22T10:00:00.000Z")),
    ).toBe("לא ניתן לרשום משקל לתאריך עתידי");
  });

  it("accepts today and past dates", () => {
    expect(
      validateBodyWeightDate("2026-06-22", new Date("2026-06-22T10:00:00.000Z")),
    ).toBeNull();
    expect(
      validateBodyWeightDate("2026-06-01", new Date("2026-06-22T10:00:00.000Z")),
    ).toBeNull();
  });
});

describe("parseBodyWeightDaysOfWeek", () => {
  it("parses unique weekday values", () => {
    expect(parseBodyWeightDaysOfWeek(["0", "2", "2", "5"])).toEqual([0, 2, 5]);
  });

  it("returns null for empty input", () => {
    expect(parseBodyWeightDaysOfWeek([])).toBeNull();
  });
});

describe("parseBodyWeightTimeLocal", () => {
  it("accepts valid HH:mm values", () => {
    expect(parseBodyWeightTimeLocal("08:00")).toBe("08:00");
    expect(parseBodyWeightTimeLocal("23:59")).toBe("23:59");
  });

  it("rejects invalid times", () => {
    expect(parseBodyWeightTimeLocal("24:00")).toBeNull();
    expect(parseBodyWeightTimeLocal("8:00")).toBeNull();
  });
});

describe("resolveBodyWeightRecordedAt", () => {
  const now = new Date("2026-06-22T10:30:00.000Z");

  it("uses now for today's date", () => {
    expect(resolveBodyWeightRecordedAt("2026-06-22", now)?.toISOString()).toBe(now.toISOString());
  });

  it("uses noon israel time for past dates", () => {
    const recordedAt = resolveBodyWeightRecordedAt("2026-06-01", now);
    expect(recordedAt).toBeTruthy();
    expect(recordedAt!.getTime()).not.toBe(now.getTime());
  });
});

describe("buildProgressSeries", () => {
  it("includes body weight as the first chart option", () => {
    const series = buildProgressSeries([], [{ date: "2026-06-01T10:00:00.000Z", weight: 80, volume: 80 }]);
    expect(series).toHaveLength(1);
    expect(series[0]?.id).toBe(BODY_WEIGHT_PROGRESS_ID);
  });
});

describe("resolveBodyWeightCurrentDisplay", () => {
  it("falls back to questionnaire weight when there are no logs", () => {
    expect(resolveBodyWeightCurrentDisplay([], 82.5)).toEqual({
      latestWeightKg: 82.5,
      previousWeightKg: null,
    });
  });

  it("prefers the latest log over questionnaire weight", () => {
    expect(resolveBodyWeightCurrentDisplay([{ weightKg: 79 }, { weightKg: 81 }], 82.5)).toEqual({
      latestWeightKg: 79,
      previousWeightKg: 81,
    });
  });

  it("returns null when there is no log and no questionnaire weight", () => {
    expect(resolveBodyWeightCurrentDisplay([], null)).toEqual({
      latestWeightKg: null,
      previousWeightKg: null,
    });
  });
});

describe("body weight chart data", () => {
  it("appends questionnaire starting weight when no log exists on that day", () => {
    const logs = [
      {
        id: "1",
        weightKg: 80,
        recordedAt: new Date("2026-06-10T09:00:00.000Z"),
        recordedDay: "2026-06-10",
        notes: null,
      },
    ];

    const chartData = mapBodyWeightLogsToChartData(logs);
    const merged = appendQuestionnaireStartingWeight(chartData, {
      weightKg: 85,
      completedAt: new Date("2026-05-01T09:00:00.000Z"),
    });

    expect(merged).toHaveLength(2);
    expect(merged[0]?.weight).toBe(85);
    expect(merged[1]?.weight).toBe(80);
  });

  it("includes notes on chart points from logs", () => {
    const chartData = mapBodyWeightLogsToChartData([
      {
        id: "1",
        weightKg: 80,
        recordedAt: new Date("2026-06-10T09:00:00.000Z"),
        recordedDay: "2026-06-10",
        notes: "אחרי ארוחת בוקר",
      },
      {
        id: "2",
        weightKg: 79,
        recordedAt: new Date("2026-06-12T09:00:00.000Z"),
        recordedDay: "2026-06-12",
        notes: null,
      },
    ]);

    expect(chartData[0]?.notes).toBe("אחרי ארוחת בוקר");
    expect(chartData[1]?.notes).toBeNull();
  });
});
