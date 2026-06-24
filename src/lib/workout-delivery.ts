export type WorkoutDeliveryMode = "IN_PERSON" | "ONLINE";

export const WORKOUT_DELIVERY_MODES: WorkoutDeliveryMode[] = ["IN_PERSON", "ONLINE"];

export const workoutDeliveryModeLabels: Record<WorkoutDeliveryMode, string> = {
  IN_PERSON: "פרונטלי",
  ONLINE: "אונליין",
};

export function parseWorkoutDeliveryMode(value: string): WorkoutDeliveryMode | null {
  if (value === "IN_PERSON" || value === "ONLINE") return value;
  return null;
}

export function normalizeMeetingLink(value: string): string {
  return value.trim();
}

export function isValidMeetingLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function validateWorkoutDeliveryInput(
  deliveryMode: WorkoutDeliveryMode,
  meetingLink: string,
): string | null {
  const normalizedLink = normalizeMeetingLink(meetingLink);

  if (deliveryMode === "ONLINE") {
    if (!normalizedLink) return "יש להזין קישור לאימון אונליין";
    if (!isValidMeetingLink(normalizedLink)) return "יש להזין קישור תקין (https://...)";
  }

  if (deliveryMode === "IN_PERSON" && normalizedLink && !isValidMeetingLink(normalizedLink)) {
    return "יש להזין קישור תקין (https://...)";
  }

  return null;
}

export function resolveStoredMeetingLink(
  deliveryMode: WorkoutDeliveryMode,
  meetingLink: string,
): string | null {
  if (deliveryMode !== "ONLINE") return null;
  return normalizeMeetingLink(meetingLink) || null;
}

export function formatWorkoutDeliverySummary(
  deliveryMode: WorkoutDeliveryMode,
  meetingLink?: string | null,
): string {
  const label = workoutDeliveryModeLabels[deliveryMode];
  if (deliveryMode === "ONLINE" && meetingLink) {
    return `${label} · ${meetingLink}`;
  }
  return label;
}
