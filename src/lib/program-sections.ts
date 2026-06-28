export const DEFAULT_PROGRAM_SECTION_NAME = "כללי";

export type ProgramExerciseInput = {
  id?: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  coachNotes?: string;
  youtubeUrl?: string;
  instructions?: string;
  sortOrder?: number;
};

export type ProgramSectionInput = {
  id?: string;
  name: string;
  exercises: ProgramExerciseInput[];
};

export type ProgramExerciseRecord = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  coachNotes: string | null;
  youtubeUrl: string | null;
  instructions: string | null;
  sortOrder: number;
  sectionId: string | null;
};

export type ProgramSectionRecord = {
  id: string;
  name: string;
  sortOrder: number;
  exercises: ProgramExerciseRecord[];
};

export type ProgramSectionDisplay = {
  id: string;
  name: string;
  sortOrder: number;
  exercises: ProgramExerciseRecord[];
};

export type ExistingProgramSection = {
  id: string;
  name: string;
  sortOrder: number;
  exercises: Array<{
    id: string;
    name: string;
    logCount: number;
  }>;
};

export type ProgramSectionSyncPlan = {
  sectionsToDelete: string[];
  sectionsToArchive: string[];
  exercisesToDelete: string[];
  exercisesToArchive: string[];
};

function classifyRemovedExercises(
  exercises: ExistingProgramSection["exercises"],
  exercisesToDelete: string[],
  exercisesToArchive: string[],
) {
  let hasArchived = false;

  for (const exercise of exercises) {
    if (exercise.logCount > 0) {
      exercisesToArchive.push(exercise.id);
      hasArchived = true;
    } else {
      exercisesToDelete.push(exercise.id);
    }
  }

  return hasArchived;
}

export function parseProgramSectionsJson(json: string): ProgramSectionInput[] | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as ProgramSectionInput[];
  } catch {
    return null;
  }
}

/** Backward-compatible: flat exercises array → single default section. */
export function legacyExercisesToSections(exercises: ProgramExerciseInput[]): ProgramSectionInput[] {
  return [
    {
      name: DEFAULT_PROGRAM_SECTION_NAME,
      exercises,
    },
  ];
}

export function parseLegacyExercisesJson(json: string): ProgramExerciseInput[] | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as ProgramExerciseInput[];
  } catch {
    return null;
  }
}

export function parseProgramSectionsPayload(
  sectionsJson: string,
  legacyExercisesJson?: string,
): { sections: ProgramSectionInput[] } | { error: string } {
  const trimmedSectionsJson = sectionsJson.trim();

  if (trimmedSectionsJson) {
    const sections = parseProgramSectionsJson(trimmedSectionsJson);
    if (!sections) {
      return { error: "נתוני מקטעים לא תקינים" };
    }
    if (sections.length > 0) {
      return { sections };
    }
  }

  if (legacyExercisesJson?.trim()) {
    const exercises = parseLegacyExercisesJson(legacyExercisesJson);
    if (exercises) {
      return { sections: legacyExercisesToSections(exercises) };
    }
  }

  return { error: "נתוני מקטעים לא תקינים" };
}

export function validateProgramSections(sections: ProgramSectionInput[]): string | null {
  if (sections.length === 0) {
    return "יש להוסיף לפחות מקטע אחד";
  }

  for (const [sectionIndex, section] of sections.entries()) {
    const sectionLabel = section.name.trim() || `מקטע ${sectionIndex + 1}`;

    if (!section.name.trim()) {
      return "יש להזין שם לכל מקטע (קבוצת שרירים)";
    }

    if (!section.exercises?.length) {
      return `יש להוסיף לפחות תרגיל אחד במקטע "${sectionLabel}"`;
    }

    for (const [exerciseIndex, exercise] of section.exercises.entries()) {
      if (!exercise.name?.trim()) {
        return `יש להזין שם תרגיל במקטע "${sectionLabel}" (תרגיל ${exerciseIndex + 1})`;
      }
      if (!Number.isFinite(exercise.sets) || exercise.sets < 1) {
        return `מספר סטים לא תקין בתרגיל "${exercise.name.trim()}"`;
      }
      if (!Number.isFinite(exercise.reps) || exercise.reps < 1) {
        return `מספר חזרות לא תקין בתרגיל "${exercise.name.trim()}"`;
      }
      if (!Number.isFinite(exercise.restSeconds) || exercise.restSeconds < 0) {
        return `זמן מנוחה לא תקין בתרגיל "${exercise.name.trim()}"`;
      }
    }
  }

  return null;
}

export function assignGlobalExerciseSortOrders(
  sections: ProgramSectionInput[],
): Array<ProgramSectionInput & { exercises: Array<ProgramExerciseInput & { sortOrder: number }> }> {
  let sortOrder = 0;

  return sections.map((section) => ({
    ...section,
    exercises: section.exercises.map((exercise) => ({
      ...exercise,
      sortOrder: sortOrder++,
    })),
  }));
}

export function flattenSectionsToExercises<
  T extends { sortOrder: number },
>(sections: Array<{ exercises: T[] }>): T[] {
  return sections.flatMap((section) =>
    [...section.exercises].sort((a, b) => a.sortOrder - b.sortOrder),
  );
}

