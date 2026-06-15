import { isSetLogFilled } from "@/lib/workout-log-metrics";

export const WORKOUT_DRAFT_TTL_MS = 12 * 60 * 60 * 1000;
export const WORKOUT_DRAFT_VERSION = 2;

const STORAGE_KEY_PREFIX = "tp-workout-draft";

export type SetLogState = {
  setNumber: number;
  weightKg: string;
  repsCompleted: string;
};

export type ExerciseLogState = {
  exerciseId: string;
  setLogs: SetLogState[];
  notes: string;
};

export type SetLogDraftFields = {
  weightKg?: string;
  repsCompleted?: string;
};

export type ExerciseLogDraftFields = {
  notes?: string;
  sets?: Record<string, SetLogDraftFields>;
};

export type WorkoutLogDraft = {
  version: number;
  programId: string;
  traineeKey: string;
  savedAt: number;
  sessionNotes: string;
  exerciseLogs: Record<string, ExerciseLogDraftFields>;
};

type LegacyExerciseLogDraftFields = {
  weightKg?: string;
  repsCompleted?: string;
  notes?: string;
};

type LegacyWorkoutLogDraft = {
  version?: number;
  programId: string;
  traineeKey: string;
  savedAt: number;
  sessionNotes: string;
  exerciseLogs: Record<string, LegacyExerciseLogDraftFields | ExerciseLogDraftFields>;
};

function draftStorageKey(programId: string, traineeKey: string): string {
  return `${STORAGE_KEY_PREFIX}:${programId}:${traineeKey}`;
}

export function getWorkoutDraftTraineeKey(traineeId?: string): string {
  return traineeId ?? "self";
}

export function buildEmptySetLogs(setsCount: number, defaultReps: number): SetLogState[] {
  return Array.from({ length: setsCount }, (_, index) => ({
    setNumber: index + 1,
    weightKg: "",
    repsCompleted: String(defaultReps),
  }));
}

export function isExerciseLogFilled(
  log: ExerciseLogState,
  baseline: ExerciseLogState,
): boolean {
  if (log.notes.trim() !== "") return true;

  return log.setLogs.some((set, index) =>
    isSetLogFilled(set, baseline.setLogs[index]?.repsCompleted ?? ""),
  );
}

export function hasWorkoutDraftContent(
  logs: ExerciseLogState[],
  baselines: ExerciseLogState[],
  sessionNotes: string,
  baselineSessionNotes: string,
): boolean {
  if (sessionNotes.trim() !== "" && sessionNotes !== baselineSessionNotes) return true;
  return logs.some((log, index) => isExerciseLogFilled(log, baselines[index]));
}

export function buildWorkoutLogDraft(
  programId: string,
  traineeKey: string,
  logs: ExerciseLogState[],
  baselines: ExerciseLogState[],
  sessionNotes: string,
): WorkoutLogDraft | null {
  const exerciseLogs: WorkoutLogDraft["exerciseLogs"] = {};

  logs.forEach((log, index) => {
    const baseline = baselines[index];
    const sets: Record<string, SetLogDraftFields> = {};

    log.setLogs.forEach((set, setIndex) => {
      if (!isSetLogFilled(set, baseline.setLogs[setIndex]?.repsCompleted ?? "")) return;

      const entry: SetLogDraftFields = {};
      if (set.weightKg.trim() !== "") entry.weightKg = set.weightKg;
      if (
        set.repsCompleted.trim() !== "" &&
        set.repsCompleted !== (baseline.setLogs[setIndex]?.repsCompleted ?? "")
      ) {
        entry.repsCompleted = set.repsCompleted;
      }

      if (Object.keys(entry).length > 0) {
        sets[String(set.setNumber)] = entry;
      }
    });

    const entry: ExerciseLogDraftFields = {};
    if (log.notes.trim() !== "") entry.notes = log.notes;
    if (Object.keys(sets).length > 0) entry.sets = sets;

    if (Object.keys(entry).length > 0) {
      exerciseLogs[log.exerciseId] = entry;
    }
  });

  const trimmedSessionNotes = sessionNotes.trim();
  if (Object.keys(exerciseLogs).length === 0 && !trimmedSessionNotes) {
    return null;
  }

  return {
    version: WORKOUT_DRAFT_VERSION,
    programId,
    traineeKey,
    savedAt: Date.now(),
    sessionNotes: trimmedSessionNotes,
    exerciseLogs,
  };
}

