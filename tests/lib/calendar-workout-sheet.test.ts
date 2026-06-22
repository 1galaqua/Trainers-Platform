import { describe, expect, it } from "vitest";

import {
  filterTraineesByNameAndIds,
  normalizeTraineeNameSearch,
  traineeNameMatchesSearch,
} from "@/lib/trainee-name-search";
import {
  workoutSheetContentClassName,
  workoutSheetScrollClassName,
} from "@/features/calendar/components/workout-sheet-layout";

describe("normalizeTraineeNameSearch", () => {
  it("trims and lowercases the query", () => {
    expect(normalizeTraineeNameSearch("  דני  ")).toBe("דני");
    expect(normalizeTraineeNameSearch("YoAv")).toBe("yoav");
  });
});

describe("traineeNameMatchesSearch", () => {
  it("matches partial Hebrew names case-insensitively", () => {
    expect(traineeNameMatchesSearch("דני כהן", "דני")).toBe(true);
    expect(traineeNameMatchesSearch("דני כהן", "כהן")).toBe(true);
    expect(traineeNameMatchesSearch("Dana Levi", "levi")).toBe(true);
  });

  it("returns all names when search is empty", () => {
    expect(traineeNameMatchesSearch("דני כהן", "")).toBe(true);
    expect(traineeNameMatchesSearch("דני כהן", "   ")).toBe(true);
  });

  it("returns false when no match", () => {
    expect(traineeNameMatchesSearch("דני כהן", "משה")).toBe(false);
  });
});

describe("filterTraineesByNameAndIds", () => {
  const trainees = [
    { id: "1", name: "דני כהן" },
    { id: "2", name: "מיכל לוי" },
    { id: "3", name: "יואב שמש" },
  ];

  it("filters by name and excludes selected ids", () => {
    expect(filterTraineesByNameAndIds(trainees, "מיכל", ["3"])).toEqual([
      { id: "2", name: "מיכל לוי" },
    ]);
  });

  it("returns all non-excluded trainees when search is empty", () => {
    expect(filterTraineesByNameAndIds(trainees, "", ["1"])).toEqual([
      { id: "2", name: "מיכל לוי" },
      { id: "3", name: "יואב שמש" },
    ]);
  });
});

describe("workout sheet mobile layout classes", () => {
  it("locks sheet body to vertical scroll only on mobile viewports", () => {
    expect(workoutSheetContentClassName).toContain("overflow-hidden");
    expect(workoutSheetContentClassName).toContain("max-h-[100dvh]");
    expect(workoutSheetContentClassName).toContain("flex-col");
    expect(workoutSheetScrollClassName).toContain("overflow-y-auto");
    expect(workoutSheetScrollClassName).toContain("overflow-x-hidden");
    expect(workoutSheetScrollClassName).toContain("overscroll-y-contain");
  });
});
