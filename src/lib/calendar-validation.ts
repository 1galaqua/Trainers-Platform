import { isDateOnOrAfterTodayInIsrael, parseIsraelDateTime } from "@/lib/calendar-datetime";
import type { ProgramType } from "@/lib/prisma-client";

export const WORKOUT_DURATION_OPTIONS = [30, 45, 60, 75, 90, 120] as const;

const PROGRAM_TYPES: ProgramType[] = [
  "STRENGTH",
  "HYPERTROPHY",
  "CUTTING",
  "ENDURANCE",
  "CUSTOM",
];

export type CreateWorkoutInput = {
  type: "PERSONAL" | "GROUP";
  date: string;
  time: string;
  durationMinutes: number;
  workoutKind: ProgramType;
  traineeId: string;
  programId: string;
  maxParticipants: number;
  groupTraineeIds: string[];
  notes: string;
};

export function validateCreateWorkoutInput(input: CreateWorkoutInput): string | null {
  const startsAt = parseIsraelDateTime(input.date, input.time);
  if (!startsAt) return "יש לבחור תאריך ושעה תקינים";

  if (!isDateOnOrAfterTodayInIsrael(input.date)) {
    return "לא ניתן לקבוע אימון בתאריך שעבר";
  }

  if (!WORKOUT_DURATION_OPTIONS.includes(input.durationMinutes as (typeof WORKOUT_DURATION_OPTIONS)[number])) {
    return "יש לבחור משך אימון תקין";
  }

  if (input.type === "PERSONAL") {
    if (!input.traineeId.trim()) return "יש לבחור מתאמן";
    return null;
  }

  if (!PROGRAM_TYPES.includes(input.workoutKind)) {
    return "יש לבחור סוג אימון";
  }

  if (!Number.isInteger(input.maxParticipants) || input.maxParticipants < 2) {
    return "יש להגדיר לפחות 2 משתתפים";
  }

  if (input.maxParticipants > 50) {
    return "מקסימום 50 משתתפים";
  }

  const uniqueGroupTraineeIds = [...new Set(input.groupTraineeIds)];
  if (uniqueGroupTraineeIds.length > input.maxParticipants) {
    return `לא ניתן לרשום יותר מ-${input.maxParticipants} מתאמנים`;
  }

  return null;
}

export function createWorkoutInputFromFormData(formData: FormData): CreateWorkoutInput {
  return {
    type: String(formData.get("type") ?? "PERSONAL") as CreateWorkoutInput["type"],
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    durationMinutes: Number(formData.get("durationMinutes") ?? 0),
    workoutKind: String(formData.get("workoutKind") ?? "CUSTOM") as ProgramType,
    traineeId: String(formData.get("traineeId") ?? ""),
    programId: String(formData.get("programId") ?? "").trim(),
    maxParticipants: Number(formData.get("maxParticipants") ?? 0),
    groupTraineeIds: formData
      .getAll("groupTraineeIds")
      .map((value) => String(value))
      .filter(Boolean),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

export function validateUpdateWorkoutInput(
  input: CreateWorkoutInput,
  workoutType: "PERSONAL" | "GROUP",
  registeredCount: number,
): string | null {
  const uniqueGroupTraineeIds = [...new Set(input.groupTraineeIds)];
  const effectiveRegisteredCount =
    workoutType === "GROUP" ? uniqueGroupTraineeIds.length : registeredCount;

  const baseError = validateCreateWorkoutInput({
    ...input,
    type: workoutType,
    groupTraineeIds: uniqueGroupTraineeIds,
  });

  if (baseError) return baseError;

  if (
    workoutType === "GROUP" &&
    Number.isInteger(input.maxParticipants) &&
    input.maxParticipants < effectiveRegisteredCount
  ) {
    return `לא ניתן להגדיר פחות מ-${effectiveRegisteredCount} משתתפים (כבר נרשמו)`;
  }

  return null;
}
