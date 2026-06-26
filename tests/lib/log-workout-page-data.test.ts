import { describe, expect, it } from "vitest";

import { resolveLogWorkoutSelectedProgramId } from "@/lib/log-workout-page-data";

describe("resolveLogWorkoutSelectedProgramId", () => {
  const summaries = [
    { id: "program-a" },
    { id: "program-b" },
    { id: "program-c" },
  ];

  it("returns null when there are no programs", () => {
    expect(resolveLogWorkoutSelectedProgramId([], "program-a")).toBeNull();
  });

  it("returns the first program by default", () => {
    expect(resolveLogWorkoutSelectedProgramId(summaries)).toBe("program-a");
    expect(resolveLogWorkoutSelectedProgramId(summaries, undefined)).toBe("program-a");
  });

  it("returns the preferred program when it exists", () => {
    expect(resolveLogWorkoutSelectedProgramId(summaries, "program-b")).toBe("program-b");
  });

  it("falls back to the first program when preferred id is invalid", () => {
    expect(resolveLogWorkoutSelectedProgramId(summaries, "missing")).toBe("program-a");
  });
});
