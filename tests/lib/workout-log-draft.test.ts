import { describe, expect, it } from "vitest";

import {
  applyWorkoutLogDraft,
  buildEmptySetLogs,
  buildWorkoutLogDraft,
  buildWorkoutLogPrefillKey,
  getWorkoutLogFormStatus,
  hasWorkoutDraftContent,
  type ExerciseLogState,
  type WorkoutLogDraft,
} from "@/lib/workout-log-draft";

function buildBaselineLogs(): ExerciseLogState[] {
  return [
    {
      exerciseId: "ex-1",
      notes: "",
      setLogs: buildEmptySetLogs(2, 10),
    },
  ];
}

describe("buildWorkoutLogPrefillKey", () => {
  it("builds a stable key from program, trainee and exercise ids", () => {
    expect(buildWorkoutLogPrefillKey("prog-1", "self", ["ex-1", "ex-2"])).toBe(
      "prog-1:self:ex-1,ex-2",
    );
  });
});

describe("getWorkoutLogFormStatus", () => {
  it("prefers loading over other states", () => {
    expect(
      getWorkoutLogFormStatus({
        prefillLoading: true,
        draftRestored: true,
        hasPreviousLog: true,
      }),
    ).toBe("loading");
  });

  it("shows draft after loading completes", () => {
    expect(
      getWorkoutLogFormStatus({
        prefillLoading: false,
        draftRestored: true,
        hasPreviousLog: false,
      }),
    ).toBe("draft");
  });

  it("shows prefill when there is a previous log without a draft", () => {
    expect(
      getWorkoutLogFormStatus({
        prefillLoading: false,
        draftRestored: false,
        hasPreviousLog: true,
      }),
    ).toBe("prefill");
  });
});

describe("applyWorkoutLogDraft", () => {
  it("restores only changed set fields from the draft", () => {
    const baselines = buildBaselineLogs();
    const draft: WorkoutLogDraft = {
      version: 2,
      programId: "prog-1",
      traineeKey: "self",
      savedAt: Date.now(),
      sessionNotes: "",
      exerciseLogs: {
        "ex-1": {
          sets: {
            "1": { weightKg: "80" },
          },
        },
      },
    };

    const result = applyWorkoutLogDraft(baselines, draft, new Set(["ex-1"]));

    expect(result.logs[0].setLogs[0].weightKg).toBe("80");
    expect(result.logs[0].setLogs[1].weightKg).toBe("");
  });
});

describe("hasWorkoutDraftContent", () => {
  it("detects when a filled weight differs from the baseline", () => {
    const baselines = buildBaselineLogs();
    const logs = structuredClone(baselines);
    logs[0].setLogs[0].weightKg = "75";

    expect(hasWorkoutDraftContent(logs, baselines, "", "")).toBe(true);
  });
});

describe("buildWorkoutLogDraft", () => {
  it("persists only filled sets that differ from baseline", () => {
    const baselines = buildBaselineLogs();
    const logs = structuredClone(baselines);
    logs[0].setLogs[0].weightKg = "60";

    const draft = buildWorkoutLogDraft("prog-1", "self", logs, baselines, "");

    expect(draft?.exerciseLogs["ex-1"]?.sets?.["1"]?.weightKg).toBe("60");
  });
});
