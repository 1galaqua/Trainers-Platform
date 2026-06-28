import {
  DEFAULT_PROGRAM_SECTION_NAME,
  type ProgramExerciseRecord,
  type ProgramSectionRecord,
} from "@/lib/program-sections";
import { prisma } from "@/lib/prisma";

/** Rows with no archive timestamp (field absent in Mongo or explicitly null). */
export function isActiveProgramRow(archivedAt: Date | null | undefined): boolean {
  return archivedAt == null;
}

export function filterActiveProgramExercises<
  T extends { archivedAt?: Date | null },
>(exercises: T[]): T[] {
  return exercises.filter((exercise) => isActiveProgramRow(exercise.archivedAt));
}

export function filterActiveProgramSections<
  T extends {
    archivedAt?: Date | null;
    exercises: Array<{ archivedAt?: Date | null }>;
  },
>(sections: T[]): T[] {
  return filterActiveProgramExercises(sections).map((section) => ({
    ...section,
    exercises: filterActiveProgramExercises(section.exercises),
  }));
}

export function applyActiveProgramFilters<
  T extends {
    sections: Array<{
      archivedAt?: Date | null;
      exercises: Array<{ archivedAt?: Date | null }>;
    }>;
    exercises: Array<{ archivedAt?: Date | null }>;
  },
>(program: T): T {
  return {
    ...program,
    sections: filterActiveProgramSections(program.sections),
    exercises: filterActiveProgramExercises(program.exercises),
  };
}

const programSectionsInclude = {
  sections: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      exercises: { orderBy: { sortOrder: "asc" as const } },
    },
  },
  exercises: { orderBy: { sortOrder: "asc" as const } },
};

export type ProgramWithSections = {
  id: string;
  sections: ProgramSectionRecord[];
  exercises: ProgramExerciseRecord[];
};

function groupRowsByProgramId<T extends { programId: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.programId) ?? [];
    list.push(row);
    map.set(row.programId, list);
  }
  return map;
}

function pickLegacySection<
  T extends { name: string; archivedAt?: Date | null },
>(sections: T[]): T | null {
  const activeSections = filterActiveProgramExercises(sections);
  return (
    activeSections.find((section) => section.name === DEFAULT_PROGRAM_SECTION_NAME) ??
    activeSections[0] ??
    null
  );
}

export async function ensureLegacyProgramSectionsBatch(
  programIds: string[],
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  const uniqueIds = [...new Set(programIds)];
  if (uniqueIds.length === 0) return results;

  const [allExercises, allSections] = await Promise.all([
    prisma.programExercise.findMany({
      where: { programId: { in: uniqueIds } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.programSection.findMany({
      where: { programId: { in: uniqueIds } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const exercisesByProgram = groupRowsByProgramId(allExercises);
  const sectionsByProgram = groupRowsByProgramId(allSections);
  const createsNeeded: Array<{ programId: string; orphanIds: string[] }> = [];
  const updatesBySectionId = new Map<string, string[]>();

  for (const programId of uniqueIds) {
    const activeExercises = filterActiveProgramExercises(
      exercisesByProgram.get(programId) ?? [],
    );
    if (activeExercises.length === 0) {
      results.set(programId, false);
      continue;
    }

    const orphanIds = activeExercises
      .filter((exercise) => exercise.sectionId == null)
      .map((exercise) => exercise.id);

    if (orphanIds.length === 0) {
      results.set(programId, false);
      continue;
    }

    const section = pickLegacySection(sectionsByProgram.get(programId) ?? []);
    if (!section) {
      createsNeeded.push({ programId, orphanIds });
      results.set(programId, true);
      continue;
    }

    const existing = updatesBySectionId.get(section.id) ?? [];
    updatesBySectionId.set(section.id, [...existing, ...orphanIds]);
    results.set(programId, true);
  }

  await Promise.all([
    ...createsNeeded.map(async ({ programId, orphanIds }) => {
      const section = await prisma.programSection.create({
        data: {
          programId,
          name: DEFAULT_PROGRAM_SECTION_NAME,
          sortOrder: 0,
        },
      });

      if (orphanIds.length > 0) {
        await prisma.programExercise.updateMany({
          where: { id: { in: orphanIds }, programId },
          data: { sectionId: section.id },
        });
      }
    }),
    ...Array.from(updatesBySectionId.entries()).map(([sectionId, orphanIds]) =>
      prisma.programExercise.updateMany({
        where: { id: { in: orphanIds } },
        data: { sectionId },
      }),
    ),
  ]);

  return results;
}

export async function ensureLegacyProgramSections(programId: string): Promise<boolean> {
  const results = await ensureLegacyProgramSectionsBatch([programId]);
  return results.get(programId) ?? false;
}

export async function loadProgramWithSections(programId: string) {
  await ensureLegacyProgramSections(programId);

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId },
    include: programSectionsInclude,
  });

  return program ? applyActiveProgramFilters(program) : null;
}

export type ProgressProgramExercise = {
  id: string;
  name: string;
  archivedAt: Date | null;
};

/** Active exercises plus archived exercises that have logs for this trainee (for progress charts). */
export async function loadProgressExercisesForProgram(
  programId: string,
  traineeId: string,
): Promise<ProgressProgramExercise[]> {
  const exercises = await prisma.programExercise.findMany({
    where: { programId },
    select: {
      id: true,
      name: true,
      archivedAt: true,
      logs: {
        where: { session: { traineeId } },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return exercises
    .filter(
      (exercise) =>
        isActiveProgramRow(exercise.archivedAt) || exercise.logs.length > 0,
    )
    .map(({ id, name, archivedAt }) => ({ id, name, archivedAt }));
}

export { programSectionsInclude };
