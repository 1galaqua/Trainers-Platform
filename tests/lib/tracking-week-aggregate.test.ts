import { describe, expect, it } from "vitest";

import { mapTrackingWeekFacetResultsForTests } from "@/lib/tracking-week-aggregate";

describe("mapTrackingWeekFacetResultsForTests", () => {
  it("maps facet branches into week log payload fields", () => {
    const payload = mapTrackingWeekFacetResultsForTests({
      bodyWeightLogs: [{ recordedDay: "2026-06-21", weightKg: 80 }],
      sleepLogs: [{ recordedDay: "2026-06-21", sleepStart: "23:00", sleepEnd: "07:00" }],
      waterLogs: [{ recordedDay: "2026-06-22", amountMl: 2500 }],
      stepsLogs: [{ recordedDay: "2026-06-23", steps: 9000 }],
      caloriesLogs: [{ recordedDay: "2026-06-24", calories: 2100 }],
      measurementsLogs: [{ recordedDay: "2026-06-21", chestCm: 100, bellyCm: 90 }],
    });

    expect(payload.bodyWeightLogs[0]?.weightKg).toBe(80);
    expect(payload.sleepLogs[0]?.sleepEnd).toBe("07:00");
    expect(payload.waterLogs[0]?.amountMl).toBe(2500);
    expect(payload.stepsLogs[0]?.steps).toBe(9000);
    expect(payload.caloriesLogs[0]?.calories).toBe(2100);
    expect(payload.measurementsLogs[0]?.chestCm).toBe(100);
    expect(payload.measurementsLogs[0]?.bellyCm).toBe(90);
  });

  it("returns empty arrays for missing facet branches", () => {
    const payload = mapTrackingWeekFacetResultsForTests({});
    expect(payload.bodyWeightLogs).toEqual([]);
    expect(payload.measurementsLogs).toEqual([]);
  });
});
