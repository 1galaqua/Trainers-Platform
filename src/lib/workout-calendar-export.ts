import { programTypeLabels } from "@/lib/program-labels";
import type { ProgramType } from "@/lib/prisma-client";

export type WorkoutCalendarExportInput = {
  id: string;
  type: "PERSONAL" | "GROUP";
  workoutKind: string;
  startsAt: string;
  durationMinutes: number;
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

  if (workout.type === "PERSONAL") {
    if (workout.traineeName) {
      return `אימון אישי · ${workout.traineeName}`;
    }
    return "אימון אישי";
  }

  return `אימון קבוצתי · ${kindLabel}`;
}

export function getWorkoutCalendarDescription(workout: WorkoutCalendarExportInput) {
  const parts = [
    workout.type === "PERSONAL" ? "אימון אישי" : "אימון קבוצתי",
    programTypeLabels[workout.workoutKind as ProgramType] ?? workout.workoutKind,
    workout.programName ? `תוכנית: ${workout.programName}` : null,
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
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadWorkoutICS(workout: WorkoutCalendarExportInput) {
  const content = buildWorkoutICSContent(workout);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `workout-${workout.id}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
