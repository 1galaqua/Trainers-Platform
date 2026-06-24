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

export function createWorkoutICSFile(workout: WorkoutCalendarExportInput) {
  const content = buildWorkoutICSContent(workout);
  return new File([content], `workout-${workout.id}.ics`, {
    type: "text/calendar;charset=utf-8",
  });
}

export function isMobileCalendarDevice(userAgent: string) {
  return /Android|iPhone|iPad|iPod/i.test(userAgent);
}

function buildWorkoutICSDataUrl(content: string) {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}

async function tryShareWorkoutICS(workout: WorkoutCalendarExportInput): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }

  const file = createWorkoutICSFile(workout);
  const shareData = {
    files: [file],
    title: getWorkoutCalendarTitle(workout),
  };

  if (typeof navigator.canShare === "function") {
    try {
      if (!navigator.canShare(shareData)) return false;
    } catch {
      return false;
    }
  }

  try {
    await navigator.share(shareData);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    return false;
  }
}

export function openWorkoutICSInNativeCalendar(workout: WorkoutCalendarExportInput) {
  const content = buildWorkoutICSContent(workout);
  const dataUrl = buildWorkoutICSDataUrl(content);
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
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

export type AddWorkoutToCalendarResult = "shared" | "opened" | "downloaded";

export async function addWorkoutToCalendar(
  workout: WorkoutCalendarExportInput,
  options?: { userAgent?: string },
): Promise<AddWorkoutToCalendarResult> {
  const userAgent =
    options?.userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");

  if (await tryShareWorkoutICS(workout)) {
    return "shared";
  }

  if (isMobileCalendarDevice(userAgent)) {
    openWorkoutICSInNativeCalendar(workout);
    return "opened";
  }

  downloadWorkoutICSBlob(workout);
  return "downloaded";
}

/** @deprecated Use addWorkoutToCalendar */
export function downloadWorkoutICS(workout: WorkoutCalendarExportInput) {
  downloadWorkoutICSBlob(workout);
}
