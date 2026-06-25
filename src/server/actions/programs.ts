"use server";

import { revalidatePath } from "next/cache";
import type { ProgramType } from "@/lib/prisma-client";

import { requireCoach } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import {
  assignGlobalExerciseSortOrders,
  buildProgramSectionSyncPlan,
  getProgramSectionSyncError,
  parseProgramSectionsPayload,
  validateProgramSections,
  type ProgramExerciseInput,
  type ProgramSectionInput,
} from "@/lib/program-sections";
import {
  ensureLegacyProgramSections,
  programSectionsInclude,
} from "@/lib/program-sections-persistence";
import { workoutSessionLogInclude } from "@/lib/workout-session-display";
import { prisma } from "@/lib/prisma";

export type ExerciseInput = ProgramExerciseInput;
export type SectionInput = ProgramSectionInput;

function readSectionsFromForm(formData: FormData) {
  const sectionsJson = String(formData.get("sections") ?? "");
  const legacyExercisesJson = String(formData.get("exercises") ?? "");
  return parseProgramSectionsPayload(
    sectionsJson,
    legacyExercisesJson || undefined,
  );
}

function exercisePayload(exercise: ProgramExerciseInput & { sortOrder: number }) {
  return {
    name: exercise.name.trim(),
    sets: exercise.sets,
    reps: exercise.reps,
    restSeconds: exercise.restSeconds,
    coachNotes: exercise.coachNotes?.trim() || null,
    youtubeUrl: exercise.youtubeUrl?.trim() || null,
    instructions: exercise.instructions?.trim() || null,
    sortOrder: exercise.sortOrder,
  };
}

async function syncProgramSections(
  programId: string,
  submittedSections: ProgramSectionInput[],
  existingSections: Array<{
    id: string;
    name: string;
    sortOrder: number;
    exercises: Array<{ id: string; name: string; _count: { logs: number } }>;
  }>,
) {
  const syncPlan = buildProgramSectionSyncPlan(
    existingSections.map((section) => ({
      id: section.id,
      name: section.name,
      sortOrder: section.sortOrder,
      exercises: section.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        logCount: exercise._count.logs,
      })),
    })),
    submittedSections,
  );

  const syncError = getProgramSectionSyncError(syncPlan);
  if (syncError) return syncError;

  if (syncPlan.exercisesToDelete.length > 0) {
    await prisma.programExercise.deleteMany({
      where: { id: { in: syncPlan.exercisesToDelete }, programId },
    });
  }

  if (syncPlan.sectionsToDelete.length > 0) {
    await prisma.programSection.deleteMany({
      where: { id: { in: syncPlan.sectionsToDelete }, programId },
    });
  }

  const orderedSections = assignGlobalExerciseSortOrders(submittedSections);

  for (const [sectionIndex, section] of orderedSections.entries()) {
    const sectionPayload = {
      name: section.name.trim(),
      sortOrder: sectionIndex,
    };

    let sectionId = section.id;

    if (section.id) {
      const belongs = existingSections.some((existing) => existing.id === section.id);
      if (belongs) {
        await prisma.programSection.update({
          where: { id: section.id },
          data: sectionPayload,
        });
      } else {
        sectionId = undefined;
      }
    }

    if (!sectionId) {
      const createdSection = await prisma.programSection.create({
        data: { programId, ...sectionPayload },
      });
      sectionId = createdSection.id;
    }

    for (const exercise of section.exercises) {
      const payload = exercisePayload(exercise);

      if (exercise.id) {
        const belongs = existingSections.some((existingSection) =>
          existingSection.exercises.some((existingExercise) => existingExercise.id === exercise.id),
        );
        if (belongs) {
          await prisma.programExercise.update({
            where: { id: exercise.id },
            data: { ...payload, sectionId },
          });
          continue;
        }
      }

      await prisma.programExercise.create({
        data: {
          programId,
          sectionId,
          ...payload,
        },
      });
    }
  }

  return null;
}

