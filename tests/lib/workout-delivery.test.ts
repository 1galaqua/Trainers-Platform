// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";

import {
  buildWorkoutICSContent,
  getWorkoutCalendarDescription,
  getWorkoutCalendarTitle,
  isMobileCalendarDevice,
  openWorkoutICSInNativeCalendar,
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

describe("isMobileCalendarDevice", () => {
  it("detects common phone user agents", () => {
    expect(isMobileCalendarDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
      true,
    );
    expect(isMobileCalendarDevice("Mozilla/5.0 (Linux; Android 14)")).toBe(true);
    expect(isMobileCalendarDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
  });
});

describe("openWorkoutICSInNativeCalendar", () => {
  it("opens a calendar data url without downloading", () => {
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.fn();
    const anchor = {
      href: "",
      rel: "",
      click,
      remove,
    };

    vi.spyOn(document, "createElement").mockReturnValue(anchor as unknown as HTMLElement);
    vi.spyOn(document.body, "appendChild").mockImplementation(appendChild);

    openWorkoutICSInNativeCalendar({
      id: "workout-1",
      type: "PERSONAL",
      workoutKind: "STRENGTH",
      startsAt: "2026-06-22T06:00:00.000Z",
      durationMinutes: 60,
    });

    expect(anchor.href.startsWith("data:text/calendar;charset=utf-8,")).toBe(true);
    expect(click).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalledWith(anchor);
    expect(remove).toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
