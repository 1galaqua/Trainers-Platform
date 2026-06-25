import { describe, expect, it } from "vitest";

import {
  parseCoachingDateInput,
  serializeCoachingDateForClient,
  toCoachingDateInputValue,
} from "@/lib/coaching-period-dates";

describe("coaching period dates", () => {
  it("serializes stored dates using Israel calendar day", () => {
    expect(
      serializeCoachingDateForClient(new Date("2026-06-21T21:00:00.000Z")),
    ).toBe("2026-06-22");
  });

  it("converts legacy ISO values to Israel date input values", () => {
    expect(toCoachingDateInputValue("2026-06-21T21:00:00.000Z")).toBe("2026-06-22");
    expect(toCoachingDateInputValue("2026-06-22")).toBe("2026-06-22");
  });

  it("parses date input at Israel noon", () => {
    const parsed = parseCoachingDateInput("2026-06-22");
    expect(parsed).not.toBeNull();
    expect(serializeCoachingDateForClient(parsed)).toBe("2026-06-22");
  });
});
