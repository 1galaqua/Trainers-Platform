import { describe, expect, it } from "vitest";

import {
  createCalendarEventInputFromFormData,
  validateCreateCalendarEventInput,
} from "@/lib/calendar-event-validation";
import { getIsraelDateString } from "@/lib/calendar-datetime";

describe("calendar event validation", () => {
  it("requires a title", () => {
    const formData = new FormData();
    formData.set("title", "");
    formData.set("date", getIsraelDateString());
    formData.set("time", "09:00");
    formData.set("durationMinutes", "60");

    const input = createCalendarEventInputFromFormData(formData);
    expect(validateCreateCalendarEventInput(input)).toBe("יש להזין שם לאירוע");
  });

  it("accepts events without a trainee", () => {
    const formData = new FormData();
    formData.set("title", "פגישה");
    formData.set("date", getIsraelDateString());
    formData.set("time", "09:00");
    formData.set("durationMinutes", "60");

    const input = createCalendarEventInputFromFormData(formData);
    expect(validateCreateCalendarEventInput(input)).toBeNull();
    expect(input.traineeId).toBe("");
  });
});