function normalizeDraft(raw: LegacyWorkoutLogDraft): WorkoutLogDraft | null {
  if (raw.version === WORKOUT_DRAFT_VERSION) {
    return raw as WorkoutLogDraft;
  }

  const exerciseLogs: WorkoutLogDraft["exerciseLogs"] = {};

  for (const [exerciseId, value] of Object.entries(raw.exerciseLogs)) {
    if ("sets" in value && value.sets) {
      exerciseLogs[exerciseId] = value;
      continue;
    }

    const legacy = value as LegacyExerciseLogDraftFields;
    const entry: ExerciseLogDraftFields = {};
    if (legacy.notes?.trim()) entry.notes = legacy.notes;

    const legacySets: Record<string, SetLogDraftFields> = {};
    if (legacy.weightKg?.trim() || legacy.repsCompleted?.trim()) {
      legacySets["1"] = {
        ...(legacy.weightKg?.trim() ? { weightKg: legacy.weightKg } : {}),
        ...(legacy.repsCompleted?.trim() ? { repsCompleted: legacy.repsCompleted } : {}),
      };
    }

    if (Object.keys(legacySets).length > 0) entry.sets = legacySets;
    if (Object.keys(entry).length > 0) exerciseLogs[exerciseId] = entry;
  }

  return {
    version: WORKOUT_DRAFT_VERSION,
    programId: raw.programId,
    traineeKey: raw.traineeKey,
    savedAt: raw.savedAt,
    sessionNotes: raw.sessionNotes,
    exerciseLogs,
  };
}

export function applyWorkoutLogDraft(
  baselines: ExerciseLogState[],
  draft: WorkoutLogDraft,
  validExerciseIds: Set<string>,
): { logs: ExerciseLogState[]; sessionNotes: string } {
  const logs = baselines.map((baseline) => {
    const saved = draft.exerciseLogs[baseline.exerciseId];
    if (!saved || !validExerciseIds.has(baseline.exerciseId)) return baseline;

    const setLogs = baseline.setLogs.map((set) => {
      const savedSet = saved.sets?.[String(set.setNumber)];
      if (!savedSet) return set;

      return {
        ...set,
        weightKg: savedSet.weightKg ?? set.weightKg,
        repsCompleted: savedSet.repsCompleted ?? set.repsCompleted,
      };
    });

    return {
      ...baseline,
      notes: saved.notes ?? baseline.notes,
      setLogs,
    };
  });

  return {
    logs,
    sessionNotes: draft.sessionNotes,
  };
}

export function loadWorkoutLogDraft(
  programId: string,
  traineeKey: string,
  validExerciseIds: Set<string>,
): WorkoutLogDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(draftStorageKey(programId, traineeKey));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as LegacyWorkoutLogDraft;
    const draft = normalizeDraft(parsed);
    if (!draft) return null;

    if (draft.programId !== programId || draft.traineeKey !== traineeKey) {
      clearWorkoutLogDraft(programId, traineeKey);
      return null;
    }

    if (Date.now() - draft.savedAt > WORKOUT_DRAFT_TTL_MS) {
      clearWorkoutLogDraft(programId, traineeKey);
      return null;
    }

    const hasValidExercise = Object.keys(draft.exerciseLogs).some((id) =>
      validExerciseIds.has(id),
    );
    if (!hasValidExercise && !draft.sessionNotes.trim()) {
      clearWorkoutLogDraft(programId, traineeKey);
      return null;
    }

    return draft;
  } catch {
    clearWorkoutLogDraft(programId, traineeKey);
    return null;
  }
}

export function saveWorkoutLogDraft(draft: WorkoutLogDraft): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      draftStorageKey(draft.programId, draft.traineeKey),
      JSON.stringify(draft),
    );
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded)
  }
}

export function clearWorkoutLogDraft(programId: string, traineeKey: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(draftStorageKey(programId, traineeKey));
  } catch {
    // ignore
  }
}
