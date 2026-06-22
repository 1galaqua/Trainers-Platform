import { afterEach, describe, expect, it, vi } from "vitest";

import { getVapidPublicKey, isPushConfigured } from "@/lib/push-config";

describe("isPushConfigured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when the public VAPID key is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "");
    expect(isPushConfigured()).toBe(false);
  });

  it("returns true when the public VAPID key is set", () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "test-public-key");
    expect(isPushConfigured()).toBe(true);
  });

  it("ignores whitespace-only keys", () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "   ");
    expect(isPushConfigured()).toBe(false);
  });
});

describe("getVapidPublicKey", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when the key is missing", () => {
    expect(getVapidPublicKey()).toBeNull();
  });

  it("returns the trimmed public key", () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "  test-public-key  ");
    expect(getVapidPublicKey()).toBe("test-public-key");
  });
});
