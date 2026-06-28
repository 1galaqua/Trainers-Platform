import { describe, expect, it } from "vitest";

import {
  calendarMonthTag,
  calendarWorkoutsTag,
  coachTraineesTag,
  logWorkoutTag,
  notificationsTag,
  programsTag,
  trackingWeekTag,
  traineeDetailTag,
  userTag,
} from "@/lib/cache-tags";

describe("cache-tags", () => {
  it("builds stable user and notification tags", () => {
    expect(userTag("user-1")).toBe("user:user-1");
    expect(notificationsTag("user-1")).toBe("notifications:user-1");
  });

  it("builds trainee-scoped tags", () => {
    expect(programsTag("trainee-1")).toBe("programs:trainee-1");
    expect(logWorkoutTag("trainee-1")).toBe("log-workout:trainee-1");
    expect(traineeDetailTag("trainee-1")).toBe("trainee-detail:trainee-1");
  });

  it("builds week and calendar tags", () => {
    expect(trackingWeekTag("trainee-1", "2026-06-15")).toBe(
      "tracking:trainee-1:2026-06-15",
    );
    expect(calendarMonthTag("user-1", "2026-06")).toBe("calendar:user-1:2026-06");
    expect(calendarWorkoutsTag("user-1")).toBe("calendar-workouts:user-1");
    expect(coachTraineesTag("coach-1")).toBe("coach-trainees:coach-1");
  });
});
