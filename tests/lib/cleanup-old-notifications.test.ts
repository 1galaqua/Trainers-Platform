import { describe, expect, it } from "vitest";

import {
  NOTIFICATION_RETENTION_DAYS,
  getNotificationRetentionCutoff,
} from "@/lib/cleanup-old-notifications";

describe("getNotificationRetentionCutoff", () => {
  it("returns a date 7 days before the reference time", () => {
    const now = new Date("2026-06-10T12:00:00.000Z");
    const cutoff = getNotificationRetentionCutoff(now);

    expect(NOTIFICATION_RETENTION_DAYS).toBe(7);
    expect(cutoff.toISOString()).toBe("2026-06-03T12:00:00.000Z");
  });
});
