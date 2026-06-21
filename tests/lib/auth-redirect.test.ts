import { describe, expect, it } from "vitest";

import {
  getSafeRedirectPath,
  isAuthEntryPath,
  shouldRedirectAuthenticatedUserToDashboard,
} from "@/lib/auth-redirect";

describe("isAuthEntryPath", () => {
  it("matches sign-in and sign-up routes", () => {
    expect(isAuthEntryPath("/sign-in")).toBe(true);
    expect(isAuthEntryPath("/sign-in/foo")).toBe(true);
    expect(isAuthEntryPath("/sign-up")).toBe(true);
    expect(isAuthEntryPath("/sign-up/coach")).toBe(true);
  });

  it("does not match dashboard or other routes", () => {
    expect(isAuthEntryPath("/dashboard")).toBe(false);
    expect(isAuthEntryPath("/dashboard/calendar")).toBe(false);
    expect(isAuthEntryPath("/")).toBe(false);
  });
});

describe("shouldRedirectAuthenticatedUserToDashboard", () => {
  it("redirects home and auth entry pages", () => {
    expect(shouldRedirectAuthenticatedUserToDashboard("/")).toBe(true);
    expect(shouldRedirectAuthenticatedUserToDashboard("/sign-in")).toBe(true);
    expect(shouldRedirectAuthenticatedUserToDashboard("/sign-up")).toBe(true);
  });

  it("does not redirect dashboard or invite flows", () => {
    expect(shouldRedirectAuthenticatedUserToDashboard("/dashboard")).toBe(false);
    expect(shouldRedirectAuthenticatedUserToDashboard("/dashboard/calendar")).toBe(false);
    expect(shouldRedirectAuthenticatedUserToDashboard("/invite/abc")).toBe(false);
    expect(shouldRedirectAuthenticatedUserToDashboard("/forgot-password")).toBe(false);
  });
});

describe("getSafeRedirectPath", () => {
  it("defaults to dashboard when redirect is missing", () => {
    expect(getSafeRedirectPath(null)).toBe("/dashboard");
    expect(getSafeRedirectPath(undefined)).toBe("/dashboard");
    expect(getSafeRedirectPath("")).toBe("/dashboard");
  });

  it("rejects open redirects", () => {
    expect(getSafeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("https://evil.com")).toBe("/dashboard");
  });

  it("allows internal dashboard paths", () => {
    expect(getSafeRedirectPath("/dashboard/calendar")).toBe("/dashboard/calendar");
    expect(getSafeRedirectPath("/dashboard/updates")).toBe("/dashboard/updates");
  });

  it("blocks redirect back to auth pages", () => {
    expect(getSafeRedirectPath("/sign-in")).toBe("/dashboard");
    expect(getSafeRedirectPath("/sign-up")).toBe("/dashboard");
  });
});
