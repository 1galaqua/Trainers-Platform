import { isDateOnOrAfterTodayInIsrael, parseIsraelDateTime } from "@/lib/calendar-datetime";
import { WORKOUT_DURATION_OPTIONS } from "@/lib/calendar-validation";

export type CreateCalendarEventInput = {
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  traineeId: string;
  notes: string;
};

export function createCalendarEventInputFromFormData(formData: FormData): CreateCalendarEventInput {
  return {
    title: String(formData.get("title") ?? "").trim(),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    durationMinutes: Number(formData.get("durationMinutes") ?? 0),
    traineeId: String(formData.get("traineeId") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

export function validateCreateCalendarEventInput(input: CreateCalendarEventInput): string | null {
  if (!input.title) return "יש להזין שם לאירוע";
  if (input.title.length > 120) return "שם האירוע ארוך מדי";

  const startsAt = parseIsraelDateTime(input.date, input.time);
  if (!startsAt) return "יש לבחור תאריך ושעה תקינים";

  if (!isDateOnOrAfterTodayInIsrael(input.date)) {
    return "לא ניתן לקבוע אירוע בתאריך שעבר";
  }

  if (!WORKOUT_DURATION_OPTIONS.includes(input.durationMinutes as (typeof WORKOUT_DURATION_OPTIONS)[number])) {
    return "יש לבחור משך תקין";
  }

  return null;
}

export function validateUpdateCalendarEventInput(input: CreateCalendarEventInput): string | null {
  return validateCreateCalendarEventInput(input);
}

export function detectSignificantCalendarEventChanges(
  previous: {
    title: string;
    startsAt: Date;
    durationMinutes: number;
    traineeId: string | null;
  },
  next: {
    title: string;
    startsAt: Date;
    durationMinutes: number;
    traineeId: string | null;
  },
) {
  return {
    hasSignificantChange:
      previous.title !== next.title ||
      previous.startsAt.getTime() !== next.startsAt.getTime() ||
      previous.durationMinutes !== next.durationMinutes ||
      previous.traineeId !== next.traineeId,
  };
}
