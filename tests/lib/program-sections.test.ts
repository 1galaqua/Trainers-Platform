import { describe, expect, it } from "vitest";

import {
  buildLogWorkoutSections,
  DEFAULT_PROGRAM_SECTION_NAME,
  assignGlobalExerciseSortOrders,
  buildProgramSectionDisplay,
  buildProgramSectionSyncPlan,
  flattenSectionsToExercises,
  getProgramSectionSyncError,
  legacyExercisesToSections,
  parseLegacyExercisesJson,
  parseProgramSectionsJson,
  parseProgramSectionsPayload,
  sectionsToFormSections,
  validateProgramSections,
  type ProgramExerciseInput,
  type ProgramSectionInput,
} from "@/lib/program-sections";

const sampleExercise = (overrides: Partial<ProgramExerciseInput> = {}): ProgramExerciseInput => ({
  name: "סקוואט",
  sets: 3,
  reps: 10,
  restSeconds: 60,
  ...overrides,
});

const sampleSection = (overrides: Partial<ProgramSectionInput> = {}): ProgramSectionInput => ({
  name: "רגליים",
  exercises: [sampleExercise()],
  ...overrides,
});

describe("program sections parsing", () => {
  it("parses valid sections json", () => {
    const sections = [sampleSection({ name: "חזה" })];
    expect(parseProgramSectionsJson(JSON.stringify(sections))).toEqual(sections);
  });

  it("returns null for invalid sections json", () => {
    expect(parseProgramSectionsJson("{")).toBeNull();
    expect(parseProgramSectionsJson(JSON.stringify({}))).toBeNull();
  });

  it("wraps legacy flat exercises in default section", () => {
    const exercises = [sampleExercise({ name: "לחיצה" })];
    expect(legacyExercisesToSections(exercises)).toEqual([
      {
        name: DEFAULT_PROGRAM_SECTION_NAME,
        exercises,
      },
    ]);
  });

  it("accepts legacy exercises payload when sections field is missing", () => {
    const exercises = [sampleExercise({ name: "דדלift" })];
    const result = parseProgramSectionsPayload("[]", JSON.stringify(exercises));
    expect(result).toEqual({
      sections: [
        {
          name: DEFAULT_PROGRAM_SECTION_NAME,
          exercises,
        },
      ],
    });
  });

  it("prefers sections payload over legacy exercises", () => {
    const sections = [sampleSection({ name: "גב" })];
    const legacy = [sampleExercise({ name: "ישן" })];
    const result = parseProgramSectionsPayload(JSON.stringify(sections), JSON.stringify(legacy));
    expect(result).toEqual({ sections });
  });

  it("parses legacy exercises json helper", () => {
    const exercises = [sampleExercise()];
    expect(parseLegacyExercisesJson(JSON.stringify(exercises))).toEqual(exercises);
  });
});

describe("validateProgramSections", () => {
  it("accepts valid sections", () => {
    expect(validateProgramSections([sampleSection()])).toBeNull();
  });

  it("requires at least one section", () => {
    expect(validateProgramSections([])).toBe("יש להוסיף לפחות מקטע אחד");
  });

  it("requires section name", () => {
    expect(validateProgramSections([sampleSection({ name: "   " })])).toBe(
      "יש להזין שם לכל מקטע (קבוצת שרירים)",
    );
  });

  it("requires at least one exercise per section", () => {
    expect(validateProgramSections([sampleSection({ exercises: [] })])).toBe(
      'יש להוסיף לפחות תרגיל אחד במקטע "רגליים"',
    );
  });

  it("requires exercise name", () => {
    expect(
      validateProgramSections([
        sampleSection({ exercises: [sampleExercise({ name: "  " })] }),
      ]),
    ).toMatch(/יש להזין שם תרגיל/);
  });

  it("validates sets, reps and rest like existing exercise rules", () => {
    expect(
      validateProgramSections([
        sampleSection({ exercises: [sampleExercise({ sets: 0 })] }),
      ]),
    ).toMatch(/מספר סטים לא תקין/);

    expect(
      validateProgramSections([
        sampleSection({ exercises: [sampleExercise({ reps: 0 })] }),
      ]),
    ).toMatch(/מספר חזרות לא תקין/);

    expect(
      validateProgramSections([
        sampleSection({ exercises: [sampleExercise({ restSeconds: -1 })] }),
      ]),
    ).toMatch(/זמן מנוחה לא תקין/);
  });
});

describe("assignGlobalExerciseSortOrders", () => {
  it("assigns continuous global sort order across sections", () => {
    const sections = assignGlobalExerciseSortOrders([
      sampleSection({
        name: "חזה",
        exercises: [sampleExercise({ name: "A" }), sampleExercise({ name: "B" })],
      }),
      sampleSection({
        name: "גב",
        exercises: [sampleExercise({ name: "C" })],
      }),
    ]);

    expect(sections[0].exercises.map((exercise) => exercise.sortOrder)).toEqual([0, 1]);
    expect(sections[1].exercises[0].sortOrder).toBe(2);
  });

  it("preserves backward-compatible flat exercise order semantics", () => {
    const legacyFlat = [
      sampleExercise({ name: "ex-1" }),
      sampleExercise({ name: "ex-2" }),
      sampleExercise({ name: "ex-3" }),
    ];
    const ordered = assignGlobalExerciseSortOrders(legacyExercisesToSections(legacyFlat));
    const flat = flattenSectionsToExercises(ordered);

    expect(flat.map((exercise) => exercise.name)).toEqual(["ex-1", "ex-2", "ex-3"]);
    expect(flat.map((exercise) => exercise.sortOrder)).toEqual([0, 1, 2]);
  });
});

