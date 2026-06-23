import { beforeEach, describe, expect, it, vi } from "vitest";

import { getIsraelWeekdayIndex, parseIsraelDateTime } from "@/lib/calendar-datetime";

const findManyRemindersMock = vi.fn();
const findFirstLogMock = vi.fn();
const updateReminderMock = vi.fn();
const notifyMock = vi.fn();

vi.mock("@/lib/tracking-reminder-notifications", () => ({
  notifyUserAboutStepsReminder: (...args: unknown[]) => notifyMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stepsReminder: {
      findMany: (...args: unknown[]) => findManyRemindersMock(...args),
      update: (...args: unknown[]) => updateReminderMock(...args),
    },
    stepsLog: {
      findFirst: (...args: unknown[]) => findFirstLogMock(...args),
    },
  },
}));

import { processDueStepsReminders } from "@/lib/process-steps-reminders";

const REMINDER_DAY = "2026-06-22";
const REMINDER_TIME = "20:00";

function reminderNow() {
  return parseIsraelDateTime(REMINDER_DAY, REMINDER_TIME)!;
}

function baseReminder() {
  return {
    id: "reminder-1",
    traineeId: "trainee-1",
    daysOfWeek: [getIsraelWeekdayIndex(REMINDER_DAY)],
    timeLocal: REMINDER_TIME,
    lastSentAt: null,
  };
}

describe("processDueStepsReminders", () => {
  beforeEach(() => {
    findManyRemindersMock.mockReset();
    findFirstLogMock.mockReset();
    updateReminderMock.mockReset();
    notifyMock.mockReset();
    findFirstLogMock.mockResolvedValue(null);
    notifyMock.mockResolvedValue(true);
    updateReminderMock.mockResolvedValue({});
  });

  it("sends a reminder when weekday and time match", async () => {
    const now = reminderNow();
    findManyRemindersMock.mockResolvedValue([baseReminder()]);

    const result = await processDueStepsReminders(now);

    expect(result).toEqual({ processed: 1, sent: 1, skipped: 0 });
    expect(notifyMock).toHaveBeenCalledWith({
      userId: "trainee-1",
      reminderId: "reminder-1",
    });
  });

  it("skips when steps were already logged today", async () => {
    const now = reminderNow();
    findManyRemindersMock.mockResolvedValue([baseReminder()]);
    findFirstLogMock.mockResolvedValue({ id: "log-1" });

    const result = await processDueStepsReminders(now);

    expect(result).toEqual({ processed: 1, sent: 0, skipped: 1 });
    expect(notifyMock).not.toHaveBeenCalled();
  });
});
