import { describe, expect, it } from "vitest";

import {
  parseSessionPayload,
  signSessionToken,
  verifySessionToken,
  type SessionData,
} from "@/lib/session-token";

const sampleSession: SessionData = {
  userId: "user-123",
  clerkId: "local_abc",
  email: "coach@example.com",
  displayName: "Coach Test",
  role: "COACH",
  sessionVersion: 2,
};

describe("parseSessionPayload", () => {
  it("parses a valid payload", () => {
    expect(parseSessionPayload({ ...sampleSession })).toEqual(sampleSession);
  });

  it("defaults sessionVersion to 0 for legacy tokens", () => {
    const legacy = {
      userId: sampleSession.userId,
      clerkId: sampleSession.clerkId,
      email: sampleSession.email,
      displayName: sampleSession.displayName,
      role: sampleSession.role,
    };
    expect(parseSessionPayload(legacy)).toMatchObject({
      userId: sampleSession.userId,
      sessionVersion: 0,
    });
  });

  it("returns null when required fields are missing", () => {
    expect(parseSessionPayload({ userId: "x" })).toBeNull();
    expect(parseSessionPayload({ clerkId: "x" })).toBeNull();
  });

  it("defaults unknown roles to TRAINEE", () => {
    expect(parseSessionPayload({ ...sampleSession, role: "UNKNOWN" })?.role).toBe("TRAINEE");
  });
});

describe("signSessionToken / verifySessionToken", () => {
  it("round-trips session data", async () => {
    const token = await signSessionToken(sampleSession);
    const verified = await verifySessionToken(token);

    expect(verified).toEqual(sampleSession);
  });

  it("returns null for invalid tokens", async () => {
    expect(await verifySessionToken("not.a.jwt")).toBeNull();
  });

  it("returns null for token signed with a different secret", async () => {
    const token = await signSessionToken(sampleSession);
    const secret = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = "different-secret";

    expect(await verifySessionToken(token)).toBeNull();

    process.env.SESSION_SECRET = secret;
  });

  it("returns null when SESSION_SECRET is missing", async () => {
    const token = await signSessionToken(sampleSession);
    const secret = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;

    expect(await verifySessionToken(token)).toBeNull();

    process.env.SESSION_SECRET = secret;
  });
});

describe("sessionVersion invalidation contract", () => {
  it("changes token payload when sessionVersion changes", async () => {
    const first = await signSessionToken({ ...sampleSession, sessionVersion: 1 });
    const second = await signSessionToken({ ...sampleSession, sessionVersion: 2 });

    expect(first).not.toBe(second);
    expect(await verifySessionToken(first)).toMatchObject({ sessionVersion: 1 });
    expect(await verifySessionToken(second)).toMatchObject({ sessionVersion: 2 });
  });
});
