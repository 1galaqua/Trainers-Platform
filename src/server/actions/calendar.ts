"use server";

import { revalidatePath } from "next/cache";

import { requireCoach, requireUser } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { parseIsraelDateTime } from "@/lib/calendar-datetime";
import { getCalendarVisibleRange } from "@/lib/calendar-range";
import {
  findOverlappingCoachWorkout,
  SCHEDULE_OVERLAP_ERROR,
} from "@/lib/calendar-overlap";
import {
  createWorkoutInputFromFormData,
  validateCreateWorkoutInput,
  validateUpdateWorkoutInput,
} from "@/lib/calendar-validation";
import {
  getCoachTraineeIdsNotRegistered,
  notifyCoachAboutGroupCancellation,
  notifyCoachAboutGroupRegistration,
  notifyRegisteredTraineesAboutGroupCancellation,
  notifyRegisteredTraineesAboutGroupUpdate,
  notifyTraineeAboutPersonalCancellation,
  notifyTraineeAboutPersonalScheduled,
  notifyTraineeAboutPersonalUpdate,
  notifyTraineesAboutGroupEnrollment,
  notifyTraineesAboutGroupUnenrollment,
  notifyUnregisteredTraineesAboutGroupSpots,
} from "@/lib/calendar-notifications";
import {
  cancelGroupWorkoutReminder,
  scheduleGroupWorkoutReminder,
} from "@/lib/calendar-reminders";
import {
  cancelAllUserWorkoutReminders,
  cancelUserWorkoutReminder,
  createDefaultUserWorkoutReminder,
  rescheduleWorkoutUserReminders,
} from "@/lib/user-workout-reminders";
import { detectSignificantWorkoutChanges } from "@/lib/calendar-workout-changes";
import {
  getEffectiveWorkoutsCompleted,
  getTraineeStatus,
} from "@/lib/trainee-status";
import { notCancelledWhere } from "@/lib/calendar-prisma-filters";
import { prisma } from "@/lib/prisma";
import type { ProgramType, ScheduledWorkoutType, UserRole } from "@/lib/prisma-client";

export type CalendarWorkoutItem = {
  id: string;
  type: ScheduledWorkoutType;
  workoutKind: string;
  startsAt: string;
  durationMinutes: number;
  traineeId: string | null;
  traineeName: string | null;
  programId: string | null;
  programName: string | null;
  maxParticipants: number | null;
  registeredCount: number;
  isRegistered: boolean;
  registeredTrainees: CalendarRegisteredTrainee[];
  notes: string | null;
  userReminder: CalendarUserReminder | null;
};

export type CalendarUserReminder = {
  kind: "THIRTY_MINUTES" | "ONE_HOUR" | "CUSTOM";
  scheduledFor: string;
};

export type CalendarTraineeOption = {
  id: string;
  name: string;
  status: "active" | "inactive";
};

export type CalendarRegisteredTrainee = {
  id: string;
  name: string;
};

async function resolvePersonalWorkoutProgram(
  coachId: string,
  traineeId: string,
  programId: string,
): Promise<{ error?: string; programId?: string | null; workoutKind?: ProgramType }> {
  if (!programId) {
    return { programId: null, workoutKind: "CUSTOM" };
  }

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, coachId, traineeId, isActive: true },
    select: { id: true, type: true },
  });

  if (!program) {
    return { error: "התוכנית שנבחרה אינה תקינה" };
  }

  return { programId: program.id, workoutKind: program.type };
}

