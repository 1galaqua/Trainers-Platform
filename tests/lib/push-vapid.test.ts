import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendNotificationMock = vi.fn();
const setVapidDetailsMock = vi.fn();

vi.mock("web-push", () => ({
  default: {
    sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
    setVapidDetails: (...args: unknown[]) => setVapidDetailsMock(...args),
  },
}));

import { getVapidSubject } from "@/lib/push-vapid";

const subscription = {
  endpoint: "https://push.example.com/sub/1",
  p256dh: "p256dh-key",
  auth: "auth-key",
};

describe("getVapidSubject", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers VAPID_SUBJECT when set", () => {
    vi.stubEnv("VAPID_SUBJECT", "mailto:coach@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com");
    expect(getVapidSubject()).toBe("mailto:coach@example.com");
  });

  it("uses the app URL origin when VAPID_SUBJECT is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com/dashboard");
    expect(getVapidSubject()).toBe("https://app.example.com");
  });

  it("falls back to the default contact when the app URL is invalid", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "not-a-url");
    expect(getVapidSubject()).toBe("mailto:notifications@trainers-platform.local");
  });

  it("falls back to the default contact when no env vars are set", () => {
    expect(getVapidSubject()).toBe("mailto:notifications@trainers-platform.local");
  });
});

describe("sendPushNotification", () => {
  beforeEach(() => {
    vi.resetModules();
    sendNotificationMock.mockReset();
    setVapidDetailsMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function loadSendPushNotification() {
    const pushModule = await import("@/lib/push-vapid");
    return pushModule.sendPushNotification;
  }

  it("returns failure when VAPID keys are not configured", async () => {
    const sendPushNotification = await loadSendPushNotification();

    await expect(sendPushNotification(subscription, { title: "Hi", body: "There" })).resolves.toEqual({
      ok: false,
      expired: false,
    });
    expect(setVapidDetailsMock).not.toHaveBeenCalled();
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });

  it("sends a notification with defaults when delivery succeeds", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "public-key");
    vi.stubEnv("VAPID_PRIVATE_KEY", "private-key");
    vi.stubEnv("VAPID_SUBJECT", "mailto:test@example.com");
    sendNotificationMock.mockResolvedValue(undefined);

    const sendPushNotification = await loadSendPushNotification();
    const result = await sendPushNotification(subscription, {
      title: "Workout reminder",
      body: "Your session starts soon",
    });

    expect(result).toEqual({ ok: true, expired: false });
    expect(setVapidDetailsMock).toHaveBeenCalledWith(
      "mailto:test@example.com",
      "public-key",
      "private-key",
    );
    expect(sendNotificationMock).toHaveBeenCalledWith(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({
        title: "Workout reminder",
        body: "Your session starts soon",
        url: "/dashboard/updates",
        tag: "app-update",
        unreadCount: 1,
      }),
      { TTL: 60 * 60 * 24, urgency: "high" },
    );
  });

  it("passes custom url, tag, and unreadCount in the payload", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "public-key");
    vi.stubEnv("VAPID_PRIVATE_KEY", "private-key");
    sendNotificationMock.mockResolvedValue(undefined);

    const sendPushNotification = await loadSendPushNotification();
    await sendPushNotification(subscription, {
      title: "Update",
      body: "New message",
      url: "/dashboard/calendar",
      tag: "workout-reminder",
      unreadCount: 3,
    });

    expect(sendNotificationMock).toHaveBeenCalledWith(
      expect.any(Object),
      JSON.stringify({
        title: "Update",
        body: "New message",
        url: "/dashboard/calendar",
        tag: "workout-reminder",
        unreadCount: 3,
      }),
      expect.any(Object),
    );
  });

  it("marks 404 and 410 responses as expired subscriptions", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "public-key");
    vi.stubEnv("VAPID_PRIVATE_KEY", "private-key");

    const sendPushNotification = await loadSendPushNotification();

    sendNotificationMock.mockRejectedValueOnce({ statusCode: 404 });
    await expect(sendPushNotification(subscription, { title: "Hi", body: "There" })).resolves.toEqual({
      ok: false,
      expired: true,
    });

    sendNotificationMock.mockRejectedValueOnce({ statusCode: 410 });
    await expect(sendPushNotification(subscription, { title: "Hi", body: "There" })).resolves.toEqual({
      ok: false,
      expired: true,
    });
  });

  it("treats other delivery errors as non-expired failures", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "public-key");
    vi.stubEnv("VAPID_PRIVATE_KEY", "private-key");
    sendNotificationMock.mockRejectedValue({ statusCode: 503 });

    const sendPushNotification = await loadSendPushNotification();

    await expect(sendPushNotification(subscription, { title: "Hi", body: "There" })).resolves.toEqual({
      ok: false,
      expired: false,
    });
  });
});
