import type { ProgramType } from "@/lib/prisma-client";

export type LogWorkoutProgramSummary = {
  id: string;
  name: string;
  type: ProgramType;
  coachName: string | null;
  exerciseCount: number;
};

export function resolveLogWorkoutSelectedProgramId(
  summaries: Array<{ id: string }>,
  preferredId?: string | null,
): string | null {
  if (summaries.length === 0) return null;
  if (preferredId && summaries.some((summary) => summary.id === preferredId)) {
    return preferredId;
  }
  return summaries[0]?.id ?? null;
}
