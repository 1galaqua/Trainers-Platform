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

export async function ensureLegacyProgramSections(programId: string): Promise<boolean> {
  const exercises = await prisma.programExercise.findMany({
    where: { programId },
    orderBy: { sortOrder: "asc" },
  });

  const activeExercises = filterActiveProgramExercises(exercises);
  if (activeExercises.length === 0) return false;

  const orphanCount = activeExercises.filter((exercise) => exercise.sectionId == null).length;
  if (orphanCount === 0) return false;

  const sections = await prisma.programSection.findMany({
    where: { programId },
    orderBy: { sortOrder: "asc" },
  });

  let section = filterActiveProgramExercises(sections).find(
    (item) => item.name === DEFAULT_PROGRAM_SECTION_NAME,
  );

  if (!section) {
    section = filterActiveProgramExercises(sections)[0];
  }

  if (!section) {
    section = await prisma.programSection.create({
      data: {
        programId,
        name: DEFAULT_PROGRAM_SECTION_NAME,
        sortOrder: 0,
      },
    });
  }

  const orphanIds = activeExercises
    .filter((exercise) => exercise.sectionId == null)
    .map((exercise) => exercise.id);

  if (orphanIds.length > 0) {
    await prisma.programExercise.updateMany({
      where: { id: { in: orphanIds }, programId },
      data: { sectionId: section.id },
    });
  }

  return true;
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
