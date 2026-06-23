import { describe, expect, it } from "vitest";

import { computeSleepHours, formatSleepRange, sleepHoursToRange } from "@/lib/sleep-validation";
import { formatStepsDisplay, parseSteps } from "@/lib/steps-validation";
import { formatWaterDisplay, litersToMl, mlToLitersInput, parseWaterAmountMl } from "@/lib/water-validation";
import { parseMeasurementsForm } from "@/lib/measurements-validation";
import { parseWaterTimesLocal, parseTrackingTimeLocal, sanitizeTimeInputDraft, normalizeTimeInputValue } from "@/lib/tracking-validation";

describe("parseWaterAmountMl", () => {
  it("accepts valid ml values", () => {
    expect(parseWaterAmountMl("2000")).toBe(2000);
  });

  it("rejects non-integers", () => {
    expect(parseWaterAmountMl("1.5")).toBeNull();
  });
});

describe("water display", () => {
  it("formats ml and liters", () => {
    expect(formatWaterDisplay(2000)).toContain("2");
    expect(formatWaterDisplay(2000)).toContain('מ"ל');
  });

  it("converts between ml and liters", () => {
    expect(litersToMl(2)).toBe(2000);
    expect(mlToLitersInput(2000)).toBe(2);
  });
});

describe("computeSleepHours", () => {
  it("handles same-day sleep", () => {
    expect(computeSleepHours("23:00", "07:00")).toBe(8);
  });

  it("handles short naps", () => {
    expect(computeSleepHours("13:00", "14:30")).toBe(1.5);
  });
});

describe("formatSleepRange", () => {
  it("formats range string", () => {
    expect(formatSleepRange("22:30", "06:45")).toBe("22:30 – 06:45");
  });
});

describe("sleepHoursToRange", () => {
  it("derives sleep start from hours and wake time", () => {
    expect(sleepHoursToRange(8, "07:00")).toEqual({
      sleepStart: "23:00",
      sleepEnd: "07:00",
    });
  });
});

describe("parseMeasurementsForm", () => {
  it("requires at least one measurement", () => {
    const formData = new FormData();
    formData.set("bellyCm", "");
    expect(parseMeasurementsForm(formData).error).toBe("יש להזין לפחות היקף אחד");
  });

  it("parses valid measurements", () => {
    const formData = new FormData();
    formData.set("chestCm", "100");
    const result = parseMeasurementsForm(formData);
    expect("values" in result && result.values?.chestCm).toBe(100);
  });
});

describe("parseSteps", () => {
  it("accepts valid integers", () => {
    expect(parseSteps("8500")).toBe(8500);
  });

  it("rejects decimals", () => {
    expect(parseSteps("8500.5")).toBeNull();
  });
});

describe("formatStepsDisplay", () => {
  it("formats with locale grouping", () => {
    expect(formatStepsDisplay(10000)).toContain("10");
  });
});

describe("parseWaterTimesLocal", () => {
  it("accepts up to three unique times", () => {
    expect(parseWaterTimesLocal(["08:00", "12:00", "20:00", "20:00"])).toEqual([
      "08:00",
      "12:00",
      "20:00",
    ]);
  });

  it("rejects invalid times", () => {
    expect(parseWaterTimesLocal(["invalid"])).toBeNull();
  });
});

describe("parseTrackingTimeLocal", () => {
  it("validates HH:mm", () => {
    expect(parseTrackingTimeLocal("08:30")).toBe("08:30");
    expect(parseTrackingTimeLocal("17:30")).toBe("17:30");
    expect(parseTrackingTimeLocal("24:00")).toBeNull();
  });
});

describe("sanitizeTimeInputDraft", () => {
  it("formats digits as 24h time while typing", () => {
    expect(sanitizeTimeInputDraft("1730")).toBe("17:30");
    expect(sanitizeTimeInputDraft("9")).toBe("9");
  });
});

describe("normalizeTimeInputValue", () => {
  it("pads hours and minutes", () => {
    expect(normalizeTimeInputValue("9:30")).toBe("09:30");
    expect(normalizeTimeInputValue("17:5")).toBe("17:05");
  });
});
