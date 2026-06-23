import { beforeEach, describe, expect, it, vi } from "vitest";

import { getIsraelWeekdayIndex, parseIsraelDateTime } from "@/lib/calendar-datetime";

const findManyRemindersMock = vi.fn();
const findFirstLogMock = vi.fn();
const updateReminderMock = vi.fn();
const notifyMock = vi.fn();

vi.mock("@/lib/tracking-reminder-notifications", () => ({
  notifyUserAboutWaterReminder: (...args: unknown[]) => notifyMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    waterReminder: {
      findMany: (...args: unknown[]) => findManyRemindersMock(...args),
      update: (...args: unknown[]) => updateReminderMock(...args),
    },
    waterLog: {
      findFirst: (...args: unknown[]) => findFirstLogMock(...args),
    },
  },
}));

import { processDueWaterReminders } from "@/lib/process-water-reminders";

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
    timesLocal: [REMINDER_TIME, "12:00"],
    lastSentSlots: {},
  };
}

describe("processDueWaterReminders", () => {
  beforeEach(() => {
    findManyRemindersMock.mockReset();
    findFirstLogMock.mockReset();
    updateReminderMock.mockReset();
    notifyMock.mockReset();
    findFirstLogMock.mockResolvedValue(null);
    notifyMock.mockResolvedValue(true);
    updateReminderMock.mockResolvedValue({});
  });

  it("sends a reminder for matching time slot", async () => {
    const now = reminderNow();
    findManyRemindersMock.mockResolvedValue([baseReminder()]);

    const result = await processDueWaterReminders(now);

    expect(result).toEqual({ processed: 1, sent: 1, skipped: 0 });
    expect(notifyMock).toHaveBeenCalledWith({
      userId: "trainee-1",
      reminderId: "reminder-1",
      timeSlot: REMINDER_TIME,
    });
    expect(updateReminderMock).toHaveBeenCalledWith({
      where: { id: "reminder-1" },
      data: { lastSentSlots: { [REMINDER_DAY]: [REMINDER_TIME] } },
    });
  });

  it("allows multiple slots on the same day", async () => {
    const now = parseIsraelDateTime(REMINDER_DAY, "12:00")!;
    findManyRemindersMock.mockResolvedValue([
      {
        ...baseReminder(),
        lastSentSlots: { [REMINDER_DAY]: [REMINDER_TIME] },
      },
    ]);

    const result = await processDueWaterReminders(now);

    expect(result).toEqual({ processed: 1, sent: 1, skipped: 0 });
    expect(notifyMock).toHaveBeenCalledWith({
      userId: "trainee-1",
      reminderId: "reminder-1",
      timeSlot: "12:00",
    });
  });

  it("skips when slot was already sent today", async () => {
    const now = reminderNow();
    findManyRemindersMock.mockResolvedValue([
      {
        ...baseReminder(),
        lastSentSlots: { [REMINDER_DAY]: [REMINDER_TIME] },
      },
    ]);

    const result = await processDueWaterReminders(now);

    expect(result).toEqual({ processed: 1, sent: 0, skipped: 1 });
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("skips when trainee already logged water today", async () => {
    const now = reminderNow();
    findManyRemindersMock.mockResolvedValue([baseReminder()]);
    findFirstLogMock.mockResolvedValue({ id: "log-1" });

    const result = await processDueWaterReminders(now);

    expect(result).toEqual({ processed: 1, sent: 0, skipped: 1 });
    expect(notifyMock).not.toHaveBeenCalled();
  });
});
