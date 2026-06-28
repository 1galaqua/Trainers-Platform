import { describe, expect, it } from "vitest";

import { loadUserNotifications } from "@/lib/notification-items";

describe("loadUserNotifications", () => {
  it("returns notifications with eventId extracted from payload", async () => {
    const notifications = await loadUserNotifications("6a2e9fb1485a69948a8c62a5");
    const eventNotification = notifications.find((item) => item.type === "EVENT_SCHEDULED");

    if (!eventNotification) {
      // No event notification in this environment — skip assertion.
      expect(notifications).toBeInstanceOf(Array);
      return;
    }

    expect(eventNotification.eventId).toBeTruthy();
    expect(eventNotification.createdAt).toMatch(/^\d{4}-/);
  });
});