export async function getCoachTraineeProgramsForCalendarAction(traineeId: string) {
  const coach = await requireCoach();

  if (!traineeId) return [];

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, traineeId);
  if (!ownsTrainee) return [];

  try {
    return await prisma.trainingProgram.findMany({
      where: { coachId: coach.id, traineeId, isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return [];
  }
}

async function getCoachIdForUser(userId: string, role: UserRole) {
  if (role === "COACH") return userId;

  const link = await prisma.coachTrainee.findUnique({
    where: { traineeId: userId },
    select: { coachId: true },
  });

  return link?.coachId ?? null;
}

export async function getCoachTraineesForCalendarAction(): Promise<CalendarTraineeOption[]> {
  const coach = await requireCoach();

  const links = await prisma.coachTrainee.findMany({
    where: { coachId: coach.id },
    include: {
      trainee: {
        include: {
          workoutSessions: {
            where: { program: { coachId: coach.id } },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return links.map((link) => {
    const loggedSessionsCount = link.trainee.workoutSessions.length;
    const sessionsCount = getEffectiveWorkoutsCompleted(
      link.workoutsCompleted,
      loggedSessionsCount,
    );
    const status = getTraineeStatus({
      coachingStartDate: link.coachingStartDate,
      coachingEndDate: link.coachingEndDate,
      workoutQuota: link.workoutQuota,
      sessionsCount,
    });

    return {
      id: link.trainee.id,
      name: link.trainee.displayName ?? link.trainee.email ?? "מתאמן",
      status,
    };
  });
}

async function validateActiveGroupTraineeIds(
  coachId: string,
  traineeIds: string[],
): Promise<{ error?: string; traineeIds?: string[] }> {
  const uniqueIds = [...new Set(traineeIds)];
  if (uniqueIds.length === 0) {
    return { traineeIds: [] };
  }

  const links = await prisma.coachTrainee.findMany({
    where: {
      coachId,
      traineeId: { in: uniqueIds },
    },
    include: {
      trainee: {
        include: {
          workoutSessions: {
            where: { program: { coachId } },
            select: { id: true },
          },
        },
      },
    },
  });

  if (links.length !== uniqueIds.length) {
    return { error: "חלק מהמתאמנים שנבחרו אינם משויכים אליך" };
  }

  const inactiveNames: string[] = [];

  for (const link of links) {
    const sessionsCount = getEffectiveWorkoutsCompleted(
      link.workoutsCompleted,
      link.trainee.workoutSessions.length,
    );
    const status = getTraineeStatus({
      coachingStartDate: link.coachingStartDate,
      coachingEndDate: link.coachingEndDate,
      workoutQuota: link.workoutQuota,
      sessionsCount,
    });

    if (status !== "active") {
      inactiveNames.push(
        link.trainee.displayName ?? link.trainee.email ?? "מתאמן",
      );
    }
  }

  if (inactiveNames.length > 0) {
    return { error: `ניתן לרשום רק מתאמנים פעילים (${inactiveNames.join(", ")})` };
  }

  return { traineeIds: uniqueIds };
}

async function validateGroupTraineeIdsForUpdate(
  coachId: string,
  traineeIds: string[],
  previousTraineeIds: string[],
): Promise<{ error?: string; traineeIds?: string[] }> {
  const uniqueIds = [...new Set(traineeIds)];
  if (uniqueIds.length === 0) {
    return { traineeIds: [] };
  }

  const links = await prisma.coachTrainee.findMany({
    where: {
      coachId,
      traineeId: { in: uniqueIds },
    },
    select: { traineeId: true },
  });

  if (links.length !== uniqueIds.length) {
    return { error: "חלק מהמתאמנים שנבחרו אינם משויכים אליך" };
  }

  const toAdd = uniqueIds.filter((traineeId) => !previousTraineeIds.includes(traineeId));
  if (toAdd.length === 0) {
    return { traineeIds: uniqueIds };
  }

  const addValidation = await validateActiveGroupTraineeIds(coachId, toAdd);
  if (addValidation.error) {
    return { error: addValidation.error };
  }

  return { traineeIds: uniqueIds };
}

async function syncGroupWorkoutRegistrations(params: {
  workoutId: string;
  previousTraineeIds: string[];
  nextTraineeIds: string[];
}) {
  const nextIds = [...new Set(params.nextTraineeIds)];
  const previousIds = params.previousTraineeIds;
  const toAdd = nextIds.filter((traineeId) => !previousIds.includes(traineeId));
  const toRemove = previousIds.filter((traineeId) => !nextIds.includes(traineeId));

  if (toRemove.length > 0) {
    await prisma.groupWorkoutRegistration.updateMany({
      where: {
        workoutId: params.workoutId,
        traineeId: { in: toRemove },
        ...notCancelledWhere,
      },
      data: { cancelledAt: new Date() },
    });
  }

  for (const traineeId of toAdd) {
    const existing = await prisma.groupWorkoutRegistration.findUnique({
      where: {
        workoutId_traineeId: {
          workoutId: params.workoutId,
          traineeId,
        },
      },
    });

    if (existing) {
      await prisma.groupWorkoutRegistration.update({
        where: { id: existing.id },
        data: { cancelledAt: null, registeredAt: new Date() },
      });
    } else {
      await prisma.groupWorkoutRegistration.create({
        data: {
          workoutId: params.workoutId,
          traineeId,
        },
      });
    }
  }

  return { toAdd, toRemove };
}

export async function createScheduledWorkoutAction(formData: FormData) {
  const coach = await requireCoach();
  const input = createWorkoutInputFromFormData(formData);
  const validationError = validateCreateWorkoutInput(input);

  if (validationError) {
    return { error: validationError };
  }

  const startsAt = parseIsraelDateTime(input.date, input.time);
  if (!startsAt) {
    return { error: "יש לבחור תאריך ושעה תקינים" };
  }

  const overlappingWorkout = await findOverlappingCoachWorkout({
    coachId: coach.id,
    startsAt,
    durationMinutes: input.durationMinutes,
  });
  if (overlappingWorkout) {
    return { error: SCHEDULE_OVERLAP_ERROR };
  }

  if (input.type === "PERSONAL") {
    const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, input.traineeId);
    if (!ownsTrainee) {
      return { error: "המתאמן שנבחר אינו משויך אליך" };
    }

    const programResult = await resolvePersonalWorkoutProgram(
      coach.id,
      input.traineeId,
      input.programId,
    );
    if (programResult.error) {
      return { error: programResult.error };
    }

    const workout = await prisma.scheduledWorkout.create({
      data: {
        coachId: coach.id,
        type: "PERSONAL",
        workoutKind: programResult.workoutKind ?? "CUSTOM",
        startsAt,
        durationMinutes: input.durationMinutes,
        traineeId: input.traineeId,
        programId: programResult.programId ?? null,
        notes: input.notes || null,
      },
    });

    await notifyTraineeAboutPersonalScheduled({
      workout,
      traineeId: input.traineeId,
    });

    await createDefaultUserWorkoutReminder(workout.id, input.traineeId, startsAt);
    await createDefaultUserWorkoutReminder(workout.id, coach.id, startsAt);
  } else {
    const groupTraineeValidation = await validateActiveGroupTraineeIds(
      coach.id,
      input.groupTraineeIds,
    );
    if (groupTraineeValidation.error) {
      return { error: groupTraineeValidation.error };
    }

    const groupTraineeIds = groupTraineeValidation.traineeIds ?? [];

    const workout = await prisma.scheduledWorkout.create({
      data: {
        coachId: coach.id,
        type: "GROUP",
        workoutKind: input.workoutKind,
        startsAt,
        durationMinutes: input.durationMinutes,
        maxParticipants: input.maxParticipants,
        notes: input.notes || null,
      },
    });

    if (groupTraineeIds.length > 0) {
      await prisma.groupWorkoutRegistration.createMany({
        data: groupTraineeIds.map((traineeId) => ({
          workoutId: workout.id,
          traineeId,
        })),
      });

      await notifyTraineesAboutGroupEnrollment({
        workout,
        traineeIds: groupTraineeIds,
      });

      for (const traineeId of groupTraineeIds) {
        await createDefaultUserWorkoutReminder(workout.id, traineeId, startsAt);
      }
    }

    await createDefaultUserWorkoutReminder(workout.id, coach.id, startsAt);

    await scheduleGroupWorkoutReminder(workout.id, startsAt);

    const registeredCount = groupTraineeIds.length;
    const unregisteredIds = await getCoachTraineeIdsNotRegistered(coach.id, workout.id);
    if (unregisteredIds.length > 0) {
      await notifyUnregisteredTraineesAboutGroupSpots({
        workout,
        maxParticipants: input.maxParticipants,
        registeredCount,
        traineeIds: unregisteredIds,
      });
    }
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/updates");
  return { success: true as const };
}

async function getCoachOwnedWorkout(coachId: string, workoutId: string) {
  return prisma.scheduledWorkout.findFirst({
    where: {
      id: workoutId,
      coachId,
      ...notCancelledWhere,
    },
    include: {
      registrations: {
        where: notCancelledWhere,
        select: { traineeId: true },
      },
    },
  });
}

export async function updateScheduledWorkoutAction(workoutId: string, formData: FormData) {
  const coach = await requireCoach();
  const existing = await getCoachOwnedWorkout(coach.id, workoutId);

  if (!existing) {
    return { error: "האימון לא נמצא" };
  }

  if (existing.startsAt <= new Date()) {
    return { error: "לא ניתן לערוך אימון שכבר התחיל או עבר" };
  }

  const input = createWorkoutInputFromFormData(formData);
  const registeredCount = existing.registrations.length;
  const previousRegisteredIds = existing.registrations.map(
    (registration) => registration.traineeId,
  );
  const validationError = validateUpdateWorkoutInput(
    input,
    existing.type,
    registeredCount,
  );

  if (validationError) {
    return { error: validationError };
  }

  const startsAt = parseIsraelDateTime(input.date, input.time);
  if (!startsAt) {
    return { error: "יש לבחור תאריך ושעה תקינים" };
  }

  const overlappingWorkout = await findOverlappingCoachWorkout({
    coachId: coach.id,
    startsAt,
    durationMinutes: input.durationMinutes,
    excludeWorkoutId: existing.id,
  });
  if (overlappingWorkout) {
    return { error: SCHEDULE_OVERLAP_ERROR };
  }

  let nextGroupTraineeIds: string[] = [];
  let personalProgramUpdate: { programId: string | null; workoutKind: ProgramType } | null = null;

  if (existing.type === "PERSONAL") {
    const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, input.traineeId);
    if (!ownsTrainee) {
      return { error: "המתאמן שנבחר אינו משויך אליך" };
    }

    const programResult = await resolvePersonalWorkoutProgram(
      coach.id,
      input.traineeId,
      input.programId,
    );
    if (programResult.error) {
      return { error: programResult.error };
    }

    personalProgramUpdate = {
      programId: programResult.programId ?? null,
      workoutKind: programResult.workoutKind ?? "CUSTOM",
    };
  } else {
    const groupTraineeValidation = await validateGroupTraineeIdsForUpdate(
      coach.id,
      input.groupTraineeIds,
      previousRegisteredIds,
    );
    if (groupTraineeValidation.error) {
      return { error: groupTraineeValidation.error };
    }
    nextGroupTraineeIds = groupTraineeValidation.traineeIds ?? [];
  }

  const updateData =
    existing.type === "PERSONAL"
      ? {
          startsAt,
          durationMinutes: input.durationMinutes,
          traineeId: input.traineeId,
          programId: personalProgramUpdate?.programId ?? null,
          workoutKind: personalProgramUpdate?.workoutKind ?? existing.workoutKind,
          notes: input.notes || null,
        }
      : {
          startsAt,
          durationMinutes: input.durationMinutes,
          workoutKind: input.workoutKind,
          maxParticipants: input.maxParticipants,
          notes: input.notes || null,
        };

  const changeResult = detectSignificantWorkoutChanges(
    {
      type: existing.type,
      startsAt: existing.startsAt,
      durationMinutes: existing.durationMinutes,
      workoutKind: existing.workoutKind,
      traineeId: existing.traineeId,
      maxParticipants: existing.maxParticipants,
      registeredCount,
    },
    {
      startsAt,
      durationMinutes: input.durationMinutes,
      workoutKind: existing.type === "GROUP" ? input.workoutKind : existing.workoutKind,
      traineeId: existing.type === "PERSONAL" ? input.traineeId : null,
      maxParticipants: existing.type === "GROUP" ? input.maxParticipants : null,
    },
  );

  const updated = await prisma.scheduledWorkout.update({
    where: { id: existing.id },
    data: updateData,
  });

  if (existing.type === "GROUP") {
    const groupRegistrationChanges = await syncGroupWorkoutRegistrations({
      workoutId: existing.id,
      previousTraineeIds: previousRegisteredIds,
      nextTraineeIds: nextGroupTraineeIds,
    });

    try {
      if (groupRegistrationChanges.toAdd.length > 0) {
        await notifyTraineesAboutGroupEnrollment({
          workout: updated,
          traineeIds: groupRegistrationChanges.toAdd,
        });
      }

      if (groupRegistrationChanges.toRemove.length > 0) {
        await notifyTraineesAboutGroupUnenrollment({
          workout: updated,
          traineeIds: groupRegistrationChanges.toRemove,
        });
      }

      const wasFullBefore =
        existing.maxParticipants != null && registeredCount >= existing.maxParticipants;
      const newRegisteredCount = nextGroupTraineeIds.length;

      if (
        wasFullBefore &&
        updated.maxParticipants != null &&
        newRegisteredCount < updated.maxParticipants
      ) {
        const unregisteredIds = await getCoachTraineeIdsNotRegistered(coach.id, updated.id);
        if (unregisteredIds.length > 0) {
          await notifyUnregisteredTraineesAboutGroupSpots({
            workout: updated,
            maxParticipants: updated.maxParticipants,
            registeredCount: newRegisteredCount,
            traineeIds: unregisteredIds,
          });
        }
      }
    } catch (error) {
      console.error("Failed to send group registration notifications:", error);
    }
  }

  if (changeResult.hasSignificantChange) {
    if (existing.type === "PERSONAL" && updated.traineeId) {
      await notifyTraineeAboutPersonalUpdate({
        workout: updated,
        traineeId: updated.traineeId,
      });

      if (existing.traineeId && existing.traineeId !== updated.traineeId) {
        await notifyTraineeAboutPersonalCancellation({
          workout: existing,
          traineeId: existing.traineeId,
        });
      }
    }

    if (existing.type === "GROUP") {
      await notifyRegisteredTraineesAboutGroupUpdate({
        workout: updated,
        traineeIds: nextGroupTraineeIds,
      });

      if (changeResult.spotsOpened && updated.maxParticipants != null) {
        const unregisteredIds = await getCoachTraineeIdsNotRegistered(coach.id, updated.id);
        await notifyUnregisteredTraineesAboutGroupSpots({
          workout: updated,
          maxParticipants: updated.maxParticipants,
          registeredCount: nextGroupTraineeIds.length,
          traineeIds: unregisteredIds,
        });
      }
    }
  }

  if (existing.type === "GROUP" && existing.startsAt.getTime() !== startsAt.getTime()) {
    await scheduleGroupWorkoutReminder(updated.id, startsAt);
  }

  if (existing.startsAt.getTime() !== startsAt.getTime()) {
    await rescheduleWorkoutUserReminders(updated.id, startsAt);
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/updates");
  return { success: true as const };
}

export async function cancelScheduledWorkoutAction(workoutId: string) {
  const coach = await requireCoach();
  const existing = await getCoachOwnedWorkout(coach.id, workoutId);

  if (!existing) {
    return { error: "האימון לא נמצא" };
  }

  if (existing.startsAt <= new Date()) {
    return { error: "לא ניתן לבטל אימון שכבר התחיל או עבר" };
  }

  await prisma.scheduledWorkout.update({
    where: { id: existing.id },
    data: { cancelledAt: new Date() },
  });

  await cancelGroupWorkoutReminder(existing.id);
  await cancelAllUserWorkoutReminders(existing.id);

  if (existing.type === "PERSONAL" && existing.traineeId) {
    await notifyTraineeAboutPersonalCancellation({
      workout: existing,
      traineeId: existing.traineeId,
    });
  }

  if (existing.type === "GROUP") {
    const registeredIds = existing.registrations.map(
      (registration) => registration.traineeId,
    );

    await notifyRegisteredTraineesAboutGroupCancellation({
      workout: existing,
      traineeIds: registeredIds,
    });
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/updates");
  return { success: true as const };
}

async function getGroupWorkoutForTrainee(workoutId: string, traineeId: string) {
  const coachId = await getCoachIdForUser(traineeId, "TRAINEE");
  if (!coachId) return null;

  return prisma.scheduledWorkout.findFirst({
    where: {
      id: workoutId,
      coachId,
      type: "GROUP",
      ...notCancelledWhere,
    },
    include: {
      registrations: {
        where: notCancelledWhere,
        select: { traineeId: true },
      },
    },
  });
}

export async function registerForGroupWorkoutAction(workoutId: string) {
  const user = await requireUser();
  if (user.role !== "TRAINEE") {
    return { error: "רק מתאמנים יכולים להירשם לאימון קבוצתי" };
  }

  const workout = await getGroupWorkoutForTrainee(workoutId, user.id);
  if (!workout) {
    return { error: "האימון לא נמצא" };
  }

  if (workout.startsAt <= new Date()) {
    return { error: "לא ניתן להירשם לאימון שכבר התחיל או עבר" };
  }

  if (workout.maxParticipants == null) {
    return { error: "אימון לא תקין" };
  }

  const activeCount = workout.registrations.length;
  const alreadyRegistered = workout.registrations.some(
    (registration) => registration.traineeId === user.id,
  );

  if (alreadyRegistered) {
    return { error: "כבר נרשמת לאימון זה" };
  }

  if (activeCount >= workout.maxParticipants) {
    return { error: "האימון מלא" };
  }

  const coachId = await getCoachIdForUser(user.id, "TRAINEE");
  if (!coachId) {
    return { error: "לא נמצא מאמן משויך" };
  }

  const traineeName = user.displayName ?? user.email ?? "מתאמן";

  const existing = await prisma.groupWorkoutRegistration.findUnique({
    where: {
      workoutId_traineeId: {
        workoutId,
        traineeId: user.id,
      },
    },
  });

  if (existing?.cancelledAt == null && existing) {
    return { error: "כבר נרשמת לאימון זה" };
  }

  if (existing) {
    await prisma.groupWorkoutRegistration.update({
      where: { id: existing.id },
      data: { cancelledAt: null, registeredAt: new Date() },
    });
  } else {
    await prisma.groupWorkoutRegistration.create({
      data: {
        workoutId,
        traineeId: user.id,
      },
    });
  }

  await notifyCoachAboutGroupRegistration({
    workout,
    traineeName,
  });

  await notifyTraineesAboutGroupEnrollment({
    workout,
    traineeIds: [user.id],
  });

  await createDefaultUserWorkoutReminder(workoutId, user.id, workout.startsAt);

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/updates");
  return { success: true as const };
}

export async function cancelGroupWorkoutRegistrationAction(workoutId: string) {
  const user = await requireUser();
  if (user.role !== "TRAINEE") {
    return { error: "רק מתאמנים יכולים לבטל רישום" };
  }

  const registration = await prisma.groupWorkoutRegistration.findFirst({
    where: {
      workoutId,
      traineeId: user.id,
      ...notCancelledWhere,
      workout: {
        type: "GROUP",
        ...notCancelledWhere,
      },
    },
    include: {
      workout: true,
    },
  });

  if (!registration) {
    return { error: "לא נמצא רישום פעיל לאימון זה" };
  }

  if (registration.workout.startsAt <= new Date()) {
    return { error: "לא ניתן לבטל רישום לאימון שכבר התחיל או עבר" };
  }

  await prisma.groupWorkoutRegistration.update({
    where: { id: registration.id },
    data: { cancelledAt: new Date() },
  });

  const traineeName = user.displayName ?? user.email ?? "מתאמן";
  const workout = registration.workout;

  await notifyCoachAboutGroupCancellation({
    workout,
    traineeName,
  });

  await cancelUserWorkoutReminder(workoutId, user.id);

  if (workout.maxParticipants != null) {
    const registeredCount = await prisma.groupWorkoutRegistration.count({
      where: { workoutId, ...notCancelledWhere },
    });
    const hadNoSpotsBefore = registeredCount + 1 >= workout.maxParticipants;
    const hasSpotsNow = registeredCount < workout.maxParticipants;

    if (hadNoSpotsBefore && hasSpotsNow) {
      const coachId = await getCoachIdForUser(user.id, "TRAINEE");
      if (coachId) {
        const unregisteredIds = await getCoachTraineeIdsNotRegistered(coachId, workoutId);
        if (unregisteredIds.length > 0) {
          await notifyUnregisteredTraineesAboutGroupSpots({
            workout,
            maxParticipants: workout.maxParticipants,
            registeredCount,
            traineeIds: unregisteredIds,
          });
        }
      }
    }
  }

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/updates");
  return { success: true as const };
}

export async function getCalendarWorkoutsAction(): Promise<CalendarWorkoutItem[]> {
  const user = await requireUser();
  const { start, end } = getCalendarVisibleRange();

  if (user.role === "ADMIN") return [];

  const coachId = await getCoachIdForUser(user.id, user.role);
  if (!coachId) return [];

  const workouts = await prisma.scheduledWorkout.findMany({
    where: {
      coachId,
      startsAt: { gte: start, lte: end },
      AND: [
        notCancelledWhere,
        ...(user.role === "TRAINEE"
          ? [
              {
                OR: [
                  { type: "GROUP" as const },
                  { type: "PERSONAL" as const, traineeId: user.id },
                ],
              },
            ]
          : []),
      ],
    },
    orderBy: { startsAt: "asc" },
    include: {
      trainee: { select: { displayName: true } },
      program: { select: { name: true } },
      registrations: {
        where: notCancelledWhere,
        select: {
          traineeId: true,
          trainee: {
            select: { id: true, displayName: true, email: true },
          },
        },
      },
    },
  });

  const workoutIds = workouts.map((workout) => workout.id);
  const userReminders = await prisma.userWorkoutReminder.findMany({
    where: {
      userId: user.id,
      workoutId: { in: workoutIds },
      sentAt: null,
    },
    select: {
      workoutId: true,
      kind: true,
      scheduledFor: true,
    },
  });

  const reminderByWorkoutId = new Map(
    userReminders.map((reminder) => [reminder.workoutId, reminder]),
  );

  return workouts.map((workout) => {
    const reminder = reminderByWorkoutId.get(workout.id);

    return {
    id: workout.id,
    type: workout.type,
    workoutKind: workout.workoutKind,
    startsAt: workout.startsAt.toISOString(),
    durationMinutes: workout.durationMinutes,
    traineeId: workout.traineeId,
    traineeName: workout.trainee?.displayName ?? null,
    programId: workout.programId,
    programName: workout.program?.name ?? null,
    maxParticipants: workout.maxParticipants,
    registeredCount: workout.registrations.length,
    isRegistered:
      user.role === "TRAINEE"
        ? workout.registrations.some((registration) => registration.traineeId === user.id)
        : false,
    registeredTrainees:
      user.role === "COACH"
        ? workout.registrations.map((registration) => ({
            id: registration.trainee.id,
            name:
              registration.trainee.displayName ??
              registration.trainee.email ??
              "מתאמן",
          }))
        : [],
    notes: workout.notes,
    userReminder: reminder
      ? {
          kind: reminder.kind,
          scheduledFor: reminder.scheduledFor.toISOString(),
        }
      : null,
  };
  });
}
