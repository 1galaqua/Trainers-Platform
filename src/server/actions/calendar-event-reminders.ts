"use server";

import { requireUser } from "@/lib/auth";
import { revalidateCalendarWorkouts } from "@/lib/revalidate-tags";
import {
  canUserManageCalendarEventReminder,
  cancelUserCalendarEventReminder,
  upsertUserCalendarEventReminder,
  validateCustomCalendarEventReminderInput,
} from "@/lib/user-calendar-event-reminders";
import type { UserWorkoutReminderKind } from "@/lib/prisma-client";

export async function setCalendarEventReminderAction(
  eventId: string,
  kind: UserWorkoutReminderKind,
  customDate?: string,
  customTime?: string,
) {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    return { error: "לא ניתן להגדיר תזכורת" };
  }

  const access = await canUserManageCalendarEventReminder(
    eventId,
    user.id,
    user.role as "COACH" | "TRAINEE",
  );

  if (!access.allowed || !access.event) {
    return { error: "לא ניתן להגדיר תזכורת לאירוע זה" };
  }

  let customScheduledFor: Date | undefined;

  if (kind === "CUSTOM") {
    if (!customDate || !customTime) {
      return { error: "יש לבחור תאריך ושעה לתזכורת" };
    }

    const validation = validateCustomCalendarEventReminderInput(
      customDate,
      customTime,
      access.event.startsAt,
    );

    if (validation.error || !validation.scheduledFor) {
      return { error: validation.error ?? "תזכורת לא תקינה" };
    }

    customScheduledFor = validation.scheduledFor;
  }

  const result = await upsertUserCalendarEventReminder({
    eventId,
    userId: user.id,
    kind,
    eventStartsAt: access.event.startsAt,
    customScheduledFor,
  });

  if (result.error) {
    return { error: result.error };
  }

  revalidateCalendarWorkouts(user.id);
  return { success: true as const };
}

export async function cancelCalendarEventReminderAction(eventId: string) {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    return { error: "לא ניתן לבטל תזכורת" };
  }

  const access = await canUserManageCalendarEventReminder(
    eventId,
    user.id,
    user.role as "COACH" | "TRAINEE",
  );

  if (!access.allowed) {
    return { error: "לא ניתן לבטל תזכורת לאירוע זה" };
  }

  await cancelUserCalendarEventReminder(eventId, user.id);
  revalidateCalendarWorkouts(user.id);
  return { success: true as const };
}