describe("buildProgramSectionDisplay", () => {
  it("groups exercises under their sections", () => {
    const display = buildProgramSectionDisplay(
      [
        {
          id: "s1",
          name: "חזה",
          sortOrder: 0,
          exercises: [
            {
              id: "e1",
              name: "לחיצה",
              sets: 3,
              reps: 10,
              restSeconds: 60,
              coachNotes: null,
              youtubeUrl: null,
              instructions: null,
              sortOrder: 0,
              sectionId: "s1",
            },
          ],
        },
      ],
      [],
    );

    expect(display).toHaveLength(1);
    expect(display[0].name).toBe("חזה");
    expect(display[0].exercises[0].name).toBe("לחיצה");
  });

  it("wraps orphan exercises in default legacy section", () => {
    const display = buildProgramSectionDisplay(
      [],
      [
        {
          id: "e1",
          name: "סקוואט",
          sets: 4,
          reps: 8,
          restSeconds: 90,
          coachNotes: null,
          youtubeUrl: null,
          instructions: null,
          sortOrder: 0,
          sectionId: null,
        },
      ],
    );

    expect(display).toEqual([
      expect.objectContaining({
        id: "legacy",
        name: DEFAULT_PROGRAM_SECTION_NAME,
        exercises: [expect.objectContaining({ name: "סקוואט" })],
      }),
    ]);
  });

  it("merges orphan exercises into an existing default section shell", () => {
    const display = buildProgramSectionDisplay(
      [
        {
          id: "s1",
          name: DEFAULT_PROGRAM_SECTION_NAME,
          sortOrder: 0,
          exercises: [],
        },
      ],
      [
        {
          id: "e1",
          name: "לחיצה",
          sets: 3,
          reps: 10,
          restSeconds: 60,
          coachNotes: null,
          youtubeUrl: null,
          instructions: null,
          sortOrder: 0,
          sectionId: null,
        },
        {
          id: "e2",
          name: "פרפר",
          sets: 3,
          reps: 12,
          restSeconds: 45,
          coachNotes: null,
          youtubeUrl: null,
          instructions: null,
          sortOrder: 1,
          sectionId: null,
        },
      ],
    );

    expect(display).toHaveLength(1);
    expect(display[0].name).toBe(DEFAULT_PROGRAM_SECTION_NAME);
    expect(display[0].exercises.map((exercise) => exercise.name)).toEqual(["לחיצה", "פרפר"]);
  });

  it("resets exercise numbering per section in display order", () => {
    const display = buildProgramSectionDisplay(
      [
        {
          id: "s1",
          name: "חזה",
          sortOrder: 0,
          exercises: [
            {
              id: "e1",
              name: "A",
              sets: 3,
              reps: 10,
              restSeconds: 60,
              coachNotes: null,
              youtubeUrl: null,
              instructions: null,
              sortOrder: 0,
              sectionId: "s1",
            },
            {
              id: "e2",
              name: "B",
              sets: 3,
              reps: 10,
              restSeconds: 60,
              coachNotes: null,
              youtubeUrl: null,
              instructions: null,
              sortOrder: 1,
              sectionId: "s1",
            },
          ],
        },
        {
          id: "s2",
          name: "גב",
          sortOrder: 1,
          exercises: [
            {
              id: "e3",
              name: "C",
              sets: 3,
              reps: 10,
              restSeconds: 60,
              coachNotes: null,
              youtubeUrl: null,
              instructions: null,
              sortOrder: 2,
              sectionId: "s2",
            },
          ],
        },
      ],
      [],
    );

    expect(display[0].exercises.map((exercise) => exercise.name)).toEqual(["A", "B"]);
    expect(display[1].exercises.map((exercise) => exercise.name)).toEqual(["C"]);
  });
});

