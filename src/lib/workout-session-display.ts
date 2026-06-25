import { DEFAULT_PROGRAM_SECTION_NAME } from "@/lib/program-sections";

export type SessionLogExerciseInfo = {
  name: string;
  sortOrder: number;
  sectionId: string | null;
  section?: {
    id: string;
    name: string;
    sortOrder: number;
  } | null;
};

export type SessionLogForGrouping = {
  id: string;
  weightKg: number | null;
  repsCompleted: number | null;
  exercise: SessionLogExerciseInfo;
  setLogs: Array<{
    setNumber: number;
    weightKg: number | null;
    repsCompleted: number | null;
  }>;
};

export type SessionLogSectionGroup = {
  id: string;
  name: string;
  sortOrder: number;
  logs: SessionLogForGrouping[];
};

export function groupSessionLogsBySection(logs: SessionLogForGrouping[]): SessionLogSectionGroup[] {
  const sectionMap = new Map<string, SessionLogSectionGroup>();

  for (const log of logs) {
    const section = log.exercise.section;
    const sectionId = section?.id ?? log.exercise.sectionId ?? "legacy";
    const sectionName = section?.name ?? DEFAULT_PROGRAM_SECTION_NAME;
    const sectionSortOrder = section?.sortOrder ?? 0;

    const existing = sectionMap.get(sectionId);
    if (existing) {
      existing.logs.push(log);
      continue;
    }

    sectionMap.set(sectionId, {
      id: sectionId,
      name: sectionName,
      sortOrder: sectionSortOrder,
      logs: [log],
    });
  }

  return [...sectionMap.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "he"))
    .map((group) => ({
      ...group,
      logs: [...group.logs].sort((a, b) => a.exercise.sortOrder - b.exercise.sortOrder),
    }));
}

export const workoutSessionLogInclude = {
  exercise: {
    include: {
      section: true,
    },
  },
  setLogs: { orderBy: { setNumber: "asc" as const } },
};
