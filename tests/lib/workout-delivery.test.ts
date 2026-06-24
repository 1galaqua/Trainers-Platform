// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";

import {
  addWorkoutToCalendar,
  buildGoogleCalendarAddEventUrl,
  buildWorkoutICSContent,
  getWorkoutCalendarDescription,
  getWorkoutCalendarTitle,
  getWorkoutICSUrl,
  isAndroidCalendarDevice,
  isIOSCalendarDevice,
  isMobileCalendarDevice,
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

  it("builds a google calendar add-event url for android", () => {
    const url = buildGoogleCalendarAddEventUrl({
      ...baseWorkout,
      deliveryMode: "ONLINE",
      meetingLink: "https://meet.google.com/abc",
    });

    expect(url).toContain("calendar.google.com/calendar/render");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain(encodeURIComponent("https://meet.google.com/abc"));
  });

  it("builds a server ics url for ios calendar import", () => {
    expect(getWorkoutICSUrl("workout-1", "https://app.example.com")).toBe(
      "https://app.example.com/api/calendar/workouts/workout-1/calendar.ics",
    );
  });
});

describe("calendar device detection", () => {
  it("detects mobile, android, and ios user agents", () => {
    const iphone =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
    const android = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36";
    const desktop = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

    expect(isMobileCalendarDevice(iphone)).toBe(true);
    expect(isIOSCalendarDevice(iphone)).toBe(true);
    expect(isAndroidCalendarDevice(iphone)).toBe(false);

    expect(isMobileCalendarDevice(android)).toBe(true);
    expect(isAndroidCalendarDevice(android)).toBe(true);
    expect(isIOSCalendarDevice(android)).toBe(false);

    expect(isMobileCalendarDevice(desktop)).toBe(false);
  });
});

describe("addWorkoutToCalendar mobile navigation", () => {
  it("opens google calendar on android when share is unavailable", async () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    });

    const result = await addWorkoutToCalendar(
      {
        id: "workout-1",
        type: "PERSONAL",
        workoutKind: "STRENGTH",
        startsAt: "2026-06-22T06:00:00.000Z",
        durationMinutes: 60,
      },
      {
        userAgent: "Mozilla/5.0 (Linux; Android 14)",
        origin: "https://app.example.com",
      },
    );

    expect(result).toBe("google-calendar");
    expect(assign).toHaveBeenCalledWith(expect.stringContaining("calendar.google.com"));
  });

  it("opens server ics url on ios when share is unavailable", async () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    });

    const result = await addWorkoutToCalendar(
      {
        id: "workout-1",
        type: "PERSONAL",
        workoutKind: "STRENGTH",
        startsAt: "2026-06-22T06:00:00.000Z",
        durationMinutes: 60,
      },
      {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        origin: "https://app.example.com",
      },
    );

    expect(result).toBe("ics-opened");
    expect(assign).toHaveBeenCalledWith(
      "https://app.example.com/api/calendar/workouts/workout-1/calendar.ics",
    );
  });
});
