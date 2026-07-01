import { describe, expect, it } from "vitest";

import { calendarSchedulePreviewAriaLabel } from "@/features/calendar/components/calendar-schedule-grid-preview";
import type { CalendarWorkoutItem } from "@/server/actions/calendar";
import type { CalendarEventItem } from "@/server/actions/calendar-events";

const workout: CalendarWorkoutItem = {
  kind: "workout",
  id: "w1",
  startsAt: "2026-06-22T08:00:00.000Z",
  durationMinutes: 60,
  type: "PERSONAL",
  workoutKind: "STRENGTH",
  deliveryMode: "IN_PERSON",
  traineeId: "t1",
  traineeName: "דני",
  programName: "תוכנית A",
  meetingLink: null,
  notes: null,
  registeredCount: 0,
  maxParticipants: null,
  registeredTrainees: [],
  isRegistered: false,
  programId: "p1",
  userReminder: null,
};

const event: CalendarEventItem = {
  kind: "event",
  id: "e1",
  startsAt: "2026-06-22T10:00:00.000Z",
  durationMinutes: 45,
  title: "פגישת תזונה",
  traineeId: null,
  traineeName: null,
  notes: null,
  userReminder: null,
};

describe("calendarSchedulePreviewAriaLabel", () => {
  it("labels workouts and events for screen readers", () => {
    expect(calendarSchedulePreviewAriaLabel(workout)).toContain("דני");
    expect(calendarSchedulePreviewAriaLabel(event)).toContain("פגישת תזונה");
  });
});
