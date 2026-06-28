import { unstable_cache } from "next/cache";

import { programsTag } from "@/lib/cache-tags";
import {
  applyActiveProgramFilters,
  ensureLegacyProgramSectionsBatch,
  programSectionsInclude,
} from "@/lib/program-sections-persistence";
import { prisma } from "@/lib/prisma";

export async function loadTraineePrograms(params: {
  traineeId: string;
  coachId?: string;
}) {
  const where = {
    traineeId: params.traineeId,
    isActive: true,
    ...(params.coachId ? { coachId: params.coachId } : {}),
  };

  const programIds = await prisma.trainingProgram.findMany({
    where,
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });

  await ensureLegacyProgramSectionsBatch(programIds.map((program) => program.id));

  const loaded = await prisma.trainingProgram.findMany({
    where,
    include: {
      ...programSectionsInclude,
      coach: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return loaded.map(applyActiveProgramFilters);
}

export type TraineeProgramRecord = Awaited<ReturnType<typeof loadTraineePrograms>>[number];

export async function getCachedTraineePrograms(params: {
  traineeId: string;
  coachId?: string;
}) {
  const scope = params.coachId ?? "self";

  return unstable_cache(
    async () => loadTraineePrograms(params),
    ["trainee-programs", params.traineeId, scope],
    { tags: [programsTag(params.traineeId)] },
  )();
}