export function buildProgramSectionDisplay(
  sections: ProgramSectionRecord[],
  orphanExercises: ProgramExerciseRecord[] = [],
): ProgramSectionDisplay[] {
  const sortedOrphans = [...orphanExercises].sort((a, b) => a.sortOrder - b.sortOrder);
  const orderedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  const orphansBySectionId = new Map<string, ProgramExerciseRecord[]>();
  for (const exercise of sortedOrphans) {
    if (!exercise.sectionId) continue;
    const list = orphansBySectionId.get(exercise.sectionId) ?? [];
    list.push(exercise);
    orphansBySectionId.set(exercise.sectionId, list);
  }

  const assignedExerciseIds = new Set<string>();

  const displaySections = orderedSections.map((section) => {
    const mergedExercises = [...section.exercises];
    const nestedIds = new Set(section.exercises.map((exercise) => exercise.id));

    for (const exercise of orphansBySectionId.get(section.id) ?? []) {
      if (nestedIds.has(exercise.id)) continue;
      mergedExercises.push(exercise);
    }

    mergedExercises.sort((a, b) => a.sortOrder - b.sortOrder);
    mergedExercises.forEach((exercise) => assignedExerciseIds.add(exercise.id));

    return {
      id: section.id,
      name: section.name,
      sortOrder: section.sortOrder,
      exercises: mergedExercises,
    };
  });

  const unassignedExercises = sortedOrphans.filter(
    (exercise) => !assignedExerciseIds.has(exercise.id),
  );

  if (orderedSections.length === 0 && unassignedExercises.length > 0) {
    return [
      {
        id: "legacy",
        name: DEFAULT_PROGRAM_SECTION_NAME,
        sortOrder: 0,
        exercises: unassignedExercises,
      },
    ];
  }

  if (unassignedExercises.length > 0 && displaySections.length > 0) {
    const generalIndex = displaySections.findIndex(
      (section) => section.name === DEFAULT_PROGRAM_SECTION_NAME,
    );
    const targetIndex = generalIndex >= 0 ? generalIndex : 0;
    const targetSection = displaySections[targetIndex];

    displaySections[targetIndex] = {
      ...targetSection,
      exercises: [...targetSection.exercises, ...unassignedExercises].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    };
  }

  return displaySections;
}

export function buildProgramSectionSyncPlan(
  existingSections: ExistingProgramSection[],
  submittedSections: ProgramSectionInput[],
): ProgramSectionSyncPlan {
  const submittedSectionIds = new Set(
    submittedSections.map((section) => section.id).filter((id): id is string => Boolean(id)),
  );

  const submittedExerciseIds = new Set(
    submittedSections.flatMap((section) =>
      section.exercises.map((exercise) => exercise.id).filter((id): id is string => Boolean(id)),
    ),
  );

  const sectionsToDelete: string[] = [];
  const sectionsToArchive: string[] = [];
  const exercisesToDelete: string[] = [];
  const exercisesToArchive: string[] = [];

  for (const existingSection of existingSections) {
    if (submittedSectionIds.has(existingSection.id)) continue;

    const hasArchived = classifyRemovedExercises(
      existingSection.exercises,
      exercisesToDelete,
      exercisesToArchive,
    );

    if (hasArchived) {
      sectionsToArchive.push(existingSection.id);
    } else {
      sectionsToDelete.push(existingSection.id);
    }
  }

  for (const existingSection of existingSections) {
    if (sectionsToDelete.includes(existingSection.id)) continue;
    if (sectionsToArchive.includes(existingSection.id)) continue;

    for (const exercise of existingSection.exercises) {
      if (submittedExerciseIds.has(exercise.id)) continue;
      classifyRemovedExercises([exercise], exercisesToDelete, exercisesToArchive);
    }
  }

  return {
    sectionsToDelete,
    sectionsToArchive,
    exercisesToDelete: [...new Set(exercisesToDelete)],
    exercisesToArchive: [...new Set(exercisesToArchive)],
  };
}

export function getProgramSectionSyncError(): string | null {
  return null;
}

export function sectionsToFormSections(
  sections: ProgramSectionDisplay[],
): ProgramSectionInput[] {
  return sections.map((section) => ({
    id: section.id === "legacy" ? undefined : section.id,
    name: section.name,
    exercises: section.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      restSeconds: exercise.restSeconds,
      coachNotes: exercise.coachNotes ?? "",
      youtubeUrl: exercise.youtubeUrl ?? "",
      instructions: exercise.instructions ?? "",
    })),
  }));
}

export type LogWorkoutExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
};

export type LogWorkoutSection = {
  id: string;
  name: string;
  exercises: LogWorkoutExercise[];
};

export function buildLogWorkoutSections(
  sections: ProgramSectionRecord[],
  exercises: ProgramExerciseRecord[],
): LogWorkoutSection[] {
  return buildProgramSectionDisplay(sections, exercises).map((section) => ({
    id: section.id,
    name: section.name,
    exercises: section.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      restSeconds: exercise.restSeconds,
    })),
  }));
}
