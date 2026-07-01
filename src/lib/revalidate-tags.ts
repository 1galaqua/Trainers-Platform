import { revalidateTag } from "next/cache";

import {
  calendarMonthTag,
  calendarWorkoutsTag,
  coachTraineesTag,
  logWorkoutTag,
  notificationsTag,
  programsTag,
  trackingRemindersTag,
  trackingWeekTag,
  traineeDetailTag,
  userTag,
} from "@/lib/cache-tags";

export function revalidateUser(userId: string) {
  revalidateTag(userTag(userId));
}

export function revalidateNotifications(userId: string) {
  revalidateTag(notificationsTag(userId));
}

export function revalidateTrackingWeek(traineeId: string, weekStart: string) {
  revalidateTag(trackingWeekTag(traineeId, weekStart));
}

export function revalidatePrograms(traineeId: string) {
  revalidateTag(programsTag(traineeId));
}

export function revalidateLogWorkout(traineeId: string) {
  revalidateTag(logWorkoutTag(traineeId));
}

export function revalidateTraineeDetail(traineeId: string) {
  revalidateTag(traineeDetailTag(traineeId));
}

export function revalidateCalendarMonth(userId: string, monthKey: string) {
  revalidateTag(calendarMonthTag(userId, monthKey));
}

export function revalidateCalendarWorkouts(userId: string) {
  revalidateTag(calendarWorkoutsTag(userId));
}

export function revalidateCalendarWorkoutsForUsers(userIds: Iterable<string>) {
  for (const userId of new Set(userIds)) {
    if (userId) revalidateCalendarWorkouts(userId);
  }
}

export function revalidateCoachTrainees(coachId: string) {
  revalidateTag(coachTraineesTag(coachId));
}

export function revalidateTrackingReminders(traineeId: string) {
  revalidateTag(trackingRemindersTag(traineeId));
}
