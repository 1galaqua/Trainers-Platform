"use server";

import { requireCoach, requireUser } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { parseIsraelDateTime } from "@/lib/calendar-datetime";
import {
  createCalendarEventInputFromFormData,
  detectSignificantCalendarEventChanges,
  validateCreateCalendarEventInput,
  validateUpdateCalendarEventInput,
} from "@/lib/calendar-event-validation";
import {
  notifyTraineeAboutEventCancelled,
  notifyTraineeAboutEventScheduled,
  notifyTraineeAboutEventUpdated,
} from "@/lib/calendar-event-notifications";
import {
  findOverlappingCoachWorkout,
  SCHEDULE_OVERLAP_ERROR,
} from "@/lib/calendar-overlap";
import { notCancelledWhere } from "@/lib/calendar-prisma-filters";
import { revalidateCalendarWorkoutsForUsers } from "@/lib/revalidate-tags";
import {
  cancelAllUserCalendarEventReminders,
  cancelUserCalendarEventReminder,
  createDefaultUserCalendarEventReminder,
  rescheduleCalendarEventUserReminders,
} from "@/lib/user-calendar-event-reminders";
import { prisma } from "@/lib/prisma";
import type { CalendarUserReminder } from "@/server/actions/calendar";

export type CalendarEventItem = {
  kind: "event";
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  traineeId: string | null;
  traineeName: string | null;
  notes: string | null;
  userReminder: CalendarUserReminder | null;
};

function revalidateCalendarViews(...userIds: Array<string | null | undefined>) {
  revalidateCalendarWorkoutsForUsers(
    userIds.filter((userId): userId is string => Boolean(userId)),
  );
}

async function getCoachOwnedEvent(coachId: string, eventId: string) {
  return prisma.calendarEvent.findFirst({
    where: {
      id: eventId,
      coachId,
      ...notCancelledWhere,
    },
  });
}

export async function createCalendarEventAction(formData: FormData) {
  const coach = await requireCoach();
  const input = createCalendarEventInputFromFormData(formData);
  const validationError = validateCreateCalendarEventInput(input);

  if (validationError) {
    return { error: validationError };
  }

  const startsAt = parseIsraelDateTime(input.date, input.time);
  if (!startsAt) {
    return { error: "יש לבחור תאריך ושעה תקינים" };
  }

  const overlapping = await findOverlappingCoachWorkout({
    coachId: coach.id,
    startsAt,
    durationMinutes: input.durationMinutes,
  });
  if (overlapping) {
    return { error: SCHEDULE_OVERLAP_ERROR };
  }

  const traineeId = input.traineeId || null;
  if (traineeId) {
    const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
    if (!ownsTrainee) {
      return { error: "המתאמן שנבחר אינו משויך אליך" };
    }
  }

  const event = await prisma.calendarEvent.create({
    data: {
      coachId: coach.id,
      title: input.title,
      startsAt,
      durationMinutes: input.durationMinutes,
      traineeId,
      notes: input.notes || null,
    },
  });

  if (traineeId) {
    await notifyTraineeAboutEventScheduled({ event, traineeId });
    await createDefaultUserCalendarEventReminder(event.id, traineeId, startsAt);
  }

  await createDefaultUserCalendarEventReminder(event.id, coach.id, startsAt);
  revalidateCalendarViews(coach.id, traineeId);
  return { success: true as const };
}

export async function updateCalendarEventAction(eventId: string, formData: FormData) {
  const coach = await requireCoach();
  const existing = await getCoachOwnedEvent(coach.id, eventId);

  if (!existing) {
    return { error: "האירוע לא נמצא" };
  }

  if (existing.startsAt <= new Date()) {
    return { error: "לא ניתן לערוך אירוע שכבר התחיל או עבר" };
  }

  const input = createCalendarEventInputFromFormData(formData);
  const validationError = validateUpdateCalendarEventInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const startsAt = parseIsraelDateTime(input.date, input.time);
  if (!startsAt) {
    return { error: "יש לבחור תאריך ושעה תקינים" };
  }

  const overlapping = await findOverlappingCoachWorkout({
    coachId: coach.id,
    startsAt,
    durationMinutes: input.durationMinutes,
    excludeEventId: existing.id,
  });
  if (overlapping) {
    return { error: SCHEDULE_OVERLAP_ERROR };
  }

  const traineeId = input.traineeId || null;
  if (traineeId) {
    const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
    if (!ownsTrainee) {
      return { error: "המתאמן שנבחר אינו משויך אליך" };
    }
  }

  const changeResult = detectSignificantCalendarEventChanges(
    {
      title: existing.title,
      startsAt: existing.startsAt,
      durationMinutes: existing.durationMinutes,
      traineeId: existing.traineeId,
    },
    {
      title: input.title,
      startsAt,
      durationMinutes: input.durationMinutes,
      traineeId,
    },
  );

  const updated = await prisma.calendarEvent.update({
    where: { id: existing.id },
    data: {
      title: input.title,
      startsAt,
      durationMinutes: input.durationMinutes,
      traineeId,
      notes: input.notes || null,
    },
  });

  if (existing.traineeId && existing.traineeId !== traineeId) {
    await cancelUserCalendarEventReminder(existing.id, existing.traineeId);
    await notifyTraineeAboutEventCancelled({ event: existing, traineeId: existing.traineeId });
  }

  if (traineeId) {
    if (traineeId !== existing.traineeId) {
      await notifyTraineeAboutEventScheduled({ event: updated, traineeId });
      await createDefaultUserCalendarEventReminder(updated.id, traineeId, startsAt);
    } else if (changeResult.hasSignificantChange) {
      await notifyTraineeAboutEventUpdated({ event: updated, traineeId });
    }
  }

  if (existing.startsAt.getTime() !== startsAt.getTime()) {
    await rescheduleCalendarEventUserReminders(updated.id, startsAt);
  }

  revalidateCalendarViews(coach.id, existing.traineeId, traineeId);
  return { success: true as const };
}

export async function cancelCalendarEventAction(eventId: string) {
  const coach = await requireCoach();
  const existing = await getCoachOwnedEvent(coach.id, eventId);

  if (!existing) {
    return { error: "האירוע לא נמצא" };
  }

  const isPast = existing.startsAt <= new Date();

  await prisma.calendarEvent.update({
    where: { id: existing.id },
    data: { cancelledAt: new Date() },
  });

  await cancelAllUserCalendarEventReminders(existing.id);

  if (!isPast && existing.traineeId) {
    await notifyTraineeAboutEventCancelled({
      event: existing,
      traineeId: existing.traineeId,
    });
  }

  revalidateCalendarViews(coach.id, existing.traineeId);
  return { success: true as const };
}

export async function canCoachManageCalendarEventAction(eventId: string) {
  const coach = await requireCoach();
  const event = await getCoachOwnedEvent(coach.id, eventId);
  return Boolean(event);
}

export async function canUserAccessCalendarEventAction(eventId: string) {
  const user = await requireUser();
  if (user.role === "ADMIN") return false;

  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, ...notCancelledWhere },
    select: { coachId: true, traineeId: true },
  });

  if (!event) return false;
  if (user.role === "COACH") return event.coachId === user.id;
  return event.traineeId === user.id;
}
