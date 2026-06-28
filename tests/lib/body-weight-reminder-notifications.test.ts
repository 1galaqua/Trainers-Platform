import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirstNotificationMock = vi.fn();
const createNotificationMock = vi.fn();
const countSubscriptionsMock = vi.fn();
const sendPushMock = vi.fn();
const unreadCountMock = vi.fn();
const revalidateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appNotification: {
      findFirst: (...args: unknown[]) => findFirstNotificationMock(...args),
      create: (...args: unknown[]) => createNotificationMock(...args),
    },
    pushSubscription: {
      count: (...args: unknown[]) => countSubscriptionsMock(...args),
    },
  },
}));

vi.mock("@/lib/notifications", () => ({
  getUnreadNotificationCountForUser: (...args: unknown[]) => unreadCountMock(...args),
}));

vi.mock("@/lib/push-send", () => ({
  sendPushNotificationsToUsers: (...args: unknown[]) => sendPushMock(...args),
}));

vi.mock("@/lib/revalidate-tags", () => ({
  revalidateNotifications: (...args: unknown[]) => revalidateMock(...args),
}));

import { notifyUserAboutBodyWeightReminder } from "@/lib/body-weight-reminder-notifications";

describe("notifyUserAboutBodyWeightReminder", () => {
  beforeEach(() => {
    findFirstNotificationMock.mockReset();
    createNotificationMock.mockReset();
    countSubscriptionsMock.mockReset();
    sendPushMock.mockReset();
    unreadCountMock.mockReset();
    revalidateMock.mockReset();

    findFirstNotificationMock.mockResolvedValue(null);
    createNotificationMock.mockResolvedValue({ id: "notification-1" });
    countSubscriptionsMock.mockResolvedValue(1);
    unreadCountMock.mockResolvedValue(2);
    sendPushMock.mockResolvedValue(undefined);
  });

  it("creates an in-app notification and sends push", async () => {
    const delivered = await notifyUserAboutBodyWeightReminder({
      userId: "trainee-1",
      reminderId: "reminder-1",
    });

    expect(delivered).toBe(true);
    expect(createNotificationMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "trainee-1",
        type: "BODY_WEIGHT_REMINDER",
        title: "תזכורת: עדכון משקל",
        body: "זמן לעדכן את משקל הגוף שלך",
        payload: { reminderId: "reminder-1" },
      }),
    });
    expect(sendPushMock).toHaveBeenCalledWith(
      ["trainee-1"],
      expect.objectContaining({
        title: "תזכורת: עדכון משקל",
        url: "/dashboard/tracking",
      }),
    );
    expect(revalidateMock).toHaveBeenCalledWith("trainee-1");
  });

  it("does not duplicate notifications on the same day", async () => {
    findFirstNotificationMock.mockResolvedValue({ id: "existing" });

    const delivered = await notifyUserAboutBodyWeightReminder({
      userId: "trainee-1",
      reminderId: "reminder-1",
    });

    expect(delivered).toBe(false);
    expect(createNotificationMock).not.toHaveBeenCalled();
    expect(sendPushMock).not.toHaveBeenCalled();
  });

  it("creates in-app notification even without push subscriptions", async () => {
    countSubscriptionsMock.mockResolvedValue(0);

    const delivered = await notifyUserAboutBodyWeightReminder({
      userId: "trainee-1",
      reminderId: "reminder-1",
    });

    expect(delivered).toBe(true);
    expect(createNotificationMock).toHaveBeenCalled();
    expect(sendPushMock).not.toHaveBeenCalled();
  });
});
