"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import {
  canUserManageWorkoutReminder,
  cancelUserWorkoutReminder,
  upsertUserWorkoutReminder,
  validateCustomReminderInput,
} from "@/lib/user-workout-reminders";
import type { UserWorkoutReminderKind } from "@/lib/prisma-client";

export async function setWorkoutReminderAction(
  workoutId: string,
  kind: UserWorkoutReminderKind,
  customDate?: string,
  customTime?: string,
) {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    return { error: "לא ניתן להגדיר תזכורת" };
  }

  const access = await canUserManageWorkoutReminder(
    workoutId,
    user.id,
    user.role as "COACH" | "TRAINEE",
  );

  if (!access.allowed || !access.workout) {
    return { error: "לא ניתן להגדיר תזכורת לאימון זה" };
  }

  let customScheduledFor: Date | undefined;

  if (kind === "CUSTOM") {
    if (!customDate || !customTime) {
      return { error: "יש לבחור תאריך ושעה לתזכורת" };
    }

    const validation = validateCustomReminderInput(
      customDate,
      customTime,
      access.workout.startsAt,
    );

    if (validation.error || !validation.scheduledFor) {
      return { error: validation.error ?? "תזכורת לא תקינה" };
    }

    customScheduledFor = validation.scheduledFor;
  }

  const result = await upsertUserWorkoutReminder({
    workoutId,
    userId: user.id,
    kind,
    workoutStartsAt: access.workout.startsAt,
    customScheduledFor,
  });

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/calendar");
  return { success: true as const };
}

export async function cancelWorkoutReminderAction(workoutId: string) {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    return { error: "לא ניתן לבטל תזכורת" };
  }

  const access = await canUserManageWorkoutReminder(
    workoutId,
    user.id,
    user.role as "COACH" | "TRAINEE",
  );

  if (!access.allowed) {
    return { error: "לא ניתן לבטל תזכורת לאימון זה" };
  }

  await cancelUserWorkoutReminder(workoutId, user.id);
  revalidatePath("/dashboard/calendar");
  return { success: true as const };
}