export async function createTrainingProgramAction(formData: FormData) {
  const coach = await requireCoach();

  const traineeId = String(formData.get("traineeId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "CUSTOM") as ProgramType;
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!traineeId || !name) {
    return { error: "יש לבחור מתאמן ולהזין שם לתוכנית" };
  }

  const parsed = readSectionsFromForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const validationError = validateProgramSections(parsed.sections);
  if (validationError) return { error: validationError };

  try {
    const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
    if (!ownsTrainee) {
      return { error: "ניתן לשייך תוכנית רק למתאמנים שלך" };
    }

    const program = await prisma.trainingProgram.create({
      data: {
        coachId: coach.id,
        traineeId,
        name,
        type,
        description,
      },
    });

    const syncError = await syncProgramSections(program.id, parsed.sections, []);
    if (syncError) {
      await prisma.trainingProgram.delete({ where: { id: program.id } });
      return { error: syncError };
    }

    revalidatePath("/dashboard/workouts");
    revalidatePath("/dashboard/trainees");
    revalidatePath("/dashboard/my-program");
    return { success: true, programId: program.id };
  } catch {
    return { error: "שגיאה ביצירת התוכנית" };
  }
}

export async function updateTrainingProgramAction(formData: FormData) {
  const coach = await requireCoach();

  const programId = String(formData.get("programId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "CUSTOM") as ProgramType;
  const description = String(formData.get("description") ?? "").trim() || null;
  const isActiveRaw = String(formData.get("isActive") ?? "true");
  const isActive = isActiveRaw !== "false";

  if (!programId || !name) {
    return { error: "תוכנית לא נמצאה או חסר שם" };
  }

  const parsed = readSectionsFromForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const validationError = validateProgramSections(parsed.sections);
  if (validationError) return { error: validationError };

  try {
    await ensureLegacyProgramSections(programId);

    const program = await prisma.trainingProgram.findFirst({
      where: { id: programId, coachId: coach.id },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
          include: {
            exercises: {
              include: { _count: { select: { logs: true } } },
            },
          },
        },
      },
    });

    if (!program) return { error: "תוכנית לא נמצאה" };

    await prisma.trainingProgram.update({
      where: { id: programId },
      data: { name, type, description, isActive },
    });

    const syncError = await syncProgramSections(programId, parsed.sections, program.sections);
    if (syncError) return { error: syncError };

    revalidatePath("/dashboard/workouts");
    revalidatePath(`/dashboard/workouts/${programId}`);
    revalidatePath(`/dashboard/workouts/${programId}/edit`);
    revalidatePath("/dashboard/trainees");
    revalidatePath("/dashboard/my-program");
    return { success: true, programId };
  } catch {
    return { error: "שגיאה בעדכון התוכנית" };
  }
}

export async function deleteTrainingProgramAction(programId: string) {
  const coach = await requireCoach();

  if (!programId) {
    return { error: "תוכנית לא נמצאה" };
  }

  try {
    const program = await prisma.trainingProgram.findFirst({
      where: { id: programId, coachId: coach.id },
      select: { id: true },
    });

    if (!program) {
      return { error: "תוכנית לא נמצאה" };
    }

    const [sessions, exercises] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { programId },
        select: { id: true },
      }),
      prisma.programExercise.findMany({
        where: { programId },
        select: { id: true },
      }),
    ]);

    const sessionIds = sessions.map((session) => session.id);
    const exerciseIds = exercises.map((exercise) => exercise.id);

    const logOrConditions = [];
    if (sessionIds.length > 0) {
      logOrConditions.push({ sessionId: { in: sessionIds } });
    }
    if (exerciseIds.length > 0) {
      logOrConditions.push({ exerciseId: { in: exerciseIds } });
    }

    const exerciseLogs =
      logOrConditions.length > 0
        ? await prisma.exerciseLog.findMany({
            where: { OR: logOrConditions },
            select: { id: true },
          })
        : [];

    const exerciseLogIds = exerciseLogs.map((log) => log.id);

    if (exerciseLogIds.length > 0) {
      await prisma.exerciseSetLog.deleteMany({
        where: { exerciseLogId: { in: exerciseLogIds } },
      });
      await prisma.exerciseLog.deleteMany({
        where: { id: { in: exerciseLogIds } },
      });
    }

    if (sessionIds.length > 0) {
      await prisma.workoutSession.deleteMany({
        where: { id: { in: sessionIds } },
      });
    }

    if (exerciseIds.length > 0) {
      await prisma.programExercise.deleteMany({
        where: { id: { in: exerciseIds } },
      });
    }

    await prisma.programSection.deleteMany({
      where: { programId },
    });

    await prisma.trainingProgram.delete({
      where: { id: programId },
    });

    revalidatePath("/dashboard/workouts");
    revalidatePath("/dashboard/trainees");
    revalidatePath("/dashboard/my-program");
    revalidatePath("/dashboard/progress");
    revalidatePath("/dashboard");

    return { success: true as const };
  } catch {
    return { error: "שגיאה במחיקת התוכנית" };
  }
}

export async function getCoachTraineesAction() {
  const coach = await requireCoach();

  try {
    const links = await prisma.coachTrainee.findMany({
      where: { coachId: coach.id },
      include: {
        trainee: {
          include: {
            programsAsTrainee: {
              where: { coachId: coach.id, isActive: true },
              orderBy: { updatedAt: "desc" },
              include: { _count: { select: { sessions: true } } },
            },
            questionnaireResponse: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return links.map((l) => l.trainee);
  } catch {
    return [];
  }
}

export async function getCoachProgramsAction() {
  const coach = await requireCoach();

  try {
    return await prisma.trainingProgram.findMany({
      where: { coachId: coach.id },
      include: {
        trainee: true,
        _count: { select: { exercises: true, sessions: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getProgramByIdAction(programId: string) {
  const coach = await requireCoach();

  try {
    await ensureLegacyProgramSections(programId);

    return prisma.trainingProgram.findFirst({
      where: { id: programId, coachId: coach.id },
      include: {
        trainee: true,
        coach: true,
        ...programSectionsInclude,
        sessions: {
          orderBy: { completedAt: "desc" },
          include: {
            logs: {
              include: workoutSessionLogInclude,
            },
          },
          take: 10,
        },
      },
    });
  } catch {
    return null;
  }
}
