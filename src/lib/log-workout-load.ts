import { unstable_cache } from "next/cache";

import { logWorkoutTag } from "@/lib/cache-tags";
import { buildLogWorkoutProgramOption } from "@/lib/log-workout-program-option";
import {
  resolveLogWorkoutSelectedProgramId,
  type LogWorkoutProgramSummary,
} from "@/lib/log-workout-page-data";
import {
  applyActiveProgramFilters,
  ensureLegacyProgramSectionsBatch,
  filterActiveProgramExercises,
  programSectionsInclude,
} from "@/lib/program-sections-persistence";
import { prisma } from "@/lib/prisma";
import { getTraineeQuotaSnapshot, type TraineeQuotaSnapshot } from "@/lib/trainee-quota";

export type LogWorkoutPageData = {
  programSummaries: LogWorkoutProgramSummary[];
  activeProgram: ReturnType<typeof buildLogWorkoutProgramOption> | null;
  quotaInfo: TraineeQuotaSnapshot | null;
};

const EMPTY_LOG_WORKOUT_PAGE: LogWorkoutPageData = {
  programSummaries: [],
  activeProgram: null,
  quotaInfo: null,
};

function buildSummaries(
  programs: Array<{
    id: string;
    name: string;
    type: LogWorkoutProgramSummary["type"];
    coach: { displayName: string | null };
    exercises: Array<{ archivedAt: Date | null }>;
  }>,
): LogWorkoutProgramSummary[] {
  return programs.map((program) => ({
    id: program.id,
    name: program.name,
    type: program.type,
    coachName: program.coach.displayName,
    exerciseCount: filterActiveProgramExercises(program.exercises).length,
  }));
}

export async function loadLogWorkoutPageData(params: {
  traineeId: string;
  coachId?: string;
  selectedProgramParam?: string;
}): Promise<LogWorkoutPageData> {
  try {
    const [coachLink, programs] = await Promise.all([
      prisma.coachTrainee.findUnique({
        where: { traineeId: params.traineeId },
        select: { coachId: true },
      }),
      prisma.trainingProgram.findMany({
        where: {
          traineeId: params.traineeId,
          isActive: true,
          ...(params.coachId ? { coachId: params.coachId } : {}),
        },
        select: {
          id: true,
          name: true,
          type: true,
          coach: { select: { displayName: true } },
          exercises: { select: { archivedAt: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const programSummaries = buildSummaries(programs);
    if (programSummaries.length === 0) {
      return EMPTY_LOG_WORKOUT_PAGE;
    }

    const selectedProgramId = resolveLogWorkoutSelectedProgramId(
      programSummaries,
      params.selectedProgramParam,
    );
    if (!selectedProgramId) {
      return { programSummaries, activeProgram: null, quotaInfo: null };
    }

    await ensureLegacyProgramSectionsBatch([selectedProgramId]);

    const [programRaw, quotaInfo] = await Promise.all([
      prisma.trainingProgram.findFirst({
        where: {
          id: selectedProgramId,
          traineeId: params.traineeId,
          isActive: true,
          ...(params.coachId ? { coachId: params.coachId } : {}),
        },
        include: {
          ...programSectionsInclude,
          coach: true,
        },
      }),
      coachLink ? getTraineeQuotaSnapshot(params.traineeId, coachLink.coachId) : Promise.resolve(null),
    ]);

    return {
      programSummaries,
      activeProgram: programRaw
        ? buildLogWorkoutProgramOption(applyActiveProgramFilters(programRaw))
        : null,
      quotaInfo,
    };
  } catch {
    return EMPTY_LOG_WORKOUT_PAGE;
  }
}

export async function getCachedLogWorkoutPageData(params: {
  traineeId: string;
  coachId?: string;
  selectedProgramParam?: string;
}): Promise<LogWorkoutPageData> {
  const cacheKey = params.selectedProgramParam ?? "default";

  return unstable_cache(
    async () => loadLogWorkoutPageData(params),
    ["log-workout-page", params.traineeId, params.coachId ?? "self", cacheKey],
    { tags: [logWorkoutTag(params.traineeId)] },
  )();
}
