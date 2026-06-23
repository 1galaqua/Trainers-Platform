"use server";

import { revalidatePath } from "next/cache";

import { requireTraineeOnboarded } from "@/lib/auth";
import {
  parseTrackingDaysOfWeek,
  parseTrackingTimeLocal,
} from "@/lib/tracking-validation";
import { prisma } from "@/lib/prisma";

export type StepsReminderSettings = {
  enabled: boolean;
  daysOfWeek: number[];
  timeLocal: string;
};

function revalidateStepsPaths() {
  revalidatePath("/dashboard/tracking");
}

export async function upsertStepsReminderAction(formData: FormData) {
  const trainee = await requireTraineeOnboarded();

  const enabled = formData.get("enabled") === "true" || formData.get("enabled") === "on";
  const daysOfWeek = parseTrackingDaysOfWeek(formData.getAll("daysOfWeek"));
  const timeLocal = parseTrackingTimeLocal(formData.get("timeLocal"));

  if (enabled) {
    if (!daysOfWeek) return { error: "יש לבחור לפחות יום אחד" };
    if (!timeLocal) return { error: "יש לבחור שעה תקינה" };
  }

  try {
    await prisma.stepsReminder.upsert({
      where: { traineeId: trainee.id },
      create: {
        traineeId: trainee.id,
        enabled,
        daysOfWeek: daysOfWeek ?? [],
        timeLocal: timeLocal ?? "20:00",
      },
      update: {
        enabled,
        ...(daysOfWeek ? { daysOfWeek } : {}),
        ...(timeLocal ? { timeLocal } : {}),
      },
    });
  } catch {
    return { error: "שגיאה בשמירת התזכורת" };
  }

  revalidateStepsPaths();
  return { success: true as const };
}

export async function cancelStepsReminderAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    const existing = await prisma.stepsReminder.findUnique({
      where: { traineeId: trainee.id },
      select: { id: true, enabled: true },
    });

    if (!existing?.enabled) return { error: "אין תזכורת פעילה לביטול" };

    await prisma.stepsReminder.update({
      where: { traineeId: trainee.id },
      data: { enabled: false },
    });
  } catch {
    return { error: "שגיאה בביטול התזכורת" };
  }

  revalidateStepsPaths();
  return { success: true as const };
}

export async function upsertMeasurementsReminderAction(formData: FormData) {
  const trainee = await requireTraineeOnboarded();

  const enabled = formData.get("enabled") === "true" || formData.get("enabled") === "on";
  const daysOfWeek = parseTrackingDaysOfWeek(formData.getAll("daysOfWeek"));
  const timeLocal = parseTrackingTimeLocal(formData.get("timeLocal"));

  if (enabled) {
    if (!daysOfWeek) return { error: "יש לבחור לפחות יום אחד" };
    if (!timeLocal) return { error: "יש לבחור שעה תקינה" };
  }

  try {
    await prisma.measurementsReminder.upsert({
      where: { traineeId: trainee.id },
      create: {
        traineeId: trainee.id,
        enabled,
        daysOfWeek: daysOfWeek ?? [],
        timeLocal: timeLocal ?? "09:00",
      },
      update: {
        enabled,
        ...(daysOfWeek ? { daysOfWeek } : {}),
        ...(timeLocal ? { timeLocal } : {}),
      },
    });
  } catch {
    return { error: "שגיאה בשמירת התזכורת" };
  }

  revalidatePath("/dashboard/tracking");
  return { success: true as const };
}

export async function cancelMeasurementsReminderAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    const existing = await prisma.measurementsReminder.findUnique({
      where: { traineeId: trainee.id },
      select: { id: true, enabled: true },
    });

    if (!existing?.enabled) return { error: "אין תזכורת פעילה לביטול" };

    await prisma.measurementsReminder.update({
      where: { traineeId: trainee.id },
      data: { enabled: false },
    });
  } catch {
    return { error: "שגיאה בביטול התזכורת" };
  }

  revalidatePath("/dashboard/tracking");
  return { success: true as const };
}
