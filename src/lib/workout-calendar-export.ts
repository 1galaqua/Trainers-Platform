import { programTypeLabels } from "@/lib/program-labels";
import type { ProgramType } from "@/lib/prisma-client";
import {
  formatWorkoutDeliverySummary,
  type WorkoutDeliveryMode,
} from "@/lib/workout-delivery";

export type WorkoutCalendarExportInput = {
  id: string;
  type: "PERSONAL" | "GROUP";
  workoutKind: string;
  startsAt: string;
  durationMinutes: number;
  deliveryMode?: WorkoutDeliveryMode;
  meetingLink?: string | null;
  traineeName?: string | null;
  programName?: string | null;
  notes?: string | null;
};

function formatICSUtc(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function formatGoogleCalendarDate(date: Date) {
  return formatICSUtc(date);
}

function escapeICSValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function getWorkoutCalendarTitle(workout: WorkoutCalendarExportInput) {
  const kindLabel = programTypeLabels[workout.workoutKind as ProgramType] ?? workout.workoutKind;
  const deliveryMode = workout.deliveryMode ?? "IN_PERSON";
  const deliveryLabel = formatWorkoutDeliverySummary(deliveryMode, workout.meetingLink);

  if (workout.type === "PERSONAL") {
    if (workout.traineeName) {
      return `אימון אישי · ${workout.traineeName} · ${deliveryLabel}`;
    }
    return `אימון אישי · ${deliveryLabel}`;
  }

  return `אימון קבוצתי · ${kindLabel} · ${deliveryLabel}`;
}

export function getWorkoutCalendarDescription(workout: WorkoutCalendarExportInput) {
  const deliveryMode = workout.deliveryMode ?? "IN_PERSON";
  const parts = [
    workout.type === "PERSONAL" ? "אימון אישי" : "אימון קבוצתי",
    formatWorkoutDeliverySummary(deliveryMode, workout.meetingLink),
    programTypeLabels[workout.workoutKind as ProgramType] ?? workout.workoutKind,
    workout.programName ? `תוכנית: ${workout.programName}` : null,
    workout.meetingLink ? `קישור: ${workout.meetingLink}` : null,
    workout.notes ? workout.notes : null,
  ].filter(Boolean);

  return parts.join("\n");
}

export function buildWorkoutICSContent(workout: WorkoutCalendarExportInput) {
  const startsAt = new Date(workout.startsAt);
  const endsAt = new Date(startsAt.getTime() + workout.durationMinutes * 60_000);
  const title = getWorkoutCalendarTitle(workout);
  const description = getWorkoutCalendarDescription(workout);
  const uid = `workout-${workout.id}@trainers-platform`;
  const deliveryMode = workout.deliveryMode ?? "IN_PERSON";
  const locationLine =
    deliveryMode === "ONLINE" && workout.meetingLink
      ? `LOCATION:${escapeICSValue(workout.meetingLink)}`
      : null;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Trainers Platform//Calendar//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSUtc(new Date())}`,
    `DTSTART:${formatICSUtc(startsAt)}`,
    `DTEND:${formatICSUtc(endsAt)}`,
    `SUMMARY:${escapeICSValue(title)}`,
    `DESCRIPTION:${escapeICSValue(description)}`,
    ...(locationLine ? [locationLine] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildGoogleCalendarAddEventUrl(workout: WorkoutCalendarExportInput) {
  const startsAt = new Date(workout.startsAt);
  const endsAt = new Date(startsAt.getTime() + workout.durationMinutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: getWorkoutCalendarTitle(workout),
    dates: `${formatGoogleCalendarDate(startsAt)}/${formatGoogleCalendarDate(endsAt)}`,
    details: getWorkoutCalendarDescription(workout),
  });

  const deliveryMode = workout.deliveryMode ?? "IN_PERSON";
  if (deliveryMode === "ONLINE" && workout.meetingLink) {
    params.set("location", workout.meetingLink);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function createWorkoutICSFile(workout: WorkoutCalendarExportInput) {
  const content = buildWorkoutICSContent(workout);
  return new File([content], `workout-${workout.id}.ics`, {
    type: "text/calendar",
  });
}

export function isMobileCalendarDevice(userAgent: string) {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
}

export function isAndroidCalendarDevice(userAgent: string) {
  return /Android/i.test(userAgent);
}

export function isIOSCalendarDevice(userAgent: string) {
  return /iPhone|iPad|iPod/i.test(userAgent);
}

export function getWorkoutICSUrl(workoutId: string, origin = "") {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/api/calendar/workouts/${workoutId}/calendar.ics`;
}

async function tryShareWorkoutICS(
  workout: WorkoutCalendarExportInput,
  icsUrl: string,
): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }

  const title = getWorkoutCalendarTitle(workout);
  const file = createWorkoutICSFile(workout);

  const fileShare = { files: [file], title };
  if (typeof navigator.canShare !== "function" || navigator.canShare(fileShare)) {
    try {
      await navigator.share(fileShare);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
    }
  }

  const urlShare = { url: icsUrl, title };
  if (typeof navigator.canShare !== "function" || navigator.canShare(urlShare)) {
    try {
      await navigator.share(urlShare);
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
    }
  }

  return false;
}

function openExternalCalendarUrl(url: string) {
  window.location.assign(url);
}

function downloadWorkoutICSBlob(workout: WorkoutCalendarExportInput) {
  const content = buildWorkoutICSContent(workout);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `workout-${workout.id}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export type AddWorkoutToCalendarResult =
  | "shared"
  | "google-calendar"
  | "ics-opened"
  | "downloaded";

export async function addWorkoutToCalendar(
  workout: WorkoutCalendarExportInput,
  options?: { userAgent?: string; origin?: string },
): Promise<AddWorkoutToCalendarResult> {
  const userAgent =
    options?.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  const icsUrl = getWorkoutICSUrl(workout.id, options?.origin);

  if (!isMobileCalendarDevice(userAgent)) {
    downloadWorkoutICSBlob(workout);
    return "downloaded";
  }

  if (await tryShareWorkoutICS(workout, icsUrl)) {
    return "shared";
  }

  if (isAndroidCalendarDevice(userAgent)) {
    openExternalCalendarUrl(buildGoogleCalendarAddEventUrl(workout));
    return "google-calendar";
  }

  openExternalCalendarUrl(icsUrl);
  return "ics-opened";
}

/** @deprecated Use addWorkoutToCalendar */
export function downloadWorkoutICS(workout: WorkoutCalendarExportInput) {
  downloadWorkoutICSBlob(workout);
}

/** @deprecated Prefer addWorkoutToCalendar */
export function openWorkoutICSInNativeCalendar(workout: WorkoutCalendarExportInput) {
  openExternalCalendarUrl(getWorkoutICSUrl(workout.id));
}
