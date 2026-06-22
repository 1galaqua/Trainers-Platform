import { describe, expect, it } from "vitest";

import { resolveNotificationRecipients } from "@/lib/calendar-notifications";

describe("resolveNotificationRecipients", () => {
  it("removes the coach from trainee notification lists", () => {
    expect(
      resolveNotificationRecipients(
        ["coach-1", "trainee-1", "trainee-2"],
        ["coach-1"],
      ),
    ).toEqual(["trainee-1", "trainee-2"]);
  });

  it("deduplicates recipients", () => {
    expect(
      resolveNotificationRecipients(
        ["trainee-1", "trainee-1", "trainee-2"],
        ["coach-1"],
      ),
    ).toEqual(["trainee-1", "trainee-2"]);
  });
});
