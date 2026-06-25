import {
  DEFAULT_PROGRAM_SECTION_NAME,
  type ProgramExerciseRecord,
  type ProgramSectionRecord,
} from "@/lib/program-sections";
import { prisma } from "@/lib/prisma";

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

  if (exercises.length === 0) return false;

  const orphanCount = await prisma.programExercise.count({
    where: { programId, sectionId: null },
  });

  if (orphanCount === 0) return false;

  let section = await prisma.programSection.findFirst({
    where: { programId, name: DEFAULT_PROGRAM_SECTION_NAME },
    orderBy: { sortOrder: "asc" },
  });

  if (!section) {
    section = await prisma.programSection.findFirst({
      where: { programId },
      orderBy: { sortOrder: "asc" },
    });
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

  await prisma.programExercise.updateMany({
    where: { programId, sectionId: null },
    data: { sectionId: section.id },
  });

  return true;
}

export async function loadProgramWithSections(programId: string) {
  await ensureLegacyProgramSections(programId);

  return prisma.trainingProgram.findFirst({
    where: { id: programId },
    include: programSectionsInclude,
  });
}

export { programSectionsInclude };
