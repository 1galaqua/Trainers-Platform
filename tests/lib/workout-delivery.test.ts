import { describe, expect, it } from "vitest";

import {
  buildWorkoutICSContent,
  getWorkoutCalendarDescription,
  getWorkoutCalendarTitle,
} from "@/lib/workout-calendar-export";
import {
  isValidMeetingLink,
  resolveStoredMeetingLink,
  validateWorkoutDeliveryInput,
} from "@/lib/workout-delivery";

describe("validateWorkoutDeliveryInput", () => {
  it("requires a meeting link for online workouts", () => {
    expect(validateWorkoutDeliveryInput("ONLINE", "")).toBe("יש להזין קישור לאימון אונליין");
    expect(validateWorkoutDeliveryInput("ONLINE", "not-a-url")).toBe(
      "יש להזין קישור תקין (https://...)",
    );
    expect(validateWorkoutDeliveryInput("ONLINE", "https://meet.google.com/abc")).toBeNull();
  });

  it("allows in-person workouts without a link", () => {
    expect(validateWorkoutDeliveryInput("IN_PERSON", "")).toBeNull();
  });
});

describe("resolveStoredMeetingLink", () => {
  it("stores meeting links only for online workouts", () => {
    expect(resolveStoredMeetingLink("ONLINE", "https://zoom.us/j/123")).toBe(
      "https://zoom.us/j/123",
    );
    expect(resolveStoredMeetingLink("IN_PERSON", "https://zoom.us/j/123")).toBeNull();
  });
});

describe("isValidMeetingLink", () => {
  it("accepts http and https urls", () => {
    expect(isValidMeetingLink("https://example.com")).toBe(true);
    expect(isValidMeetingLink("http://example.com")).toBe(true);
    expect(isValidMeetingLink("ftp://example.com")).toBe(false);
  });
});

describe("workout calendar export", () => {
  const baseWorkout = {
    id: "workout-1",
    type: "GROUP" as const,
    workoutKind: "STRENGTH",
    startsAt: "2026-06-22T06:00:00.000Z",
    durationMinutes: 60,
  };

  it("includes delivery mode and meeting link in exported calendar content", () => {
    const title = getWorkoutCalendarTitle({
      ...baseWorkout,
      deliveryMode: "ONLINE",
      meetingLink: "https://meet.google.com/abc",
    });
    const description = getWorkoutCalendarDescription({
      ...baseWorkout,
      deliveryMode: "ONLINE",
      meetingLink: "https://meet.google.com/abc",
    });
    const ics = buildWorkoutICSContent({
      ...baseWorkout,
      deliveryMode: "ONLINE",
      meetingLink: "https://meet.google.com/abc",
    });

    expect(title).toContain("אונליין");
    expect(description).toContain("https://meet.google.com/abc");
    expect(ics).toContain("LOCATION:https://meet.google.com/abc");
  });
});
