import { describe, expect, it } from "vitest";

import {
  WORKOUT_REMINDER_ONE_HOUR_MS,
  WORKOUT_REMINDER_THIRTY_MIN_MS,
  computeReminderScheduledFor,
  isValidReminderTime,
} from "@/lib/user-workout-reminders";
import { shouldDeliverWorkoutReminder } from "@/lib/workout-reminder-delivery";

describe("computeReminderScheduledFor", () => {
  const workoutStartsAt = new Date("2026-06-10T18:00:00.000Z");

  it("schedules 30 minutes before the workout", () => {
    const scheduledFor = computeReminderScheduledFor(workoutStartsAt, "THIRTY_MINUTES");
    expect(scheduledFor?.toISOString()).toBe(
      new Date(workoutStartsAt.getTime() - WORKOUT_REMINDER_THIRTY_MIN_MS).toISOString(),
    );
  });

  it("schedules 1 hour before the workout", () => {
    const scheduledFor = computeReminderScheduledFor(workoutStartsAt, "ONE_HOUR");
    expect(scheduledFor?.toISOString()).toBe(
      new Date(workoutStartsAt.getTime() - WORKOUT_REMINDER_ONE_HOUR_MS).toISOString(),
    );
  });

  it("uses the custom datetime when provided", () => {
    const custom = new Date("2026-06-10T17:45:00.000Z");
    const scheduledFor = computeReminderScheduledFor(workoutStartsAt, "CUSTOM", custom);
    expect(scheduledFor?.toISOString()).toBe(custom.toISOString());
  });
});

describe("isValidReminderTime", () => {
  const workoutStartsAt = new Date("2026-06-10T18:00:00.000Z");

  it("accepts a reminder between now and workout start", () => {
    const now = new Date("2026-06-10T16:00:00.000Z");
    const scheduledFor = new Date("2026-06-10T17:30:00.000Z");
    expect(isValidReminderTime(scheduledFor, workoutStartsAt, now)).toBe(true);
  });

  it("rejects a reminder in the past", () => {
    const now = new Date("2026-06-10T17:45:00.000Z");
    const scheduledFor = new Date("2026-06-10T17:30:00.000Z");
    expect(isValidReminderTime(scheduledFor, workoutStartsAt, now)).toBe(false);
  });

  it("rejects a reminder after workout start", () => {
    const now = new Date("2026-06-10T16:00:00.000Z");
    const scheduledFor = new Date("2026-06-10T18:30:00.000Z");
    expect(isValidReminderTime(scheduledFor, workoutStartsAt, now)).toBe(false);
  });
});

describe("shouldDeliverWorkoutReminder", () => {
  const scheduledFor = new Date("2026-06-10T17:30:00.000Z");

  it("delivers when reminder is due and workout is active", () => {
    expect(
      shouldDeliverWorkoutReminder({
        workoutCancelledAt: undefined,
        scheduledFor,
        now: new Date("2026-06-10T17:31:00.000Z"),
      }),
    ).toEqual({ deliver: true });
  });

  it("still delivers when cron runs after workout start (previous bug skipped notify)", () => {
    expect(
      shouldDeliverWorkoutReminder({
        workoutCancelledAt: undefined,
        scheduledFor,
        now: new Date("2026-06-10T18:05:00.000Z"),
      }),
    ).toEqual({ deliver: true });
  });

  it("skips cancelled workouts", () => {
    expect(
      shouldDeliverWorkoutReminder({
        workoutCancelledAt: new Date("2026-06-10T16:00:00.000Z"),
        scheduledFor,
        now: new Date("2026-06-10T17:31:00.000Z"),
      }),
    ).toEqual({ deliver: false, reason: "cancelled" });
  });

  it("waits until scheduled time", () => {
    expect(
      shouldDeliverWorkoutReminder({
        workoutCancelledAt: undefined,
        scheduledFor,
        now: new Date("2026-06-10T17:29:00.000Z"),
      }),
    ).toEqual({ deliver: false, reason: "not-due" });
  });
});
