import { beforeEach, describe, expect, it, vi } from "vitest";

import { getIsraelWeekdayIndex, parseIsraelDateTime } from "@/lib/calendar-datetime";

const findManyRemindersMock = vi.fn();
const findFirstLogMock = vi.fn();
const updateReminderMock = vi.fn();
const notifyMock = vi.fn();

vi.mock("@/lib/body-weight-reminder-notifications", () => ({
  notifyUserAboutBodyWeightReminder: (...args: unknown[]) => notifyMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bodyWeightReminder: {
      findMany: (...args: unknown[]) => findManyRemindersMock(...args),
      update: (...args: unknown[]) => updateReminderMock(...args),
    },
    bodyWeightLog: {
      findFirst: (...args: unknown[]) => findFirstLogMock(...args),
    },
  },
}));

import { processDueBodyWeightReminders } from "@/lib/process-body-weight-reminders";

const REMINDER_DAY = "2026-06-22";
const REMINDER_TIME = "08:00";

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

describe("processDueBodyWeightReminders", () => {
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

    const result = await processDueBodyWeightReminders(now);

    expect(result).toEqual({ processed: 1, sent: 1, skipped: 0 });
    expect(notifyMock).toHaveBeenCalledWith({
      userId: "trainee-1",
      reminderId: "reminder-1",
    });
    expect(updateReminderMock).toHaveBeenCalledWith({
      where: { id: "reminder-1" },
      data: { lastSentAt: now },
    });
  });

  it("skips when weekday does not match", async () => {
    const now = reminderNow();
    const weekday = getIsraelWeekdayIndex(REMINDER_DAY);
    const wrongDay = (weekday + 1) % 7;

    findManyRemindersMock.mockResolvedValue([
      { ...baseReminder(), daysOfWeek: [wrongDay] },
    ]);

    const result = await processDueBodyWeightReminders(now);

    expect(result).toEqual({ processed: 1, sent: 0, skipped: 1 });
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("skips when time does not match", async () => {
    const now = reminderNow();

    findManyRemindersMock.mockResolvedValue([
      { ...baseReminder(), timeLocal: "09:00" },
    ]);

    const result = await processDueBodyWeightReminders(now);

    expect(result).toEqual({ processed: 1, sent: 0, skipped: 1 });
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("skips when reminder was already sent today", async () => {
    const now = reminderNow();

    findManyRemindersMock.mockResolvedValue([
      { ...baseReminder(), lastSentAt: now },
    ]);

    const result = await processDueBodyWeightReminders(now);

    expect(result).toEqual({ processed: 1, sent: 0, skipped: 1 });
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("skips when trainee already logged weight today", async () => {
    const now = reminderNow();
    findManyRemindersMock.mockResolvedValue([baseReminder()]);
    findFirstLogMock.mockResolvedValue({ id: "log-1" });

    const result = await processDueBodyWeightReminders(now);

    expect(result).toEqual({ processed: 1, sent: 0, skipped: 1 });
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("skips when notification delivery returns false", async () => {
    const now = reminderNow();
    findManyRemindersMock.mockResolvedValue([baseReminder()]);
    notifyMock.mockResolvedValue(false);

    const result = await processDueBodyWeightReminders(now);

    expect(result).toEqual({ processed: 1, sent: 0, skipped: 1 });
    expect(updateReminderMock).not.toHaveBeenCalled();
  });
});
