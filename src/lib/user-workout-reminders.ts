import { parseIsraelDateTime } from "@/lib/calendar-datetime";
import { notCancelledWhere } from "@/lib/calendar-prisma-filters";
import { prisma } from "@/lib/prisma";
import type { UserWorkoutReminderKind } from "@/lib/prisma-client";

export const WORKOUT_REMINDER_THIRTY_MIN_MS = 30 * 60 * 1000;
export const WORKOUT_REMINDER_ONE_HOUR_MS = 60 * 60 * 1000;

/** MongoDB + Prisma: unset optional DateTime fields are not matched by `{ sentAt: null }`. */
export const reminderNotSentWhere = {
  OR: [{ sentAt: null }, { sentAt: { isSet: false } }],
};

export function computeReminderScheduledFor(
  workoutStartsAt: Date,
  kind: UserWorkoutReminderKind,
  customScheduledFor?: Date,
): Date | null {
  if (kind === "THIRTY_MINUTES") {
    return new Date(workoutStartsAt.getTime() - WORKOUT_REMINDER_THIRTY_MIN_MS);
  }

  if (kind === "ONE_HOUR") {
    return new Date(workoutStartsAt.getTime() - WORKOUT_REMINDER_ONE_HOUR_MS);
  }

  if (kind === "CUSTOM" && customScheduledFor) {
    return customScheduledFor;
  }

  return null;
}

export function isValidReminderTime(scheduledFor: Date, workoutStartsAt: Date, now = new Date()) {
  return scheduledFor > now && scheduledFor < workoutStartsAt;
}

export function validateCustomReminderInput(
  date: string,
  time: string,
  workoutStartsAt: Date,
): { error?: string; scheduledFor?: Date } {
  const scheduledFor = parseIsraelDateTime(date, time);
  if (!scheduledFor) {
    return { error: "יש לבחור תאריך ושעה תקינים לתזכורת" };
  }

  if (!isValidReminderTime(scheduledFor, workoutStartsAt)) {
    return { error: "תזכורת חייבת להיות לפני תחילת האימון ולא בעבר" };
  }

  return { scheduledFor };
}

export async function upsertUserWorkoutReminder(params: {
  workoutId: string;
  userId: string;
  kind: UserWorkoutReminderKind;
  workoutStartsAt: Date;
  customScheduledFor?: Date;
}) {
  const scheduledFor = computeReminderScheduledFor(
    params.workoutStartsAt,
    params.kind,
    params.customScheduledFor,
  );

  if (!scheduledFor || !isValidReminderTime(scheduledFor, params.workoutStartsAt)) {
    return { error: "תזכורת חייבת להיות לפני תחילת האימון ולא בעבר" };
  }

  await prisma.userWorkoutReminder.upsert({
    where: {
      workoutId_userId: {
        workoutId: params.workoutId,
        userId: params.userId,
      },
    },
    create: {
      workoutId: params.workoutId,
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

export async function createDefaultUserWorkoutReminder(
  workoutId: string,
  userId: string,
  workoutStartsAt: Date,
) {
  const result = await upsertUserWorkoutReminder({
    workoutId,
    userId,
    kind: "THIRTY_MINUTES",
    workoutStartsAt,
  });

  if (result.error) {
    return { skipped: true as const };
  }

  return { success: true as const };
}

export async function claimUserWorkoutReminder(reminderId: string, now = new Date()) {
  const result = await prisma.userWorkoutReminder.updateMany({
    where: {
      id: reminderId,
      ...reminderNotSentWhere,
    },
    data: { sentAt: now },
  });

  return result.count > 0;
}

export async function cancelUserWorkoutReminder(workoutId: string, userId: string) {
  await prisma.userWorkoutReminder.deleteMany({
    where: {
      workoutId,
      userId,
      ...reminderNotSentWhere,
    },
  });

  return { success: true as const };
}

export async function cancelAllUserWorkoutReminders(workoutId: string) {
  await prisma.userWorkoutReminder.deleteMany({
    where: {
      workoutId,
      ...reminderNotSentWhere,
    },
  });
}

export async function rescheduleWorkoutUserReminders(workoutId: string, workoutStartsAt: Date) {
  const reminders = await prisma.userWorkoutReminder.findMany({
    where: { workoutId, ...reminderNotSentWhere },
  });

  const now = new Date();

  for (const reminder of reminders) {
    const nextScheduledFor = computeReminderScheduledFor(
      workoutStartsAt,
      reminder.kind,
      reminder.kind === "CUSTOM" ? reminder.scheduledFor : undefined,
    );

    if (!nextScheduledFor || !isValidReminderTime(nextScheduledFor, workoutStartsAt, now)) {
      await prisma.userWorkoutReminder.delete({ where: { id: reminder.id } });
      continue;
    }

    await prisma.userWorkoutReminder.update({
      where: { id: reminder.id },
      data: { scheduledFor: nextScheduledFor },
    });
  }
}

export async function canUserManageWorkoutReminder(
  workoutId: string,
  userId: string,
  userRole: "COACH" | "TRAINEE",
) {
  const workout = await prisma.scheduledWorkout.findFirst({
    where: { id: workoutId, ...notCancelledWhere },
    include: {
      registrations: {
        where: notCancelledWhere,
        select: { traineeId: true },
      },
    },
  });

  if (!workout || workout.startsAt <= new Date()) {
    return { allowed: false as const, workout: null };
  }

  if (userRole === "COACH" && workout.coachId === userId) {
    return { allowed: true as const, workout };
  }

  if (userRole === "TRAINEE") {
    if (workout.type === "PERSONAL" && workout.traineeId === userId) {
      return { allowed: true as const, workout };
    }

    if (
      workout.type === "GROUP" &&
      workout.registrations.some((registration) => registration.traineeId === userId)
    ) {
      return { allowed: true as const, workout };
    }
  }

  return { allowed: false as const, workout: null };
}
