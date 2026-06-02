"use server";

import { revalidatePath } from "next/cache";
import type { PhotoCategory } from "@prisma/client";

import { requireCoach, requireTraineeOnboarded } from "@/lib/auth";
import { getWeekStart } from "@/lib/program-labels";
import { prisma } from "@/lib/prisma";

export async function uploadProgressPhotoAction(formData: FormData) {
  const trainee = await requireTraineeOnboarded();

  const category = String(formData.get("category") ?? "") as PhotoCategory;
  const imageUrl = String(formData.get("imageUrl") ?? "");

  if (!category || !imageUrl) {
    return { error: "יש לבחור קטגוריה ולהעלות תמונה" };
  }

  const weekStart = getWeekStart();

  try {
    const countThisWeek = await prisma.progressPhoto.count({
      where: { traineeId: trainee.id, weekStart },
    });

    if (countThisWeek >= 3) {
      return { error: "ניתן להעלות עד 3 תמונות בשבוע" };
    }

    await prisma.progressPhoto.create({
      data: {
        traineeId: trainee.id,
        category,
        imageUrl,
        weekStart,
      },
    });

    revalidatePath("/dashboard/photos");
    return { success: true };
  } catch {
    return { error: "שגיאה בהעלאת התמונה" };
  }
}

export async function getMyPhotosAction() {
  const trainee = await requireTraineeOnboarded();

  try {
    return await prisma.progressPhoto.findMany({
      where: { traineeId: trainee.id },
      orderBy: [{ weekStart: "desc" }, { uploadedAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export async function getTraineePhotosAction(traineeId: string) {
  await requireCoach();

  try {
    return await prisma.progressPhoto.findMany({
      where: { traineeId },
      orderBy: [{ weekStart: "desc" }, { uploadedAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export async function getWeeklyPhotoCountAction() {
  const trainee = await requireTraineeOnboarded();
  const weekStart = getWeekStart();

  try {
    return await prisma.progressPhoto.count({
      where: { traineeId: trainee.id, weekStart },
    });
  } catch {
    return 0;
  }
}
