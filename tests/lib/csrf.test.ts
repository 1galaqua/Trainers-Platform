import { describe, expect, it } from "vitest";

import { isSameOriginRequest } from "@/lib/csrf";

function makeRequest(headers: Record<string, string>) {
  return new Request("https://example.com/api/auth/forgot-password", {
    method: "POST",
    headers,
  });
}

describe("isSameOriginRequest", () => {
  it("accepts matching origin", () => {
    const request = makeRequest({
      host: "example.com",
      origin: "https://example.com",
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("accepts matching referer when origin is absent", () => {
    const request = makeRequest({
      host: "example.com",
      referer: "https://example.com/forgot-password",
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("rejects cross-origin requests", () => {
    const request = makeRequest({
      host: "example.com",
      origin: "https://evil.com",
    });
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("rejects requests without origin or referer", () => {
    const request = makeRequest({ host: "example.com" });
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("rejects requests without host", () => {
    const request = makeRequest({ origin: "https://example.com" });
    expect(isSameOriginRequest(request)).toBe(false);
  });
});
