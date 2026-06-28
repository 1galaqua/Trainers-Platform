import { parseIsraelDateTime } from "@/lib/calendar-datetime";
import { notCancelledWhere } from "@/lib/calendar-prisma-filters";
import { prisma } from "@/lib/prisma";
import type { UserWorkoutReminderKind } from "@/lib/prisma-client";
import {
  computeReminderScheduledFor,
  isValidReminderTime,
  reminderNotSentWhere,
} from "@/lib/user-workout-reminders";

export async function upsertUserCalendarEventReminder(params: {
  eventId: string;
  userId: string;
  kind: UserWorkoutReminderKind;
  eventStartsAt: Date;
  customScheduledFor?: Date;
}) {
  const scheduledFor = computeReminderScheduledFor(
    params.eventStartsAt,
    params.kind,
    params.customScheduledFor,
  );

  if (!scheduledFor || !isValidReminderTime(scheduledFor, params.eventStartsAt)) {
    return { error: "תזכורת חייבת להיות לפני תחילת האירוע ולא בעבר" };
  }

  await prisma.userCalendarEventReminder.upsert({
    where: {
      eventId_userId: {
        eventId: params.eventId,
        userId: params.userId,
      },
    },
    create: {
      eventId: params.eventId,
      userId: params.userId,
      kind: params.kind,
      scheduledFor,
    },
    update: {
      kind: params.kind,
      scheduledFor,
      sentAt: null,
    },
  });

  return { success: true as const };
}

export async function createDefaultUserCalendarEventReminder(
  eventId: string,
  userId: string,
  eventStartsAt: Date,
) {
  const result = await upsertUserCalendarEventReminder({
    eventId,
    userId,
    kind: "THIRTY_MINUTES",
    eventStartsAt,
  });

  if (result.error) {
    return { skipped: true as const };
  }

  return { success: true as const };
}

export async function claimUserCalendarEventReminder(reminderId: string, now = new Date()) {
  const result = await prisma.userCalendarEventReminder.updateMany({
    where: {
      id: reminderId,
      ...reminderNotSentWhere,
    },
    data: { sentAt: now },
  });

  return result.count > 0;
}

export async function cancelUserCalendarEventReminder(eventId: string, userId: string) {
  await prisma.userCalendarEventReminder.deleteMany({
    where: {
      eventId,
      userId,
      ...reminderNotSentWhere,
    },
  });

  return { success: true as const };
}

export async function cancelAllUserCalendarEventReminders(eventId: string) {
  await prisma.userCalendarEventReminder.deleteMany({
    where: {
      eventId,
      ...reminderNotSentWhere,
    },
  });
}

export async function rescheduleCalendarEventUserReminders(eventId: string, eventStartsAt: Date) {
  const reminders = await prisma.userCalendarEventReminder.findMany({
    where: { eventId, ...reminderNotSentWhere },
  });

  const now = new Date();

  for (const reminder of reminders) {
    const nextScheduledFor = computeReminderScheduledFor(
      eventStartsAt,
      reminder.kind,
      reminder.kind === "CUSTOM" ? reminder.scheduledFor : undefined,
    );

    if (!nextScheduledFor || !isValidReminderTime(nextScheduledFor, eventStartsAt, now)) {
      await prisma.userCalendarEventReminder.delete({ where: { id: reminder.id } });
      continue;
    }

    await prisma.userCalendarEventReminder.update({
      where: { id: reminder.id },
      data: { scheduledFor: nextScheduledFor },
    });
  }
}

export async function canUserManageCalendarEventReminder(
  eventId: string,
  userId: string,
  userRole: "COACH" | "TRAINEE",
) {
  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, ...notCancelledWhere },
  });

  if (!event || event.startsAt <= new Date()) {
    return { allowed: false as const, event: null };
  }

  if (userRole === "COACH" && event.coachId === userId) {
    return { allowed: true as const, event };
  }

  if (userRole === "TRAINEE" && event.traineeId === userId) {
    return { allowed: true as const, event };
  }

  return { allowed: false as const, event: null };
}

export function validateCustomCalendarEventReminderInput(
  date: string,
  time: string,
  eventStartsAt: Date,
): { error?: string; scheduledFor?: Date } {
  const scheduledFor = parseIsraelDateTime(date, time);
  if (!scheduledFor) {
    return { error: "יש לבחור תאריך ושעה תקינים לתזכורת" };
  }

  if (!isValidReminderTime(scheduledFor, eventStartsAt)) {
    return { error: "תזכורת חייבת להיות לפני תחילת האירוע ולא בעבר" };
  }

  return { scheduledFor };
}
