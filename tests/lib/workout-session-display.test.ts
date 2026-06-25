import { describe, expect, it } from "vitest";

import { DEFAULT_PROGRAM_SECTION_NAME } from "@/lib/program-sections";
import {
  groupSessionLogsBySection,
  type SessionLogForGrouping,
} from "@/lib/workout-session-display";

function makeLog(
  id: string,
  exerciseName: string,
  sortOrder: number,
  section?: { id: string; name: string; sortOrder: number } | null,
): SessionLogForGrouping {
  return {
    id,
    weightKg: 50,
    repsCompleted: 10,
    exercise: {
      name: exerciseName,
      sortOrder,
      sectionId: section?.id ?? null,
      section: section ?? null,
    },
    setLogs: [{ setNumber: 1, weightKg: 50, repsCompleted: 10 }],
  };
}

describe("groupSessionLogsBySection", () => {
  it("groups logs under section headers and preserves exercise order within section", () => {
    const groups = groupSessionLogsBySection([
      makeLog("l1", "לחיצה", 0, { id: "s1", name: "חזה", sortOrder: 0 }),
      makeLog("l2", "פרפר", 1, { id: "s1", name: "חזה", sortOrder: 0 }),
      makeLog("l3", "משיכה", 0, { id: "s2", name: "גב", sortOrder: 1 }),
    ]);

    expect(groups.map((group) => group.name)).toEqual(["חזה", "גב"]);
    expect(groups[0].logs.map((log) => log.exercise.name)).toEqual(["לחיצה", "פרפר"]);
    expect(groups[1].logs.map((log) => log.exercise.name)).toEqual(["משיכה"]);
  });

  it("places logs without section under the default legacy section name", () => {
    const groups = groupSessionLogsBySection([
      makeLog("l1", "סקוואט", 0, null),
      makeLog("l2", "לאנג'", 1, null),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe(DEFAULT_PROGRAM_SECTION_NAME);
    expect(groups[0].logs.map((log) => log.exercise.name)).toEqual(["סקוואט", "לאנג'"]);
  });
});
