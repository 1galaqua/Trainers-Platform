export const WORKOUT_DRAFT_TTL_MS = 12 * 60 * 60 * 1000;

const STORAGE_KEY_PREFIX = "tp-workout-draft";

export type ExerciseLogDraftFields = {
  weightKg?: string;
  repsCompleted?: string;
  notes?: string;
};

export type WorkoutLogDraft = {
  programId: string;
  traineeKey: string;
  savedAt: number;
  sessionNotes: string;
  exerciseLogs: Record<string, ExerciseLogDraftFields>;
};

export type ExerciseLogState = {
  exerciseId: string;
  weightKg: string;
  repsCompleted: string;
  notes: string;
};

function draftStorageKey(programId: string, traineeKey: string): string {
  return `${STORAGE_KEY_PREFIX}:${programId}:${traineeKey}`;
}

export function getWorkoutDraftTraineeKey(traineeId?: string): string {
  return traineeId ?? "self";
}

export function isExerciseLogFilled(
  log: ExerciseLogState,
  baseline: ExerciseLogState,
): boolean {
  if (log.weightKg.trim() !== "") return true;
  if (log.notes.trim() !== "") return true;
  if (log.repsCompleted.trim() !== "" && log.repsCompleted !== baseline.repsCompleted) {
    return true;
  }
  return false;
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
    if (!isExerciseLogFilled(log, baselines[index])) return;

    const entry: ExerciseLogDraftFields = {};
    if (log.weightKg.trim() !== "") entry.weightKg = log.weightKg;
    if (log.notes.trim() !== "") entry.notes = log.notes;
    if (
      log.repsCompleted.trim() !== "" &&
      log.repsCompleted !== baselines[index].repsCompleted
    ) {
      entry.repsCompleted = log.repsCompleted;
    }

    exerciseLogs[log.exerciseId] = entry;
  });

  const trimmedSessionNotes = sessionNotes.trim();
  if (Object.keys(exerciseLogs).length === 0 && !trimmedSessionNotes) {
    return null;
  }

  return {
    programId,
    traineeKey,
    savedAt: Date.now(),
    sessionNotes: trimmedSessionNotes,
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

    return {
      ...baseline,
      weightKg: saved.weightKg ?? baseline.weightKg,
      repsCompleted: saved.repsCompleted ?? baseline.repsCompleted,
      notes: saved.notes ?? baseline.notes,
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

    const draft = JSON.parse(raw) as WorkoutLogDraft;
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
