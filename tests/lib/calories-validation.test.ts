import { describe, expect, it } from "vitest";

import { formatCaloriesDisplay, parseCalories } from "@/lib/calories-validation";

describe("parseCalories", () => {
  it("accepts valid integers", () => {
    expect(parseCalories("2000")).toBe(2000);
    expect(parseCalories(1500)).toBe(1500);
  });

  it("rejects invalid values", () => {
    expect(parseCalories("abc")).toBeNull();
    expect(parseCalories("2000.5")).toBeNull();
    expect(parseCalories(-1)).toBeNull();
  });
});

describe("formatCaloriesDisplay", () => {
  it("formats with Hebrew locale and unit", () => {
    expect(formatCaloriesDisplay(2000)).toContain("קק");
  });
});
