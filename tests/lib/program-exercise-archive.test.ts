import { describe, expect, it } from "vitest";

import {
  applyActiveProgramFilters,
  filterActiveProgramExercises,
  isActiveProgramRow,
} from "@/lib/program-sections-persistence";
import { buildProgramSectionSyncPlan } from "@/lib/program-sections";

describe("program exercise archive filters", () => {
  it("treats missing or null archivedAt as active in application code", () => {
    expect(isActiveProgramRow(null)).toBe(true);
    expect(isActiveProgramRow(undefined)).toBe(true);
    expect(isActiveProgramRow(new Date())).toBe(false);
  });

  it("filters archived exercises after loading from Mongo", () => {
    const active = filterActiveProgramExercises([
      { id: "1", archivedAt: null },
      { id: "2", archivedAt: undefined },
      { id: "3", archivedAt: new Date("2026-06-01") },
    ]);

    expect(active.map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("filters nested program content for display", () => {
    const filtered = applyActiveProgramFilters({
      sections: [
        {
          id: "s1",
          archivedAt: null,
          exercises: [
            { id: "e1", archivedAt: null },
            { id: "e2", archivedAt: new Date("2026-06-01") },
          ],
        },
        {
          id: "s2",
          archivedAt: new Date("2026-06-01"),
          exercises: [{ id: "e3", archivedAt: null }],
        },
      ],
      exercises: [
        { id: "e1", archivedAt: null },
        { id: "e2", archivedAt: new Date("2026-06-01") },
      ],
    });

    expect(filtered.sections).toHaveLength(1);
    expect(filtered.sections[0]?.exercises.map((exercise) => exercise.id)).toEqual(["e1"]);
    expect(filtered.exercises.map((exercise) => exercise.id)).toEqual(["e1"]);
  });
});

describe("buildProgramSectionSyncPlan archive semantics", () => {
  it("deletes entire section when no exercises have logs", () => {
    const plan = buildProgramSectionSyncPlan(
      [
        {
          id: "s1",
          name: "חזה",
          sortOrder: 0,
          exercises: [{ id: "e1", name: "A", logCount: 0 }],
        },
      ],
      [],
    );

    expect(plan.sectionsToDelete).toEqual(["s1"]);
    expect(plan.sectionsToArchive).toEqual([]);
    expect(plan.exercisesToArchive).toEqual([]);
    expect(plan.exercisesToDelete).toContain("e1");
  });

  it("keeps archived and active exercise removals disjoint", () => {
    const plan = buildProgramSectionSyncPlan(
      [
        {
          id: "s1",
          name: "גב",
          sortOrder: 0,
          exercises: [
            { id: "e1", name: "משיכה", logCount: 3 },
            { id: "e2", name: "חתירה", logCount: 0 },
          ],
        },
      ],
      [],
    );

    expect(plan.exercisesToArchive).toEqual(["e1"]);
    expect(plan.exercisesToDelete).toEqual(["e2"]);
    expect(plan.exercisesToArchive).not.toContain("e2");
    expect(plan.exercisesToDelete).not.toContain("e1");
  });
});
