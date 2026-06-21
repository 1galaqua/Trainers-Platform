import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SESSION_EXPIRES_IN,
  SESSION_MAX_AGE_SECONDS,
  getSessionCookieOptions,
} from "@/lib/session-config";

describe("session-config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses a 30-day session lifetime", () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(60 * 60 * 24 * 30);
    expect(SESSION_EXPIRES_IN).toBe("30d");
  });

  it("sets secure httpOnly cookies with sameSite lax", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getSessionCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  });

  it("allows non-secure cookies in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getSessionCookieOptions().secure).toBe(false);
  });
});
