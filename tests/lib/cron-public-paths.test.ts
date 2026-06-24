import { describe, expect, it } from "vitest";

import { CRON_PUBLIC_PATHS, isCronPublicPath } from "@/lib/cron-public-paths";

describe("cron public paths", () => {
  it("includes all split cron endpoints", () => {
    expect(CRON_PUBLIC_PATHS).toContain("/api/cron/workout-reminders");
    expect(CRON_PUBLIC_PATHS).toContain("/api/cron/group-spots-reminders");
    expect(CRON_PUBLIC_PATHS).toContain("/api/cron/cleanup-notifications");
    expect(CRON_PUBLIC_PATHS).toContain("/api/cron/body-weight-reminders");
    expect(CRON_PUBLIC_PATHS).toContain("/api/cron/sleep-reminders");
    expect(CRON_PUBLIC_PATHS).toContain("/api/cron/water-reminders");
    expect(CRON_PUBLIC_PATHS).toContain("/api/cron/measurements-reminders");
    expect(CRON_PUBLIC_PATHS).toContain("/api/cron/steps-reminders");
    expect(CRON_PUBLIC_PATHS).toContain("/api/cron/calories-reminders");
    expect(CRON_PUBLIC_PATHS).toContain("/api/cron/calendar-reminders");
  });

  it("treats body weight reminders cron as public", () => {
    expect(isCronPublicPath("/api/cron/body-weight-reminders")).toBe(true);
    expect(isCronPublicPath("/api/cron/workout-reminders")).toBe(true);
    expect(isCronPublicPath("/api/cron/unknown")).toBe(false);
  });
});
