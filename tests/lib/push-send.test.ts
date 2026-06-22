import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();
const deleteManyMock = vi.fn();
const sendPushNotificationMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pushSubscription: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      deleteMany: (...args: unknown[]) => deleteManyMock(...args),
    },
  },
}));

vi.mock("@/lib/push-vapid", () => ({
  sendPushNotification: (...args: unknown[]) => sendPushNotificationMock(...args),
}));

import { sendPushNotificationsToUsers } from "@/lib/push-send";

describe("sendPushNotificationsToUsers", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    deleteManyMock.mockReset();
    sendPushNotificationMock.mockReset();
    deleteManyMock.mockResolvedValue({ count: 0 });
  });

  it("returns early when no user ids are provided", async () => {
    await sendPushNotificationsToUsers([], { title: "Hi", body: "There" });

    expect(findManyMock).not.toHaveBeenCalled();
    expect(sendPushNotificationMock).not.toHaveBeenCalled();
  });

  it("returns early when users have no push subscriptions", async () => {
    findManyMock.mockResolvedValue([]);

    await sendPushNotificationsToUsers(["user-1"], { title: "Hi", body: "There" });

    expect(findManyMock).toHaveBeenCalledWith({
      where: { userId: { in: ["user-1"] } },
    });
    expect(sendPushNotificationMock).not.toHaveBeenCalled();
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("deduplicates user ids before querying subscriptions", async () => {
    findManyMock.mockResolvedValue([]);

    await sendPushNotificationsToUsers(
      ["user-1", "user-1", "user-2"],
      { title: "Hi", body: "There" },
    );

    expect(findManyMock).toHaveBeenCalledWith({
      where: { userId: { in: ["user-1", "user-2"] } },
    });
  });

  it("sends notifications to every subscription", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "sub-1",
        userId: "user-1",
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
      },
      {
        id: "sub-2",
        userId: "user-2",
        endpoint: "https://push.example.com/2",
        p256dh: "p256dh-2",
        auth: "auth-2",
      },
    ]);
    sendPushNotificationMock.mockResolvedValue({ ok: true, expired: false });

    await sendPushNotificationsToUsers(["user-1", "user-2"], {
      title: "Reminder",
      body: "Workout soon",
      tag: "workout-reminder",
    });

    expect(sendPushNotificationMock).toHaveBeenCalledTimes(2);
    expect(sendPushNotificationMock).toHaveBeenNthCalledWith(
      1,
      {
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
      },
      {
        title: "Reminder",
        body: "Workout soon",
        tag: "workout-reminder",
        unreadCount: undefined,
      },
    );
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("uses per-user unread counts when provided", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "sub-1",
        userId: "user-1",
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
      },
      {
        id: "sub-2",
        userId: "user-2",
        endpoint: "https://push.example.com/2",
        p256dh: "p256dh-2",
        auth: "auth-2",
      },
    ]);
    sendPushNotificationMock.mockResolvedValue({ ok: true, expired: false });

    await sendPushNotificationsToUsers(
      ["user-1", "user-2"],
      { title: "Update", body: "New activity", unreadCount: 1 },
      new Map([
        ["user-1", 4],
        ["user-2", 9],
      ]),
    );

    expect(sendPushNotificationMock).toHaveBeenNthCalledWith(
      1,
      expect.any(Object),
      expect.objectContaining({ unreadCount: 4 }),
    );
    expect(sendPushNotificationMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ endpoint: "https://push.example.com/2" }),
      expect.objectContaining({ unreadCount: 9 }),
    );
  });

  it("deletes expired subscriptions after failed delivery", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "sub-active",
        userId: "user-1",
        endpoint: "https://push.example.com/active",
        p256dh: "p256dh-active",
        auth: "auth-active",
      },
      {
        id: "sub-expired",
        userId: "user-1",
        endpoint: "https://push.example.com/expired",
        p256dh: "p256dh-expired",
        auth: "auth-expired",
      },
    ]);
    sendPushNotificationMock
      .mockResolvedValueOnce({ ok: true, expired: false })
      .mockResolvedValueOnce({ ok: false, expired: true });

    await sendPushNotificationsToUsers(["user-1"], { title: "Hi", body: "There" });

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { id: { in: ["sub-expired"] } },
    });
  });
});