describe("buildProgramSectionSyncPlan", () => {
  it("marks removed sections and their exercises for deletion", () => {
    const plan = buildProgramSectionSyncPlan(
      [
        {
          id: "s1",
          name: "חזה",
          sortOrder: 0,
          exercises: [{ id: "e1", name: "A", logCount: 0 }],
        },
        {
          id: "s2",
          name: "גב",
          sortOrder: 1,
          exercises: [{ id: "e2", name: "B", logCount: 0 }],
        },
      ],
      [sampleSection({ id: "s1", name: "חזה", exercises: [sampleExercise({ id: "e1", name: "A" })] })],
    );

    expect(plan.sectionsToDelete).toEqual(["s2"]);
    expect(plan.exercisesToDelete).toContain("e2");
    expect(getProgramSectionSyncError()).toBeNull();
  });

  it("archives removed section exercises with logs and deletes those without", () => {
    const plan = buildProgramSectionSyncPlan(
      [
        {
          id: "s1",
          name: "רגליים",
          sortOrder: 0,
          exercises: [
            { id: "e1", name: "סקוואט", logCount: 2 },
            { id: "e2", name: "לחיצה", logCount: 0 },
          ],
        },
      ],
      [],
    );

    expect(plan.sectionsToArchive).toEqual(["s1"]);
    expect(plan.sectionsToDelete).toEqual([]);
    expect(plan.exercisesToArchive).toEqual(["e1"]);
    expect(plan.exercisesToDelete).toContain("e2");
    expect(getProgramSectionSyncError()).toBeNull();
  });

  it("archives removed exercise with logs and deletes exercise without logs", () => {
    const plan = buildProgramSectionSyncPlan(
      [
        {
          id: "s1",
          name: "חזה",
          sortOrder: 0,
          exercises: [
            { id: "e1", name: "A", logCount: 0 },
            { id: "e2", name: "B", logCount: 1 },
          ],
        },
      ],
      [
        sampleSection({
          id: "s1",
          name: "חזה",
          exercises: [sampleExercise({ id: "e1", name: "A" })],
        }),
      ],
    );

    expect(plan.sectionsToDelete).toEqual([]);
    expect(plan.sectionsToArchive).toEqual([]);
    expect(plan.exercisesToArchive).toEqual(["e2"]);
    expect(plan.exercisesToDelete).not.toContain("e2");
    expect(getProgramSectionSyncError()).toBeNull();
  });
});

describe("sectionsToFormSections", () => {
  it("maps display sections back to editable form shape", () => {
    const formSections = sectionsToFormSections([
      {
        id: "s1",
        name: "כללי",
        sortOrder: 0,
        exercises: [
          {
            id: "e1",
            name: "סקוואט",
            sets: 3,
            reps: 10,
            restSeconds: 60,
            coachNotes: "slow",
            youtubeUrl: "https://youtube.com/x",
            instructions: "desc",
            sortOrder: 0,
            sectionId: "s1",
          },
        ],
      },
    ]);

    expect(formSections[0]).toEqual({
      id: "s1",
      name: "כללי",
      exercises: [
        {
          id: "e1",
          name: "סקוואט",
          sets: 3,
          reps: 10,
          restSeconds: 60,
          coachNotes: "slow",
          youtubeUrl: "https://youtube.com/x",
          instructions: "desc",
        },
      ],
    });
  });

  it("omits legacy pseudo-section id when mapping to form", () => {
    const formSections = sectionsToFormSections([
      {
        id: "legacy",
        name: DEFAULT_PROGRAM_SECTION_NAME,
        sortOrder: 0,
        exercises: [
          {
            id: "e1",
            name: "A",
            sets: 3,
            reps: 10,
            restSeconds: 60,
            coachNotes: null,
            youtubeUrl: null,
            instructions: null,
            sortOrder: 0,
            sectionId: null,
          },
        ],
      },
    ]);

    expect(formSections[0].id).toBeUndefined();
    expect(formSections[0].name).toBe(DEFAULT_PROGRAM_SECTION_NAME);
  });
});

describe("buildLogWorkoutSections", () => {
  it("maps display sections to log workout sections", () => {
    const sections = buildLogWorkoutSections(
      [
        {
          id: "s1",
          name: "חזה",
          sortOrder: 0,
          exercises: [],
        },
      ],
      [
        {
          id: "e1",
          name: "לחיצה",
          sets: 3,
          reps: 10,
          restSeconds: 60,
          coachNotes: null,
          youtubeUrl: null,
          instructions: null,
          sortOrder: 0,
          sectionId: null,
        },
      ],
    );

    expect(sections).toEqual([
      {
        id: "s1",
        name: "חזה",
        exercises: [
          {
            id: "e1",
            name: "לחיצה",
            sets: 3,
            reps: 10,
            restSeconds: 60,
          },
        ],
      },
    ]);
  });
});

describe("regression: legacy single-section programs", () => {
  it("keep the same exercise sequence when only one default section exists", () => {
    const payload = parseProgramSectionsPayload(
      "",
      JSON.stringify([
        { name: "תרגיל 1", sets: 3, reps: 10, restSeconds: 60 },
        { name: "תרגיל 2", sets: 4, reps: 8, restSeconds: 90 },
      ]),
    );

    expect(payload).toEqual({
      sections: [
        {
          name: DEFAULT_PROGRAM_SECTION_NAME,
          exercises: [
            { name: "תרגיל 1", sets: 3, reps: 10, restSeconds: 60 },
            { name: "תרגיל 2", sets: 4, reps: 8, restSeconds: 90 },
          ],
        },
      ],
    });

    if (!("sections" in payload)) throw new Error("expected sections");
    expect(validateProgramSections(payload.sections)).toBeNull();
  });
});
